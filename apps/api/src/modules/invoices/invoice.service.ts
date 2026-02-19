import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { InvoiceStatus } from '@easyfactura/shared-types';
import { VerifactuService } from '../verifactu/services/verifactu.service';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => VerifactuService))
    private verifactuService: VerifactuService
  ) {}

  async create(tenantId: string, dto: CreateInvoiceDto) {
    // Verify series belongs to tenant
    const series = await this.prisma.invoiceSeries.findFirst({
      where: { id: dto.seriesId, tenantId },
    });

    if (!series) {
      throw new NotFoundException('Serie de facturación no encontrada');
    }

    // Verify customer belongs to tenant
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    // Calculate totals
    const lines = dto.lines.map((line, index) => {
      const lineSubtotal = Number(line.quantity) * Number(line.unitPrice);
      const lineTaxAmount = (lineSubtotal * Number(line.taxRate)) / 100;
      const lineIrpfAmount = line.irpfRate ? (lineSubtotal * Number(line.irpfRate)) / 100 : 0;
      const total = lineSubtotal + lineTaxAmount - lineIrpfAmount;

      return {
        tenantId,
        productId: line.productId,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        subtotal: lineSubtotal,
        taxRate: line.taxRate,
        taxAmount: lineTaxAmount,
        irpfRate: line.irpfRate || null,
        irpfAmount: lineIrpfAmount,
        lineTotal: total,
        sortOrder: index,
      };
    });

    const subtotal = lines.reduce((sum, line) => sum + Number(line.subtotal), 0);
    const taxTotal = lines.reduce((sum, line) => sum + Number(line.taxAmount), 0);
    const irpfTotal = lines.reduce((sum, line) => sum + Number(line.irpfAmount), 0);
    const total = subtotal + taxTotal - irpfTotal;

    // Create invoice with lines in transaction
    return this.prisma.$transaction(async (tx) => {
      // Get next number for series
      const nextNumber = series.nextNumber;

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          seriesId: dto.seriesId,
          customerId: dto.customerId,
          number: `${series.prefix}${nextNumber.toString().padStart(series.digits, '0')}`,
          issueDate: new Date(dto.issueDate),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          subtotal,
          taxTotal,
          irpfTotal,
          total,
          status: InvoiceStatus.DRAFT,
          notes: dto.notes,
          lines: {
            create: lines,
          },
        },
        include: {
          lines: true,
          customer: true,
          series: true,
        },
      });

      // Increment series number
      await tx.invoiceSeries.update({
        where: { id: series.id },
        data: { nextNumber: nextNumber + 1 },
      });

      return invoice;
    });
  }

  async findAll(tenantId: string, query: QueryInvoiceDto) {
    const { page = 1, limit = 20, search, status, customerId, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (fromDate) {
      where.issueDate = { ...where.issueDate, gte: new Date(fromDate) };
    }

    if (toDate) {
      where.issueDate = { ...where.issueDate, lte: new Date(toDate) };
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issueDate: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              nif: true,
            },
          },
          series: {
            select: {
              id: true,
              name: true,
              prefix: true,
            },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        lines: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                reference: true,
              },
            },
          },
        },
        customer: true,
        series: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Factura no encontrada');
    }

    return invoice;
  }

  async update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ConflictException('Solo se pueden modificar facturas en borrador');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: dto,
    });
  }

  async confirm(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ConflictException('La factura ya está confirmada');
    }

    // Update status to confirmed
    const confirmedInvoice = await this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CONFIRMED,
      },
    });

    // Process VeriFactu asynchronously (don't block the response)
    this.verifactuService.processInvoice(tenantId, id).catch((error) => {
      console.error('Error processing VeriFactu for invoice:', id, error);
    });

    return confirmedInvoice;
  }

  async remove(tenantId: string, id: string) {
    const invoice = await this.findOne(tenantId, id);

    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new ConflictException('Solo se pueden eliminar facturas en borrador');
    }

    return this.prisma.invoice.delete({
      where: { id },
    });
  }
}

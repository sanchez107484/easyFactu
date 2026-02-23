import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_INVOICE_LAYOUT, InvoiceTemplate } from '@easyfactura/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceTemplateDto } from './dto/create-invoice-template.dto';
import { UpdateInvoiceTemplateDto } from './dto/update-invoice-template.dto';

@Injectable()
export class InvoiceTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string): Promise<InvoiceTemplate[]> {
    return this.prisma.invoiceTemplate.findMany({
      where: { tenantId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    }) as unknown as InvoiceTemplate[];
  }

  async findOne(tenantId: string, id: string): Promise<InvoiceTemplate> {
    const template = await this.prisma.invoiceTemplate.findFirst({
      where: { id, tenantId },
    });
    if (!template) {
      throw new NotFoundException(`Plantilla con id ${id} no encontrada`);
    }
    return template as unknown as InvoiceTemplate;
  }

  async findDefault(tenantId: string): Promise<InvoiceTemplate> {
    const existing = await this.prisma.invoiceTemplate.findFirst({
      where: { tenantId, isDefault: true },
    });
    if (existing) {
      return existing as unknown as InvoiceTemplate;
    }

    return this.create(tenantId, {
      name: 'Plantilla predeterminada',
      isDefault: true,
      layout: DEFAULT_INVOICE_LAYOUT,
    });
  }

  async create(tenantId: string, dto: CreateInvoiceTemplateDto): Promise<InvoiceTemplate> {
    const name = dto.name ?? 'Plantilla predeterminada';

    const existing = await this.prisma.invoiceTemplate.findFirst({
      where: { tenantId, name },
    });
    if (existing) {
      throw new ConflictException(`Ya existe una plantilla con el nombre "${name}"`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.invoiceTemplate.updateMany({
          where: { tenantId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const template = await tx.invoiceTemplate.create({
        data: {
          tenantId,
          name,
          isDefault: dto.isDefault ?? false,
          layout: dto.layout as object,
        },
      });

      return template as unknown as InvoiceTemplate;
    });
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateInvoiceTemplateDto
  ): Promise<InvoiceTemplate> {
    await this.findOne(tenantId, id);

    if (dto.name) {
      const nameConflict = await this.prisma.invoiceTemplate.findFirst({
        where: { tenantId, name: dto.name, NOT: { id } },
      });
      if (nameConflict) {
        throw new ConflictException(`Ya existe una plantilla con el nombre "${dto.name}"`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.invoiceTemplate.updateMany({
          where: { tenantId, isDefault: true, NOT: { id } },
          data: { isDefault: false },
        });
      }

      const updated = await tx.invoiceTemplate.update({
        where: { id },
        data: {
          ...(dto.name && { name: dto.name }),
          ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
          ...(dto.layout && { layout: dto.layout as object }),
        },
      });

      return updated as unknown as InvoiceTemplate;
    });
  }

  async setDefault(tenantId: string, id: string): Promise<InvoiceTemplate> {
    await this.findOne(tenantId, id);

    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceTemplate.updateMany({
        where: { tenantId, isDefault: true },
        data: { isDefault: false },
      });

      const updated = await tx.invoiceTemplate.update({
        where: { id },
        data: { isDefault: true },
      });

      return updated as unknown as InvoiceTemplate;
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const template = await this.findOne(tenantId, id);

    if (template.isDefault) {
      throw new ConflictException(
        'No se puede eliminar la plantilla predeterminada. Establece otra como predeterminada primero.'
      );
    }

    await this.prisma.invoiceTemplate.delete({ where: { id } });
  }
}

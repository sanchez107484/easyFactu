import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceSeriesDto } from './dto/create-invoice-series.dto';
import { UpdateInvoiceSeriesDto } from './dto/update-invoice-series.dto';
import { QueryInvoiceSeriesDto } from './dto/query-invoice-series.dto';
import { SeriesType } from '@easyfactura/shared-types';

@Injectable()
export class InvoiceSeriesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateInvoiceSeriesDto) {
    const year = dto.year ?? new Date().getFullYear();

    // Check if series with same code and year already exists
    const existing = await this.prisma.invoiceSeries.findUnique({
      where: {
        tenantId_code_year: {
          tenantId,
          code: dto.code,
          year,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Ya existe una serie con código ${dto.code} para el año ${year}`);
    }

    // If isDefault is true, unset other defaults of the same type
    if (dto.isDefault) {
      await this.prisma.invoiceSeries.updateMany({
        where: {
          tenantId,
          type: dto.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.invoiceSeries.create({
      data: {
        ...dto,
        year,
        tenantId,
        digits: dto.digits ?? 4,
      },
    });
  }

  async findAll(tenantId: string, query: QueryInvoiceSeriesDto) {
    const { page = 1, limit = 20, type, year, isDefault } = query;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (type !== undefined) {
      where.type = type;
    }

    if (year !== undefined) {
      where.year = year;
    }

    if (isDefault !== undefined) {
      where.isDefault = isDefault;
    }

    const [data, total] = await Promise.all([
      this.prisma.invoiceSeries.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { code: 'asc' }],
      }),
      this.prisma.invoiceSeries.count({ where }),
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
    const series = await this.prisma.invoiceSeries.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: { invoices: true },
        },
      },
    });

    if (!series) {
      throw new NotFoundException('Serie no encontrada');
    }

    return series;
  }

  async update(tenantId: string, id: string, dto: UpdateInvoiceSeriesDto) {
    const series = await this.findOne(tenantId, id);

    // If trying to set as default, unset other defaults of the same type
    if (dto.isDefault === true && !series.isDefault) {
      await this.prisma.invoiceSeries.updateMany({
        where: {
          tenantId,
          type: series.type,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    return this.prisma.invoiceSeries.update({
      where: { id },
      data: dto,
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const series = await this.findOne(tenantId, id);

    const invoiceCount = series._count?.invoices ?? 0;
    if (invoiceCount > 0) {
      throw new ConflictException(
        `No se puede eliminar la serie "${series.code}" porque tiene ${invoiceCount} factura(s) asociada(s). ` +
          'Archiva las facturas o asígnalas a otra serie antes de eliminar esta.'
      );
    }

    await this.prisma.invoiceSeries.delete({
      where: { id, tenantId },
    });
  }

  /**
   * Atomically increments the next number for a series
   * Used when creating a new invoice to prevent race conditions
   */
  async getNextNumber(tenantId: string, seriesId: string): Promise<number> {
    const series = await this.prisma.invoiceSeries.findFirst({
      where: { id: seriesId, tenantId },
    });

    if (!series) {
      throw new NotFoundException('Serie no encontrada');
    }

    // Atomic increment using transaction
    const updated = await this.prisma.invoiceSeries.update({
      where: { id: seriesId },
      data: {
        nextNumber: {
          increment: 1,
        },
      },
    });

    return series.nextNumber;
  }

  /**
   * Creates default invoice series for a new tenant (F and R for current year)
   * Called automatically during tenant registration
   */
  async createDefaultSeries(tenantId: string): Promise<void> {
    const currentYear = new Date().getFullYear();

    const defaultSeries = [
      {
        code: 'F',
        name: 'Facturas',
        type: SeriesType.INVOICE,
        prefix: `${currentYear}/F-`,
        year: currentYear,
        isDefault: true,
        digits: 4,
        tenantId,
      },
      {
        code: 'R',
        name: 'Facturas rectificativas',
        type: SeriesType.RECTIFICATIVE,
        prefix: `${currentYear}/R-`,
        year: currentYear,
        isDefault: true,
        digits: 4,
        tenantId,
      },
    ];

    await this.prisma.invoiceSeries.createMany({
      data: defaultSeries,
      skipDuplicates: true,
    });
  }

  /**
   * Creates series for a new year based on existing series from previous year
   * Called when a tenant starts operating in a new year
   */
  async createSeriesForNewYear(tenantId: string, newYear: number): Promise<void> {
    const currentYear = new Date().getFullYear();

    if (newYear < currentYear) {
      throw new BadRequestException('No se pueden crear series para años anteriores');
    }

    if (newYear > currentYear + 1) {
      throw new BadRequestException('No se pueden crear series para más de un año adelante');
    }

    // Get all series from the previous year
    const previousYearSeries = await this.prisma.invoiceSeries.findMany({
      where: {
        tenantId,
        year: newYear - 1,
      },
    });

    if (previousYearSeries.length === 0) {
      throw new NotFoundException(`No hay series en el año ${newYear - 1} para replicar`);
    }

    // Create new series for the new year
    const newSeries = previousYearSeries.map((series: any) => ({
      tenantId,
      code: series.code,
      name: series.name,
      type: series.type,
      prefix: series.prefix.replace(`${newYear - 1}`, `${newYear}`),
      digits: series.digits,
      year: newYear,
      isDefault: series.isDefault,
      nextNumber: 1,
    }));

    await this.prisma.invoiceSeries.createMany({
      data: newSeries,
      skipDuplicates: true,
    });
  }
}

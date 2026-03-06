import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateInvoiceDefaultsDto } from './dto/update-invoice-defaults.dto';

@Injectable()
export class InvoiceDefaultsService {
  constructor(private prisma: PrismaService) {}

  async findByTenant(tenantId: string) {
    return this.prisma.invoiceDefaults.findUnique({
      where: { tenantId },
    });
  }

  async upsert(tenantId: string, dto: UpdateInvoiceDefaultsDto) {
    // Prisma requires Prisma.JsonNull (not plain null) for nullable JSON columns
    const paymentDetails: Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined =
      dto.paymentDetails === null
        ? Prisma.JsonNull
        : dto.paymentDetails !== undefined
          ? (dto.paymentDetails as Prisma.InputJsonValue)
          : undefined;

    const data = {
      paymentMethod: dto.paymentMethod ?? null,
      ...(paymentDetails !== undefined && { paymentDetails }),
      ...(dto.irpfPercent !== undefined && { irpfPercent: dto.irpfPercent }),
      ...(dto.dueDays !== undefined && { dueDays: dto.dueDays }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    };

    return this.prisma.invoiceDefaults.upsert({
      where: { tenantId },
      update: data,
      create: { tenantId, ...data },
    });
  }
}

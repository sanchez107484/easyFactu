import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProductAlias } from '@easyfactura/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductAliasDto } from './dto/product-alias.dto';
import { normalizedTextSql } from './grouping/product-match.sql';

/**
 * Equivalences "free-text description = catalog product" used by the reports to
 * attribute lines without a product. Invoices themselves are never modified.
 */
@Injectable()
export class ReportsProductAliasesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Creates the equivalence, or re-points it if that description was already linked. */
  async link(tenantId: string, userId: string, dto: CreateProductAliasDto): Promise<ProductAlias> {
    const [product, normalizedDescription] = await Promise.all([
      this.prisma.product.findFirst({
        where: { id: dto.productId, tenantId },
        select: { id: true, name: true },
      }),
      this.normalize(dto.description),
    ]);
    if (!product) throw new NotFoundException('Artículo no encontrado');
    if (!normalizedDescription) throw new BadRequestException('La descripción está vacía');

    const alias = await this.prisma.productAlias.upsert({
      where: { tenantId_normalizedDescription: { tenantId, normalizedDescription } },
      create: {
        tenantId,
        productId: product.id,
        description: dto.description,
        normalizedDescription,
        createdByUserId: userId,
      },
      update: { productId: product.id, description: dto.description, createdByUserId: userId },
      select: { id: true, description: true, productId: true },
    });

    return { ...alias, productName: product.name };
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const { count } = await this.prisma.productAlias.deleteMany({ where: { id, tenantId } });
    if (count === 0) throw new NotFoundException('Equivalencia no encontrada');
  }

  /**
   * Normalizes with the same SQL the reports use to compare descriptions, so a
   * saved equivalence always matches the lines it was created from.
   */
  private async normalize(description: string): Promise<string> {
    const [row] = await this.prisma.$queryRaw<{ normalized: string }[]>(
      Prisma.sql`SELECT ${normalizedTextSql(Prisma.sql`${description}::text`)} AS normalized`
    );
    return row?.normalized ?? '';
  }
}

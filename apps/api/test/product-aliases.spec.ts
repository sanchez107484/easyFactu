import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReportsProductAliasesService } from '../src/modules/reports/reports-product-aliases.service';
import { PrismaService } from '../src/prisma/prisma.service';

const TENANT_ID = 'tenant-1';
const PRODUCT_ID = '22222222-2222-4222-8222-222222222222';

function buildService(options: {
  product?: { id: string; name: string } | null;
  normalized?: string;
}) {
  const findFirst = jest.fn().mockResolvedValue(options.product ?? null);
  const queryRaw = jest
    .fn()
    .mockResolvedValue([{ normalized: options.normalized ?? 'asesoria puntual' }]);
  const upsert = jest
    .fn()
    .mockResolvedValue({ id: 'alias-1', description: 'Asesoría puntual', productId: PRODUCT_ID });
  const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
  const prisma = {
    product: { findFirst },
    productAlias: { upsert, deleteMany },
    $queryRaw: queryRaw,
  } as unknown as PrismaService;
  return { service: new ReportsProductAliasesService(prisma), findFirst, upsert, deleteMany };
}

describe('ReportsProductAliasesService', () => {
  const dto = { description: 'Asesoría  PUNTUAL', productId: PRODUCT_ID };

  it('links the normalized description to a product of the same tenant', async () => {
    const { service, findFirst, upsert } = buildService({
      product: { id: PRODUCT_ID, name: 'Consultoría' },
    });

    const alias = await service.link(TENANT_ID, 'user-1', dto);

    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: PRODUCT_ID, tenantId: TENANT_ID } })
    );
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId_normalizedDescription: {
            tenantId: TENANT_ID,
            normalizedDescription: 'asesoria puntual',
          },
        },
        update: expect.objectContaining({ productId: PRODUCT_ID }),
      })
    );
    expect(alias).toMatchObject({ id: 'alias-1', productName: 'Consultoría' });
  });

  it('rejects products from another tenant', async () => {
    const { service, upsert } = buildService({ product: null });
    await expect(service.link(TENANT_ID, 'user-1', dto)).rejects.toThrow(NotFoundException);
    expect(upsert).not.toHaveBeenCalled();
  });

  it('rejects descriptions that are empty once normalized', async () => {
    const { service } = buildService({
      product: { id: PRODUCT_ID, name: 'Consultoría' },
      normalized: '',
    });
    await expect(service.link(TENANT_ID, 'user-1', { ...dto, description: '   ' })).rejects.toThrow(
      BadRequestException
    );
  });

  it('only deletes equivalences of the current tenant', async () => {
    const { service, deleteMany } = buildService({});
    await expect(service.remove(TENANT_ID, 'alias-x')).rejects.toThrow(NotFoundException);
    expect(deleteMany).toHaveBeenCalledWith({ where: { id: 'alias-x', tenantId: TENANT_ID } });
  });
});

import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Plan } from '@easyfactura/shared-types';
import { SuppliersService } from '../src/modules/suppliers/suppliers.service';
import { prismaTest, cleanupTestData } from './helpers/prisma-test';
import {
  createTestTenant,
  createTestUser,
  linkTenantUser,
  createTestSupplier,
} from './helpers/test-data';

jest.setTimeout(30000);

describe('SuppliersService security', () => {
  const suppliersService = new SuppliersService(prismaTest);
  let tenantAId: string;
  let tenantBId: string;
  let userAId: string;
  let supplierAId: string;
  let supplierBIdValue: string;

  const tracked = {
    tenantIds: [] as string[],
    userIds: [] as string[],
    supplierIds: [] as string[],
  };

  beforeAll(async () => {
    const tenantA = await createTestTenant(Plan.PROFESSIONAL);
    const tenantB = await createTestTenant(Plan.PROFESSIONAL);
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;
    tracked.tenantIds.push(tenantAId, tenantBId);

    const userA = await createTestUser();
    userAId = userA.id;
    tracked.userIds.push(userAId);

    await linkTenantUser(tenantAId, userAId);

    const supplierA = await createTestSupplier(tenantAId, { name: 'Supplier A' });
    supplierAId = supplierA.id;
    tracked.supplierIds.push(supplierAId);

    const supplierB = await createTestSupplier(tenantBId, { name: 'Supplier B' });
    supplierBIdValue = supplierB.id;
    tracked.supplierIds.push(supplierB.id);
  });

  afterAll(async () => {
    await cleanupTestData(tracked);
    await prismaTest.$disconnect();
  });

  it('should not allow tenant A to read tenant B supplier', async () => {
    await expect(suppliersService.findOne(tenantAId, supplierBIdValue)).rejects.toThrow(NotFoundException);
  });

  it('should only list suppliers belonging to the requesting tenant', async () => {
    const result = await suppliersService.findAll(tenantAId, { page: 1, limit: 20, skip: 0 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.id).toBe(supplierAId);
  });

  it('should not allow tenant A to update tenant B supplier', async () => {
    await expect(
      suppliersService.update(tenantAId, supplierBIdValue, { name: 'Hacked' })
    ).rejects.toThrow(NotFoundException);
  });

  it('should not allow tenant A to delete tenant B supplier', async () => {
    await expect(suppliersService.remove(tenantAId, supplierBIdValue)).rejects.toThrow(NotFoundException);
  });

  it('should reject invalid Spanish NIF', async () => {
    await expect(
      suppliersService.create(tenantAId, {
        name: 'Invalid NIF',
        country: 'ES',
        taxId: '12345678',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('should allow valid Spanish NIF', async () => {
    const supplier = await suppliersService.create(tenantAId, {
      name: 'Valid NIF',
      country: 'ES',
      taxId: '12345678Z',
    });
    tracked.supplierIds.push(supplier.id);
    expect(supplier.taxId).toBe('12345678Z');
  });

  it('belongsToTenant returns false for cross-tenant supplier', async () => {
    const belongs = await suppliersService.belongsToTenant(tenantAId, supplierBIdValue);
    expect(belongs).toBe(false);
  });

  it('belongsToTenant returns true for own tenant supplier', async () => {
    const belongs = await suppliersService.belongsToTenant(tenantAId, supplierAId);
    expect(belongs).toBe(true);
  });
});

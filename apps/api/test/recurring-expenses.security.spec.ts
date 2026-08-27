import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Plan, RecurringExpenseFrequency } from '@easyfactura/shared-types';
import { PrismaService } from '../src/prisma/prisma.service';
import { RecurringExpensesService } from '../src/modules/recurring-expenses/recurring-expenses.service';
import { ExpensesCalculationService } from '../src/modules/expenses/expenses-calculation.service';
import { SuppliersService } from '../src/modules/suppliers/suppliers.service';
import { prismaTest, cleanupTestData } from './helpers/prisma-test';
import {
  createTestTenant,
  createTestUser,
  linkTenantUser,
  createTestCategory,
  createTestSupplier,
  today,
} from './helpers/test-data';

jest.setTimeout(30000);

describe('RecurringExpensesService security', () => {
  const recurringService = new RecurringExpensesService(
    prismaTest,
    new ExpensesCalculationService(),
    new SuppliersService(prismaTest)
  );
  let tenantAId: string;
  let tenantBId: string;
  let userAId: string;
  let userBId: string;
  let categoryAId: string;
  let categoryBId: string;
  let recurringAId: string;

  const tracked = {
    tenantIds: [] as string[],
    userIds: [] as string[],
    categoryIds: [] as string[],
    recurringExpenseIds: [] as string[],
    expenseIds: [] as string[],
  };

  beforeAll(async () => {
    const tenantA = await createTestTenant(Plan.PROFESSIONAL);
    const tenantB = await createTestTenant(Plan.PROFESSIONAL);
    tenantAId = tenantA.id;
    tenantBId = tenantB.id;
    tracked.tenantIds.push(tenantAId, tenantBId);

    const userA = await createTestUser();
    const userB = await createTestUser();
    userAId = userA.id;
    userBId = userB.id;
    tracked.userIds.push(userAId, userBId);

    await linkTenantUser(tenantAId, userAId);
    await linkTenantUser(tenantBId, userBId);

    const categoryA = await createTestCategory('Category A');
    const categoryB = await createTestCategory('Category B');
    categoryAId = categoryA.id;
    categoryBId = categoryB.id;
    tracked.categoryIds.push(categoryAId, categoryBId);

    const recurringA = await recurringService.create(tenantAId, userAId, {
      description: 'Suscripción A',
      categoryId: categoryAId,
      baseAmount: 100,
      vatRate: 21,
      frequency: RecurringExpenseFrequency.MONTHLY,
      startDate: today(),
    });
    recurringAId = recurringA.id;
    tracked.recurringExpenseIds.push(recurringAId);

    const recurringB = await recurringService.create(tenantBId, userBId, {
      description: 'Suscripción B',
      categoryId: categoryBId,
      baseAmount: 50,
      vatRate: 10,
      frequency: RecurringExpenseFrequency.MONTHLY,
      startDate: today(),
    });
    tracked.recurringExpenseIds.push(recurringB.id);
  });

  afterAll(async () => {
    await cleanupTestData({ ...tracked, supplierIds: [], attachmentIds: [] });
    await prismaTest.$disconnect();
  });

  it('should not allow tenant A to read tenant B recurring expense', async () => {
    const recurringBId = tracked.recurringExpenseIds.at(-1)!;
    await expect(recurringService.findOne(tenantAId, recurringBId)).rejects.toThrow(NotFoundException);
  });

  it('should only list recurring expenses belonging to the requesting tenant', async () => {
    const result = await recurringService.findAll(tenantAId, { page: 1, limit: 20, skip: 0 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]!.id).toBe(recurringAId);
  });

  it('should not allow tenant A to update tenant B recurring expense', async () => {
    const recurringBId = tracked.recurringExpenseIds.at(-1)!;
    await expect(
      recurringService.update(tenantAId, recurringBId, { description: 'Hacked' })
    ).rejects.toThrow(NotFoundException);
  });

  it('should not allow tenant A to delete tenant B recurring expense', async () => {
    const recurringBId = tracked.recurringExpenseIds.at(-1)!;
    await expect(recurringService.remove(tenantAId, recurringBId)).rejects.toThrow(NotFoundException);
  });

  it('should generate expenses only for own tenant', async () => {
    const result = await recurringService.generate(tenantAId, recurringAId, today());
    expect(result.generatedCount).toBeGreaterThan(0);
    const expenses = await prismaTest.expense.findMany({ where: { recurringExpenseId: recurringAId } });
    tracked.expenseIds.push(...expenses.map((e) => e.id));
    expect(expenses.length).toBe(result.generatedCount);
    expect(expenses.every((e) => e.tenantId === tenantAId)).toBe(true);
  });

  it('should not generate expenses for cross-tenant recurring expense', async () => {
    const recurringBId = tracked.recurringExpenseIds.at(-1)!;
    await expect(recurringService.generate(tenantAId, recurringBId)).rejects.toThrow(NotFoundException);
  });

  it('should reject endDate before startDate', async () => {
    const start = today();
    const end = new Date();
    end.setFullYear(end.getFullYear() - 1);
    await expect(
      recurringService.create(tenantAId, userAId, {
        description: 'Invalid dates',
        categoryId: categoryAId,
        baseAmount: 10,
        vatRate: 21,
        frequency: RecurringExpenseFrequency.MONTHLY,
        startDate: start,
        endDate: end.toISOString().split('T')[0],
      })
    ).rejects.toThrow(BadRequestException);
  });
});

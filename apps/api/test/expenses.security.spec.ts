import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Plan } from '@easyfactura/shared-types';
import { ExpensesService } from '../src/modules/expenses/expenses.service';
import { ExpensesCalculationService } from '../src/modules/expenses/expenses-calculation.service';
import { SuppliersService } from '../src/modules/suppliers/suppliers.service';
import { prismaTest, cleanupTestData } from './helpers/prisma-test';
import {
  createTestTenant,
  createTestUser,
  linkTenantUser,
  createTestCategory,
  createTestSupplier,
  createTestExpense,
  today,
  toDateString,
} from './helpers/test-data';

jest.setTimeout(30000);

describe('ExpensesService security', () => {
  const expensesService = new ExpensesService(
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
  let supplierAId: string;
  let expenseAId: string;

  const tracked = {
    tenantIds: [] as string[],
    userIds: [] as string[],
    categoryIds: [] as string[],
    supplierIds: [] as string[],
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

    const supplierA = await createTestSupplier(tenantAId);
    supplierAId = supplierA.id;
    tracked.supplierIds.push(supplierAId);

    const expenseA = await createTestExpense(tenantAId, userAId, categoryAId, {
      supplierId: supplierAId,
      baseAmount: 100,
      vatRate: 21,
      description: 'Expense A',
    });
    expenseAId = expenseA.id;
    tracked.expenseIds.push(expenseAId);

    const expenseB = await createTestExpense(tenantBId, userBId, categoryBId, {
      description: 'Expense B',
    });
    tracked.expenseIds.push(expenseB.id);
  });

  afterAll(async () => {
    await cleanupTestData(tracked);
    await prismaTest.$disconnect();
  });

  describe('IDOR isolation', () => {
    const expenseBId = () => tracked.expenseIds.at(-1)!;

    it('should not allow tenant A to read tenant B expense', async () => {
      await expect(expensesService.findOne(tenantAId, expenseBId())).rejects.toThrow(NotFoundException);
    });

    it('should only list expenses belonging to the requesting tenant', async () => {
      const result = await expensesService.findAll(tenantAId, { page: 1, limit: 20, skip: 0 });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]!.id).toBe(expenseAId);
    });

    it('should not allow tenant A to update tenant B expense', async () => {
      await expect(
        expensesService.update(tenantAId, expenseBId(), { description: 'Hacked' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should not allow tenant A to delete tenant B expense', async () => {
      await expect(expensesService.remove(tenantAId, expenseBId())).rejects.toThrow(NotFoundException);
    });

    it('should not allow using supplier from another tenant', async () => {
      await expect(
        expensesService.create(tenantBId, userBId, {
          date: today(),
          description: 'Cross-tenant supplier',
          categoryId: categoryBId,
          supplierId: supplierAId,
          baseAmount: 50,
          vatRate: 21,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should not allow using category from another tenant because categories are global', async () => {
      // Categories are global, so this should succeed even if created by tenant A helper.
      // The test documents that categories are intentionally global.
      const expense = await expensesService.create(tenantBId, userBId, {
        date: today(),
        description: 'Uses global category',
        categoryId: categoryAId,
        baseAmount: 50,
        vatRate: 21,
      });
      tracked.expenseIds.push(expense.id);
      expect(expense.categoryId).toBe(categoryAId);
    });
  });

  describe('Validation', () => {
    it('should reject a date older than 10 years', async () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 11);

      await expect(
        expensesService.create(tenantAId, userAId, {
          date: toDateString(oldDate),
          description: 'Old expense',
          categoryId: categoryAId,
          baseAmount: 100,
          vatRate: 21,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow a future date within 10 years', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const expense = await expensesService.create(tenantAId, userAId, {
        date: toDateString(futureDate),
        description: 'Future expense',
        categoryId: categoryAId,
        baseAmount: 100,
        vatRate: 21,
      });
      tracked.expenseIds.push(expense.id);
      expect(expense.date.toISOString().startsWith(toDateString(futureDate))).toBe(true);
    });

    it('should reject baseAmount equal to 0', async () => {
      await expect(
        expensesService.create(tenantAId, userAId, {
          date: today(),
          description: 'Zero amount',
          categoryId: categoryAId,
          baseAmount: 0,
          vatRate: 21,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject negative baseAmount', async () => {
      await expect(
        expensesService.create(tenantAId, userAId, {
          date: today(),
          description: 'Negative amount',
          categoryId: categoryAId,
          baseAmount: -10,
          vatRate: 21,
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Calculation & rounding', () => {
    it('should calculate VAT and total with half-up rounding', async () => {
      const expense = await expensesService.create(tenantAId, userAId, {
        date: today(),
        description: 'Rounding test',
        categoryId: categoryAId,
        baseAmount: 33.33,
        vatRate: 21,
      });
      tracked.expenseIds.push(expense.id);
      // 33.33 * 0.21 = 6.9993 -> 7.00
      expect(Number(expense.vatAmount)).toBe(7);
      expect(Number(expense.totalAmount)).toBe(40.33);
    });

    it('should recalculate totals on update', async () => {
      const updated = await expensesService.update(tenantAId, expenseAId, {
        baseAmount: 200,
        vatRate: 10,
      });
      expect(Number(updated.vatAmount)).toBe(20);
      expect(Number(updated.totalAmount)).toBe(220);
    });
  });
});

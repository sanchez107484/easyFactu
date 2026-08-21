import { Plan, TenantUserRole } from '@easyfactura/shared-types';
import { prismaTest } from './prisma-test';

let counter = 0;

export function today(): string {
  return new Date().toISOString().split('T')[0] as string;
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0] as string;
}

function unique(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now()}_${process.pid}_${counter}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createTestTenant(plan: Plan = Plan.FREE) {
  return prismaTest.tenant.create({
    data: {
      businessName: unique('tenant'),
      nif: unique('NIF'),
      address: 'Test address',
      postalCode: '31001',
      city: 'Pamplona',
      province: 'Navarra',
      country: 'ES',
      email: `${unique('tenant')}@test.local`,
      plan,
    },
  });
}

export async function createTestUser() {
  const email = `${unique('user')}@test.local`;
  return prismaTest.user.create({
    data: {
      email,
      passwordHash: 'not-used',
      firstName: 'Test',
      lastName: 'User',
    },
  });
}

export async function linkTenantUser(
  tenantId: string,
  userId: string,
  role: TenantUserRole = TenantUserRole.ADMIN
) {
  return prismaTest.tenantUser.create({
    data: {
      tenantId,
      userId,
      role,
      isOwner: role === TenantUserRole.ADMIN,
    },
  });
}

export async function createTestCategory(name?: string) {
  const slug = unique('cat');
  return prismaTest.expenseCategory.create({
    data: {
      slug,
      name: name ?? `Category ${slug}`,
    },
  });
}

export async function createTestSupplier(
  tenantId: string,
  overrides: Partial<{ name: string; taxId: string }> = {}
) {
  return prismaTest.supplier.create({
    data: {
      tenantId,
      name: overrides.name ?? unique('Supplier'),
      taxId: overrides.taxId ?? undefined,
      country: 'ES',
    },
  });
}

export async function createTestExpense(
  tenantId: string,
  userId: string,
  categoryId: string,
  overrides: Partial<{
    supplierId: string;
    baseAmount: number;
    vatRate: number;
    date: string;
    description: string;
  }> = {}
) {
  return prismaTest.expense.create({
    data: {
      tenantId,
      createdByUserId: userId,
      categoryId,
      supplierId: overrides.supplierId ?? null,
      date: overrides.date ? new Date(overrides.date) : new Date(),
      description: overrides.description ?? unique('Expense'),
      baseAmount: overrides.baseAmount ?? 100,
      vatRate: overrides.vatRate ?? 21,
      vatAmount: 0,
      totalAmount: 0,
    },
  });
}

export async function createTestAttachment(
  tenantId: string,
  userId: string,
  overrides: Partial<{ expenseId: string; fileName: string; mimeType: string }> = {}
) {
  return prismaTest.expenseAttachment.create({
    data: {
      tenantId,
      expenseId: overrides.expenseId ?? null,
      fileName: overrides.fileName ?? 'receipt.pdf',
      mimeType: overrides.mimeType ?? 'application/pdf',
      size: 1024,
      storageKey: unique('key'),
      content: 'data:application/pdf;base64,dGVzdA==',
    },
  });
}

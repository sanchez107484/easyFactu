import { PlanTier, TenantUserRole } from '@easyfactura/shared-types';
import { createFreeSubscription } from '../../src/modules/subscriptions/initial-subscription';
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

/**
 * Creates a tenant with its subscription in one transaction, exactly as signup, agency clients
 * and ERP provisioning do: the plan lives in Subscription → Plan.tier, never on the tenant.
 */
export async function createTestTenant(tier: PlanTier = PlanTier.BASIC) {
  return prismaTest.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        businessName: unique('tenant'),
        nif: unique('NIF'),
        address: 'Test address',
        postalCode: '31001',
        city: 'Pamplona',
        province: 'Navarra',
        country: 'ES',
        email: `${unique('tenant')}@test.local`,
      },
    });
    await createFreeSubscription(
      tx,
      tenant.id,
      tier === PlanTier.PROFESSIONAL ? 'PROFESSIONAL_FREE' : 'BASIC_FREE'
    );
    return tenant;
  });
}

/** A tenant without subscription: an inconsistent state the app never creates on purpose. */
export async function createTenantWithoutSubscription() {
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

import { Prisma } from '@prisma/client';

export type FreePlanSlug = 'BASIC_FREE' | 'PROFESSIONAL_FREE';

/**
 * Every tenant must have exactly one subscription from the moment it exists —
 * PlanGuard and the plan UI rely on it. Call inside the tenant-creation transaction.
 */
export async function createFreeSubscription(
  tx: Prisma.TransactionClient,
  tenantId: string,
  planSlug: FreePlanSlug
): Promise<void> {
  const plan = await tx.plan.findUnique({ where: { slug: planSlug }, select: { id: true } });
  if (!plan) {
    throw new Error(`Plan ${planSlug} no encontrado en el seed`);
  }

  await tx.subscription.create({
    data: {
      tenantId,
      planId: plan.id,
      status: 'ACTIVE',
      billingCycle: 'FREE',
    },
  });
}

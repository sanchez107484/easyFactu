import { Prisma } from '@prisma/client';
import { createFreeSubscription } from '../src/modules/subscriptions/initial-subscription';

function buildTx(plan: { id: string } | null) {
  const findUnique = jest.fn().mockResolvedValue(plan);
  const create = jest.fn().mockResolvedValue({});
  const tx = {
    plan: { findUnique },
    subscription: { create },
  } as unknown as Prisma.TransactionClient;
  return { tx, findUnique, create };
}

describe('createFreeSubscription', () => {
  it('creates an active free subscription on the requested plan', async () => {
    const { tx, findUnique, create } = buildTx({ id: 'plan-basic' });

    await createFreeSubscription(tx, 'tenant-1', 'BASIC_FREE');

    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { slug: 'BASIC_FREE' } })
    );
    expect(create).toHaveBeenCalledWith({
      data: { tenantId: 'tenant-1', planId: 'plan-basic', status: 'ACTIVE', billingCycle: 'FREE' },
    });
  });

  it('fails (rolling back the transaction) when the plan is missing from the seed', async () => {
    const { tx, create } = buildTx(null);

    await expect(createFreeSubscription(tx, 'tenant-1', 'BASIC_FREE')).rejects.toThrow(
      'Plan BASIC_FREE no encontrado en el seed'
    );
    expect(create).not.toHaveBeenCalled();
  });
});

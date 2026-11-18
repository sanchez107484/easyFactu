import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PlanTier } from '@easyfactura/shared-types';
import { PlanRequiredException } from '../src/common/errors/plan-required.exception';
import { PrismaService } from '../src/prisma/prisma.service';
import { PlanGuard } from '../src/common/guards/plan.guard';
import { REQUIRED_PLAN_KEY } from '../src/common/decorators/require-plan.decorator';
import { prismaTest, cleanupTestData } from './helpers/prisma-test';
import {
  createTenantWithoutSubscription,
  createTestTenant,
  createTestUser,
  linkTenantUser,
} from './helpers/test-data';

function createMockContext(tenantId?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: tenantId ? { tenantId } : undefined,
      }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => ({} as never),
  } as unknown as ExecutionContext;
}

describe('PlanGuard', () => {
  let guard: PlanGuard;
  let reflector: Reflector;
  let prisma: PrismaService;
  let basicTenantId: string;
  let proTenantId: string;

  const tracked = {
    tenantIds: [] as string[],
    userIds: [] as string[],
  };

  function requirePlan(tier: PlanTier | undefined): void {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(tier);
  }

  beforeAll(async () => {
    prisma = new PrismaService();
    reflector = new Reflector();
    guard = new PlanGuard(reflector, prisma);

    const basicTenant = await createTestTenant(PlanTier.BASIC);
    const proTenant = await createTestTenant(PlanTier.PROFESSIONAL);
    basicTenantId = basicTenant.id;
    proTenantId = proTenant.id;
    tracked.tenantIds.push(basicTenantId, proTenantId);

    const user = await createTestUser();
    tracked.userIds.push(user.id);
    await linkTenantUser(basicTenantId, user.id);
    await linkTenantUser(proTenantId, user.id);
  });

  afterAll(async () => {
    await cleanupTestData(tracked);
    await prisma.$disconnect();
    await prismaTest.$disconnect();
  });

  it('allows access when no plan is required', async () => {
    requirePlan(undefined);
    await expect(guard.canActivate(createMockContext(basicTenantId))).resolves.toBe(true);
  });

  it('denies access when tenantId is missing', async () => {
    requirePlan(PlanTier.PROFESSIONAL);
    await expect(guard.canActivate(createMockContext(undefined))).rejects.toThrow(
      ForbiddenException
    );
  });

  it('allows a PROFESSIONAL tenant to use a PROFESSIONAL feature', async () => {
    requirePlan(PlanTier.PROFESSIONAL);
    await expect(guard.canActivate(createMockContext(proTenantId))).resolves.toBe(true);
  });

  it('allows a PROFESSIONAL tenant to use a BASIC feature', async () => {
    requirePlan(PlanTier.BASIC);
    await expect(guard.canActivate(createMockContext(proTenantId))).resolves.toBe(true);
  });

  it('allows a BASIC tenant to use a BASIC feature', async () => {
    requirePlan(PlanTier.BASIC);
    await expect(guard.canActivate(createMockContext(basicTenantId))).resolves.toBe(true);
  });

  it('denies a BASIC tenant a PROFESSIONAL feature with PlanRequiredException', async () => {
    requirePlan(PlanTier.PROFESSIONAL);
    await expect(guard.canActivate(createMockContext(basicTenantId))).rejects.toThrow(
      PlanRequiredException
    );
  });

  it('denies a tenant without subscription', async () => {
    const orphan = await createTenantWithoutSubscription();
    tracked.tenantIds.push(orphan.id);
    requirePlan(PlanTier.BASIC);
    await expect(guard.canActivate(createMockContext(orphan.id))).rejects.toThrow(
      ForbiddenException
    );
  });
});

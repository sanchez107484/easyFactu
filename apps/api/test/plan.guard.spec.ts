import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Plan } from '@easyfactura/shared-types';
import { PrismaService } from '../src/prisma/prisma.service';
import { PlanGuard } from '../src/common/guards/plan.guard';
import { REQUIRED_PLAN_KEY } from '../src/common/decorators/require-plan.decorator';
import { prismaTest, cleanupTestData } from './helpers/prisma-test';
import { createTestTenant, createTestUser, linkTenantUser } from './helpers/test-data';

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
  let freeTenantId: string;
  let proTenantId: string;

  const tracked = {
    tenantIds: [] as string[],
    userIds: [] as string[],
  };

  beforeAll(async () => {
    prisma = new PrismaService();
    reflector = new Reflector();
    guard = new PlanGuard(reflector, prisma);

    const freeTenant = await createTestTenant(Plan.FREE);
    const proTenant = await createTestTenant(Plan.PROFESSIONAL);
    freeTenantId = freeTenant.id;
    proTenantId = proTenant.id;
    tracked.tenantIds.push(freeTenantId, proTenantId);

    const user = await createTestUser();
    tracked.userIds.push(user.id);
    await linkTenantUser(freeTenantId, user.id);
    await linkTenantUser(proTenantId, user.id);
  });

  afterAll(async () => {
    await cleanupTestData(tracked);
    await prismaTest.$disconnect();
  });

  it('should allow access when no plan is required', async () => {
    const context = createMockContext(freeTenantId);
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should deny access when tenantId is missing', async () => {
    const context = createMockContext(undefined);
    reflector.getAllAndOverride = jest.fn().mockReturnValue(Plan.PROFESSIONAL);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow PRO tenant to access PRO feature', async () => {
    const context = createMockContext(proTenantId);
    reflector.getAllAndOverride = jest.fn().mockReturnValue(Plan.PROFESSIONAL);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should deny FREE tenant from PRO feature', async () => {
    const context = createMockContext(freeTenantId);
    reflector.getAllAndOverride = jest.fn().mockReturnValue(Plan.PROFESSIONAL);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow BASIC tenant to access BASIC feature', async () => {
    const basicTenant = await createTestTenant(Plan.BASIC);
    tracked.tenantIds.push(basicTenant.id);

    const context = createMockContext(basicTenant.id);
    reflector.getAllAndOverride = jest.fn().mockReturnValue(Plan.BASIC);

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('should deny FREE tenant from BASIC feature', async () => {
    const context = createMockContext(freeTenantId);
    reflector.getAllAndOverride = jest.fn().mockReturnValue(Plan.BASIC);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });
});

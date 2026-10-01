import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../common/email/email.service';
import { ChangePlanDto } from './dto/change-plan.dto';
import { SetPreferredPlanDto } from './dto/set-preferred-plan.dto';
import { PlanTier, SubscriptionStatus } from '@easyfactura/shared-types';

export interface DowngradeValidationResult {
  valid: boolean;
  violations: string[];
}

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async getCurrentSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    return subscription;
  }

  async setPreferredPlan(
    tenantId: string,
    dto: SetPreferredPlanDto
  ): Promise<{ success: boolean; preferredPlanSlug: string | null }> {
    const { preferredPlanSlug } = dto;

    await this.prisma.subscription.update({
      where: { tenantId },
      data: {
        preferredPlanSlug: preferredPlanSlug ?? null,
      },
    });

    return {
      success: true,
      preferredPlanSlug: preferredPlanSlug ?? null,
    };
  }

  async getAvailablePlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ tier: 'asc' }, { cycle: 'asc' }],
    });
  }

  async getInvoicesCountThisYear(tenantId: string): Promise<number> {
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const count = await this.prisma.invoice.count({
      where: {
        tenantId,
        status: { in: ['CONFIRMED', 'SENT', 'PAID'] },
        issueDate: { gte: startOfYear },
      },
    });
    return count;
  }

  async getUsage(tenantId: string) {
    const [invoiceCountThisYear, basicPlan] = await Promise.all([
      this.getInvoicesCountThisYear(tenantId),
      this.prisma.plan.findUnique({ where: { slug: 'BASIC_FREE' } }),
    ]);

    const maxInvoicesBasic = (basicPlan?.limits as any)?.maxInvoicesPerYear as number | null;

    return {
      invoicesThisYear: invoiceCountThisYear,
      maxInvoicesBasic,
    };
  }

  async validateDowngrade(
    tenantId: string,
    targetPlanSlug: string
  ): Promise<DowngradeValidationResult> {
    const violations: string[] = [];

    const targetPlan = await this.prisma.plan.findUnique({
      where: { slug: targetPlanSlug },
    });

    if (!targetPlan) {
      throw new NotFoundException('Plan destino no encontrado');
    }

    if (targetPlan.tier === PlanTier.BASIC) {
      const invoiceCount = await this.getInvoicesCountThisYear(tenantId);
      const maxInvoices = (targetPlan.limits as any)?.maxInvoicesPerYear as number | null;

      if (maxInvoices !== null && invoiceCount > maxInvoices) {
        violations.push(
          `Tienes ${invoiceCount} facturas emitidas en ${new Date().getFullYear()}. El plan BASIC permite máximo ${maxInvoices} facturas anuales.`
        );
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  async changePlan(
    tenantId: string,
    userId: string,
    dto: ChangePlanDto
  ): Promise<{ success: boolean; message: string }> {
    const { targetPlanSlug } = dto;

    const targetPlan = await this.prisma.plan.findUnique({
      where: { slug: targetPlanSlug },
    });

    if (!targetPlan) {
      throw new NotFoundException('Plan no encontrado');
    }

    const currentSubscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!currentSubscription) {
      throw new NotFoundException('Suscripción no encontrada');
    }

    if (currentSubscription.plan.slug === targetPlanSlug) {
      return { success: true, message: 'Ya estás en este plan' };
    }

    const isDowngrade =
      targetPlan.tier === PlanTier.BASIC && currentSubscription.plan.tier === PlanTier.PROFESSIONAL;

    if (isDowngrade) {
      const validation = await this.validateDowngrade(tenantId, targetPlanSlug);
      if (!validation.valid) {
        throw new BadRequestException({
          message: 'No puedes cambiar a este plan',
          violations: validation.violations,
        });
      }
    }

    const previousPlanId = currentSubscription.planId;

    await this.prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { tenantId },
        data: {
          planId: targetPlan.id,
          billingCycle: targetPlan.cycle,
          status: SubscriptionStatus.ACTIVE,
        },
      });

      await tx.planChangeLog.create({
        data: {
          tenantId,
          fromPlanId: previousPlanId,
          toPlanId: targetPlan.id,
          changedBy: userId,
        },
      });
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true },
    });

    if (user) {
      await this.emailService.sendPlanChangeNotification({
        to: user.email,
        firstName: user.firstName ?? '',
        fromPlanName: currentSubscription.plan.name,
        toPlanName: targetPlan.name,
        changeDate: new Date().toISOString(),
      });
    }

    return {
      success: true,
      message: `Plan cambiado a ${targetPlan.name} correctamente`,
    };
  }
}

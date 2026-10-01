import { SetMetadata } from '@nestjs/common';
import { PlanTier } from '@easyfactura/shared-types';

export const REQUIRED_PLAN_KEY = 'requiredPlan';

export const RequirePlan = (tier: PlanTier) => SetMetadata(REQUIRED_PLAN_KEY, tier);

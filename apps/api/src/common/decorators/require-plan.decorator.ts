import { SetMetadata } from '@nestjs/common';
import { Plan } from '@easyfactura/shared-types';

export const REQUIRED_PLAN_KEY = 'requiredPlan';

export const RequirePlan = (plan: Plan) => SetMetadata(REQUIRED_PLAN_KEY, plan);

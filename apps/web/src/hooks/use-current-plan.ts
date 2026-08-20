import { useAuthStore } from '@/store/auth-store';
import { Plan } from '@easyfactura/shared-types';

export function useCurrentPlan(): Plan | null {
  return useAuthStore((state) => state.currentTenant?.plan ?? null);
}

export function useIsPlanAtLeast(requiredPlan: Plan): boolean {
  const currentPlan = useCurrentPlan();
  if (!currentPlan) return false;

  const order: Record<Plan, number> = {
    [Plan.FREE]: 0,
    [Plan.BASIC]: 1,
    [Plan.PROFESSIONAL]: 2,
  };

  return order[currentPlan] >= order[requiredPlan];
}

export function useHasProfessionalPlan(): boolean {
  return useIsPlanAtLeast(Plan.PROFESSIONAL);
}

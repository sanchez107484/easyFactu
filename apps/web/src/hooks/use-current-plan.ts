import { useAuthStore } from '@/store/auth-store';
import { PlanTier } from '@easyfactura/shared-types';

export function useCurrentPlanTier(): PlanTier | null {
  return useAuthStore((state) => state.currentTenant?.subscription?.plan?.tier ?? null);
}

export function useIsPlanAtLeast(requiredTier: PlanTier): boolean {
  const currentTier = useCurrentPlanTier();
  if (!currentTier) return false;

  const order: Record<PlanTier, number> = {
    [PlanTier.BASIC]: 1,
    [PlanTier.PROFESSIONAL]: 2,
  };

  return order[currentTier] >= order[requiredTier];
}

export function useHasProfessionalPlan(): boolean {
  return useIsPlanAtLeast(PlanTier.PROFESSIONAL);
}

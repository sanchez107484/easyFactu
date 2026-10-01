import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { subscriptionApi } from '@/lib/api/subscription-api';
import { getApiErrorMessage } from '@/lib/api-error';

export function useCurrentSubscription() {
  return useQuery({
    queryKey: ['subscription', 'current'],
    queryFn: () => subscriptionApi.getCurrent(),
    staleTime: 60_000,
  });
}

export function useAvailablePlans() {
  return useQuery({
    queryKey: ['plans', 'available'],
    queryFn: () => subscriptionApi.getAvailablePlans(),
    staleTime: 60_000 * 5,
  });
}

export function useSubscriptionUsage() {
  return useQuery({
    queryKey: ['subscription', 'usage'],
    queryFn: () => subscriptionApi.getUsage(),
    staleTime: 30_000,
  });
}

export function useChangePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (targetPlanSlug: string) => subscriptionApi.changePlan(targetPlanSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      toast.success('Plan actualizado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useSetPreferredPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferredPlanSlug: string | null) =>
      subscriptionApi.setPreferredPlan(preferredPlanSlug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      toast.success('Preferencia guardada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

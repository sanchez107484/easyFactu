import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { integrationApi } from '@/lib/api/integration-api';
import { getApiErrorMessage } from '@/lib/api-error';

export const integrationConsentKeys = {
  detail: (token: string) => ['integration-consent', token] as const,
};

/** ERP link request; only loads once the user is signed in (the API requires the OWNER). */
export function useIntegrationConsent(token: string, isEnabled: boolean) {
  return useQuery({
    queryKey: integrationConsentKeys.detail(token),
    queryFn: () => integrationApi.getConsent(token),
    enabled: isEnabled,
    retry: false,
  });
}

export function useAcceptIntegrationConsent(token: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => integrationApi.acceptConsent(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      toast.success('Conexión con el ERP autorizada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invoiceDefaultsApi, UpdateInvoiceDefaultsInput } from '@/lib/api/invoice-defaults-api';
import { InvoiceDefaults } from '@easyfactura/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';

export const invoiceDefaultsKeys = {
  all: ['invoice-defaults'] as const,
  detail: () => [...invoiceDefaultsKeys.all, 'detail'] as const,
};

export function useInvoiceDefaults() {
  return useQuery({
    queryKey: invoiceDefaultsKeys.detail(),
    queryFn: () => invoiceDefaultsApi.get(),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateInvoiceDefaults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateInvoiceDefaultsInput) => invoiceDefaultsApi.update(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(invoiceDefaultsKeys.detail(), updated);
      toast.success('Preferencias guardadas');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

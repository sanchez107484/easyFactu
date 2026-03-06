'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { invoiceDefaultsApi, UpdateInvoiceDefaultsInput } from '@/lib/api/invoice-defaults-api';
import { InvoiceDefaults } from '@easyfactura/shared-types';

export const invoiceDefaultsKeys = {
  all: ['invoice-defaults'] as const,
  detail: () => [...invoiceDefaultsKeys.all, 'detail'] as const,
};

function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message[0];
  }
  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

export function useInvoiceDefaults() {
  return useQuery({
    queryKey: invoiceDefaultsKeys.detail(),
    queryFn: () => invoiceDefaultsApi.get(),
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

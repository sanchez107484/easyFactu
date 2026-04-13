'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { recurringInvoiceApi } from '@/lib/api/recurring-invoice-api';
import {
  RecurringInvoice,
  RecurringStatus,
  CreateRecurringInvoiceInput,
  UpdateRecurringInvoiceInput,
  QueryRecurringInvoicesInput,
} from '@easyfactura/shared-types';
import { AxiosError } from 'axios';

// ==================== QUERY KEYS ====================

export const recurringInvoiceKeys = {
  all: ['recurring-invoices'] as const,
  lists: () => [...recurringInvoiceKeys.all, 'list'] as const,
  list: (filters: QueryRecurringInvoicesInput) =>
    [...recurringInvoiceKeys.lists(), filters] as const,
  details: () => [...recurringInvoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...recurringInvoiceKeys.details(), id] as const,
};

// ==================== HELPERS ====================

function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message[0];
  }
  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

// ==================== QUERIES ====================

export function useRecurringInvoices(filters: QueryRecurringInvoicesInput = {}) {
  return useQuery({
    queryKey: recurringInvoiceKeys.list(filters),
    queryFn: () => recurringInvoiceApi.getAll(filters),
  });
}

export function useRecurringInvoice(id: string) {
  return useQuery({
    queryKey: recurringInvoiceKeys.detail(id),
    queryFn: () => recurringInvoiceApi.getById(id),
    enabled: !!id,
  });
}

// ==================== MUTATIONS ====================

export function useCreateRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringInvoiceInput) => recurringInvoiceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
      toast.success('Factura recurrente creada correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringInvoiceInput }) =>
      recurringInvoiceApi.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
      queryClient.setQueryData(recurringInvoiceKeys.detail(updated.id), updated);
      toast.success('Factura recurrente actualizada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function usePauseRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringInvoiceApi.pause(id),
    onSuccess: (updated, id) => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
      queryClient.setQueryData(recurringInvoiceKeys.detail(id), updated);
      toast.success('Factura recurrente pausada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useResumeRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringInvoiceApi.resume(id),
    onSuccess: (updated, id) => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
      queryClient.setQueryData(recurringInvoiceKeys.detail(id), updated);
      toast.success('Factura recurrente reactivada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteRecurringInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringInvoiceApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: recurringInvoiceKeys.lists() });
      queryClient.removeQueries({ queryKey: recurringInvoiceKeys.detail(id) });
      toast.success('Factura recurrente eliminada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

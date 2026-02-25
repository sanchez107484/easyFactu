'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invoiceApi, RectifyInvoiceInput } from '@/lib/api/invoice-api';
import {
  QueryInvoicesInput,
  CreateInvoiceInput,
  UpdateInvoiceInput,
} from '@easyfactura/shared-types';
import { AxiosError } from 'axios';

// ==================== QUERY KEYS ====================

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: QueryInvoicesInput) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
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

export function useInvoices(filters: QueryInvoicesInput = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => invoiceApi.getAll(filters),
  });
}

// ESTA ES LA VERSIÓN CORREGIDA Y UNIFICADA
export function useInvoice(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoiceApi.getById(id),
    // Si pasamos enabled en las opciones, lo usamos. Si no, verificamos que haya ID.
    enabled: options?.enabled ?? Boolean(id),
  });
}

// ==================== MUTATIONS ====================

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceInput) => invoiceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success('Factura creada correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceInput }) =>
      invoiceApi.update(id, data),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      toast.success('Factura actualizada correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useConfirmInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.confirm(id),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      toast.success(`Factura ${invoice.number} confirmada correctamente`);
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useMarkInvoiceAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.markAsPaid(id),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      toast.success('Factura marcada como pagada');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDuplicateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success('Factura duplicada como borrador');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useRectifyInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RectifyInvoiceInput }) =>
      invoiceApi.rectify(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success('Factura rectificativa creada como borrador');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success('Factura eliminada correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

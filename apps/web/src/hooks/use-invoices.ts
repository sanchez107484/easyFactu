'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { invoiceApi, paymentApi, RectifyInvoiceInput } from '@/lib/api/invoice-api';
import {
  QueryInvoicesInput,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CreatePaymentInput,
  InvoiceStats,
  InvoiceReportData,
} from '@easyfactura/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';

// ==================== QUERY KEYS ====================

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: QueryInvoicesInput) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

// ==================== QUERIES ====================

export function useInvoices(filters: QueryInvoicesInput = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: () => invoiceApi.getAll(filters),
    staleTime: 30_000, // 30s — evita re-fetches en navegación rápida
    placeholderData: keepPreviousData, // mantiene datos previos al paginar/filtrar
  });
}

export function useInvoiceStats(year?: number) {
  return useQuery<InvoiceStats>({
    queryKey: ['invoices', 'stats', year ?? 'current'],
    queryFn: () => invoiceApi.getStats(year),
    staleTime: 60_000, // 1 min — KPIs no cambian segundo a segundo
  });
}

export function useInvoiceReports(fromDate: string, toDate: string) {
  return useQuery<InvoiceReportData>({
    queryKey: ['invoices', 'reports', fromDate, toDate],
    queryFn: () => invoiceApi.getReports(fromDate, toDate),
    enabled: Boolean(fromDate) && Boolean(toDate),
    staleTime: 60_000,
  });
}

export function useInvoice(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoiceApi.getById(id),
    enabled: options?.enabled ?? Boolean(id),
    staleTime: 30_000, // 30s — el detalle no cambia si el usuario vuelve rápido
  });
}

/**
 * Returns a callback to prefetch an invoice detail on hover.
 * Data is prefetched into TanStack Query cache so navigation to the detail page is instant.
 */
export function usePrefetchInvoice() {
  const queryClient = useQueryClient();

  return useCallback(
    (id: string) => {
      queryClient.prefetchQuery({
        queryKey: invoiceKeys.detail(id),
        queryFn: () => invoiceApi.getById(id),
        staleTime: 30_000,
      });
    },
    [queryClient],
  );
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
      // Invalidate (not set) the detail query so the page refetches fresh data from the
      // server — this ensures verifactuQr and hash are present in the rendered detail.
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoice.id) });
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

export function useUnmarkInvoiceAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.unmarkAsPaid(id),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      toast.success('Factura desmarcada como pagada');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useMarkInvoiceAsSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.markAsSent(id),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      toast.success('Factura marcada como enviada');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUnmarkInvoiceAsSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.unmarkAsSent(id),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      toast.success('Factura desmarcada como enviada');
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

export function useConvertProformaToOfficial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.convertToOfficial(id),
    onSuccess: (invoice, proformaId) => {
      // Cancel and remove the old proforma query FIRST to prevent a 404 refetch
      // while the component is still mounted before navigation completes.
      void queryClient.cancelQueries({ queryKey: invoiceKeys.detail(proformaId) });
      queryClient.removeQueries({ queryKey: invoiceKeys.detail(proformaId) });
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success(
        'Factura oficial creada como borrador. Revísala y confírmala cuando esté lista.',
      );
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useConvertDraftToProforma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.convertToProforma(id),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      toast.success('Borrador convertido a proforma correctamente.');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      invoiceApi.updateQuoteStatus(id, status),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      toast.success('Estado del presupuesto actualizado');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useConvertQuoteToProforma() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.convertQuoteToProforma(id),
    onSuccess: (proforma) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success('Proforma creada. Revísala y confírmala cuando esté lista.', {
        action: {
          label: 'Ver proforma',
          onClick: () => window.location.assign(`/dashboard/facturas/${proforma.id}`),
        },
      });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useConvertQuoteToOfficial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.convertQuoteToOfficial(id),
    onSuccess: (draft) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      toast.success('Borrador de factura creado. Revísalo y confírmalo cuando esté listo.', {
        action: {
          label: 'Ver factura',
          onClick: () => window.location.assign(`/dashboard/facturas/${draft.id}`),
        },
      });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateInvoiceNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string | null }) =>
      invoiceApi.updateNotes(id, notes),
    onSuccess: (invoice) => {
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      toast.success('Nota actualizada correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

// ==================== PAYMENT HOOKS ====================

export const paymentKeys = {
  all: (invoiceId: string) => ['invoices', invoiceId, 'payments'] as const,
};

export function useInvoicePayments(invoiceId: string) {
  return useQuery({
    queryKey: paymentKeys.all(invoiceId),
    queryFn: () => paymentApi.getAll(invoiceId),
    enabled: Boolean(invoiceId),
    staleTime: 30_000,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: CreatePaymentInput }) =>
      paymentApi.create(invoiceId, data),
    onSuccess: ({ invoice }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      queryClient.invalidateQueries({ queryKey: paymentKeys.all(invoice.id) });
      toast.success('Cobro registrado correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, paymentId }: { invoiceId: string; paymentId: string }) =>
      paymentApi.remove(invoiceId, paymentId),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      queryClient.invalidateQueries({ queryKey: paymentKeys.all(invoice.id) });
      toast.success('Cobro eliminado correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

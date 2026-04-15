'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invoiceApi, RectifyInvoiceInput } from '@/lib/api/invoice-api';
import {
  Invoice,
  QueryInvoicesInput,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  InvoiceStats,
  InvoiceReportData,
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
    staleTime: 30_000, // 30s — evita re-fetches en navegación rápida
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
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
      queryClient.setQueryData(invoiceKeys.detail(invoice.id), invoice);
      queryClient.removeQueries({ queryKey: invoiceKeys.detail(proformaId) });
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

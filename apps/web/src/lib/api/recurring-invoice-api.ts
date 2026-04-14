import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import {
  RecurringInvoice,
  PaginatedResponse,
  CreateRecurringInvoiceInput,
  UpdateRecurringInvoiceInput,
  QueryRecurringInvoicesInput,
  RecurringGeneratedInvoice,
  RecurringGenerateResult,
} from '@easyfactura/shared-types';

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const recurringInvoiceApi = {
  getAll: (
    filters: QueryRecurringInvoicesInput = {},
  ): Promise<PaginatedResponse<RecurringInvoice>> =>
    apiClient
      .get<
        ApiResponse<PaginatedResponse<RecurringInvoice>>
      >(`/recurring-invoices${buildQueryString(filters as Record<string, unknown>)}`)
      .then(unwrapApiResponse),

  getById: (id: string): Promise<RecurringInvoice> =>
    apiClient
      .get<ApiResponse<RecurringInvoice>>(`/recurring-invoices/${id}`)
      .then(unwrapApiResponse),

  create: (data: CreateRecurringInvoiceInput): Promise<RecurringInvoice> =>
    apiClient
      .post<ApiResponse<RecurringInvoice>>('/recurring-invoices', data)
      .then(unwrapApiResponse),

  update: (id: string, data: UpdateRecurringInvoiceInput): Promise<RecurringInvoice> =>
    apiClient
      .put<ApiResponse<RecurringInvoice>>(`/recurring-invoices/${id}`, data)
      .then(unwrapApiResponse),

  pause: (id: string): Promise<RecurringInvoice> =>
    apiClient
      .patch<ApiResponse<RecurringInvoice>>(`/recurring-invoices/${id}/pause`)
      .then(unwrapApiResponse),

  resume: (id: string): Promise<RecurringInvoice> =>
    apiClient
      .patch<ApiResponse<RecurringInvoice>>(`/recurring-invoices/${id}/resume`)
      .then(unwrapApiResponse),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/recurring-invoices/${id}`).then(() => undefined),

  getGeneratedInvoices: (id: string): Promise<RecurringGeneratedInvoice[]> =>
    apiClient
      .get<ApiResponse<RecurringGeneratedInvoice[]>>(`/recurring-invoices/${id}/generated-invoices`)
      .then(unwrapApiResponse),

  generateNow: (id: string): Promise<RecurringGenerateResult> =>
    apiClient
      .post<ApiResponse<RecurringGenerateResult>>(`/recurring-invoices/${id}/generate`)
      .then(unwrapApiResponse),
};

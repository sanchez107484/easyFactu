import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import {
  Invoice,
  PaginatedResponse,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  QueryInvoicesInput,
} from '@easyfactura/shared-types';

export interface RectifyInvoiceInput {
  rectificationReason: string;
  lines: CreateInvoiceInput['lines'];
}

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const invoiceApi = {
  getAll: (filters: QueryInvoicesInput = {}): Promise<PaginatedResponse<Invoice>> =>
    apiClient
      .get<
        ApiResponse<PaginatedResponse<Invoice>>
      >(`/invoices${buildQueryString(filters as Record<string, unknown>)}`)
      .then(unwrapApiResponse),

  getById: (id: string): Promise<Invoice> =>
    apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`).then(unwrapApiResponse),

  create: (data: CreateInvoiceInput): Promise<Invoice> =>
    apiClient.post<ApiResponse<Invoice>>('/invoices', data).then(unwrapApiResponse),

  update: (id: string, data: UpdateInvoiceInput): Promise<Invoice> =>
    apiClient.put<ApiResponse<Invoice>>(`/invoices/${id}`, data).then(unwrapApiResponse),

  confirm: (id: string): Promise<Invoice> =>
    apiClient.post<ApiResponse<Invoice>>(`/invoices/${id}/confirm`).then(unwrapApiResponse),

  markAsPaid: (id: string): Promise<Invoice> =>
    apiClient.post<ApiResponse<Invoice>>(`/invoices/${id}/paid`).then(unwrapApiResponse),

  duplicate: (id: string): Promise<Invoice> =>
    apiClient.post<ApiResponse<Invoice>>(`/invoices/${id}/duplicate`).then(unwrapApiResponse),

  rectify: (id: string, data: RectifyInvoiceInput): Promise<Invoice> =>
    apiClient.post<ApiResponse<Invoice>>(`/invoices/${id}/rectify`, data).then(unwrapApiResponse),

  convertToOfficial: (id: string): Promise<Invoice> =>
    apiClient
      .post<ApiResponse<Invoice>>(`/invoices/${id}/convert-to-official`)
      .then(unwrapApiResponse),

  convertToProforma: (id: string): Promise<Invoice> =>
    apiClient
      .post<ApiResponse<Invoice>>(`/invoices/${id}/convert-to-proforma`)
      .then(unwrapApiResponse),

  remove: (id: string): Promise<void> => apiClient.delete(`/invoices/${id}`).then(() => undefined),
};

import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import {
  Invoice,
  Payment,
  PaginatedResponse,
  CreateInvoiceInput,
  UpdateInvoiceInput,
  CreatePaymentInput,
  QueryInvoicesInput,
  InvoiceStats,
  InvoiceReportData,
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

  unmarkAsPaid: (id: string): Promise<Invoice> =>
    apiClient.delete<ApiResponse<Invoice>>(`/invoices/${id}/paid`).then(unwrapApiResponse),

  markAsSent: (id: string): Promise<Invoice> =>
    apiClient.post<ApiResponse<Invoice>>(`/invoices/${id}/sent`).then(unwrapApiResponse),

  unmarkAsSent: (id: string): Promise<Invoice> =>
    apiClient.delete<ApiResponse<Invoice>>(`/invoices/${id}/sent`).then(unwrapApiResponse),

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

  updateQuoteStatus: (id: string, quoteAcceptanceStatus: string): Promise<Invoice> =>
    apiClient
      .patch<ApiResponse<Invoice>>(`/invoices/${id}/quote-status`, { quoteAcceptanceStatus })
      .then(unwrapApiResponse),

  convertQuoteToProforma: (id: string): Promise<Invoice> =>
    apiClient
      .post<ApiResponse<Invoice>>(`/invoices/${id}/convert-quote-to-proforma`)
      .then(unwrapApiResponse),

  convertQuoteToOfficial: (id: string): Promise<Invoice> =>
    apiClient
      .post<ApiResponse<Invoice>>(`/invoices/${id}/convert-quote-to-official`)
      .then(unwrapApiResponse),

  updateNotes: (id: string, notes: string | null): Promise<Invoice> =>
    apiClient
      .patch<ApiResponse<Invoice>>(`/invoices/${id}/notes`, { notes })
      .then(unwrapApiResponse),

  remove: (id: string): Promise<void> => apiClient.delete(`/invoices/${id}`).then(() => undefined),

  getStats: (year?: number): Promise<InvoiceStats> => {
    const qs = year !== undefined ? `?year=${year}` : '';
    return apiClient.get<ApiResponse<InvoiceStats>>(`/invoices/stats${qs}`).then(unwrapApiResponse);
  },

  getReports: (fromDate: string, toDate: string): Promise<InvoiceReportData> =>
    apiClient
      .get<
        ApiResponse<InvoiceReportData>
      >(`/invoices/reports?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`)
      .then(unwrapApiResponse),
};

// ==================== PAYMENT API ====================

export const paymentApi = {
  getAll: (invoiceId: string): Promise<Payment[]> =>
    apiClient
      .get<ApiResponse<Payment[]>>(`/invoices/${invoiceId}/payments`)
      .then(unwrapApiResponse),

  create: (
    invoiceId: string,
    data: CreatePaymentInput,
  ): Promise<{ invoice: Invoice; payment: Payment }> =>
    apiClient
      .post<
        ApiResponse<{ invoice: Invoice; payment: Payment }>
      >(`/invoices/${invoiceId}/payments`, data)
      .then(unwrapApiResponse),

  remove: (invoiceId: string, paymentId: string): Promise<Invoice> =>
    apiClient
      .delete<ApiResponse<Invoice>>(`/invoices/${invoiceId}/payments/${paymentId}`)
      .then(unwrapApiResponse),
};

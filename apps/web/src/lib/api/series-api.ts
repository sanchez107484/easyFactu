import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import {
  InvoiceSeries,
  PaginatedResponse,
  CreateInvoiceSeriesInput,
  UpdateInvoiceSeriesInput,
} from '@easyfactura/shared-types';

export const seriesApi = {
  getAll: (year?: number): Promise<PaginatedResponse<InvoiceSeries>> =>
    apiClient
      .get<
        ApiResponse<PaginatedResponse<InvoiceSeries>>
      >(`/invoice-series${year ? `?year=${year}` : ''}`)
      .then(unwrapApiResponse),

  getById: (id: string): Promise<InvoiceSeries> =>
    apiClient.get<ApiResponse<InvoiceSeries>>(`/invoice-series/${id}`).then(unwrapApiResponse),

  create: (data: CreateInvoiceSeriesInput): Promise<InvoiceSeries> =>
    apiClient.post<ApiResponse<InvoiceSeries>>('/invoice-series', data).then(unwrapApiResponse),

  update: (id: string, data: UpdateInvoiceSeriesInput): Promise<InvoiceSeries> =>
    apiClient
      .put<ApiResponse<InvoiceSeries>>(`/invoice-series/${id}`, data)
      .then(unwrapApiResponse),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/invoice-series/${id}`).then(() => undefined),
};

import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import { InvoiceSeries, PaginatedResponse } from '@easyfactura/shared-types';

export const seriesApi = {
  getAll: (year?: number): Promise<PaginatedResponse<InvoiceSeries>> =>
    apiClient
      .get<
        ApiResponse<PaginatedResponse<InvoiceSeries>>
      >(`/invoice-series${year ? `?year=${year}` : ''}`)
      .then(unwrapApiResponse),
};

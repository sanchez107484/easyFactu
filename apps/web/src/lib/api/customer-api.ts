import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import {
  Customer,
  SharedPoolCustomer,
  PaginatedResponse,
  QueryCustomersInput,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@easyfactura/shared-types';

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export const customerApi = {
  getAll: (filters: QueryCustomersInput = {}): Promise<PaginatedResponse<Customer>> =>
    apiClient
      .get<
        ApiResponse<PaginatedResponse<Customer>>
      >(`/customers${buildQueryString(filters as Record<string, unknown>)}`)
      .then(unwrapApiResponse),

  getById: (id: string): Promise<Customer> =>
    apiClient.get<ApiResponse<Customer>>(`/customers/${id}`).then(unwrapApiResponse),

  create: (data: CreateCustomerInput): Promise<Customer> =>
    apiClient.post<ApiResponse<Customer>>('/customers', data).then(unwrapApiResponse),

  update: (id: string, data: UpdateCustomerInput): Promise<Customer> =>
    apiClient.put<ApiResponse<Customer>>(`/customers/${id}`, data).then(unwrapApiResponse),

  remove: (id: string): Promise<void> => apiClient.delete(`/customers/${id}`).then(() => undefined),

  restore: (id: string): Promise<Customer> =>
    apiClient.patch<ApiResponse<Customer>>(`/customers/${id}/restore`).then(unwrapApiResponse),

  getSharedPool: (search?: string): Promise<SharedPoolCustomer[]> =>
    apiClient
      .get<ApiResponse<SharedPoolCustomer[]>>('/customers/shared-pool', {
        params: search ? { search } : undefined,
      })
      .then(unwrapApiResponse),

  importFromPool: (nif: string): Promise<Customer> =>
    apiClient
      .post<ApiResponse<Customer>>('/customers/import-from-pool', { nif })
      .then(unwrapApiResponse),
};

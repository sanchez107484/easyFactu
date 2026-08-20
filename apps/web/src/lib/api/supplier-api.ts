import { apiClient, buildQueryString } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import {
  Supplier,
  PaginatedResponse,
  QuerySuppliersInput,
  CreateSupplierInput,
  UpdateSupplierInput,
} from '@easyfactura/shared-types';

export const supplierApi = {
  getAll: (filters: QuerySuppliersInput = {}): Promise<PaginatedResponse<Supplier>> =>
    apiClient
      .get<ApiResponse<PaginatedResponse<Supplier>>>(`/suppliers${buildQueryString(filters as Record<string, unknown>)}`)
      .then(unwrapApiResponse),

  getById: (id: string): Promise<Supplier> =>
    apiClient.get<ApiResponse<Supplier>>(`/suppliers/${id}`).then(unwrapApiResponse),

  create: (data: CreateSupplierInput): Promise<Supplier> =>
    apiClient.post<ApiResponse<Supplier>>('/suppliers', data).then(unwrapApiResponse),

  update: (id: string, data: UpdateSupplierInput): Promise<Supplier> =>
    apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, data).then(unwrapApiResponse),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/suppliers/${id}`).then(() => undefined),
};

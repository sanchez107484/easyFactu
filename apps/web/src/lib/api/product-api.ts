import { apiClient, buildQueryString } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import {
  Product,
  PaginatedResponse,
  CreateProductInput,
  UpdateProductInput,
  QueryProductsInput,
} from '@easyfactura/shared-types';

export const productApi = {
  getAll: (filters: QueryProductsInput = {}): Promise<PaginatedResponse<Product>> =>
    apiClient
      .get<
        ApiResponse<PaginatedResponse<Product>>
      >(`/products${buildQueryString(filters as Record<string, unknown>)}`)
      .then(unwrapApiResponse),

  getById: (id: string): Promise<Product> =>
    apiClient.get<ApiResponse<Product>>(`/products/${id}`).then(unwrapApiResponse),

  create: (data: CreateProductInput): Promise<Product> =>
    apiClient.post<ApiResponse<Product>>('/products', data).then(unwrapApiResponse),

  update: (id: string, data: UpdateProductInput): Promise<Product> =>
    apiClient.put<ApiResponse<Product>>(`/products/${id}`, data).then(unwrapApiResponse),

  remove: (id: string): Promise<{ deleted: true }> =>
    apiClient.delete<ApiResponse<{ deleted: true }>>(`/products/${id}`).then(unwrapApiResponse),

  bulkRemove: (ids: string[]): Promise<{ deleted: number }> =>
    apiClient
      .delete<ApiResponse<{ deleted: number }>>('/products/bulk', { data: { ids } })
      .then(unwrapApiResponse),
};

import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import {
  Product,
  PaginatedResponse,
  CreateProductInput,
  UpdateProductInput,
  QueryProductsInput,
} from '@easyfactura/shared-types';

function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

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

  remove: (id: string): Promise<void> =>
    apiClient.delete<ApiResponse<void>>(`/products/${id}`).then(unwrapApiResponse),
};

import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import { InvoiceDefaults } from '@easyfactura/shared-types';

export type UpdateInvoiceDefaultsInput = Partial<
  Omit<InvoiceDefaults, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
>;

export const invoiceDefaultsApi = {
  get: (): Promise<InvoiceDefaults | null> =>
    apiClient.get<ApiResponse<InvoiceDefaults | null>>('/invoice-defaults').then(unwrapApiResponse),

  update: (data: UpdateInvoiceDefaultsInput): Promise<InvoiceDefaults> =>
    apiClient.put<ApiResponse<InvoiceDefaults>>('/invoice-defaults', data).then(unwrapApiResponse),
};

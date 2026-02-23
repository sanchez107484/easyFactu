import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import {
  InvoiceTemplate,
  CreateInvoiceTemplateInput,
  UpdateInvoiceTemplateInput,
} from '@easyfactura/shared-types';

export const invoiceTemplateApi = {
  getAll: (): Promise<InvoiceTemplate[]> =>
    apiClient.get<ApiResponse<InvoiceTemplate[]>>('/invoice-templates').then(unwrapApiResponse),

  getById: (id: string): Promise<InvoiceTemplate> =>
    apiClient.get<ApiResponse<InvoiceTemplate>>(`/invoice-templates/${id}`).then(unwrapApiResponse),

  getDefault: (): Promise<InvoiceTemplate> =>
    apiClient
      .get<ApiResponse<InvoiceTemplate>>('/invoice-templates/default')
      .then(unwrapApiResponse),

  create: (data: CreateInvoiceTemplateInput): Promise<InvoiceTemplate> =>
    apiClient
      .post<ApiResponse<InvoiceTemplate>>('/invoice-templates', data)
      .then(unwrapApiResponse),

  update: (id: string, data: UpdateInvoiceTemplateInput): Promise<InvoiceTemplate> =>
    apiClient
      .put<ApiResponse<InvoiceTemplate>>(`/invoice-templates/${id}`, data)
      .then(unwrapApiResponse),

  setDefault: (id: string): Promise<InvoiceTemplate> =>
    apiClient
      .post<ApiResponse<InvoiceTemplate>>(`/invoice-templates/${id}/set-default`)
      .then(unwrapApiResponse),

  remove: (id: string): Promise<void> =>
    apiClient.delete(`/invoice-templates/${id}`).then(() => undefined),

  getPreviewUrl: (id: string): string =>
    `${apiClient.defaults.baseURL}/invoice-templates/${id}/preview`,
};

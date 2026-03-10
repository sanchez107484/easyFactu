import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import { Tenant, UpdateTenantInput } from '@easyfactura/shared-types';

export const tenantApi = {
  get: (): Promise<Tenant> => apiClient.get<ApiResponse<Tenant>>('/tenant').then(unwrapApiResponse),

  update: (data: UpdateTenantInput): Promise<Tenant> =>
    apiClient.put<ApiResponse<Tenant>>('/tenant', data).then(unwrapApiResponse),

  uploadLogo: (file: File): Promise<{ logoUrl: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post<ApiResponse<{ logoUrl: string }>>('/tenant/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(unwrapApiResponse);
  },

  deleteLogo: (): Promise<void> => apiClient.delete('/tenant/logo').then(() => undefined),

  uploadCertificate: (
    file: File,
    password: string,
  ): Promise<{ certificateUrl: string; certificateExpiry: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    return apiClient
      .post<ApiResponse<{ certificateUrl: string; certificateExpiry: string }>>(
        '/tenant/certificate',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
      .then(unwrapApiResponse);
  },

  deleteCertificate: (): Promise<void> =>
    apiClient.delete('/tenant/certificate').then(() => undefined),

  completeSetup: (): Promise<Tenant> =>
    apiClient.post<ApiResponse<Tenant>>('/tenant/complete-setup', {}).then(unwrapApiResponse),
};

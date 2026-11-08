import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';

/** Request from the ERP to link an existing account (only its OWNER can see and accept it). */
export interface IntegrationConsentInfo {
  businessName: string;
  expiresAt: string;
}

export const integrationApi = {
  getConsent: (token: string): Promise<IntegrationConsentInfo> =>
    apiClient
      .get<ApiResponse<IntegrationConsentInfo>>(`/integrations/consents/${token}`)
      .then(unwrapApiResponse),

  acceptConsent: (token: string): Promise<{ status: string }> =>
    apiClient
      .post<ApiResponse<{ status: string }>>(`/integrations/consents/${token}/accept`)
      .then(unwrapApiResponse),
};

import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import type {
  UpdateUserInput,
  ActivateAccountInput,
  ActivateAccountTokenInfo,
  AuthResponse,
} from '@easyfactura/shared-types';

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

interface UpdateProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  lastActiveTenantId: string | null;
}

export const authApi = {
  changePassword: (data: ChangePasswordInput): Promise<{ message: string }> =>
    apiClient
      .post<ApiResponse<{ message: string }>>('/auth/change-password', data)
      .then(unwrapApiResponse),

  updateProfile: (
    data: Pick<UpdateUserInput, 'firstName' | 'lastName'>,
  ): Promise<UpdateProfileResponse> =>
    apiClient.patch<ApiResponse<UpdateProfileResponse>>('/auth/me', data).then(unwrapApiResponse),

  validateActivationToken: (token: string): Promise<ActivateAccountTokenInfo> =>
    apiClient
      .get<ApiResponse<ActivateAccountTokenInfo>>(`/auth/activate-account/${token}`)
      .then(unwrapApiResponse),

  activateAccount: (data: ActivateAccountInput): Promise<AuthResponse> =>
    apiClient
      .post<ApiResponse<AuthResponse>>('/auth/activate-account', data)
      .then(unwrapApiResponse),
};

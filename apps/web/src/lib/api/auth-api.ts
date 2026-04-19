import { apiClient } from '../api-client';
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
    apiClient.post('/auth/change-password', data).then((res) => res.data),

  updateProfile: (
    data: Pick<UpdateUserInput, 'firstName' | 'lastName'>,
  ): Promise<UpdateProfileResponse> => apiClient.patch('/auth/me', data).then((res) => res.data),

  validateActivationToken: (token: string): Promise<ActivateAccountTokenInfo> =>
    apiClient.get(`/auth/activate-account/${token}`).then((res) => res.data),

  activateAccount: (data: ActivateAccountInput): Promise<AuthResponse> =>
    apiClient.post('/auth/activate-account', data).then((res) => res.data),
};

import { apiClient } from '../api-client';
import type { UpdateUserInput } from '@easyfactura/shared-types';

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
};

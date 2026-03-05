import { apiClient } from '../api-client';

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const authApi = {
  changePassword: (data: ChangePasswordInput): Promise<{ message: string }> =>
    apiClient.post('/auth/change-password', data).then((res) => res.data),
};

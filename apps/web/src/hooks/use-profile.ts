'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '@/lib/api/auth-api';
import { useAuthStore } from '@/store/auth-store';
import { getApiErrorMessage } from '@/lib/api-error';

export function useUpdateProfile() {
  const updateUser = useAuthStore((state) => state.updateUser);

  return useMutation({
    mutationFn: (data: { firstName?: string; lastName?: string }) => authApi.updateProfile(data),
    onSuccess: (updatedUser) => {
      updateUser({ firstName: updatedUser.firstName, lastName: updatedUser.lastName });
      toast.success('Perfil actualizado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

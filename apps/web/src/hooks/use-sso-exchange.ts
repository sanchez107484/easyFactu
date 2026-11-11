import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth-api';
import { setAccessToken, setRefreshToken } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

/** Exchanges the ERP SSO token for a session, replacing any session open in this browser. */
export function useSsoExchange() {
  const queryClient = useQueryClient();
  const setFromAuthResponse = useAuthStore((state) => state.setFromAuthResponse);

  return useMutation({
    mutationFn: (token: string) => authApi.exchangeSsoToken(token),
    retry: false,
    onSuccess: (session) => {
      // Data cached for a previous user or company must not leak into this session.
      queryClient.clear();
      setAccessToken(session.accessToken);
      setRefreshToken(session.refreshToken);
      setFromAuthResponse(session);
    },
  });
}

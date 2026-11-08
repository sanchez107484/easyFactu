'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ConsentAccepted,
  ConsentError,
  ConsentLayout,
  ConsentLoginPrompt,
  ConsentRequest,
  ConsentSkeleton,
} from '@/components/integraciones/integration-consent-states';
import {
  useAcceptIntegrationConsent,
  useIntegrationConsent,
} from '@/hooks/use-integration-consent';
import { getAccessToken, getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

const REDIRECT_DELAY_MS = 2500;

/** Page linked from the email sent to the OWNER when the ERP provisions an existing NIF. */
export default function IntegrationConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [isCheckingAuth, setIsCheckingAuth] = useState(() => !!getAccessToken());

  useEffect(() => {
    if (!getAccessToken()) return;
    checkAuth().finally(() => setIsCheckingAuth(false));
  }, [checkAuth]);

  const consent = useIntegrationConsent(token, isAuthenticated && !isCheckingAuth);
  const accept = useAcceptIntegrationConsent(token);

  useEffect(() => {
    if (!accept.isSuccess) return;
    const timer = setTimeout(() => router.push('/dashboard'), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [accept.isSuccess, router]);

  return <ConsentLayout>{renderState()}</ConsentLayout>;

  function renderState() {
    if (isCheckingAuth) return <ConsentSkeleton />;
    if (!isAuthenticated) return <ConsentLoginPrompt token={token} />;
    if (consent.isLoading) return <ConsentSkeleton />;
    if (consent.error || !consent.data) {
      return <ConsentError message={getErrorMessage(consent.error)} />;
    }
    if (accept.isSuccess) return <ConsentAccepted businessName={consent.data.businessName} />;
    return (
      <ConsentRequest
        consent={consent.data}
        isAccepting={accept.isPending}
        onAccept={() => accept.mutate()}
      />
    );
  }
}

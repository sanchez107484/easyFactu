'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, XCircle } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import { useSsoExchange } from '@/hooks/use-sso-exchange';
import { getErrorMessage } from '@/lib/api-client';
import { takeSsoTokenFromUrl, toSafeDashboardPath } from '@/lib/sso';

const MISSING_TOKEN_MESSAGE = 'Falta el enlace de acceso.';

/** Entry point from the ERP: `/sso#token=<ES256 token>` → session → allowed page. */
export default function SsoPage() {
  const router = useRouter();
  const { mutate: exchange, error } = useSsoExchange();
  const [isTokenMissing, setIsTokenMissing] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    // React Strict Mode runs effects twice; the token works only once.
    if (hasStarted.current) return;
    hasStarted.current = true;

    const token = takeSsoTokenFromUrl();
    if (!token) {
      setIsTokenMissing(true);
      return;
    }
    exchange(token, {
      onSuccess: (session) => router.replace(toSafeDashboardPath(session.redirectTo)),
    });
  }, [exchange, router]);

  if (isTokenMissing || error) {
    return <SsoError message={error ? getErrorMessage(error) : MISSING_TOKEN_MESSAGE} />;
  }

  return (
    <SsoLayout>
      <div className="flex flex-col items-center gap-4 py-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Entrando en {brandConfig.app.name}...</p>
      </div>
    </SsoLayout>
  );
}

function SsoError({ message }: { message: string }) {
  return (
    <SsoLayout>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-bold">No hemos podido iniciar sesión</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Vuelve a tu ERP y abre {brandConfig.app.name} de nuevo. Cada enlace sirve una sola vez y
            caduca en un minuto.
          </p>
        </div>
      </div>
    </SsoLayout>
  );
}

function SsoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50/40 to-background px-4 py-12 dark:from-indigo-950/20">
      <div className="mb-8">
        <Image
          src={brandConfig.logos.main}
          alt={brandConfig.app.name}
          width={180}
          height={50}
          className="object-contain"
          style={{ width: 'auto', height: '44px' }}
        />
      </div>
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">{children}</div>
    </div>
  );
}

'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api/auth-api';
import { getAccessToken, getErrorMessage } from '@/lib/api-client';
import { brandConfig } from '@easyfactura/brand-config';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';

type VerifyState = 'loading' | 'success' | 'error' | 'no-token';

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'no-token');
  const [errorMessage, setErrorMessage] = useState('');

  const isLoggedIn = !!getAccessToken();

  useEffect(() => {
    if (!token) return;

    const isValidFormat = /^[a-f0-9]{64}$/.test(token);
    if (!isValidFormat) {
      setState('error');
      setErrorMessage('El enlace de verificación no es válido.');
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setState('success');
        if (isLoggedIn) {
          setTimeout(() => router.push('/dashboard'), 2000);
        }
      })
      .catch((err) => {
        setState('error');
        setErrorMessage(getErrorMessage(err));
      });
  }, [token, isLoggedIn, router]);

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verificando tu email...</p>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">¡Email verificado!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLoggedIn
              ? 'Tu correo ha sido verificado. Redirigiendo a tu panel...'
              : 'Tu dirección de correo ha sido verificada correctamente. Ya puedes iniciar sesión.'}
          </p>
        </div>
        {isLoggedIn ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : (
          <Link href="/login">
            <Button>Iniciar sesión</Button>
          </Link>
        )}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
          <XCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
          <h1 className="text-xl font-bold">No se pudo verificar</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {errorMessage || 'El enlace de verificación no es válido o ha expirado.'}
          </p>
        </div>
        <Link href={isLoggedIn ? '/dashboard' : '/login'}>
          <Button variant="outline">
            {isLoggedIn ? 'Volver al panel' : 'Ir al inicio de sesión'}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Mail className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <h1 className="text-xl font-bold">Enlace no válido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No se encontró un token de verificación en el enlace. Revisa el email que recibiste e
          intenta de nuevo.
        </p>
      </div>
      <Link href={isLoggedIn ? '/dashboard' : '/login'}>
        <Button variant="outline">
          {isLoggedIn ? 'Volver al panel' : 'Ir al inicio de sesión'}
        </Button>
      </Link>
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50/40 to-background px-4 py-12 dark:from-indigo-950/20">
      <div className="mb-8">
        <Link href="/">
          <Image
            src={brandConfig.logos.main}
            alt={brandConfig.app.name}
            width={180}
            height={50}
            className="object-contain"
            style={{ width: 'auto', height: '44px' }}
          />
        </Link>
      </div>
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
          }
        >
          <VerificarEmailContent />
        </Suspense>
      </div>
    </div>
  );
}

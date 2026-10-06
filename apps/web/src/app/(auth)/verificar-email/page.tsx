'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { brandConfig } from '@easyfactura/brand-config';
import { authApi } from '@/lib/api/auth-api';
import { getErrorMessage } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

type State = 'loading' | 'success' | 'error' | 'missing';

export default function VerificarEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<State>(token ? 'loading' : 'missing');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const called = useRef(false);
  const updateUser = useAuthStore((s) => s.updateUser);

  useEffect(() => {
    if (!token || called.current) return;
    called.current = true;

    authApi
      .verifyEmail(token)
      .then(() => {
        updateUser({ emailVerified: true });
        setState('success');
      })
      .catch((err: unknown) => {
        setErrorMsg(getErrorMessage(err));
        setState('error');
      });
  }, [token, updateUser]);

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

      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm text-center">
        {state === 'loading' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-bold">Verificando tu email…</h1>
            <p className="mt-2 text-sm text-muted-foreground">Un momento, por favor.</p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="mt-4 text-xl font-bold">¡Email verificado!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu dirección de correo ha sido confirmada. Ya puedes acceder a todas las funciones de
              tu cuenta.
            </p>
            <Link href="/dashboard" className="mt-6 block">
              <Button className="w-full">Ir a mi panel</Button>
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="mt-4 text-xl font-bold">Enlace no válido</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {errorMsg || 'Este enlace de verificación no es válido o ha caducado.'}
            </p>
            <Link href="/login" className="mt-6 block">
              <Button variant="outline" className="w-full">
                Ir al inicio de sesión
              </Button>
            </Link>
          </>
        )}

        {state === 'missing' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="mt-4 text-xl font-bold">Enlace incompleto</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              No se encontró el token de verificación en el enlace. Asegúrate de haber copiado el
              enlace completo del correo.
            </p>
            <Link href="/login" className="mt-6 block">
              <Button variant="outline" className="w-full">
                Ir al inicio de sesión
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

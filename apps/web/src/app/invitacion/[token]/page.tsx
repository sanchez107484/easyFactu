'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { agencyApi, type InvitationPublicInfo } from '@/lib/api/agency-api';
import { useAuthStore } from '@/store/auth-store';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api-client';
import { brandConfig } from '@easyfactura/brand-config';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, CheckCircle2, Clock, XCircle, LogIn, ArrowRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

// ==================== PAGE ====================

export default function InvitacionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentTenant = useAuthStore((state) => state.currentTenant);

  const [accepted, setAccepted] = useState(false);

  const {
    data: invitation,
    isLoading,
    error,
  } = useQuery<InvitationPublicInfo>({
    queryKey: ['invitation', token],
    queryFn: () => agencyApi.getInvitationInfo(token),
    retry: false,
  });

  const { mutate: accept, isPending: isAccepting } = useMutation({
    mutationFn: () => agencyApi.acceptInvitation(token),
    onSuccess: () => {
      setAccepted(true);
      toast.success('¡Vinculación completada! Ya puedes gestionar tu facturación.');
      setTimeout(() => router.push('/dashboard'), 2500);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // ── Loading state ──
  if (isLoading) {
    return (
      <InvitationLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-12 w-full mt-6" />
        </div>
      </InvitationLayout>
    );
  }

  // ── Error / expired / already used ──
  if (error || !invitation) {
    const message = (error as Error)?.message ?? 'Esta invitación no existe o ha expirado.';
    return (
      <InvitationLayout>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Invitación no válida</h1>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </div>
          <Link href="/login">
            <Button variant="outline">Ir al inicio de sesión</Button>
          </Link>
        </div>
      </InvitationLayout>
    );
  }

  // ── Accepted success state ──
  if (accepted) {
    return (
      <InvitationLayout>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">¡Vinculación completada!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {invitation.agencyName} ya puede gestionar tu facturación. Redirigiendo...
            </p>
          </div>
        </div>
      </InvitationLayout>
    );
  }

  const expiresAt = new Date(invitation.expiresAt);
  const expiryLabel = expiresAt.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });

  // ── Main invitation card ──
  return (
    <InvitationLayout>
      {/* Agency info */}
      <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-lg font-bold">
          {invitation.agencyName.charAt(0)}
        </div>
        <div>
          <p className="font-semibold">{invitation.agencyName}</p>
          <p className="text-xs text-muted-foreground">
            {invitation.agencyNif}
            {invitation.agencyCity ? ` · ${invitation.agencyCity}` : ''}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="mt-5">
        <h1 className="text-xl font-bold leading-snug">
          {invitation.inviteeName
            ? `${invitation.inviteeName}, tienes una invitación`
            : 'Tienes una invitación de una asesoría'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          <strong>{invitation.agencyName}</strong> quiere vincularse a tu cuenta de{' '}
          {brandConfig.app.name} para ayudarte a gestionar tu facturación. Podrán crear y gestionar
          facturas en tu nombre, pero tú siempre mantendrás el control total de tu cuenta.
        </p>
      </div>

      {/* Feature list */}
      <ul className="mt-4 space-y-2">
        {[
          'Tu asesoría gestiona tus facturas desde su panel',
          'Tú sigues teniendo acceso completo en todo momento',
          'Puedes revocar el acceso cuando quieras',
        ].map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
            {item}
          </li>
        ))}
      </ul>

      {/* Expiry notice */}
      <div className="mt-5 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-xs text-amber-700 dark:text-amber-400">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        Esta invitación caduca el {expiryLabel}
      </div>

      {/* CTA */}
      <div className="mt-6 space-y-3">
        {isAuthenticated && currentTenant ? (
          <>
            <p className="text-xs text-center text-muted-foreground">
              Aceptando como:{' '}
              <strong>
                {currentTenant.businessName} ({currentTenant.nif})
              </strong>
            </p>
            <Button className="w-full" onClick={() => accept()} disabled={isAccepting}>
              {isAccepting ? (
                'Vinculando...'
              ) : (
                <>
                  Aceptar invitación
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              ¿Cuenta incorrecta?{' '}
              <Link
                href={`/login?from=/invitacion/${token}`}
                className="text-primary underline underline-offset-2"
              >
                Cambiar cuenta
              </Link>
            </p>
          </>
        ) : (
          <>
            <Button className="w-full" asChild>
              <Link href={`/login?from=/invitacion/${token}`}>
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar sesión para aceptar
              </Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href={`/registro?from=/invitacion/${token}`}>
                Crear cuenta nueva
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </>
        )}
      </div>
    </InvitationLayout>
  );
}

// ==================== LAYOUT WRAPPER ====================

function InvitationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50/40 to-background px-4 py-12 dark:from-indigo-950/20">
      <div className="mb-8">
        <Link href="/">
          <span className="text-2xl font-bold tracking-tight">
            <span className="text-indigo-600">Nova</span>
            <span className="text-foreground">Factura</span>
          </span>
        </Link>
      </div>
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">{children}</div>
    </div>
  );
}

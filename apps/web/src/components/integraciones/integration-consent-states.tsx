import Link from 'next/link';
import { brandConfig } from '@easyfactura/brand-config';
import { ArrowRight, CheckCircle2, Clock, LogIn, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { IntegrationConsentInfo } from '@/lib/api/integration-api';

const ERP_PERMISSIONS = [
  'Emitir facturas y tickets de tus ventas con tus series y tu certificado',
  'Descargar el PDF de esas facturas y registrar sus cobros',
  'Tu plan pasa a PRO incluido con el ERP mientras lo uses',
  'Tus facturas actuales no cambian y sigues teniendo acceso completo',
];

export function ConsentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50/40 to-background px-4 py-12 dark:from-indigo-950/20">
      <Link href="/" className="mb-8 text-2xl font-bold tracking-tight">
        {brandConfig.app.name}
      </Link>
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-sm">{children}</div>
    </div>
  );
}

export function ConsentSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="mt-6 h-12 w-full" />
    </div>
  );
}

export function ConsentLoginPrompt({ token }: { token: string }) {
  return (
    <div className="space-y-4 text-center">
      <h1 className="text-xl font-bold">Autoriza la conexión con tu ERP</h1>
      <p className="text-sm text-muted-foreground">
        Inicia sesión con la cuenta del titular para revisar la solicitud.
      </p>
      <Button className="w-full" asChild>
        <Link href={`/login?from=/integraciones/consentimiento/${token}`}>
          <LogIn className="mr-2 h-4 w-4" />
          Iniciar sesión
        </Link>
      </Button>
    </div>
  );
}

export function ConsentError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>
      <div>
        <h1 className="text-xl font-bold">No se puede autorizar</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="outline" asChild>
        <Link href="/dashboard">Ir a mi panel</Link>
      </Button>
    </div>
  );
}

export function ConsentAccepted({ businessName }: { businessName: string }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h1 className="text-xl font-bold">Conexión autorizada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu ERP ya puede emitir las facturas de {businessName}. Redirigiendo a tu panel...
        </p>
      </div>
    </div>
  );
}

interface ConsentRequestProps {
  consent: IntegrationConsentInfo;
  isAccepting: boolean;
  onAccept: () => void;
}

export function ConsentRequest({ consent, isAccepting, onAccept }: ConsentRequestProps) {
  const expiryLabel = new Date(consent.expiresAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
  });
  return (
    <>
      <h1 className="text-xl font-bold leading-snug">
        Tu ERP quiere conectar {consent.businessName}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Si aceptas, el ERP de tu clínica podrá usar tu cuenta de {brandConfig.app.name} para:
      </p>
      <ul className="mt-4 space-y-2">
        {ERP_PERMISSIONS.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
        <Clock className="h-3.5 w-3.5 shrink-0" />
        Esta solicitud caduca el {expiryLabel}
      </div>
      <Button className="mt-6 w-full" onClick={onAccept} disabled={isAccepting}>
        {isAccepting ? 'Autorizando...' : 'Autorizar conexión'}
        {!isAccepting && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </>
  );
}

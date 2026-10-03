'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { agencyApi } from '@/lib/api/agency-api';
import { brandConfig } from '@easyfactura/brand-config';
import { Building2, CheckCircle, Loader2, Clock, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PendingRequest {
  id: string;
  agencyName: string;
  agencyNif: string;
  status: string;
  createdAt: string;
}

interface AgencyConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: 'banner' | 'header';
}

const COPY = {
  title: 'Conexión con asesorías',
  description: `${brandConfig.app.name} permite que tu asesor contable acceda a tus facturas de forma segura y en tiempo real. Cumplimiento VeriFactu automático, sin enviar Excel ni PDFs.`,
  benefitsTitle: 'Beneficios para ti',
  benefits: [
    {
      label: 'Ahorra tiempo',
      text: 'Tu asesor accede a tus facturas al instante, sin que tengas que enviar nada manualmente',
    },
    {
      label: 'Cero errores',
      text: 'Tu asesor trabaja con datos reales, no con copias que pueden estar desactualizadas',
    },
    {
      label: 'Sin papeleo',
      text: 'No tienes que enviar facturas por email o WhatsApp, todo está centralizado',
    },
    {
      label: 'Control total',
      text: 'Revoca el acceso de tu asesor en cualquier momento desde tu panel',
    },
    { label: 'Cumplimiento total', text: 'VeriFactu automático bajo tu NIF, sin preocupaciones' },
  ],
  howItWorksTitle: '¿Cómo funciona?',
  howItWorks: [
    'Busca a tu asesoría por email o NIF',
    'Envía una solicitud de conexión',
    'Tu asesor la acepta desde su panel',
    'En menos de 2 minutos, tu asesor tendrá acceso automático a todas tus facturas',
  ],
  socialProof: `Cientos de asesorías ya conectadas con sus clientes`,
  pendingTitle: 'Solicitud pendiente',
  pendingWaiting: 'Esperando confirmación del asesor',
  pendingDesc: 'Si ya enviaste una solicitud, puedes consultarla o cancelarla desde Mis Asesorías.',
  goToAsesorias: 'Conectar con mi asesoría',
  close: 'Cerrar',
};

function StepItem({ step, index }: { step: string; index: number }) {
  return (
    <li className="flex items-start gap-3 group">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-agency-100 text-agency-600 text-xs font-semibold dark:bg-agency-900/50 dark:text-agency-400">
        {index + 1}
      </div>
      <span className="text-sm text-muted-foreground pt-0.5 group-hover:text-foreground transition-colors">
        {step}
      </span>
    </li>
  );
}

function BenefitItem({ benefit }: { benefit: { label: string; text: string } }) {
  return (
    <li className="flex items-start gap-2.5 group">
      <CheckCircle className="h-4 w-4 text-agency-500 shrink-0 mt-0.5 group-hover:text-agency-600 transition-colors" />
      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        <span className="font-medium text-foreground">{benefit.label}:</span> {benefit.text}
      </span>
    </li>
  );
}

export function AgencyConnectionModal({ open, onOpenChange }: AgencyConnectionModalProps) {
  const router = useRouter();

  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);

  const isMountedRef = useRef(true);

  // Load pending on open
  useEffect(() => {
    if (!open) return;

    isMountedRef.current = true;
    setIsLoadingPending(true);

    agencyApi
      .getMyRequests({ status: 'PENDING', limit: 1 })
      .then((res) => {
        if (!isMountedRef.current) return;
        if (res.data?.length > 0) {
          const r = res.data[0];
          setPendingRequest({
            id: r.id,
            agencyName: r.agencyName,
            agencyNif: r.agencyNif,
            status: r.status,
            createdAt: r.createdAt,
          });
        } else {
          setPendingRequest(null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMountedRef.current) setIsLoadingPending(false);
      });

    return () => {
      isMountedRef.current = false;
    };
  }, [open]);

  const handleGoToAsesorias = () => {
    onOpenChange(false);
    router.push('/dashboard/ajustes/asesorias');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-left">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-agency-100 dark:bg-agency-900/50">
              <Building2 className="h-4 w-4 text-agency-600 dark:text-agency-400" />
            </div>
            {COPY.title}
          </DialogTitle>
          <DialogDescription className="text-left">{COPY.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Beneficios para ti */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              {COPY.benefitsTitle}
            </h4>
            <ul className="space-y-2 pl-1">
              {COPY.benefits.map((b, i) => (
                <BenefitItem key={i} benefit={b} />
              ))}
            </ul>
          </section>

          {/* Cómo funciona */}
          <section className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">{COPY.howItWorksTitle}</h4>
            <ol className="space-y-2.5 pl-1">
              {COPY.howItWorks.map((step, i) => (
                <StepItem key={i} step={step} index={i} />
              ))}
            </ol>
          </section>

          {/* Social proof badge */}
          <div className="flex items-center justify-center gap-2 rounded-lg bg-agency-50 dark:bg-agency-950/30 px-4 py-2.5 border border-agency-100 dark:border-agency-800/50">
            <Users className="h-3.5 w-3.5 text-agency-500" />
            <p className="text-xs text-agency-700 dark:text-agency-400 font-medium">
              {COPY.socialProof}
            </p>
          </div>

          {/* Pending request indicator */}
          {isLoadingPending ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando...
            </div>
          ) : pendingRequest ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-4">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    {COPY.pendingTitle}
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300 mt-0.5">
                    {pendingRequest.agencyName}
                    {pendingRequest.agencyNif && (
                      <span className="font-mono ml-1 text-amber-600 dark:text-amber-400">
                        ({pendingRequest.agencyNif})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {COPY.pendingWaiting}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <DialogFooter className="gap-2 border-t pt-4">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {COPY.close}
          </Button>
          <Button
            size="sm"
            className="bg-agency-600 hover:bg-agency-700 text-white gap-1.5"
            onClick={handleGoToAsesorias}
          >
            {COPY.goToAsesorias}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

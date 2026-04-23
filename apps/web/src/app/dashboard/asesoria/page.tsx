'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAgencyContext } from '@/hooks/use-agency-context';
import { useSwitchTenant } from '@/hooks/use-switch-tenant';
import { useAgencyStats, useAgencyClients, useAgencyPendingInvitations } from '@/hooks/use-agency';
import { brandConfig } from '@easyfactura/brand-config';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UserPlus,
  ArrowRight,
  Users,
  MousePointerClick,
  SwitchCamera,
  ClipboardCheck,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AgencyKpiStrip } from './_components/agency-kpi-strip';
import { PendingInvitationsWidget } from './_components/pending-invitations-widget';
import { VincularClienteModal } from './_components/vincular-cliente-modal';
import { AnadirClienteModal } from './_components/anadir-cliente-modal';

export default function AgencyHubPage() {
  const router = useRouter();
  const { switchTenant, isPending: isSwitching } = useSwitchTenant();
  const { isOnAgencyTenant, isActingAsClient, returnToAgency } = useAgencyContext();
  const [managingClientId, setManagingClientId] = useState<string | null>(null);
  const [isVincularModalOpen, setIsVincularModalOpen] = useState(false);
  const [isAnadirModalOpen, setIsAnadirModalOpen] = useState(false);
  const { data: stats, isLoading: statsLoading } = useAgencyStats(isOnAgencyTenant);
  const { data: clientsData, isLoading: clientsLoading } = useAgencyClients(
    { limit: 50 },
    isOnAgencyTenant,
  );
  const { data: invitations = [] } = useAgencyPendingInvitations(isOnAgencyTenant);

  // Capture state at mount time — not reactive to in-page tenant switches.
  // If the user arrives here via the back button while acting as a client,
  // these refs will be true and we return them to the agency panel.
  // If they clicked "Gestionar" from here, the refs stay false and we let
  // router.push('/dashboard') in handleSwitchToClient handle navigation.
  const mountedActingAsClient = useRef(isActingAsClient);
  const mountedOnAgencyTenant = useRef(isOnAgencyTenant);

  useEffect(() => {
    if (mountedActingAsClient.current) {
      returnToAgency();
    } else if (!mountedOnAgencyTenant.current) {
      router.replace('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Mount-only — deps intentionally empty

  if (!isOnAgencyTenant) return null;

  const handleSwitchToClient = async (clientTenantId: string) => {
    if (managingClientId) return;
    setManagingClientId(clientTenantId);
    try {
      await switchTenant(clientTenantId);
      router.push('/dashboard');
    } catch {
      toast.error('No se pudo acceder al cliente. Inténtalo de nuevo.');
      setManagingClientId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Cabecera ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de asesoría</h1>
        {statsLoading ? (
          <Skeleton className="mt-2 h-4 w-48" />
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            {(stats?.totalClients ?? 0) === 0
              ? 'Empieza añadiendo tu primer cliente'
              : `${stats!.totalClients} cliente${stats!.totalClients !== 1 ? 's' : ''} en tu cartera`}
          </p>
        )}
      </div>

      {/* ── KPI Strip ── */}
      <AgencyKpiStrip stats={stats} isLoading={statsLoading} />

      {/* ── Acción: añadir cliente ── */}
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-card p-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-customer-100 text-customer-600 dark:bg-customer-950 dark:text-customer-400">
            <UserPlus className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold leading-snug">Añadir cliente de asesoría</p>
            <p className="mt-0.5 text-sm text-muted-foreground leading-snug">
              Crea la cuenta tú mismo o vincula a un cliente que ya usa {brandConfig.app.name}.
            </p>
          </div>
        </div>
        <Button className="shrink-0" size="sm" onClick={() => setIsAnadirModalOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Añadir cliente
        </Button>
      </div>

      {/* ── Grid de clientes ── */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">Mis clientes</h2>
          {(clientsData?.data.length ?? 0) > 0 && (
            <Link href="/dashboard/asesoria/clientes">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Ver todos
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>

        {clientsLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-[120px] rounded-xl" />
            ))}
          </div>
        ) : !clientsData?.data.length ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Aún no tienes clientes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Usa las opciones de abajo para añadir tu primer cliente
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y rounded-lg border">
            {clientsData.data.map((relation) => (
              <button
                key={relation.id}
                type="button"
                onClick={() => handleSwitchToClient(relation.clientTenantId)}
                disabled={managingClientId === relation.clientTenantId || isSwitching}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-customer-100 text-xs font-bold text-customer-600 dark:bg-customer-950 dark:text-customer-400">
                  {relation.clientTenant?.businessName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold leading-tight">
                    {relation.clientTenant?.businessName}
                  </p>
                  <p className="text-xs text-muted-foreground">{relation.clientTenant?.nif}</p>
                </div>
                {managingClientId === relation.clientTenantId ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-customer-500" />
                ) : (
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-customer-500" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Invitaciones pendientes ── */}
      <PendingInvitationsWidget invitations={invitations} />

      {/* ── Guía de inicio rápido ── */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-1 text-base font-semibold">Gestiona la facturación de tus clientes</div>
        <p className="mb-6 text-sm text-muted-foreground">
          Desde este panel puedes llevar la contabilidad de todos tus clientes sin salir de tu
          cuenta.
        </p>
        <div className="relative grid gap-6 sm:grid-cols-3">
          {/* Línea conectora entre pasos (solo visible en sm+) */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-5 hidden border-t border-dashed border-border sm:block"
            style={{ left: '13%', right: '13%' }}
          />
          {[
            {
              step: 1,
              icon: ClipboardCheck,
              title: 'Da de alta a tus clientes',
              description:
                'Añádelos directamente o envíales una invitación por email para que se registren ellos mismos.',
            },
            {
              step: 2,
              icon: MousePointerClick,
              title: 'Accede a su panel con un clic',
              description:
                'Pulsa sobre cualquier tarjeta de cliente para cambiar al contexto de esa empresa al instante.',
            },
            {
              step: 3,
              icon: SwitchCamera,
              title: 'Opera como si fuera tu empresa',
              description:
                'Crea facturas, presupuestos y recurrentes en su nombre. Vuelve a tu panel cuando termines.',
            },
          ].map(({ step, icon: Icon, title, description }) => (
            <div key={step} className="relative flex flex-col items-center gap-3 text-center">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-customer-200 bg-card dark:border-customer-800">
                <Icon className="h-5 w-5 text-customer-600 dark:text-customer-400" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-customer-600 text-[10px] font-bold text-white dark:bg-customer-500">
                  {step}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vincular cliente modal */}
      <AnadirClienteModal
        isOpen={isAnadirModalOpen}
        onClose={() => setIsAnadirModalOpen(false)}
        onVincularClick={() => setIsVincularModalOpen(true)}
      />
      <VincularClienteModal
        isOpen={isVincularModalOpen}
        onClose={() => setIsVincularModalOpen(false)}
      />
    </div>
  );
}

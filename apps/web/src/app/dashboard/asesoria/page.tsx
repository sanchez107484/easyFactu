'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAgencyContext } from '@/hooks/use-agency-context';
import { useSwitchTenant } from '@/hooks/use-switch-tenant';
import {
  useAgencyStats,
  useAgencyClients,
  useAgencyPendingInvitations,
  useAgencyPreferredFormat,
  useUpdatePreferredFormat,
} from '@/hooks/use-agency';

import { ExportFormat } from '@easyfactura/shared-types';
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
  Settings2,
  FileDown,
  FileText,
  Activity,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AgencyKpiStrip } from './_components/agency-kpi-strip';
import { PendingInvitationsWidget } from './_components/pending-invitations-widget';
import { PendingRequestsWidget } from './_components/pending-requests-widget';
import { SoftwareSelectModal } from './exportar/_components/software-select-modal';
import { VincularClienteModal } from './_components/vincular-cliente-modal';
import { AnadirClienteModal } from './_components/anadir-cliente-modal';

export default function AgencyHubPage() {
  const router = useRouter();
  const { switchTenant, isPending: isSwitching } = useSwitchTenant();
  const { isOnAgencyTenant, isActingAsClient, returnToAgency } = useAgencyContext();
  const [managingClientId, setManagingClientId] = useState<string | null>(null);
  const [isVincularModalOpen, setIsVincularModalOpen] = useState(false);
  const [isAnadirModalOpen, setIsAnadirModalOpen] = useState(false);
  const [isSoftwareModalOpen, setIsSoftwareModalOpen] = useState(false);
  const { data: stats, isLoading: statsLoading } = useAgencyStats(isOnAgencyTenant);
  const { data: clientsData, isLoading: clientsLoading } = useAgencyClients(
    { limit: 10 },
    isOnAgencyTenant,
  );
  const { data: invitations = [] } = useAgencyPendingInvitations(isOnAgencyTenant);
  const { data: preferredFormatData } = useAgencyPreferredFormat();
  const { mutate: updatePreferredFormat, isPending: isUpdatingFormat } = useUpdatePreferredFormat();

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
    <div className="space-y-6 pb-6">
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

      {/* ── Accesos rápidos ── */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Accesos rápidos
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setIsAnadirModalOpen(true)}
            className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:border-customer-300 hover:bg-customer-50 dark:hover:border-customer-800 dark:hover:bg-customer-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-customer-100 text-customer-600 dark:bg-customer-950 dark:text-customer-400">
              <UserPlus className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug">Añadir cliente</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                Crea la cuenta tú mismo o vincula un cliente existente.
              </p>
            </div>
          </button>

          <Link
            href="/dashboard/asesoria/exportar"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileDown className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug">Exportar facturas</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                Exporta las facturas de tus clientes a tu software contable.
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsSoftwareModalOpen(true)}
            className="flex items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:border-muted-foreground/20 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Settings2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-snug">
                ¿Qué programa de contabilidad usas?
              </p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                Configura tu software contable por defecto.
                {preferredFormatData?.format && (
                  <span className="ml-1 font-medium text-foreground">
                    (
                    {preferredFormatData.format === 'CONTAPLUS'
                      ? 'ContaPlus'
                      : preferredFormatData.format === 'A3CON'
                        ? 'a3CON'
                        : 'Excel / CSV'}
                    )
                  </span>
                )}
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ── Tabla de clientes ── */}
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
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
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
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    Cliente
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">
                    NIF
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Facturas
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">
                    Ingreso mensual
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">
                    Última actividad
                  </th>
                  <th className="px-4 py-2.5 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {[...clientsData.data]
                  .sort(
                    (a, b) =>
                      (b.stats?.totalInvoices ?? 0) - (a.stats?.totalInvoices ?? 0) ||
                      new Date(b.stats?.lastActivity ?? 0).getTime() -
                        new Date(a.stats?.lastActivity ?? 0).getTime(),
                  )
                  .map((relation) => {
                    const client = relation.clientTenant;
                    const s = relation.stats;
                    const isManaging = managingClientId === relation.clientTenantId;

                    const lastActivity = s?.lastActivity
                      ? (() => {
                          const diffDays = Math.floor(
                            (Date.now() - new Date(s.lastActivity!).getTime()) /
                              (1000 * 60 * 60 * 24),
                          );
                          if (diffDays === 0) return 'Hoy';
                          if (diffDays === 1) return 'Ayer';
                          if (diffDays < 30) return `Hace ${diffDays} días`;
                          const months = Math.floor(diffDays / 30);
                          return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
                        })()
                      : '—';

                    return (
                      <tr
                        key={relation.id}
                        onClick={() => handleSwitchToClient(relation.clientTenantId)}
                        className={cn(
                          'cursor-pointer transition-colors hover:bg-muted/30',
                          (isManaging || isSwitching) && 'pointer-events-none opacity-60',
                        )}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-customer-100 text-[11px] font-bold text-customer-700 dark:bg-customer-950 dark:text-customer-300">
                              {client?.businessName.charAt(0).toUpperCase()}
                            </div>
                            <p className="truncate text-sm font-semibold leading-tight">
                              {client?.businessName}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-2.5 hidden sm:table-cell">
                          <span className="font-mono text-xs text-muted-foreground">
                            {client?.nif}
                          </span>
                        </td>

                        <td className="px-4 py-2.5 text-right hidden md:table-cell">
                          <span className="flex items-center justify-end gap-1 text-sm">
                            <FileText className="h-3 w-3 text-muted-foreground/60" />
                            {s?.totalInvoices ?? 0}
                          </span>
                        </td>

                        <td className="px-4 py-2.5 text-right hidden lg:table-cell">
                          <span className="text-sm">
                            {formatCurrency(s?.monthlyRevenue ?? 0)}
                          </span>
                        </td>

                        <td className="px-4 py-2.5 hidden md:table-cell">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Activity className="h-3 w-3 shrink-0" />
                            {lastActivity}
                          </span>
                        </td>

                        <td className="px-4 py-2.5">
                          {isManaging ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-customer-500" />
                          ) : (
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
        {(stats?.totalClients ?? 0) > 10 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Mostrando los 10 clientes más activos ·{' '}
            <Link
              href="/dashboard/asesoria/clientes"
              className="text-primary underline underline-offset-2"
            >
              Ver los {stats!.totalClients} clientes
            </Link>
          </p>
        )}
      </div>

      {/* ── Invitaciones pendientes ── */}
      <PendingInvitationsWidget invitations={invitations} />

      {/* ── Solicitudes de autónomos ── */}
      <PendingRequestsWidget />

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
      <SoftwareSelectModal
        open={isSoftwareModalOpen}
        currentFormat={preferredFormatData?.format ?? ExportFormat.CONTAPLUS}
        alwaysSaveDefault
        onConfirm={(fmt) => {
          updatePreferredFormat(fmt);
          setIsSoftwareModalOpen(false);
        }}
        onClose={() => setIsSoftwareModalOpen(false)}
      />
    </div>
  );
}

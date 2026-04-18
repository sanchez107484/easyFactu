'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import {
  useAgencyStats,
  useAgencyClients,
  useFiscalAlertsSummary,
  useAgencyPendingInvitations,
} from '@/hooks/use-agency';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  UserPlus,
  Mail,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Users,
  Info,
  MousePointerClick,
  SwitchCamera,
  ClipboardCheck,
} from 'lucide-react';
import { AccountType } from '@easyfactura/shared-types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { AgencyDashboardAlert, FiscalAlertSummaryItem } from '@easyfactura/shared-types';
import { AgencyKpiStrip } from './_components/agency-kpi-strip';
import { ClientsNeedingAttention } from './_components/clients-needing-attention';
import { PendingInvitationsWidget } from './_components/pending-invitations-widget';
import { ClientCard } from './_components/client-card';

function AlertBanner({ alert }: { alert: AgencyDashboardAlert }) {
  const config = {
    error: {
      icon: AlertCircle,
      className: 'border-destructive/30 bg-destructive/5 text-destructive',
      iconClass: 'text-destructive',
    },
    warning: {
      icon: AlertTriangle,
      className:
        'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/20 dark:text-amber-400',
      iconClass: 'text-amber-600 dark:text-amber-400',
    },
    info: {
      icon: ShieldAlert,
      className:
        'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800/50 dark:bg-blue-950/20 dark:text-blue-400',
      iconClass: 'text-blue-600 dark:text-blue-400',
    },
  }[alert.type];
  const Icon = config.icon;
  return (
    <div className={cn('flex items-center gap-3 rounded-lg border px-4 py-3', config.className)}>
      <Icon className={cn('h-4 w-4 shrink-0', config.iconClass)} />
      <p className="text-sm font-medium">{alert.message}</p>
    </div>
  );
}

export default function AgencyHubPage() {
  const router = useRouter();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const switchTenant = useAuthStore((state) => state.switchTenant);
  const { data: stats, isLoading: statsLoading } = useAgencyStats();
  const { data: clientsData, isLoading: clientsLoading } = useAgencyClients({ limit: 50 });
  const { data: alertsSummary } = useFiscalAlertsSummary();
  const { data: invitations = [] } = useAgencyPendingInvitations();
  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  useEffect(() => {
    if (!isAgency) router.replace('/dashboard');
  }, [isAgency, router]);

  const alertsMap = useMemo(() => {
    const map = new Map<string, FiscalAlertSummaryItem>();
    alertsSummary?.forEach((item) => map.set(item.clientTenantId, item));
    return map;
  }, [alertsSummary]);

  if (!isAgency) return null;

  const handleSwitchToClient = async (clientTenantId: string) => {
    await switchTenant(clientTenantId);
    router.push('/dashboard');
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clientsData.data.map((relation) => (
              <ClientCard
                key={relation.id}
                relation={relation}
                fiscalAlert={alertsMap.get(relation.clientTenantId)}
                onSwitchToClient={handleSwitchToClient}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Alertas del sistema ── */}
      {!statsLoading && stats?.alerts && stats.alerts.length > 0 && (
        <div className="space-y-2">
          {stats.alerts.map((alert, i) => (
            <AlertBanner key={i} alert={alert} />
          ))}
        </div>
      )}

      {/* ── Clientes que requieren atención ── */}
      {clientsData?.data && (
        <ClientsNeedingAttention
          clients={clientsData.data}
          alertsMap={alertsMap}
          onSwitchToClient={handleSwitchToClient}
        />
      )}

      {/* ── Invitaciones pendientes ── */}
      <PendingInvitationsWidget invitations={invitations} />

      {/* ── Cards de acción: añadir / invitar ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Añadir cliente directamente</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Crea el perfil fiscal del cliente tú mismo. Ideal si el cliente no tiene acceso a
                EasyFactura.
              </p>
            </div>
          </div>
          <Link href="/dashboard/asesoria/clientes/nuevo" className="mt-auto">
            <Button className="w-full" size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Añadir cliente
            </Button>
          </Link>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border bg-card p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">Invitar cliente por email</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                El cliente recibe un enlace para registrarse. Una vez acepte, podrás gestionar su
                facturación.
              </p>
            </div>
          </div>
          <Link href="/dashboard/asesoria/clientes/invitar" className="mt-auto">
            <Button variant="outline" className="w-full" size="sm">
              <Mail className="mr-2 h-4 w-4" />
              Enviar invitación
            </Button>
          </Link>
        </div>
      </div>

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
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-indigo-200 bg-card dark:border-indigo-800">
                <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white dark:bg-indigo-500">
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
    </div>
  );
}

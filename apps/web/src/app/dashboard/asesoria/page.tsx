'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useAgencyStats, useAgencyClients } from '@/hooks/use-agency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Plus,
  ArrowRight,
  AlertTriangle,
  Clock,
  TrendingUp,
  LayoutDashboard,
  ChevronRight,
  UserPlus,
  Mail,
} from 'lucide-react';
import { AccountType } from '@easyfactura/shared-types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

function StatsCard({
  label,
  value,
  icon: Icon,
  accent,
  isLoading,
}: {
  label: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  accent?: 'orange' | 'blue' | 'green' | 'indigo';
  isLoading: boolean;
}) {
  const colorMap = {
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400',
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
            colorMap[accent ?? 'indigo'],
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          {isLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <p className="text-2xl font-bold">{value ?? 0}</p>
          )}
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgencyHubPage() {
  const router = useRouter();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const switchTenant = useAuthStore((state) => state.switchTenant);
  const { data: stats, isLoading: statsLoading } = useAgencyStats();
  const { data: clientsData, isLoading: clientsLoading } = useAgencyClients({ limit: 5 });

  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  if (!isAgency) {
    router.replace('/dashboard');
    return null;
  }

  const handleSwitchToClient = async (clientTenantId: string) => {
    await switchTenant(clientTenantId);
    router.push('/dashboard');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Panel de asesoría</h1>
          <p className="mt-1 text-muted-foreground">Gestiona todos tus clientes desde aquí</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/asesoria/clientes/nuevo">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Añadir cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Clientes en cartera"
          value={stats?.totalClients}
          icon={Users}
          accent="indigo"
          isLoading={statsLoading}
        />
        <StatsCard
          label="Clientes activos"
          value={stats?.activeClients}
          icon={TrendingUp}
          accent="green"
          isLoading={statsLoading}
        />
        <StatsCard
          label="Requieren atención"
          value={stats?.clientsNeedingAttention}
          icon={AlertTriangle}
          accent="orange"
          isLoading={statsLoading}
        />
        <StatsCard
          label="Invitaciones pendientes"
          value={stats?.pendingInvitations}
          icon={Clock}
          accent="blue"
          isLoading={statsLoading}
        />
      </div>

      {/* Clients list preview */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base">Clientes recientes</CardTitle>
            <CardDescription>Accede al dashboard de cada cliente con un clic</CardDescription>
          </div>
          <Link href="/dashboard/asesoria/clientes">
            <Button variant="ghost" size="sm">
              Ver todos
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : !clientsData?.data.length ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Aún no tienes clientes</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Añade tu primer cliente para empezar a gestionar su facturación
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard/asesoria/clientes/nuevo">
                  <Button size="sm">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Añadir directamente
                  </Button>
                </Link>
                <Link href="/dashboard/asesoria/clientes/invitar">
                  <Button variant="outline" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Invitar por email
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {clientsData.data.map((relation) => (
                <div
                  key={relation.id}
                  className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-sm font-semibold dark:bg-indigo-950 dark:text-indigo-400">
                      {relation.clientTenant?.businessName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-sm">
                        {relation.clientTenant?.businessName}
                      </p>
                      <p className="text-xs text-muted-foreground">{relation.clientTenant?.nif}</p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {relation.stats && relation.stats.pendingInvoices > 0 && (
                      <Badge
                        variant="outline"
                        className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400"
                      >
                        {relation.stats.pendingInvoices} pendiente
                        {relation.stats.pendingInvoices > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSwitchToClient(relation.clientTenantId)}
                    >
                      <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                      Gestionar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/dashboard/asesoria/clientes/nuevo">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Añadir cliente</p>
                <p className="text-sm text-muted-foreground">
                  Da de alta a un cliente directamente con sus datos fiscales
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/asesoria/clientes/invitar">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <Mail className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Invitar cliente</p>
                <p className="text-sm text-muted-foreground">
                  Envía un email de invitación para que acepte la colaboración
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

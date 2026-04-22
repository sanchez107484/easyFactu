'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useAgencyClients,
  useRevokeClient,
  useAgencyPendingInvitations,
  useCancelInvitation,
} from '@/hooks/use-agency';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Plus,
  Search,
  LayoutDashboard,
  MoreVertical,
  Trash2,
  Mail,
  UserPlus,
  X,
  Clock,
  XCircle,
  ArrowRightLeft,
  FileText,
  Send,
  MapPin,
  Activity,
  Loader2,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import type {
  AgencyClientWithDetails,
  AgencyInvitation,
  ClientActivationStatus,
} from '@easyfactura/shared-types';
import { useAgencyContext } from '@/hooks/use-agency-context';
import { useSwitchTenant } from '@/hooks/use-switch-tenant';
import { VincularClienteModal } from '../_components/vincular-cliente-modal';

function ClientActivationBadge({
  activationStatus,
  setupCompleted,
  createdAt,
}: {
  activationStatus: ClientActivationStatus;
  setupCompleted: boolean;
  createdAt: string;
}) {
  const { emailVerified, activationTokenExpires } = activationStatus;

  if (emailVerified && setupCompleted) return null;

  if (emailVerified && !setupCompleted) {
    return (
      <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-proforma-600 dark:text-proforma-400">
        <AlertTriangle className="h-2.5 w-2.5" />
        Config. pendiente
      </span>
    );
  }

  const now = Date.now();
  const tokenExpiredOrMissing =
    !activationTokenExpires || new Date(activationTokenExpires).getTime() < now;

  if (tokenExpiredOrMissing) {
    return (
      <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-destructive">
        <ShieldAlert className="h-2.5 w-2.5" />
        Enlace caducado
      </span>
    );
  }

  const hoursSinceCreation = (now - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreation < 24) return null; // Fresh — no need to warn yet

  return (
    <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-proforma-600 dark:text-proforma-400">
      <Clock className="h-2.5 w-2.5" />
      Sin activar
    </span>
  );
}

export default function AgencyClientsPage() {
  const router = useRouter();
  const { switchTenant, isPending: isSwitching } = useSwitchTenant();
  const { isOnAgencyTenant, isActingAsClient, returnToAgency } = useAgencyContext();
  const [search, setSearch] = useState('');
  const [managingClientId, setManagingClientId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AgencyClientWithDetails | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AgencyInvitation | null>(null);
  const [isVincularModalOpen, setIsVincularModalOpen] = useState(false);

  const { data, isLoading } = useAgencyClients(
    { search: search || undefined },
    isOnAgencyTenant,
  );
  const { data: invitationsData, isLoading: isLoadingInvitations } =
    useAgencyPendingInvitations(isOnAgencyTenant);
  const { mutate: revokeClient, isPending: isRevoking } = useRevokeClient();
  const { mutate: cancelInvitation, isPending: isCancelling } = useCancelInvitation();

  const mountedActingAsClient = useRef(isActingAsClient);
  const mountedOnAgencyTenant = useRef(isOnAgencyTenant);

  useEffect(() => {
    if (mountedActingAsClient.current) {
      returnToAgency();
    } else if (!mountedOnAgencyTenant.current) {
      router.replace('/dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isOnAgencyTenant) return null;

  const handleManage = async (clientTenantId: string) => {
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

  const handleRevoke = (clientTenantId: string) => {
    revokeClient(clientTenantId, {
      onSuccess: () => setRevokeTarget(null),
    });
  };

  const handleCancelInvitation = (id: string) => {
    cancelInvitation(id, {
      onSuccess: () => setCancelTarget(null),
    });
  };

  const pendingInvitations = invitationsData ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mis clientes</h1>
          <p className="mt-1 text-muted-foreground">
            Los autónomos y empresas de tu cartera que gestionas en su nombre
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsVincularModalOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            Vincular cliente
          </Button>
          <Link href="/dashboard/asesoria/clientes/nuevo">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Añadir cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* How it works — shown when there are no clients yet */}
      {!isLoading && !data?.data.length && !pendingInvitations.length && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-customer-50 dark:bg-customer-950/40">
              <ArrowRightLeft className="h-5 w-5 text-customer-600 dark:text-customer-400" />
            </div>
            <p className="font-semibold text-sm">Cambia entre cuentas al instante</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Con un clic accedes a la cuenta de cada cliente y gestionas sus facturas como si
              fueras él. Sin cerrar sesión, sin contraseñas.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-customer-50 dark:bg-customer-950/40">
              <FileText className="h-5 w-5 text-customer-600 dark:text-customer-400" />
            </div>
            <p className="font-semibold text-sm">VeriFactu por cada NIF</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cada cliente tiene su propio sistema de facturación con VeriFactu activado. Tú solo te
              preocupas de crear las facturas.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-customer-50 dark:bg-customer-950/40">
              <Send className="h-5 w-5 text-customer-600 dark:text-customer-400" />
            </div>
            <p className="font-semibold text-sm">Dos formas de añadir clientes</p>
            <p className="mt-1 text-xs text-muted-foreground">
              <strong>Añadir:</strong> creas tú la cuenta del cliente directamente.{' '}
              <strong>Invitar:</strong> el cliente que ya usa NovaFactura acepta la vinculación.
            </p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, NIF o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Active clients list */}
      {isLoading ? (
        <div className="grid gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : !data?.data.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">
                {search ? 'Sin resultados para tu búsqueda' : 'No tienes clientes aún'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search ? 'Prueba con otro término' : 'Añade tu primer cliente para empezar'}
              </p>
            </div>
            {!search && (
              <Link href="/dashboard/asesoria/clientes/nuevo">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Añadir cliente
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>NIF / CIF</TableHead>
                <TableHead className="hidden md:table-cell">Localidad</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Facturas</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Pendientes</TableHead>
                <TableHead className="hidden xl:table-cell text-right">Ingreso mensual</TableHead>
                <TableHead className="hidden sm:table-cell">Última actividad</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((relation) => {
                const client = relation.clientTenant;
                const stats = relation.stats;
                const lastActivity = stats?.lastActivity
                  ? (() => {
                      const diffDays = Math.floor(
                        (Date.now() - new Date(stats.lastActivity!).getTime()) /
                          (1000 * 60 * 60 * 24),
                      );
                      if (diffDays === 0) return 'Hoy';
                      if (diffDays === 1) return 'Ayer';
                      if (diffDays < 30) return `Hace ${diffDays} días`;
                      const months = Math.floor(diffDays / 30);
                      if (months < 12) return `Hace ${months} mes${months > 1 ? 'es' : ''}`;
                      return new Date(stats.lastActivity!).toLocaleDateString('es-ES', {
                        month: 'short',
                        year: 'numeric',
                      });
                    })()
                  : '—';

                return (
                  <TableRow key={relation.id} className="group">
                    <TableCell>
                      <Link
                        href={`/dashboard/asesoria/clientes/${relation.clientTenantId}`}
                        className="flex items-center gap-3 min-w-0"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-customer-100 text-xs font-bold text-customer-700 dark:bg-customer-950 dark:text-customer-300">
                          {client.businessName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-sm leading-tight hover:underline">
                            {client.businessName}
                          </p>
                          {client.legalName && (
                            <p className="truncate text-xs text-muted-foreground">
                              {client.legalName}
                            </p>
                          )}
                          <ClientActivationBadge
                            activationStatus={relation.activationStatus}
                            setupCompleted={client.setupCompleted}
                            createdAt={relation.createdAt}
                          />
                        </div>
                      </Link>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-sm">{client.nif}</span>
                    </TableCell>

                    <TableCell className="hidden md:table-cell">
                      {client.city ? (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {client.city}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-right">
                      <span className="text-sm">{stats?.totalInvoices ?? 0}</span>
                    </TableCell>

                    <TableCell className="hidden lg:table-cell text-right">
                      {(stats?.pendingInvoices ?? 0) > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-overdue-200 bg-overdue-50 text-overdue-700 dark:border-overdue-800 dark:bg-overdue-950/30 dark:text-overdue-400"
                        >
                          {stats!.pendingInvoices}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">0</span>
                      )}
                    </TableCell>

                    <TableCell className="hidden xl:table-cell text-right">
                      <span className="text-sm font-medium">
                        {(stats?.monthlyRevenue ?? 0) > 0
                          ? formatCurrency(stats!.monthlyRevenue)
                          : '—'}
                      </span>
                    </TableCell>

                    <TableCell className="hidden sm:table-cell">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Activity className="h-3 w-3 shrink-0" />
                        {lastActivity}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleManage(relation.clientTenantId)}
                          disabled={managingClientId === relation.clientTenantId || isSwitching}
                        >
                          {managingClientId === relation.clientTenantId ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <LayoutDashboard className="mr-1 h-3 w-3" />
                          )}
                          Gestionar
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleManage(relation.clientTenantId)}
                              disabled={managingClientId !== null || isSwitching}
                            >
                              <LayoutDashboard className="mr-2 h-4 w-4" />
                              Acceder al dashboard
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setRevokeTarget(relation)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Dar de baja
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pending invitations section */}
      {!search && (isLoadingInvitations || pendingInvitations.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Invitaciones pendientes
            </h2>
            {!isLoadingInvitations && (
              <Badge variant="secondary" className="text-xs">
                {pendingInvitations.length}
              </Badge>
            )}
          </div>

          {isLoadingInvitations ? (
            <div className="grid gap-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-2">
              {pendingInvitations.map((inv) => {
                const expiresAt = new Date(inv.expiresAt);
                const isExpiringSoon = expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

                return (
                  <Card key={inv.id} className="border-dashed bg-muted/30">
                    <CardContent className="flex items-center justify-between gap-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {inv.inviteeName ? (
                              <>
                                {inv.inviteeName}{' '}
                                <span className="text-muted-foreground font-normal">
                                  ({inv.inviteeEmail})
                                </span>
                              </>
                            ) : (
                              inv.inviteeEmail
                            )}
                          </p>
                          <p
                            className={`text-xs ${isExpiringSoon ? 'text-overdue-600 dark:text-overdue-400' : 'text-muted-foreground'}`}
                          >
                            Expira el{' '}
                            {expiresAt.toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                            {isExpiringSoon && ' · Expira pronto'}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => setCancelTarget(inv)}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Cancelar
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Revoke access confirmation */}
      <AlertDialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dar de baja al cliente</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Vas a dar de baja a{' '}
                  <strong className="text-foreground">
                    {revokeTarget?.clientTenant?.businessName}
                  </strong>{' '}
                  de tu cartera de clientes.
                </p>
                <p>Perderás el acceso a su dashboard y facturación. Sus datos no se eliminarán.</p>
                <p className="font-medium text-destructive">Esta acción no se puede deshacer.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeTarget && handleRevoke(revokeTarget.clientTenantId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRevoking}
            >
              {isRevoking ? 'Procesando...' : 'Confirmar baja'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel invitation confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar invitación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cancelar la invitación enviada a{' '}
              <strong>{cancelTarget?.inviteeName || cancelTarget?.inviteeEmail}</strong>? El enlace
              de invitación dejará de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelTarget && handleCancelInvitation(cancelTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
            >
              Cancelar invitación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vincular cliente modal */}
      <VincularClienteModal
        isOpen={isVincularModalOpen}
        onClose={() => setIsVincularModalOpen(false)}
      />
    </div>
  );
}

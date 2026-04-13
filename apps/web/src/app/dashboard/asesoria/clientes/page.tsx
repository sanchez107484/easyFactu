'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
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
} from 'lucide-react';
import type { AgencyClientWithDetails, AgencyInvitation } from '@easyfactura/shared-types';
import { AccountType } from '@easyfactura/shared-types';

export default function AgencyClientsPage() {
  const router = useRouter();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const switchTenant = useAuthStore((state) => state.switchTenant);
  const [search, setSearch] = useState('');
  const [revokeTarget, setRevokeTarget] = useState<AgencyClientWithDetails | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AgencyInvitation | null>(null);

  const { data, isLoading } = useAgencyClients({ search: search || undefined });
  const { data: invitationsData, isLoading: isLoadingInvitations } = useAgencyPendingInvitations();
  const { mutate: revokeClient, isPending: isRevoking } = useRevokeClient();
  const { mutate: cancelInvitation, isPending: isCancelling } = useCancelInvitation();

  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  if (!isAgency) {
    router.replace('/dashboard');
    return null;
  }

  const handleManage = async (clientTenantId: string) => {
    await switchTenant(clientTenantId);
    router.push('/dashboard');
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
          <p className="mt-1 text-muted-foreground">Todos los clientes de tu cartera</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/asesoria/clientes/invitar">
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              Invitar
            </Button>
          </Link>
          <Link href="/dashboard/asesoria/clientes/nuevo">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Añadir cliente
            </Button>
          </Link>
        </div>
      </div>

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
        <div className="grid gap-3">
          {data.data.map((relation) => (
            <Card key={relation.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <Link
                  href={`/dashboard/asesoria/clientes/${relation.clientTenantId}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold dark:bg-indigo-950 dark:text-indigo-300">
                    {relation.clientTenant?.businessName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold hover:underline">
                      {relation.clientTenant?.businessName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{relation.clientTenant?.nif}</span>
                      {relation.clientTenant?.city && (
                        <>
                          <span>·</span>
                          <span>{relation.clientTenant.city}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>

                <div className="flex shrink-0 items-center gap-2">
                  {relation.stats && (
                    <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{relation.stats.totalInvoices} facturas</span>
                      {relation.stats.pendingInvoices > 0 && (
                        <Badge
                          variant="outline"
                          className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400"
                        >
                          {relation.stats.pendingInvoices} pendientes
                        </Badge>
                      )}
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleManage(relation.clientTenantId)}
                  >
                    <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                    Gestionar
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleManage(relation.clientTenantId)}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Acceder al dashboard
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setRevokeTarget(relation)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Revocar acceso
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
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
                            className={`text-xs ${isExpiringSoon ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}
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
            <AlertDialogTitle>Revocar acceso</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres revocar el acceso a{' '}
              <strong>{revokeTarget?.clientTenant?.businessName}</strong>? Dejarás de poder
              gestionar su facturación. Los datos del cliente no se eliminarán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeTarget && handleRevoke(revokeTarget.clientTenantId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRevoking}
            >
              Revocar acceso
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
    </div>
  );
}

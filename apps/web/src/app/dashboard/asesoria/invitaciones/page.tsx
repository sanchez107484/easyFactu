'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAllInvitations, useCancelInvitation } from '@/hooks/use-agency';
import { useAgencyContext } from '@/hooks/use-agency-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { History, Mail, XCircle } from 'lucide-react';
import type { AgencyInvitationFull } from '@easyfactura/shared-types';
import { AgencyInvitationStatus } from '@easyfactura/shared-types';

const STATUS_CONFIG: Record<AgencyInvitationStatus, { label: string; className: string }> = {
  [AgencyInvitationStatus.PENDING]: {
    label: 'Pendiente',
    className:
      'border-proforma-200 bg-proforma-50 text-proforma-700 dark:border-proforma-800 dark:bg-proforma-950/30 dark:text-proforma-400',
  },
  [AgencyInvitationStatus.ACCEPTED]: {
    label: 'Aceptada',
    className:
      'border-secondary-200 bg-secondary-50 text-secondary-700 dark:border-secondary-800 dark:bg-secondary-950/30 dark:text-secondary-400',
  },
  [AgencyInvitationStatus.REJECTED]: {
    label: 'Rechazada',
    className:
      'border-rectificativa-200 bg-rectificativa-50 text-rectificativa-700 dark:border-rectificativa-800 dark:bg-rectificativa-950/30 dark:text-rectificativa-400',
  },
  [AgencyInvitationStatus.EXPIRED]: {
    label: 'Caducada',
    className:
      'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400',
  },
  [AgencyInvitationStatus.CANCELLED]: {
    label: 'Cancelada',
    className:
      'border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-400',
  },
};

function InvitationStatusBadge({ status }: { status: AgencyInvitationStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG[AgencyInvitationStatus.EXPIRED];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Destinatario</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="hidden sm:table-cell">Enviada</TableHead>
            <TableHead className="hidden md:table-cell">Expira / Respondida</TableHead>
            <TableHead className="w-[80px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(4)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20 rounded-full" />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Skeleton className="h-3.5 w-24" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-3.5 w-28" />
              </TableCell>
              <TableCell />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function InvitacionesPage() {
  const router = useRouter();
  const { isOnAgencyTenant } = useAgencyContext();
  const { data: invitations = [], isLoading } = useAllInvitations();
  const { mutate: cancelInvitation, isPending: isCancelling } = useCancelInvitation();
  const [cancelTarget, setCancelTarget] = useState<AgencyInvitationFull | null>(null);

  useEffect(() => {
    if (!isOnAgencyTenant) router.replace('/dashboard');
  }, [isOnAgencyTenant, router]);

  if (!isOnAgencyTenant) return null;

  function handleCancel() {
    if (!cancelTarget) return;
    cancelInvitation(cancelTarget.id, { onSuccess: () => setCancelTarget(null) });
  }

  function getSecondaryDate(inv: AgencyInvitationFull): string {
    if (inv.status === AgencyInvitationStatus.REJECTED && inv.rejectedAt) {
      return `Rechazada el ${formatDate(inv.rejectedAt)}`;
    }
    if (inv.status === AgencyInvitationStatus.ACCEPTED) {
      return `Aceptada el ${formatDate(inv.updatedAt)}`;
    }
    if (inv.status === AgencyInvitationStatus.CANCELLED) {
      return `Cancelada el ${formatDate(inv.updatedAt)}`;
    }
    return `Expira el ${formatDate(inv.expiresAt)}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historial de invitaciones</h1>
        <p className="mt-1 text-muted-foreground">
          Todas las invitaciones enviadas a potenciales clientes, independientemente de su estado.
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : invitations.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
          <History className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            Todavía no has enviado ninguna invitación
          </p>
          <p className="text-xs text-muted-foreground">
            Las invitaciones que envíes desde la página de clientes aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Destinatario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden sm:table-cell">Enviada</TableHead>
                <TableHead className="hidden md:table-cell">Expira / Respuesta</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        {inv.inviteeName && (
                          <p className="truncate text-sm font-medium leading-tight">
                            {inv.inviteeName}
                          </p>
                        )}
                        <p
                          className={`truncate text-sm ${inv.inviteeName ? 'text-muted-foreground' : 'font-medium'}`}
                        >
                          {inv.inviteeEmail}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <InvitationStatusBadge status={inv.status} />
                  </TableCell>

                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                    {formatDate(inv.createdAt)}
                  </TableCell>

                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {getSecondaryDate(inv)}
                  </TableCell>

                  <TableCell>
                    {inv.status === AgencyInvitationStatus.PENDING && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-muted-foreground hover:text-destructive"
                        onClick={() => setCancelTarget(inv)}
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!cancelTarget} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar invitación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres cancelar la invitación enviada a{' '}
              <strong>{cancelTarget?.inviteeName ?? cancelTarget?.inviteeEmail}</strong>? El enlace
              dejará de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>No cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelando...' : 'Cancelar invitación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

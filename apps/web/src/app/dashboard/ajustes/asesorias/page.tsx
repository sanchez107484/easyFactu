'use client';

import { useState } from 'react';
import { Building2, Mail, MapPin, Phone, ShieldOff, Trash2 } from 'lucide-react';
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
import { useMyAgencies, useRevokeMyAgency } from '@/hooks/use-agency';
import type { MyAgencyRelation } from '@easyfactura/shared-types';

function AgencyCard({
  agency,
  onRevoke,
  isRevoking,
}: {
  agency: MyAgencyRelation;
  onRevoke: (agency: MyAgencyRelation) => void;
  isRevoking: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-agency-100 dark:bg-agency-950">
            <Building2 className="h-5 w-5 text-agency-600 dark:text-agency-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold leading-tight truncate">{agency.agencyName}</p>
            <p className="text-sm text-muted-foreground font-mono">{agency.agencyNif}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
          onClick={() => onRevoke(agency)}
          disabled={isRevoking}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Revocar acceso
        </Button>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
        {agency.agencyEmail && (
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {agency.agencyEmail}
          </span>
        )}
        {agency.agencyPhone && (
          <span className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            {agency.agencyPhone}
          </span>
        )}
        {agency.agencyCity && (
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {agency.agencyCity}
          </span>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Acceso concedido el{' '}
        {new Date(agency.linkedAt).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </p>
    </div>
  );
}

function AgencyCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-28" />
      </div>
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

export default function MisAsesoriasPage() {
  const { data: agencies = [], isLoading } = useMyAgencies();
  const revokeMutation = useRevokeMyAgency();
  const [confirmAgency, setConfirmAgency] = useState<MyAgencyRelation | null>(null);

  function handleRevoke(agency: MyAgencyRelation) {
    setConfirmAgency(agency);
  }

  async function handleConfirmRevoke() {
    if (!confirmAgency) return;
    await revokeMutation.mutateAsync(confirmAgency.agencyTenantId);
    setConfirmAgency(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Mis asesorías</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Asesorías que actualmente tienen acceso a tu cuenta y pueden gestionar tu facturación en
          tu nombre. Puedes revocar el acceso en cualquier momento.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <AgencyCardSkeleton />
          <AgencyCardSkeleton />
        </div>
      ) : agencies.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center space-y-2">
          <ShieldOff className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            No tienes ninguna asesoría vinculada
          </p>
          <p className="text-xs text-muted-foreground">
            Cuando aceptes la invitación de una asesoría, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {agencies.map((agency) => (
            <AgencyCard
              key={agency.id}
              agency={agency}
              onRevoke={handleRevoke}
              isRevoking={revokeMutation.isPending}
            />
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmAgency} onOpenChange={(open) => !open && setConfirmAgency(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Revocar acceso de {confirmAgency?.agencyName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción retirará a{' '}
              <span className="font-semibold">{confirmAgency?.agencyName}</span> el acceso a tu
              cuenta. No podrán ver ni gestionar tus facturas hasta que les vuelvas a aceptar una
              invitación. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={revokeMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRevoke}
              disabled={revokeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, revocar acceso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

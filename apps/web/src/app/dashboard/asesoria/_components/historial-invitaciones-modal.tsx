'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { History, Mail, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useAllInvitations, useCancelInvitation, useInviteClient } from '@/hooks/use-agency';
import { AgencyInvitationStatus } from '@easyfactura/shared-types';
import type { AgencyInvitationFull } from '@easyfactura/shared-types';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = 'pending' | 'accepted' | 'inactive' | 'cancelled';

interface Tab {
  id: TabId;
  label: string;
  count: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<AgencyInvitationStatus, { label: string; className: string }> = {
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getSecondaryDate(inv: AgencyInvitationFull): string {
  if (inv.status === AgencyInvitationStatus.ACCEPTED) {
    return `Aceptada el ${formatDate(inv.updatedAt)}`;
  }
  if (inv.status === AgencyInvitationStatus.REJECTED && inv.rejectedAt) {
    return `Rechazada el ${formatDate(inv.rejectedAt)}`;
  }
  if (inv.status === AgencyInvitationStatus.CANCELLED) {
    return `Cancelada el ${formatDate(inv.updatedAt)}`;
  }
  return `Expira el ${formatDate(inv.expiresAt)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  tab,
  isActive,
  onClick,
}: {
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition-colors',
        isActive
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {tab.label}
      {tab.count > 0 && <span className="text-xs text-muted-foreground">({tab.count})</span>}
    </button>
  );
}

function InvitationRow({
  inv,
  onCancel,
  onResend,
}: {
  inv: AgencyInvitationFull;
  onCancel: (inv: AgencyInvitationFull) => void;
  onResend: (inv: AgencyInvitationFull) => void;
}) {
  const canCancel = inv.status === AgencyInvitationStatus.PENDING;
  const canResend =
    inv.status === AgencyInvitationStatus.EXPIRED ||
    inv.status === AgencyInvitationStatus.REJECTED ||
    inv.status === AgencyInvitationStatus.CANCELLED;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        {inv.inviteeName && (
          <p className="truncate text-sm font-medium leading-tight">{inv.inviteeName}</p>
        )}
        <p
          className={cn(
            'truncate text-sm',
            inv.inviteeName ? 'text-muted-foreground' : 'font-medium',
          )}
        >
          {inv.inviteeEmail}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Enviada el {formatDate(inv.createdAt)} · {getSecondaryDate(inv)}
        </p>
      </div>

      <Badge variant="outline" className={STATUS_BADGE[inv.status].className}>
        {STATUS_BADGE[inv.status].label}
      </Badge>

      {canCancel && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onCancel(inv)}
        >
          <XCircle className="mr-1 h-3.5 w-3.5" />
          Cancelar
        </Button>
      )}

      {canResend && (
        <Button variant="outline" size="sm" className="shrink-0" onClick={() => onResend(inv)}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Reenviar
        </Button>
      )}
    </div>
  );
}

function EmptyTabState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <Mail className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">No hay invitaciones en esta categoría</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 py-2">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface HistorialInvitacionesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HistorialInvitacionesModal({ isOpen, onClose }: HistorialInvitacionesModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('pending');
  const [cancelTarget, setCancelTarget] = useState<AgencyInvitationFull | null>(null);
  const [resendTarget, setResendTarget] = useState<AgencyInvitationFull | null>(null);

  const { data: invitations = [], isLoading } = useAllInvitations(isOpen);
  const { mutate: cancelInvitation, isPending: isCancelling } = useCancelInvitation();
  const { mutate: inviteClient, isPending: isResending } = useInviteClient();

  // Group invitations by tab
  const pending = invitations.filter((i) => i.status === AgencyInvitationStatus.PENDING);
  const accepted = invitations.filter((i) => i.status === AgencyInvitationStatus.ACCEPTED);
  const inactive = invitations.filter(
    (i) =>
      i.status === AgencyInvitationStatus.EXPIRED || i.status === AgencyInvitationStatus.REJECTED,
  );
  const cancelled = invitations.filter((i) => i.status === AgencyInvitationStatus.CANCELLED);

  const tabs: Tab[] = [
    { id: 'pending', label: 'Pendientes', count: pending.length },
    { id: 'accepted', label: 'Aceptadas', count: accepted.length },
    { id: 'inactive', label: 'Sin respuesta', count: inactive.length },
    { id: 'cancelled', label: 'Canceladas', count: cancelled.length },
  ];

  const activeItems: AgencyInvitationFull[] =
    activeTab === 'pending'
      ? pending
      : activeTab === 'accepted'
        ? accepted
        : activeTab === 'inactive'
          ? inactive
          : cancelled;

  function handleConfirmCancel() {
    if (!cancelTarget) return;
    cancelInvitation(cancelTarget.id, { onSuccess: () => setCancelTarget(null) });
  }

  function handleConfirmResend() {
    if (!resendTarget) return;
    inviteClient(
      { inviteeEmail: resendTarget.inviteeEmail },
      { onSuccess: () => setResendTarget(null) },
    );
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 p-0">
          <DialogHeader className="px-6 pb-4 pt-6">
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-agency-600 dark:text-agency-400" />
              Invitaciones enviadas
            </DialogTitle>
            <DialogDescription>
              Todas las invitaciones que has enviado a potenciales clientes, agrupadas por estado.
            </DialogDescription>
          </DialogHeader>

          {/* Horizontal tabs */}
          <div className="border-b px-6">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <TabButton
                  key={tab.id}
                  tab={tab}
                  isActive={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoading ? (
              <LoadingSkeleton />
            ) : activeItems.length === 0 ? (
              <EmptyTabState />
            ) : (
              <div className="space-y-1.5">
                {activeItems.map((inv) => (
                  <InvitationRow
                    key={inv.id}
                    inv={inv}
                    onCancel={setCancelTarget}
                    onResend={setResendTarget}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation */}
      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar invitación</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Quieres cancelar la invitación enviada a{' '}
              <strong>{cancelTarget?.inviteeName || cancelTarget?.inviteeEmail}</strong>? El enlace
              dejará de funcionar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>No cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelando...' : 'Cancelar invitación'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resend confirmation */}
      <AlertDialog open={!!resendTarget} onOpenChange={() => setResendTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reenviar invitación</AlertDialogTitle>
            <AlertDialogDescription>
              Se enviará una nueva invitación a{' '}
              <strong>{resendTarget?.inviteeName || resendTarget?.inviteeEmail}</strong>. El nuevo
              enlace será válido durante 7 días.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmResend} disabled={isResending}>
              {isResending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Reenviar invitación
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

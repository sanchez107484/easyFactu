'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  Shield,
  X,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useReceivedInvitations,
  useAcceptInvitation,
  useRejectInvitation,
} from '@/hooks/use-agency';
import type { ReceivedInvitation } from '@easyfactura/shared-types';

// ==================== HELPERS ====================

function formatDaysLeft(expiresAt: string): string {
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'caduca hoy';
  if (days === 1) return 'caduca mañana';
  return `caduca en ${days} días`;
}

/** Persists dismissed invitation IDs in sessionStorage across soft-navigations. */
function useDismissedIds() {
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => {
    try {
      const raw = sessionStorage.getItem('dismissed-inv-ids');
      return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try {
        sessionStorage.setItem('dismissed-inv-ids', JSON.stringify([...next]));
      } catch {
        // sessionStorage unavailable (private browsing restriction)
      }
      return next;
    });
  }, []);

  return [dismissed, dismiss] as const;
}

// ==================== INVITATION MODAL ====================

type ConfirmingAction = 'accept' | 'reject' | null;

interface InvitationModalProps {
  invitation: ReceivedInvitation;
  isOpen: boolean;
  onClose: () => void;
}

function InvitationModal({ invitation, isOpen, onClose }: InvitationModalProps) {
  const router = useRouter();
  const [confirmingAction, setConfirmingAction] = useState<ConfirmingAction>(null);

  const acceptMutation = useAcceptInvitation();
  const rejectMutation = useRejectInvitation();

  const isLoading = acceptMutation.isPending || rejectMutation.isPending;

  const handleRequestAction = useCallback((action: 'accept' | 'reject') => {
    setConfirmingAction(action);
  }, []);

  const handleCancelConfirm = useCallback(() => {
    setConfirmingAction(null);
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setConfirmingAction(null);
    onClose();
  }, [isLoading, onClose]);

  const handleConfirm = useCallback(async () => {
    if (!confirmingAction) return;
    try {
      if (confirmingAction === 'accept') {
        await acceptMutation.mutateAsync(invitation.token);
        onClose();
        router.refresh();
      } else {
        await rejectMutation.mutateAsync(invitation.token);
        setConfirmingAction(null);
        onClose();
      }
    } catch {
      // Error already surfaced via mutation onError toast; reset UI so user can retry
      setConfirmingAction(null);
    }
  }, [confirmingAction, invitation.token, acceptMutation, rejectMutation, onClose, router]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-agency-600" />
            Solicitud de asesoría
          </DialogTitle>
          <DialogDescription>
            Una asesoría quiere gestionar tu facturación en tu nombre.
          </DialogDescription>
        </DialogHeader>

        {/* Agency card */}
        <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-agency-100 dark:bg-agency-950">
              <Building2 className="h-5 w-5 text-agency-600 dark:text-agency-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-tight">{invitation.agencyName}</p>
              <p className="text-sm text-muted-foreground font-mono">{invitation.agencyNif}</p>
              {invitation.agencyCity && (
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {invitation.agencyCity}
                </div>
              )}
            </div>
            <Badge
              variant="outline"
              className="shrink-0 text-xs text-proforma-600 border-proforma-300"
            >
              {formatDaysLeft(invitation.expiresAt)}
            </Badge>
          </div>

          <div className="rounded-lg border border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950/30 p-3 text-xs text-primary-800 dark:text-primary-300 leading-relaxed">
            <Shield className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />
            Si aceptas, esta asesoría podrá ver y gestionar tus facturas en tu nombre. Puedes
            revocar el acceso en cualquier momento desde Ajustes.
          </div>
        </div>

        {/* Double-confirmation zone */}
        {confirmingAction === null ? (
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1 text-destructive hover:text-destructive hover:border-destructive"
              onClick={() => handleRequestAction('reject')}
              disabled={isLoading}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Rechazar
            </Button>
            <Button
              className="flex-1 bg-agency-600 hover:bg-agency-700 text-white"
              onClick={() => handleRequestAction('accept')}
              disabled={isLoading}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Aceptar solicitud
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border border-proforma-200 bg-proforma-50 dark:border-proforma-800 dark:bg-proforma-950/20 p-4 space-y-3">
            <p className="text-sm font-semibold text-proforma-900 dark:text-proforma-200">
              {confirmingAction === 'accept'
                ? '¿Confirmas que quieres vincularte a esta asesoría?'
                : '¿Confirmas que quieres rechazar esta solicitud?'}
            </p>
            <p className="text-xs text-proforma-700 dark:text-proforma-300">
              {confirmingAction === 'accept'
                ? 'La asesoría tendrá acceso de administración a tu cuenta. Podrás retirar el acceso cuando quieras.'
                : 'La asesoría recibirá una notificación del rechazo. Podrán reinvitarte después de un período de espera.'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelConfirm}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={isLoading}
                className={
                  confirmingAction === 'accept'
                    ? 'flex-1 bg-agency-600 hover:bg-agency-700 text-white'
                    : 'flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground'
                }
              >
                {isLoading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {confirmingAction === 'accept' ? 'Sí, vincularme' : 'Sí, rechazar'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== BANNER ====================

interface InvitationBannerProps {
  first: ReceivedInvitation;
  total: number;
  onOpen: () => void;
  onDismiss: () => void;
}

function InvitationBanner({ first, total, onOpen, onDismiss }: InvitationBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex items-center gap-3 rounded-xl border border-agency-200 bg-gradient-to-r from-agency-50 to-agency-100/50 px-4 py-3 dark:border-agency-800/50 dark:from-agency-950/30 dark:to-agency-950/20"
    >
      {/* Pulse dot */}
      <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-agency-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-agency-600" />
      </span>

      <Mail className="h-4 w-4 shrink-0 text-agency-600 dark:text-agency-400" aria-hidden="true" />

      <p className="flex-1 text-sm text-agency-900 dark:text-agency-200 min-w-0">
        <span className="font-semibold">{first.agencyName}</span> te ha enviado una invitación para
        gestionar tu facturación.
        {total > 1 && (
          <span className="ml-1 text-agency-600 dark:text-agency-400">(+{total - 1} más)</span>
        )}
      </p>

      <Button
        size="sm"
        className="shrink-0 bg-agency-600 hover:bg-agency-700 text-white h-7 px-3 text-xs"
        onClick={onOpen}
      >
        Ver invitación
        <ChevronRight className="ml-1 h-3 w-3" />
      </Button>

      <button
        onClick={onDismiss}
        aria-label="Cerrar notificación"
        className="shrink-0 rounded p-1 text-agency-400 hover:text-agency-700 hover:bg-agency-100 dark:hover:bg-agency-900 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// ==================== MAIN EXPORT ====================

/**
 * Shows a dismissible banner + modal when the authenticated user has pending invitations.
 * Banner dismissal survives soft-navigation (stored in sessionStorage).
 * Renders nothing if the user has no invitations.
 */
export function InvitationAlert() {
  const [selectedInvitation, setSelectedInvitation] = useState<ReceivedInvitation | null>(null);
  const [dismissedIds, dismissId] = useDismissedIds();
  const { data: invitations = [] } = useReceivedInvitations();

  const visible = invitations.filter((inv) => !dismissedIds.has(inv.id));
  const first = visible[0];

  if (!first) return null;

  return (
    <>
      <InvitationBanner
        first={first}
        total={visible.length}
        onOpen={() => setSelectedInvitation(first)}
        onDismiss={() => dismissId(first.id)}
      />
      {selectedInvitation && (
        <InvitationModal
          invitation={selectedInvitation}
          isOpen={true}
          onClose={() => setSelectedInvitation(null)}
        />
      )}
    </>
  );
}

/**
 * Compact card list for use in the main dashboard page.
 * Shows all pending invitations (not filtered by dismissal — always visible here).
 */
export function InvitationCards() {
  const [selectedInvitation, setSelectedInvitation] = useState<ReceivedInvitation | null>(null);
  const { data: invitations = [], isLoading } = useReceivedInvitations();

  if (isLoading || invitations.length === 0) return null;

  return (
    <>
      <div className="rounded-xl border border-agency-200 bg-agency-50/50 dark:border-agency-800/50 dark:bg-agency-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-agency-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-agency-600" />
          </div>
          <p className="text-sm font-semibold text-agency-900 dark:text-agency-200">
            {invitations.length === 1
              ? 'Tienes 1 solicitud de asesoría pendiente'
              : `Tienes ${invitations.length} solicitudes de asesoría pendientes`}
          </p>
        </div>

        <div className="space-y-2">
          {invitations.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-white dark:bg-card px-3 py-2.5"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Building2 className="h-4 w-4 shrink-0 text-agency-500" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{inv.agencyName}</p>
                  <p className="text-xs text-muted-foreground">{formatDaysLeft(inv.expiresAt)}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-7 text-xs border-agency-300 text-agency-700 hover:bg-agency-50"
                onClick={() => setSelectedInvitation(inv)}
              >
                Revisar
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {selectedInvitation && (
        <InvitationModal
          invitation={selectedInvitation}
          isOpen={true}
          onClose={() => setSelectedInvitation(null)}
        />
      )}
    </>
  );
}

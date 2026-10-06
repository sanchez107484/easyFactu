'use client';

import { useState } from 'react';
import {
  Building2,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
  useReceivedAgencyRequests,
  useAcceptAgencyRequest,
  useRejectAgencyRequest,
  useReceivedRequestsCount,
  useAllInvitations,
  useCancelInvitation,
  useResendActivation,
} from '@/hooks/use-agency';
import { useAgencyContext } from '@/hooks/use-agency-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AgencyInvitationStatus } from '@easyfactura/shared-types';
import type { AgencyInvitationFull } from '@easyfactura/shared-types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RequestWithMessage {
  id: string;
  clientBusinessName: string;
  clientNif: string;
  clientEmail: string;
  message: string | null;
  status: string;
  rejectionReason: string | null;
  expiresAt: string;
  createdAt: string;
}

// ─── Received request card ────────────────────────────────────────────────────

function daysUntil(isoDate: string): number {
  return Math.ceil((new Date(isoDate).getTime() - Date.now()) / 86400000);
}

function ReceivedRequestCard({
  request,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
}: {
  request: RequestWithMessage;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}) {
  const [showMessage, setShowMessage] = useState(false);
  const daysLeft = daysUntil(request.expiresAt);
  const isExpiringSoon = daysLeft <= 2;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold leading-tight truncate">{request.clientBusinessName}</p>
              <p className="text-sm text-muted-foreground font-mono">{request.clientNif}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="h-3.5 w-3.5" />
                {request.clientEmail}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 gap-1">
              <Clock className="h-3 w-3" />
              Pendiente
            </Badge>
            <span className={cn(
              'text-xs flex items-center gap-1',
              isExpiringSoon ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-muted-foreground',
            )}>
              {isExpiringSoon && <AlertTriangle className="h-3 w-3" />}
              {daysLeft <= 0
                ? 'Expira hoy'
                : daysLeft === 1
                  ? 'Expira mañana'
                  : `Expira en ${daysLeft} días`}
            </span>
          </div>
        </div>

        {request.message && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowMessage(!showMessage)}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              {showMessage ? 'Ocultar mensaje' : 'Ver mensaje del autónomo'}
            </button>
            {showMessage && (
              <div className="mt-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground border-l-2 border-blue-200">
                {request.message}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <Button
            size="sm"
            className="gap-1.5 bg-green-600 hover:bg-green-700"
            onClick={() => onAccept(request.id)}
            disabled={isAccepting || isRejecting}
          >
            {isAccepting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Aceptar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
            onClick={() => onReject(request.id)}
            disabled={isAccepting || isRejecting}
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Rechazar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReceivedRequestSkeleton() {
  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Sent invitation card ─────────────────────────────────────────────────────

const INVITATION_STATUS_CONFIG: Record<AgencyInvitationStatus, { label: string; icon: React.ElementType; className: string }> = {
  [AgencyInvitationStatus.PENDING]: {
    label: 'Pendiente',
    icon: Clock,
    className: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
  },
  [AgencyInvitationStatus.ACCEPTED]: {
    label: 'Aceptada',
    icon: CheckCircle,
    className: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400',
  },
  [AgencyInvitationStatus.REJECTED]: {
    label: 'Rechazada',
    icon: XCircle,
    className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400',
  },
  [AgencyInvitationStatus.CANCELLED]: {
    label: 'Cancelada',
    icon: XCircle,
    className: 'border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-400',
  },
  [AgencyInvitationStatus.EXPIRED]: {
    label: 'Expirada',
    icon: Clock,
    className: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-400',
  },
};

function SentInvitationCard({
  invitation,
  onCancel,
  onResendActivation,
  isCancelling,
  isResending,
}: {
  invitation: AgencyInvitationFull;
  onCancel: (id: string) => void;
  onResendActivation: (clientTenantId: string) => void;
  isCancelling: boolean;
  isResending: boolean;
}) {
  const cfg = INVITATION_STATUS_CONFIG[invitation.status] ?? INVITATION_STATUS_CONFIG[AgencyInvitationStatus.PENDING];
  const StatusIcon = cfg.icon;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              {invitation.entryType === 'ACTIVATION' ? (
                <UserCheck className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Mail className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              {invitation.inviteeName && (
                <p className="font-medium leading-tight truncate">{invitation.inviteeName}</p>
              )}
              <p className="text-sm text-muted-foreground truncate">{invitation.inviteeEmail}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {invitation.entryType === 'ACTIVATION' ? 'Cliente directo' : 'Invitación'} ·{' '}
                {new Date(invitation.createdAt).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <Badge variant="outline" className={cn('text-xs gap-1 shrink-0', cfg.className)}>
            <StatusIcon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        </div>

        {invitation.status === AgencyInvitationStatus.PENDING && (
          <div className="mt-4 flex gap-2">
            {invitation.entryType === 'ACTIVATION' && invitation.clientTenantId && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={() => onResendActivation(invitation.clientTenantId!)}
                disabled={isResending}
              >
                {isResending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Reenviar enlace
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => onCancel(invitation.id)}
              disabled={isCancelling}
            >
              Cancelar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgencyRequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOnAgencyTenant } = useAgencyContext();
  const mountedOnAgencyTenant = useRef(isOnAgencyTenant);

  const [activeTab, setActiveTab] = useState<'recibidas' | 'enviadas'>('recibidas');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const emailAccept = searchParams.get('emailAccept');
    if (emailAccept === 'success') {
      toast.success('Solicitud aceptada correctamente desde el correo');
      router.replace('/dashboard/asesoria/solicitudes');
    } else if (emailAccept === 'expired') {
      toast.error('La solicitud ha expirado y no se pudo aceptar');
      router.replace('/dashboard/asesoria/solicitudes');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (mountedOnAgencyTenant.current && !isOnAgencyTenant) {
      router.replace('/dashboard');
    }
  }, [isOnAgencyTenant, router]);

  const { data: requestsData, isLoading: loadingRequests } = useReceivedAgencyRequests(
    { limit: 50 },
    isOnAgencyTenant,
  );
  const { data: pendingCount = 0 } = useReceivedRequestsCount(isOnAgencyTenant);
  const { data: invitations = [], isLoading: loadingInvitations } = useAllInvitations(isOnAgencyTenant);

  const acceptMutation = useAcceptAgencyRequest();
  const rejectMutation = useRejectAgencyRequest();
  const cancelInvitationMutation = useCancelInvitation();
  const resendActivationMutation = useResendActivation();

  const pendingRequests = requestsData?.data.filter((r) => r.status === 'PENDING') ?? [];
  const processedRequests = requestsData?.data.filter((r) => r.status !== 'PENDING') ?? [];

  const pendingInvitations = invitations.filter((i) => i.status === AgencyInvitationStatus.PENDING);
  const historyInvitations = invitations.filter((i) => i.status !== AgencyInvitationStatus.PENDING);

  if (!isOnAgencyTenant) return null;

  const handleAccept = (id: string) => {
    setAcceptingId(id);
    acceptMutation.mutate(id, { onSettled: () => setAcceptingId(null) });
  };

  const handleReject = (id: string) => {
    setRejectDialogId(id);
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectDialogId) return;
    const id = rejectDialogId;
    setRejectingId(id);
    setRejectDialogId(null);
    rejectMutation.mutate(
      { requestId: id, reason: rejectReason.trim() || undefined },
      { onSettled: () => setRejectingId(null) },
    );
  };

  const handleCancelInvitation = (id: string) => {
    cancelInvitationMutation.mutate(id);
  };

  const handleResendActivation = (clientTenantId: string) => {
    resendActivationMutation.mutate({ clientTenantId, data: {} });
  };

  const tabs = [
    { id: 'recibidas' as const, label: 'Recibidas', count: pendingCount },
    { id: 'enviadas' as const, label: 'Enviadas', count: pendingInvitations.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Solicitudes de vinculación</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestiona las solicitudes de vinculación con autónomos y las invitaciones que has enviado.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'relative pb-3 px-4 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-foreground border-b-2 border-foreground -mb-px'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {tab.count > 99 ? '99+' : tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Recibidas ── */}
      {activeTab === 'recibidas' && (
        <>
          {pendingRequests.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/20 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {pendingRequests.length} solicitud{pendingRequests.length > 1 ? 'es' : ''} pendiente
                  {pendingRequests.length > 1 ? 's' : ''}
                </p>
                <p className="text-xs text-muted-foreground">
                  Una vez aceptada, podrás ver y gestionar las facturas de ese cliente.
                </p>
              </div>
            </div>
          )}

          {loadingRequests ? (
            <div className="space-y-4">
              <ReceivedRequestSkeleton />
              <ReceivedRequestSkeleton />
            </div>
          ) : pendingRequests.length === 0 && processedRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-muted">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No tienes solicitudes pendientes</p>
              <p className="text-xs text-muted-foreground">
                Las solicitudes de vinculación de autónomos aparecerán aquí.
              </p>
            </div>
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-muted-foreground text-sm">Pendientes</h2>
                  {pendingRequests.map((request) => (
                    <ReceivedRequestCard
                      key={request.id}
                      request={request as RequestWithMessage}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      isAccepting={acceptingId === request.id}
                      isRejecting={rejectingId === request.id}
                    />
                  ))}
                </div>
              )}

              {processedRequests.length > 0 && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-muted-foreground text-sm">Historial</h2>
                  {processedRequests.map((request) => {
                    const req = request as RequestWithMessage;
                    return (
                      <Card key={request.id} className="opacity-75 overflow-hidden">
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium leading-tight truncate">{request.clientBusinessName}</p>
                                <p className="text-sm text-muted-foreground font-mono">{request.clientNif}</p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                request.status === 'ACCEPTED'
                                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                                  : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
                              )}
                            >
                              {request.status === 'ACCEPTED' ? (
                                <><CheckCircle className="h-3 w-3 mr-1" />Aceptada</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" />Rechazada</>
                              )}
                            </Badge>
                          </div>
                          {request.status === 'REJECTED' && req.rejectionReason && (
                            <div className="mt-3 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground border-l-2 border-red-200 dark:border-red-800">
                              <span className="font-semibold text-foreground">Motivo: </span>
                              {req.rejectionReason}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Modal: Confirmar rechazo ── */}
      <AlertDialog open={!!rejectDialogId} onOpenChange={(open) => !open && setRejectDialogId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Rechazar esta solicitud?</AlertDialogTitle>
            <AlertDialogDescription>
              El autónomo recibirá un email informándole del rechazo. Podrás añadir un motivo opcional para ayudarle a entender la decisión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-1 pb-2">
            <Textarea
              placeholder="Motivo del rechazo (opcional, visible para el autónomo)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              rows={3}
              className="text-sm resize-none"
            />
            {rejectReason.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1 text-right">{rejectReason.length}/500</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rechazar solicitud
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Tab: Enviadas ── */}
      {activeTab === 'enviadas' && (
        <>
          {loadingInvitations ? (
            <div className="space-y-4">
              <ReceivedRequestSkeleton />
              <ReceivedRequestSkeleton />
            </div>
          ) : invitations.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-muted">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No has enviado ninguna invitación</p>
              <p className="text-xs text-muted-foreground">
                Las invitaciones a nuevos clientes aparecerán aquí.
              </p>
            </div>
          ) : (
            <>
              {pendingInvitations.length > 0 && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-muted-foreground text-sm">Pendientes de aceptación</h2>
                  {pendingInvitations.map((inv) => (
                    <SentInvitationCard
                      key={inv.id}
                      invitation={inv}
                      onCancel={handleCancelInvitation}
                      onResendActivation={handleResendActivation}
                      isCancelling={cancelInvitationMutation.isPending}
                      isResending={resendActivationMutation.isPending}
                    />
                  ))}
                </div>
              )}

              {historyInvitations.length > 0 && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-muted-foreground text-sm">Historial</h2>
                  {historyInvitations.map((inv) => (
                    <SentInvitationCard
                      key={inv.id}
                      invitation={inv}
                      onCancel={handleCancelInvitation}
                      onResendActivation={handleResendActivation}
                      isCancelling={cancelInvitationMutation.isPending}
                      isResending={resendActivationMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

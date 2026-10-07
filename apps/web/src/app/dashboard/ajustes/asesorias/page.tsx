'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Mail,
  MapPin,
  Phone,
  ShieldOff,
  Trash2,
  Search,
  Send,
  X,
  CheckCircle,
  Loader2,
  Clock,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  useMyAgencies,
  useRevokeMyAgency,
  useSearchAgencyPublic,
  useSendAgencyRequest,
  useSendAgencyReferral,
  useMyReferrals,
  useMyAgencyRequests,
  useCancelAgencyRequest,
} from '@/hooks/use-agency';
import type { MyAgencyRelation } from '@easyfactura/shared-types';
import { useAuthStore } from '@/store/auth-store';
import { AccountType } from '@easyfactura/shared-types';
import { cn } from '@/lib/utils';

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

function RequestCard({
  request,
  onCancel,
  onResend,
  isCancelling,
  isResending,
}: {
  request: {
    id: string;
    agencyName: string;
    agencyNif: string;
    status: string;
    expiresAt: string;
    createdAt: string;
    rejectionReason?: string | null;
  };
  onCancel: (id: string) => void;
  onResend?: (agencyNif: string) => void;
  isCancelling: boolean;
  isResending?: boolean;
}) {
  const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    PENDING: { label: 'Pendiente', icon: Clock, className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' },
    ACCEPTED: { label: 'Aceptada', icon: CheckCircle, className: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' },
    REJECTED: { label: 'Rechazada', icon: XCircle, className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' },
    CANCELLED: { label: 'Cancelada', icon: XCircle, className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800' },
    EXPIRED: { label: 'Expirada', icon: Clock, className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800' },
    REVOKED: { label: 'Acceso revocado', icon: ShieldOff, className: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800' },
  };

  const config = statusConfig[request.status] ?? statusConfig.PENDING;
  const Icon = config.icon;

  const daysLeft = request.status === 'PENDING'
    ? Math.ceil((new Date(request.expiresAt).getTime() - Date.now()) / 86400000)
    : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 2;

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-agency-100 dark:bg-agency-950/30">
            <Building2 className="h-4 w-4 text-agency-600 dark:text-agency-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{request.agencyName}</p>
            <p className="text-xs text-muted-foreground font-mono">{request.agencyNif}</p>
            {daysLeft !== null && (
              <p className={cn(
                'text-xs mt-0.5',
                isExpiringSoon ? 'text-orange-600 dark:text-orange-400 font-medium' : 'text-muted-foreground',
              )}>
                {daysLeft <= 0 ? 'Expira hoy' : daysLeft === 1 ? 'Expira mañana' : `Expira en ${daysLeft} días`}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn('text-xs gap-1', config.className)}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
          {request.status === 'PENDING' && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
              onClick={() => onCancel(request.id)}
              disabled={isCancelling}
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {request.status === 'REJECTED' && (
        <div className="border-t border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 px-4 py-3 space-y-2">
          <p className="text-xs text-red-700 dark:text-red-400">
            <span className="font-semibold">{request.agencyName}</span> ha rechazado tu solicitud de vinculación.
            Puedes ponerte en contacto directamente con ellos o enviarles una nueva solicitud.
          </p>
          {request.rejectionReason && (
            <div className="rounded-md bg-red-100/60 dark:bg-red-900/20 px-3 py-2 text-xs text-red-800 dark:text-red-300">
              <span className="font-semibold">Motivo indicado: </span>{request.rejectionReason}
            </div>
          )}
          {onResend && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
              onClick={() => onResend(request.agencyNif)}
              disabled={isResending}
            >
              {isResending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Enviar nueva solicitud
            </Button>
          )}
        </div>
      )}

      {request.status === 'EXPIRED' && (
        <div className="border-t border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-950/10 px-4 py-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Tu solicitud ha caducado. Te recomendamos <span className="font-medium">contactar directamente con el asesor</span> para agilizar el proceso antes de volver a enviar una nueva solicitud.
          </p>
          {onResend && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => onResend(request.agencyNif)}
              disabled={isResending}
            >
              {isResending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Volver a enviar solicitud
            </Button>
          )}
        </div>
      )}

      {request.status === 'CANCELLED' && onResend && (
        <div className="border-t border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-950/10 px-4 py-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Cancelaste esta solicitud. Puedes enviar una nueva cuando quieras.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={() => onResend(request.agencyNif)}
            disabled={isResending}
          >
            {isResending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Enviar nueva solicitud
          </Button>
        </div>
      )}

      {request.status === 'REVOKED' && onResend && (
        <div className="border-t border-gray-200 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-950/10 px-4 py-3 space-y-2">
          <p className="text-xs text-muted-foreground">
            Revocaste el acceso de esta asesoría. Puedes volver a solicitarlo cuando quieras.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5"
            onClick={() => onResend(request.agencyNif)}
            disabled={isResending}
          >
            {isResending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Volver a solicitar vinculación
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MisAsesoriasPage() {
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  const { data: agencies = [], isLoading: loadingAgencies } = useMyAgencies();
  const { data: myRequests, isLoading: loadingRequests } = useMyAgencyRequests({});
  const { data: myReferrals = [] } = useMyReferrals(!isAgency);
  const revokeMutation = useRevokeMyAgency();
  const cancelRequestMutation = useCancelAgencyRequest();
  const [confirmAgency, setConfirmAgency] = useState<MyAgencyRelation | null>(null);

  const [searchValue, setSearchValue] = useState('');
  const [message, setMessage] = useState('');
  const [referralEmail, setReferralEmail] = useState('');
  const [referralMessage, setReferralMessage] = useState('');
  const { data: searchResult, isFetching: isChecking } = useSearchAgencyPublic(searchValue);
  const sendRequest = useSendAgencyRequest();
  const sendReferral = useSendAgencyReferral();

  const agencyFound = searchResult?.status === 'FOUND';
  const agencyNotFound = searchResult?.status === 'NOT_FOUND';
  const agencyData = agencyFound
    ? { businessName: searchResult.businessName!, nif: searchResult.nif! }
    : null;

  const searchIsEmail = searchValue.trim().includes('@');
  useEffect(() => {
    if (agencyNotFound && searchIsEmail) {
      setReferralEmail(searchValue.trim());
    }
  }, [agencyNotFound, searchIsEmail, searchValue]);

  const canSend = agencyData && !sendRequest.isPending;
  const pendingRequests = myRequests?.data.filter((r) => r.status === 'PENDING') ?? [];

  function handleRevoke(agency: MyAgencyRelation) {
    setConfirmAgency(agency);
  }

  async function handleConfirmRevoke() {
    if (!confirmAgency) return;
    await revokeMutation.mutateAsync(confirmAgency.agencyTenantId);
    setConfirmAgency(null);
  }

  const handleSendRequest = async () => {
    if (!canSend || !agencyData) return;
    try {
      await sendRequest.mutateAsync({
        agencyNif: agencyData.nif,
        message: message.trim() || undefined,
      });
      setSearchValue('');
      setMessage('');
    } catch {
      // Error handled by mutation
    }
  };

  const handleSendReferral = async () => {
    if (!referralEmail.trim()) return;
    try {
      await sendReferral.mutateAsync({
        agencyEmail: referralEmail.trim(),
        message: referralMessage.trim() || undefined,
      });
      setReferralEmail('');
      setReferralMessage('');
      setSearchValue('');
    } catch {
      // Error handled by mutation
    }
  };

  const handleCancelRequest = (id: string) => {
    cancelRequestMutation.mutate(id);
  };

  const handleResendRequest = (agencyNif: string) => {
    sendRequest.mutate({ agencyNif });
  };

  if (isAgency) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Mis asesorías</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Esta sección es solo para autónomos y empresas. Las asesorías acceden a sus clientes desde el
            panel de asesoría.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Mis asesorías</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Asesorías que actualmente tienen acceso a tu cuenta y pueden gestionar tu facturación en
          tu nombre. Puedes revocar el acceso en cualquier momento.
        </p>
      </div>

      {/* Solicitar vinculación */}
      {!loadingAgencies && agencies.length === 0 && (
        <div className="rounded-xl border border-agency-200 bg-agency-50/50 dark:border-agency-800/50 dark:bg-agency-950/20 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-agency-600" />
            <h3 className="font-semibold">Solicitar vinculación con una asesoría</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Busca tu asesoría por NIF o email y envíales una solicitud de vinculación.
            Si no están registrados, podrás enviarles una invitación.
          </p>

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="NIF o email de tu asesoría"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-9 bg-white dark:bg-card"
                />
                {isChecking && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {agencyData && (
              <div className="rounded-lg border bg-white dark:bg-card p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">{agencyData.businessName}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{agencyData.nif}</span>
                </div>

                <div>
                  <Input
                    placeholder="Mensaje opcional para tu asesor..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-muted/50"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="gap-1.5 flex-1 bg-agency-600 hover:bg-agency-700"
                    onClick={handleSendRequest}
                    disabled={!canSend}
                  >
                    {sendRequest.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar solicitud
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSearchValue('');
                      setMessage('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {agencyNotFound && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800/50 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      Asesoría no registrada
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      No encontramos ninguna asesoría con ese NIF. Puedes enviarle un email
                      para que se registre y así podréis vincularos.
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="Email de tu asesoría"
                    value={referralEmail}
                    onChange={(e) => setReferralEmail(e.target.value)}
                    className="bg-white dark:bg-card"
                  />
                  <Input
                    placeholder="Mensaje opcional..."
                    value={referralMessage}
                    onChange={(e) => setReferralMessage(e.target.value)}
                    className="bg-white dark:bg-card"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1.5 flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={handleSendReferral}
                      disabled={!referralEmail.trim() || sendReferral.isPending}
                    >
                      {sendReferral.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                      Enviar invitación
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearchValue('');
                        setReferralEmail('');
                        setReferralMessage('');
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mis solicitudes pendientes */}
      {!loadingRequests && pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Mis solicitudes pendientes
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onCancel={handleCancelRequest}
                isCancelling={cancelRequestMutation.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* Invitaciones enviadas a asesorías no registradas */}

      {myReferrals.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Invitaciones enviadas
          </h3>
          <div className="space-y-2">
            {myReferrals.map((referral) => (
              <div
                key={referral.id}
                className="rounded-lg border bg-card p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/30">
                    <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{referral.agencyEmail}</p>
                    <p className="text-xs text-muted-foreground">
                      Enviada el{' '}
                      {new Date(referral.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                  Pendiente de registro
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de solicitudes aceptadas/rechazadas/expiradas */}
      {!loadingRequests && myRequests && myRequests.data.filter((r) => r.status !== 'PENDING').length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-muted-foreground">Historial de solicitudes</h3>
          <div className="space-y-2">
            {myRequests.data
              .filter((r) => r.status !== 'PENDING')
              .map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onCancel={handleCancelRequest}
                  onResend={
                    request.status === 'REJECTED' ||
                    request.status === 'EXPIRED' ||
                    request.status === 'CANCELLED' ||
                    request.status === 'REVOKED'
                      ? handleResendRequest
                      : undefined
                  }
                  isCancelling={cancelRequestMutation.isPending}
                  isResending={sendRequest.isPending}
                />
              ))}
          </div>
        </div>
      )}

      {/* Asesorías vinculadas */}
      <div className="space-y-3">
        <h3 className="font-semibold">Asesorías vinculadas</h3>
        {loadingAgencies ? (
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
      </div>

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

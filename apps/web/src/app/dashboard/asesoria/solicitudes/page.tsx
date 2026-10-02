'use client';

import { useState } from 'react';
import { Building2, Mail, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
} from '@/hooks/use-agency';
import { useAgencyContext } from '@/hooks/use-agency-context';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface RequestWithMessage {
  id: string;
  clientBusinessName: string;
  clientNif: string;
  clientEmail: string;
  message: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
}

function RequestCard({
  request,
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
  isLoading,
}: {
  request: RequestWithMessage;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
  isLoading: boolean;
}) {
  const [showMessage, setShowMessage] = useState(false);

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
            <span className="text-xs text-muted-foreground">
              {new Date(request.createdAt).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
              })}
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

function RequestCardSkeleton() {
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

export default function AgencyRequestsPage() {
  const router = useRouter();
  const { isOnAgencyTenant } = useAgencyContext();
  const mountedOnAgencyTenant = useRef(isOnAgencyTenant);

  const { data: requestsData, isLoading } = useReceivedAgencyRequests(
    { limit: 50 },
    isOnAgencyTenant,
  );
  const { data: countData } = useReceivedRequestsCount(isOnAgencyTenant);
  const acceptMutation = useAcceptAgencyRequest();
  const rejectMutation = useRejectAgencyRequest();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const pendingRequests = requestsData?.data.filter((r) => r.status === 'PENDING') ?? [];
  const processedRequests = requestsData?.data.filter((r) => r.status !== 'PENDING') ?? [];

  useEffect(() => {
    if (mountedOnAgencyTenant.current && !isOnAgencyTenant) {
      router.replace('/dashboard');
    }
  }, [isOnAgencyTenant, router]);

  if (!isOnAgencyTenant) return null;

  const handleAccept = (id: string) => {
    setAcceptingId(id);
    acceptMutation.mutate(id, {
      onSettled: () => setAcceptingId(null),
    });
  };

  const handleReject = (id: string) => {
    setRejectingId(id);
    rejectMutation.mutate(id, {
      onSettled: () => setRejectingId(null),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Solicitudes de vinculación</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Autónomos que han solicitado vincularse a tu asesoría. Acepta o rechaza sus solicitudes.
        </p>
      </div>

      {/* Badge con contador */}
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
              Los autónomos podrán ver tus facturas una vez aceptada la solicitud.
            </p>
          </div>
        </div>
      )}

      {/* Solicitudes pendientes */}
      {isLoading ? (
        <div className="space-y-4">
          <RequestCardSkeleton />
          <RequestCardSkeleton />
        </div>
      ) : pendingRequests.length === 0 && processedRequests.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
          <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-muted">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            No tienes solicitudes pendientes
          </p>
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
                <RequestCard
                  key={request.id}
                  request={request as RequestWithMessage}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  isAccepting={acceptingId === request.id}
                  isRejecting={rejectingId === request.id}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}

          {processedRequests.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-muted-foreground text-sm">Historial</h2>
              {processedRequests.map((request) => (
                <Card key={request.id} className="opacity-75">
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
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aceptada
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Rechazada
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

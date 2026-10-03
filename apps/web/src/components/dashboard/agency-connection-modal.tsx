'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { agencyApi } from '@/lib/api/agency-api';
import { brandConfig } from '@easyfactura/brand-config';
import { Building2, CheckCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PendingRequest {
  id: string;
  agencyName: string;
  agencyNif: string;
  status: string;
  createdAt: string;
}

interface AgencyConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: 'banner' | 'header';
  agencyCount?: number;
}

export function AgencyConnectionModal({
  open,
  onOpenChange,
  variant = 'banner',
  agencyCount,
}: AgencyConnectionModalProps) {
  const router = useRouter();

  const [searchValue, setSearchValue] = useState('');
  const [message, setMessage] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    status: 'NOT_FOUND' | 'FOUND';
    businessName?: string;
    nif?: string;
    email?: string;
  } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load pending requests on mount
  useEffect(() => {
    if (!open) return;

    setIsLoadingPending(true);
    agencyApi
      .getMyRequests({ status: 'PENDING', limit: 1 })
      .then((res) => {
        if (res.data.length > 0) {
          setPendingRequest({
            id: res.data[0].id,
            agencyName: res.data[0].agencyName,
            agencyNif: res.data[0].agencyNif,
            status: res.data[0].status,
            createdAt: res.data[0].createdAt,
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingPending(false));
  }, [open]);

  // Debounced search
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    setSearchResult(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) return;

    debounceRef.current = setTimeout(async () => {
      setIsChecking(true);
      try {
        const result = await agencyApi.searchAgencyPublic(value.trim());
        setSearchResult(result);
      } catch {
        setSearchResult({ status: 'NOT_FOUND' });
      } finally {
        setIsChecking(false);
      }
    }, 300);
  }, []);

  const handleSendRequest = async () => {
    if (!searchResult || searchResult.status !== 'FOUND' || !searchResult.nif) return;

    setIsSending(true);
    try {
      await agencyApi.sendAgencyRequest({
        agencyNif: searchResult.nif,
        message: message.trim() || undefined,
      });
      setSendSuccess(true);
      setSearchResult(null);
      setSearchValue('');
      setMessage('');
      // Refresh pending request
      const res = await agencyApi.getMyRequests({ status: 'PENDING', limit: 1 });
      if (res.data.length > 0) {
        setPendingRequest({
          id: res.data[0].id,
          agencyName: res.data[0].agencyName,
          agencyNif: res.data[0].agencyNif,
          status: res.data[0].status,
          createdAt: res.data[0].createdAt,
        });
      }
      setTimeout(() => setSendSuccess(false), 2000);
    } catch {
      // Error handled
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!pendingRequest) return;

    setIsCancelling(true);
    try {
      await agencyApi.cancelAgencyRequest(pendingRequest.id);
      setPendingRequest(null);
    } catch {
      // Error handled
    } finally {
      setIsCancelling(false);
    }
  };

  const handleClear = () => {
    setSearchValue('');
    setMessage('');
    setSearchResult(null);
  };

  const handleClose = () => {
    setSearchValue('');
    setMessage('');
    setSearchResult(null);
    setSendSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            {variant === 'header'
              ? 'Conecta con tu asesoría'
              : '¿Qué es la conexión con asesorías?'}
          </DialogTitle>
          <DialogDescription>
            {brandConfig.app.name} permite que tu asesor contable acceda a tus facturas de forma
            segura, sin necesidad de enviar archivos ni correos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">¿Cómo funciona?</h4>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Busca a tu asesor por email o NIF</li>
              <li>Envía una solicitud de conexión</li>
              <li>Tu asesor acepta desde su panel</li>
              <li>Listo, verá tus facturas automáticamente</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Ventajas</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                Tu asesor recibe tus facturas al instante
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                Exportación directa a su software contable
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                Control fiscal automático para ambos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
                Tú decides qué información compartir
              </li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground/70 italic">
            Más de 500 asesorías ya conectadas con sus clientes en {brandConfig.app.name}
          </p>

          {sendSuccess ? (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 p-4 text-sm text-green-800 dark:text-green-300">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle className="h-4 w-4" />
                Solicitud enviada
              </div>
              <p className="mt-1 text-xs">
                Tu asesor recibirá tu solicitud y podrá aceptarla desde su panel.
              </p>
            </div>
          ) : pendingRequest ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-amber-900 dark:text-amber-200">
                    Solicitud pendiente
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Enviaste solicitud a <strong>{pendingRequest.agencyName}</strong>
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Esperando confirmación del asesor
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-amber-300 hover:bg-amber-100 dark:border-amber-700"
                  onClick={handleCancelRequest}
                  disabled={isCancelling}
                >
                  {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancelar'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-medium">Conectar ahora</h4>
              <div className="relative">
                <Input
                  placeholder="Email o NIF de tu asesoría"
                  value={searchValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="bg-background pr-9"
                />
                {isChecking && (
                  <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>

              {searchResult?.status === 'NOT_FOUND' && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No hemos encontrado ninguna asesoría registrada con esos datos.
                </p>
              )}

              {searchResult?.status === 'FOUND' && searchResult.businessName && (
                <div className="rounded-lg border bg-muted/50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">{searchResult.businessName}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {searchResult.nif}
                    </span>
                  </div>
                  <Input
                    placeholder="Mensaje opcional..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-background h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1.5 flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={handleSendRequest}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Enviar solicitud'
                      )}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleClear}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="link"
            size="sm"
            className="text-muted-foreground"
            onClick={() => router.push('/dashboard/ajustes/asesorias')}
          >
            Ver todas mis asesorías
          </Button>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

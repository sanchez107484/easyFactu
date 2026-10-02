'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useMyAgencies } from '@/hooks/use-agency';
import { useCheckIdentifier } from '@/hooks/use-agency';
import { useSendAgencyRequest } from '@/hooks/use-agency';
import { Building2, Search, Send, X, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { IdentifierCheckResult } from '@/lib/api/agency-api';
import { AccountType } from '@easyfactura/shared-types';

interface AgencyFinderWidgetProps {
  className?: string;
}

export function AgencyFinderWidget({ className }: AgencyFinderWidgetProps) {
  const router = useRouter();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  const [searchValue, setSearchValue] = useState('');
  const [message, setMessage] = useState('');

  const { data: myAgencies = [], isLoading: loadingMyAgencies } = useMyAgencies();
  const hasAgenciesLinked = myAgencies.length > 0;

  const { data: checkResult, isFetching: isChecking } = useCheckIdentifier(searchValue);
  const sendRequest = useSendAgencyRequest();

  const showWidget = !isAgency && !hasAgenciesLinked && !loadingMyAgencies;

  const agencyData =
    checkResult?.status === 'EXISTS_CAN_INVITE'
      ? { businessName: checkResult.businessName, nif: checkResult.nif }
      : checkResult?.status === 'ALREADY_IN_PORTFOLIO'
        ? { businessName: checkResult.businessName, nif: checkResult.nif }
        : null;

  const canSend = agencyData && !sendRequest.isPending;

  const handleSendRequest = async () => {
    if (!canSend) return;
    try {
      await sendRequest.mutateAsync({
        agencyNif: searchValue.toUpperCase().trim(),
        message: message.trim() || undefined,
      });
      setSearchValue('');
      setMessage('');
    } catch {
      // Error handled by mutation
    }
  };

  if (!showWidget) return null;

  return (
    <Card className={cn('border-blue-200 bg-blue-50/50 dark:border-blue-800/50 dark:bg-blue-950/20', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-base">¿Tu asesor ya usa EasyFactura?</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Conecta tu cuenta con tu gestoría y tendrán acceso automático a todas tus facturas.
          Sin papeleos.
        </p>

        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="NIF de tu asesoría (ej: B12345678)"
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
                  className="gap-1.5 flex-1 bg-blue-600 hover:bg-blue-700"
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

          {checkResult?.status === 'ALREADY_IN_PORTFOLIO' && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Esta asesoría ya está vinculada a tu cuenta.
            </p>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Beneficios:</p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Tu asesor ve tus facturas al instante
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Exportación directa a su software contable
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Control fiscal automático
            </li>
          </ul>
        </div>

        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-blue-600 hover:text-blue-700"
          onClick={() => router.push('/dashboard/ajustes/asesorias')}
        >
          Gestionar mis asesorías
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

'use client';

import { useCallback } from 'react';
import { QrCode } from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_INVOICE_LAYOUT, InvoiceLayout } from '@easyfactura/shared-types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { invoiceTemplateApi } from '@/lib/api/invoice-template-api';
import { useQueryClient } from '@tanstack/react-query';
import { templateKeys } from '@/hooks/use-invoice-templates';
import { getApiErrorMessage } from '@/lib/api-error';

export function QrToggleCard() {
  const queryClient = useQueryClient();
  const { data: template, isLoading } = useDefaultTemplate();

  const currentLayout = (template?.layout as InvoiceLayout) ?? DEFAULT_INVOICE_LAYOUT;
  const isQrEnabled = currentLayout.footer?.showVerifactuQr ?? true;

  const handleToggle = useCallback(
    async (checked: boolean) => {
      if (!template) return;

      const nextLayout: InvoiceLayout = {
        ...currentLayout,
        footer: { ...currentLayout.footer, showVerifactuQr: checked },
      };

      // Optimistic update
      queryClient.setQueryData(templateKeys.default(), {
        ...template,
        layout: nextLayout,
      });

      try {
        await invoiceTemplateApi.update(template.id, { layout: nextLayout });
        queryClient.invalidateQueries({ queryKey: templateKeys.default() });
      } catch (error: unknown) {
        // Revert optimistic update on failure
        queryClient.setQueryData(templateKeys.default(), template);
        toast.error(getApiErrorMessage(error));
      }
    },
    [template, currentLayout, queryClient],
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Configuración rápida</CardTitle>
        <CardDescription>Opciones que se aplican a todas las facturas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <QrCode className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Código QR de verificación</p>
              <p className="text-xs text-muted-foreground">
                Se incluye en el PDF de todas las facturas confirmadas
              </p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-9 rounded-full" />
          ) : (
            <Switch
              checked={isQrEnabled}
              onCheckedChange={handleToggle}
              disabled={!template}
              aria-label="Mostrar código QR de verificación en las facturas"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

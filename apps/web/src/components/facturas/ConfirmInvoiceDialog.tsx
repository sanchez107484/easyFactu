'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Frequency } from '@easyfactura/shared-types';
import { FREQUENCY_OPTIONS } from '@easyfactura/shared-constants';

// ==================== TYPES ====================

export interface ConfirmInvoiceSummary {
  customerName: string;
  total: number;
}

export interface RecurringConfig {
  isRecurring: boolean;
  onToggle: (v: boolean) => void;
  frequency: Frequency;
  onFrequencyChange: (v: Frequency) => void;
  dayOfMonth: number;
  onDayOfMonthChange: (v: number) => void;
  startDate: string;
  onStartDateChange: (v: string) => void;
  hasEndDate: boolean;
  onHasEndDateChange: (v: boolean) => void;
  endDate: string;
  onEndDateChange: (v: string) => void;
  autoConfirm: boolean;
  onAutoConfirmChange: (v: boolean) => void;
}

interface ConfirmInvoiceDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
  summary: ConfirmInvoiceSummary;
  invoiceType?: string;
  recurringConfig?: RecurringConfig;
}

export function ConfirmInvoiceDialog({
  open,
  onCancel,
  onConfirm,
  isPending,
  summary,
  invoiceType,
  recurringConfig,
}: ConfirmInvoiceDialogProps) {
  const isProforma = invoiceType === 'proforma';
  const formattedTotal = summary.total.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
  });

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="sm:max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isProforma ? 'Guardar como proforma' : '¿Confirmar la factura?'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              {isProforma ? (
                <p>
                  La factura se guardará como <strong>proforma</strong>. No tendrá número fiscal ni
                  validez legal hasta que la conviertas a factura oficial.
                </p>
              ) : (
                <p>
                  Una vez confirmada, la factura se enviará a la <strong>AEAT vía VeriFactu</strong>{' '}
                  y no podrá editarse.
                </p>
              )}

              {!isProforma && (
                <div className="flex gap-3 p-3 rounded-lg bg-proforma-50 border border-proforma-200 dark:bg-proforma-950/30 dark:border-proforma-800">
                  <AlertTriangle className="h-4 w-4 text-proforma-600 shrink-0 mt-0.5" />
                  <ul className="text-sm text-proforma-800 dark:text-proforma-400 space-y-1">
                    <li>Se generará un registro de alta en VeriFactu con hash encadenado.</li>
                    <li>
                      Se asignará el siguiente número de serie disponible de forma definitiva.
                    </li>
                    <li>
                      No se puede anular directamente: deberás emitir una factura rectificativa.
                    </li>
                  </ul>
                </div>
              )}

              {/* Summary */}
              <div className="p-3 rounded-lg bg-muted text-sm space-y-1.5">
                {!isProforma && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Número:</span>
                    <span className="font-medium">Se asignará al confirmar</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente:</span>
                  <span className="font-medium">{summary.customerName}</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 mt-1.5">
                  <span className="text-muted-foreground">Total:</span>
                  <span className="font-bold text-base">{formattedTotal}</span>
                </div>
              </div>

              {/* ── Recurring section (only for non-proforma) ── */}
              {recurringConfig && (
                <div className="rounded-lg border border-dashed px-4 py-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw
                        className={`h-4 w-4 shrink-0 ${recurringConfig.isRecurring ? 'text-primary' : 'text-muted-foreground'}`}
                      />
                      <div>
                        <p className="text-sm font-medium leading-tight">
                          ¿Se repite esta factura?
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Crea un patrón recurrente automático
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={recurringConfig.isRecurring}
                      onCheckedChange={recurringConfig.onToggle}
                    />
                  </div>

                  {recurringConfig.isRecurring && (
                    <div className="space-y-3 pt-1">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Frecuencia</Label>
                          <Select
                            value={recurringConfig.frequency}
                            onValueChange={(v) => recurringConfig.onFrequencyChange(v as Frequency)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FREQUENCY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Día del mes</Label>
                          <Input
                            type="number"
                            min={1}
                            max={28}
                            className="h-8 text-xs"
                            value={recurringConfig.dayOfMonth}
                            onChange={(e) =>
                              recurringConfig.onDayOfMonthChange(Number(e.target.value))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="text-xs">Fecha de inicio</Label>
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={recurringConfig.startDate}
                          onChange={(e) => recurringConfig.onStartDateChange(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id="dialog-recurring-hasEndDate"
                          checked={recurringConfig.hasEndDate}
                          onCheckedChange={recurringConfig.onHasEndDateChange}
                        />
                        <Label
                          htmlFor="dialog-recurring-hasEndDate"
                          className="text-xs cursor-pointer font-normal"
                        >
                          Tiene fecha de fin
                        </Label>
                      </div>
                      {recurringConfig.hasEndDate && (
                        <div className="grid gap-1.5">
                          <Label className="text-xs">Fecha de fin</Label>
                          <Input
                            type="date"
                            className="h-8 text-xs"
                            value={recurringConfig.endDate}
                            onChange={(e) => recurringConfig.onEndDateChange(e.target.value)}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Switch
                          id="dialog-recurring-autoConfirm"
                          checked={recurringConfig.autoConfirm}
                          onCheckedChange={recurringConfig.onAutoConfirmChange}
                        />
                        <div>
                          <Label
                            htmlFor="dialog-recurring-autoConfirm"
                            className="text-xs cursor-pointer"
                          >
                            Confirmar automáticamente
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Si está desactivado, se crea como borrador.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isPending}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending
              ? isProforma
                ? 'Guardando...'
                : 'Confirmando...'
              : isProforma
                ? 'Guardar como proforma'
                : 'Sí, confirmar factura'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

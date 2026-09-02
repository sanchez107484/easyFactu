'use client';
import { useState } from 'react';
import { RectificationType } from '@easyfactura/shared-types';
import { useRectifyInvoice } from '@/hooks/use-invoices';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
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

export function RectifyInvoiceDialog({
  open,
  onOpenChange,
  invoice,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  invoice: { id: string; number: string | null; customerName: string; lines: any[] };
  defaultType: RectificationType;
}) {
  const router = useRouter();
  const rectifyMutation = useRectifyInvoice();
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [taxRate, setTaxRate] = useState(21);
  const isAbono = defaultType === RectificationType.DIFFERENCES;

  const handleConfirm = async () => {
    try {
      const lines = isAbono
        ? [
            {
              description: 'Ajuste rectificativo - Abonos',
              quantity: 1,
              unitPrice: parseFloat(amount),
              taxRate,
            },
          ]
        : invoice.lines.map((l: any) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            taxRate: l.taxRate,
          }));

      const rect = await rectifyMutation.mutateAsync({
        id: invoice.id,
        data: { rectificationReason: reason, rectificationType: defaultType, lines },
      });
      onOpenChange(false);
      router.push(`/dashboard/facturas/nueva?edit=${rect.id}`);
    } catch (e: any) {
      const existingId = e?.response?.data?.existingDraftId;
      if (existingId) {
        onOpenChange(false);
        toast.error('Ya existe un borrador de rectificativa', {
          action: {
            label: 'Ver borrador →',
            onClick: () => router.push(`/dashboard/facturas/nueva?edit=${existingId}`),
          },
          duration: 8000,
        });
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isAbono ? 'Crear Abono / Devolución' : 'Crear Rectificativa por Sustitución'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Vas a rectificar la factura{' '}
            <b>
              {invoice.number} de {invoice.customerName}
            </b>
            .{' '}
            {isAbono
              ? 'Se generará un abono por la diferencia que indiques a continuación.'
              : 'Se generará una factura que <b>anula y reemplaza</b> por completo a la original.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          {!isAbono && (
            <div>
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Así funciona:</span> Se copiarán las líneas de la
                  factura original. Podrás modificarlas para reflejar los importes finales
                  corregidos.
                </p>
              </div>
              <div className="rounded-md bg-blue-50 mt-2 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  <span className="font-medium">Consejo:</span> Usa esta opción si los importes
                  correctos son totalmente distintos a los de la factura original y necesitas
                  reescribirla por completo.
                </p>
              </div>
            </div>
          )}
          {isAbono && (
            <div className="grid grid-cols-3 gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="col-span-3">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <span className="font-medium">Así funciona:</span> Indica el importe del ajuste
                  (positivo o negativo). Se creará una línea con este importe que podrás editar
                  después.
                </p>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium">Importe del ajuste (€)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="-150.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Negativo = devolución</p>
              </div>
              <div className="col-span-1">
                <label className="text-xs font-medium">IVA %</label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={0}>0%</option>
                  <option value={4}>4%</option>
                  <option value={10}>10%</option>
                  <option value={21}>21%</option>
                </select>
              </div>
              <div className="col-span-3">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  <span className="font-medium">Consejo:</span> Usa esta opción si solo necesitas
                  devolver parte del importe o aplicar un descuento parcial sobre la factura
                  original.
                </p>
              </div>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Motivo *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              placeholder={
                isAbono
                  ? 'Ej: Devolución parcial de material defectuoso...'
                  : 'Ej: Error en base imponible...'
              }
              className="w-full mt-1 min-h-[90px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{reason.length}/500</p>
          </div>
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <span className="font-medium">Nota:</span> Se creará un borrador de factura
              rectificativa. La factura original permanecerá intacta hasta que confirmes la
              rectificativa. Si eliminas el borrador, la original no se verá afectada.
            </p>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setReason('');
              setAmount('');
            }}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={
              reason.trim().length < 5 ||
              rectifyMutation.isPending ||
              (isAbono && (!amount || parseFloat(amount) === 0))
            }
            onClick={handleConfirm}
          >
            {rectifyMutation.isPending ? 'Creando...' : 'Crear borrador'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

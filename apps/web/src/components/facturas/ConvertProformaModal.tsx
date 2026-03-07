'use client';

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
import { ArrowRightLeft, CheckCircle2, Info } from 'lucide-react';

interface ConvertProformaModalProps {
  open: boolean;
  invoiceCustomerName: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConvertProformaModal({
  open,
  invoiceCustomerName,
  isPending,
  onCancel,
  onConfirm,
}: ConvertProformaModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <AlertDialogTitle>Convertir a factura oficial</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Estás a punto de convertir la proforma de{' '}
                <span className="font-semibold text-foreground">{invoiceCustomerName}</span> en una{' '}
                <span className="font-semibold text-foreground">factura ordinaria</span>.
              </p>
              <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                  ¿Qué ocurre al convertir?
                </p>
                <ul className="space-y-1.5 pl-5 list-none">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-secondary-500 shrink-0 mt-0.5" />
                    <span>El documento pasa a ser una factura ordinaria en estado borrador.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-secondary-500 shrink-0 mt-0.5" />
                    <span>Podrás editarla y confirmarla para asignarle número fiscal.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-secondary-500 shrink-0 mt-0.5" />
                    <span>
                      Al confirmarla se enviará a la AEAT vía VeriFactu y tendrá validez legal.
                    </span>
                  </li>
                </ul>
              </div>
              <p>La proforma original desaparece y el documento queda como borrador ordinario.</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Convirtiendo...' : 'Sí, convertir a oficial'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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
import { FileText, Info } from 'lucide-react';

interface ConvertDraftToProformaModalProps {
  open: boolean;
  invoiceCustomerName: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConvertDraftToProformaModal({
  open,
  invoiceCustomerName,
  isPending,
  onCancel,
  onConfirm,
}: ConvertDraftToProformaModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-proforma-500/10 shrink-0">
              <FileText className="h-5 w-5 text-proforma-600" />
            </div>
            <AlertDialogTitle>Convertir a proforma</AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Estás a punto de convertir el borrador de{' '}
                <span className="font-semibold text-foreground">{invoiceCustomerName}</span> en una{' '}
                <span className="font-semibold text-foreground">factura proforma</span>.
              </p>
              <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-proforma-600 shrink-0" />
                  ¿Qué es una proforma?
                </p>
                <ul className="space-y-1.5 pl-1 list-none text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                    <span>No tiene número fiscal ni validez legal ante la AEAT.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                    <span>Sirve como presupuesto o documento informativo para tu cliente.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                    <span>Podrás convertirla a factura oficial en cualquier momento.</span>
                  </li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isPending}
            className="bg-proforma-600 hover:bg-proforma-700 text-white"
          >
            {isPending ? 'Convirtiendo...' : 'Sí, convertir a proforma'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

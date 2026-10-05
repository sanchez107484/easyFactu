'use client';

import { X } from 'lucide-react';
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
import { formatDate } from '@/lib/utils';

export interface BackfillDialogData {
  id: string;
  description: string;
  startDate: string;
  itemType: 'expense' | 'invoice';
}

interface ConfirmBackfillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: BackfillDialogData | null;
  onConfirm: () => void;
  isPending: boolean;
}

export function ConfirmBackfillDialog({
  open,
  onOpenChange,
  data,
  onConfirm,
  isPending,
}: ConfirmBackfillDialogProps) {
  if (!data) return null;

  const itemLabel = data.itemType === 'expense' ? 'gasto' : 'factura';
  const itemLabelPlural = itemLabel + 's';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </button>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Generar {itemLabelPlural} históricos?</AlertDialogTitle>
          <AlertDialogDescription>
            Has creado un {itemLabel} recurrente con fecha de inicio{' '}
            <strong>{formatDate(data.startDate)}</strong>, que es anterior a hoy.
            {' '}¿Quieres que se generen automáticamente todos los {itemLabelPlural} desde esa fecha hasta hoy?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>No, generar más tarde</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Generando...' : 'Sí, generar hasta hoy'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

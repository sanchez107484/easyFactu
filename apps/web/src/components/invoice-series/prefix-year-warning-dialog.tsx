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

export function prefixContainsYear(prefix: string, year: number): boolean {
  const shortYear = String(year).slice(-2);
  const fullYear = String(year);
  return prefix.includes(shortYear) || prefix.includes(fullYear);
}

interface PrefixYearWarningDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  prefix: string;
  year: number;
  confirmLabel?: string;
  isPending?: boolean;
}

export function PrefixYearWarningDialog({
  open,
  onClose,
  onConfirm,
  prefix,
  year,
  confirmLabel = 'Sí, usar sin año',
  isPending = false,
}: PrefixYearWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Serie sin referencia al año</AlertDialogTitle>
          <AlertDialogDescription>
            El prefijo <span className="font-mono font-semibold">"{prefix}"</span> no contiene el
            año {year} (ni <span className="font-mono">{String(year).slice(-2)}</span> ni{' '}
            <span className="font-mono">{year}</span>). Las facturas se numerarán sin indicar el
            año en el número, por ejemplo:{' '}
            <span className="font-mono font-semibold">{prefix}0001</span>.
            <br />
            <br />
            Si quieres incluir el año, cancela y modifica el prefijo a algo como{' '}
            <span className="font-mono">
              {prefix}
              {year}-
            </span>
            .
            <br />
            <br />
            ¿Confirmas que deseas usar esta serie sin referencia al año?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

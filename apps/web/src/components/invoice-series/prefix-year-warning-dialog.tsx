'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertTriangle, ArrowRight, X, Check } from 'lucide-react';

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
  const [acknowledged, setAcknowledged] = useState(false);

  const suggestedPrefix = `${prefix}${year}-`;
  const exampleWithout = `${prefix}0001`;
  const exampleWith = `${suggestedPrefix}0001`;

  function handleOpenChange(value: boolean) {
    if (!value) {
      setAcknowledged(false);
      onClose();
    }
  }

  function handleConfirm() {
    setAcknowledged(false);
    onConfirm();
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Serie sin referencia al año
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                El prefijo{' '}
                <span className="font-mono font-semibold text-foreground">"{prefix}"</span> no
                incluye el año <span className="font-semibold text-foreground">{year}</span>. Así
                quedarán tus facturas:
              </p>

              {/* Comparativa visual */}
              <div className="grid grid-cols-2 gap-2">
                {/* Sin año — actual */}
                <div className="rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400">
                    <X className="h-3.5 w-3.5" />
                    Sin año (actual)
                  </div>
                  <p className="font-mono text-base font-bold text-red-800 dark:text-red-300">
                    {exampleWithout}
                  </p>
                  <p className="mt-1 font-mono text-xs text-red-600 dark:text-red-400 opacity-70">
                    {prefix}0002, {prefix}0003…
                  </p>
                </div>

                {/* Con año — sugerido */}
                <div className="rounded-md border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400">
                    <Check className="h-3.5 w-3.5" />
                    Con año (sugerido)
                  </div>
                  <p className="font-mono text-base font-bold text-green-800 dark:text-green-300">
                    {exampleWith}
                  </p>
                  <p className="mt-1 font-mono text-xs text-green-600 dark:text-green-400 opacity-70">
                    {suggestedPrefix}0002…
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground">
                Para incluir el año, cancela y cambia el prefijo a{' '}
                <span className="font-mono font-semibold text-foreground">{suggestedPrefix}</span>.
              </p>

              <div className="flex items-start gap-2 rounded-md border bg-muted/50 p-3">
                <Checkbox
                  id="year-warning-ack"
                  checked={acknowledged}
                  onCheckedChange={(checked) => setAcknowledged(checked === true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="year-warning-ack"
                  className="text-sm font-normal leading-snug cursor-pointer"
                >
                  Entiendo que las facturas de esta serie no llevarán el año en el número
                </Label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={isPending || !acknowledged}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

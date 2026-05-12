'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { ExportFormat } from '@easyfactura/shared-types';
import { SOFTWARE_INFO } from './software-info';

interface SoftwareSelectModalProps {
  open: boolean;
  currentFormat: ExportFormat;
  /** When true: first-time setup — modal is not dismissable and shows "Empezar". */
  isFirstTime?: boolean;
  onConfirm: (format: ExportFormat, saveAsDefault: boolean) => void;
  onClose?: () => void;
}

export function SoftwareSelectModal({
  open,
  currentFormat,
  isFirstTime = false,
  onConfirm,
  onClose,
}: SoftwareSelectModalProps) {
  const [selected, setSelected] = useState<ExportFormat>(currentFormat);
  const [saveDefault, setSaveDefault] = useState(isFirstTime);

  // Sync selection with currentFormat every time the modal opens
  useEffect(() => {
    if (open) setSelected(currentFormat);
  }, [open, currentFormat]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!isFirstTime ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative bg-background rounded-xl border shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-base font-semibold">
            {isFirstTime ? 'Elige tu programa de contabilidad' : 'Cambiar software de exportación'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isFirstTime
              ? 'Selecciona el programa donde importarás las facturas. Podrás cambiarlo en cualquier momento.'
              : 'Selecciona el formato para esta exportación.'}
          </p>
        </div>

        {/* Software cards */}
        <div className="space-y-2">
          {(Object.keys(SOFTWARE_INFO) as ExportFormat[]).map((f) => {
            const info = SOFTWARE_INFO[f];
            const isActive = selected === f;
            return (
              <button
                key={f}
                type="button"
                disabled={!info.available}
                onClick={() => info.available && setSelected(f)}
                className={cn(
                  'w-full text-left rounded-lg border-2 p-3.5 transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  !info.available && 'opacity-50 cursor-not-allowed',
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/40 bg-background',
                )}
              >
                <div className="flex items-center gap-3">
                  {info.logoUrl ? (
                    <span className="h-9 w-9 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
                      <Image
                        src={info.logoUrl}
                        alt={info.name}
                        width={36}
                        height={36}
                        className="object-cover w-full h-full"
                      />
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'h-9 w-9 rounded-md text-sm font-bold flex items-center justify-center shrink-0',
                        info.brandBg,
                        info.brandText,
                      )}
                    >
                      {info.initials}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{info.name}</span>
                      {!info.available && (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground border rounded px-1 py-0.5 leading-tight">
                          Próximamente
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{info.tagline}</p>
                  </div>
                  {isActive && info.available && (
                    <Check className="h-4 w-4 text-primary shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Save as default checkbox */}
        <div className="flex items-center gap-2.5 pt-1">
          <Checkbox
            id="sw-save-default"
            checked={saveDefault}
            onCheckedChange={(v) => setSaveDefault(!!v)}
          />
          <Label htmlFor="sw-save-default" className="text-sm cursor-pointer leading-tight">
            Guardar como mi programa predeterminado
          </Label>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          {!isFirstTime && onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          )}
          <Button onClick={() => onConfirm(selected, saveDefault)}>
            {isFirstTime ? 'Empezar' : 'Confirmar selección'}
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import Image from 'next/image';
import { CheckCircle2, HelpCircle, Lightbulb, Download, X, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExportFormat } from '@easyfactura/shared-types';
import { SOFTWARE_INFO } from './software-info';

interface ImportGuideModalProps {
  open: boolean;
  format: ExportFormat;
  /** When true, shows the success/download header. When false, shows the plain info header. */
  variant: 'success' | 'info';
  /** When provided in success variant, allows the user to re-download the file. */
  downloadedFilename?: string | null;
  onReDownload?: () => void;
  onClose: () => void;
  /** When true, the "no volver a mostrar" checkbox appears (success variant only). */
  showDontShowAgain?: boolean;
  onDontShowAgain?: () => void;
}

export function ImportGuideModal({
  open,
  format,
  variant,
  downloadedFilename,
  onReDownload,
  onClose,
  showDontShowAgain = false,
  onDontShowAgain,
}: ImportGuideModalProps) {
  const info = SOFTWARE_INFO[format];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg p-0 overflow-hidden gap-0">
        {/* Header */}
        <div
          className={cn(
            'px-4 pt-4 pb-4 sm:px-6 sm:pt-6 sm:pb-5',
            variant === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-200 dark:border-emerald-800/40'
              : 'border-b',
          )}
        >
          <div className="flex items-start gap-3">
            {variant === 'success' ? (
              <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
            ) : info.logoUrl ? (
              <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-lg shrink-0 overflow-hidden">
                <Image
                  src={info.logoUrl}
                  alt={info.name}
                  width={44}
                  height={44}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div
                className={cn(
                  'h-9 w-9 sm:h-11 sm:w-11 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm',
                  info.brandBg,
                  info.brandText,
                )}
              >
                {info.initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base leading-snug">
                  {variant === 'success'
                    ? `¡Exportación completada!`
                    : `Cómo importar en ${info.name}`}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs sm:text-sm leading-relaxed">
                  {variant === 'success'
                    ? `Tu archivo ya se ha descargado. Sigue estos pasos para importarlo en ${info.name}.`
                    : info.tagline}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 max-h-[45vh] sm:max-h-[50vh] overflow-y-auto">
          <ol className="space-y-3">
            {info.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  className={cn(
                    'h-5 w-5 sm:h-6 sm:w-6 rounded-full text-[10px] sm:text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5',
                    'bg-primary/10 text-primary',
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-xs sm:text-sm leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>

          {info.tips && info.tips.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-950/20 p-3">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1.5 min-w-0">
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                    Consejos
                  </p>
                  <ul className="space-y-1">
                    {info.tips.map((tip, i) => (
                      <li
                        key={i}
                        className="text-xs text-amber-800/90 dark:text-amber-300/90 leading-relaxed"
                      >
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {info.helpUrl && (
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800/50 dark:bg-orange-950/20 p-3">
              <div className="flex items-start gap-2">
                <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">
                    Documentación oficial
                  </p>
                  <a
                    href={info.helpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-800/90 dark:text-orange-300/90 underline underline-offset-2 hover:text-orange-900 dark:hover:text-orange-200 leading-relaxed break-all"
                  >
                    {info.helpUrlLabel ?? info.helpUrl}
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reopen hint */}
        <div className="mx-4 sm:mx-6 mb-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800/50 dark:bg-blue-950/20 px-3 py-2.5">
          <HelpCircle className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-px" />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            Puedes consultar esta guía en cualquier momento desde el botón{' '}
            <span className="font-medium text-blue-900 dark:text-blue-100">
              Cómo importar en {info.name}
            </span>{' '}
            en la barra superior.
          </p>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t bg-muted/20 flex flex-col gap-2.5">
          {/* Filename — own row, always truncated */}
          {variant === 'success' && downloadedFilename && (
            <p
              className="text-[11px] font-mono text-muted-foreground truncate w-full"
              title={downloadedFilename}
            >
              {downloadedFilename}
            </p>
          )}
          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {variant === 'success' && onReDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onReDownload}
                className="text-xs sm:text-sm"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Volver a descargar
              </Button>
            )}
            <Button size="sm" onClick={onClose} className="text-xs sm:text-sm">
              {variant === 'success' ? 'Entendido' : 'Cerrar'}
              {variant !== 'success' && <X className="h-3.5 w-3.5 ml-1.5" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

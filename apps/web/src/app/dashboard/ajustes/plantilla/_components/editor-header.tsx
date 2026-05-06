'use client';

import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EditorHeaderProps {
  hasPendingChanges: boolean;
  isSaving: boolean;
  saveError: boolean;
  savedOnce: boolean;
  onBack: () => void;
  onSave: () => void;
}

export function EditorHeader({
  hasPendingChanges,
  isSaving,
  saveError,
  savedOnce,
  onBack,
  onSave,
}: EditorHeaderProps) {
  const showSaved = savedOnce && !hasPendingChanges && !isSaving && !saveError;

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
      {/* Left: back + title */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onBack}
          aria-label="Volver a ajustes"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">Ajustes</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium">Plantilla de factura</span>
        {hasPendingChanges && !isSaving && (
          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
        )}
      </div>

      {/* Right: status + save button */}
      <div className="flex items-center gap-3">
        {saveError && (
          <span className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5" />
            Error al guardar
          </span>
        )}
        {showSaved && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500">
            <Check className="h-3.5 w-3.5" />
            Guardado
          </span>
        )}
        <Button
          onClick={onSave}
          disabled={!hasPendingChanges || isSaving}
          size="sm"
          className={cn(
            'min-w-[100px] transition-all',
            hasPendingChanges && !isSaving && 'shadow-md',
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Guardando…
            </>
          ) : (
            'Guardar cambios'
          )}
        </Button>
      </div>
    </header>
  );
}

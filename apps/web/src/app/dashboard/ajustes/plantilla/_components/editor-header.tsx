'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AutosaveStatus } from './use-autosave';

interface EditorHeaderProps {
  status: AutosaveStatus;
  hasPendingChanges: boolean;
}

function SaveIndicator({
  status,
  hasPendingChanges,
}: {
  status: AutosaveStatus;
  hasPendingChanges: boolean;
}) {
  if (status === 'saving') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Guardando…
      </span>
    );
  }

  if (status === 'saved') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-500">
        <Check className="h-3.5 w-3.5" />
        Guardado
      </span>
    );
  }

  if (status === 'error') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <AlertCircle className="h-3.5 w-3.5" />
        Error al guardar
      </span>
    );
  }

  if (status === 'pending' || hasPendingChanges) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        Cambios sin guardar
      </span>
    );
  }

  return null;
}

export function EditorHeader({ status, hasPendingChanges }: EditorHeaderProps) {
  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 transition-colors',
        status === 'error' && 'border-destructive/30 bg-destructive/5',
      )}
    >
      {/* Left: back + title */}
      <div className="flex items-center gap-2">
        <Link href="/dashboard/ajustes">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Volver a ajustes</span>
          </Button>
        </Link>
        <span className="text-sm text-muted-foreground">Ajustes</span>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-sm font-medium">Plantilla de factura</span>
      </div>

      {/* Right: autosave indicator */}
      <SaveIndicator status={status} hasPendingChanges={hasPendingChanges} />
    </header>
  );
}

'use client';

import { AlertTriangle, Loader2 } from 'lucide-react';
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

interface UnsavedChangesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onKeepEditing: () => void;
  onLeaveWithoutSaving: () => void;
  onSaveAndLeave: () => void;
  isSaving: boolean;
}

export function UnsavedChangesModal({
  open,
  onOpenChange,
  onKeepEditing,
  onLeaveWithoutSaving,
  onSaveAndLeave,
  isSaving,
}: UnsavedChangesModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle>Tienes cambios sin guardar</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-1">
            Si sales ahora perderás todos los cambios que has hecho en la plantilla. ¿Qué quieres
            hacer?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <AlertDialogCancel onClick={onKeepEditing}>Seguir editando</AlertDialogCancel>
          <AlertDialogAction
            onClick={onLeaveWithoutSaving}
            className="border border-destructive/50 bg-transparent text-destructive hover:bg-destructive/10"
          >
            Salir sin guardar
          </AlertDialogAction>
          <AlertDialogAction onClick={onSaveAndLeave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Guardando…
              </>
            ) : (
              'Guardar y salir'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

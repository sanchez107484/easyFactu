import { Bot, TriangleAlert, Zap } from 'lucide-react';
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

interface GenerateNowDialogProps {
  open: boolean;
  isPending: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function GenerateNowDialog({
  open,
  isPending,
  onOpenChange,
  onConfirm,
}: GenerateNowDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 mx-auto mb-3">
            <Bot className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <AlertDialogTitle className="text-center">Generar factura manualmente</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 flex gap-2.5">
                <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-amber-800 dark:text-amber-300 leading-snug">
                  Esta factura se genera <strong>automáticamente</strong> según su periodicidad. En
                  condiciones normales no necesitas hacer esto.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Si la lanzas ahora, se creará una factura con fecha de hoy y el contador avanzará al
                siguiente período, igual que si la hubiera generado el planificador.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Úsalo solo si el planificador no se ejecutó por un problema técnico o necesitas la
                factura urgentemente fuera de fecha.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500"
            onClick={onConfirm}
            disabled={isPending}
          >
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            Sí, generar ahora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

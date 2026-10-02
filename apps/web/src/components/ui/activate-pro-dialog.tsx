'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Gift,
  CheckCircle2,
  ReceiptText,
  TrendingUp,
  Building2,
  PiggyBank,
  Sparkles,
  BarChart3,
} from 'lucide-react';

const PRO_FEATURES = [
  { icon: ReceiptText, text: 'Gestión avanzada de gastos' },
  { icon: TrendingUp, text: 'Análisis de rentabilidad' },
  { icon: Building2, text: 'Gestión de proveedores' },
  { icon: PiggyBank, text: 'Lectura inteligente de gastos (Pronto)' },
  { icon: Sparkles, text: 'Automatizaciones con IA (Pronto)' },
  { icon: BarChart3, text: 'Informes profesionales en segundos (Pronto)' },
  { icon: CheckCircle2, text: 'Soporte prioritario' },
] as const;

interface ActivateProDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: () => void;
  isPending?: boolean;
}

export function ActivateProDialog({
  isOpen,
  onClose,
  onActivate,
  isPending,
}: ActivateProDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
              <Gift className="h-5 w-5 text-green-600" />
            </div>
            Activa PRO gratis hasta 2027
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground block mb-1">¿Qué significa esto?</strong>
              Desbloquea todas las funcionalidades PRO sin coste alguno hasta 2027. Después, elige
              el plan que mejor se adapte a ti.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Lo que desbloqueas ahora:</p>
            <ul className="space-y-2">
              {PRO_FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-700">
              <CheckCircle2 className="h-4 w-4 inline mr-1" />
              Sin compromiso. Puedes cambiar de opinión en cualquier momento.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={onActivate} disabled={isPending}>
            {isPending ? 'Activando...' : 'Activar PRO gratuito'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

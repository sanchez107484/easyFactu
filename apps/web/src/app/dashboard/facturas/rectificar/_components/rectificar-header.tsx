'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Receipt, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { RectificationType } from '@easyfactura/shared-types';

interface RectificarHeaderProps {
  isAbono: boolean;
}

/**
 * Cabecera de la pantalla de selección de factura a rectificar.
 * Título dinámico + subtítulo explicativo + toggle Sustitución / Abono.
 */
export function RectificarHeader({ isAbono }: RectificarHeaderProps) {
  const router = useRouter();

  const switchTo = (tipo: 'sustitucion' | 'abono') => {
    router.replace(`/dashboard/facturas/rectificar?tipo=${tipo}`);
  };

  return (
    <div className="flex items-center gap-3">
      <Link href="/dashboard">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          {isAbono ? <Receipt className="h-5 w-5" /> : <RotateCcw className="h-5 w-5" />}
          {isAbono ? 'Crear Abono' : 'Crear Rectificativa'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isAbono
            ? 'Selecciona la factura para ajustar su importe. Puedes devolver dinero al cliente o cobrar un adicional.'
            : 'Selecciona la factura que quieres rectificar. Solo se muestran facturas en estado Confirmada, Enviada o Cobrada.'}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-1 p-1 bg-muted rounded-lg shrink-0">
        <button
          type="button"
          onClick={() => switchTo('sustitucion')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            !isAbono ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Sustitución
        </button>
        <button
          type="button"
          onClick={() => switchTo('abono')}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
            isAbono ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Abono
        </button>
      </div>
    </div>
  );
}

/**
 * Resuelve el RectificationType a partir del query param 'tipo'.
 * Default: sustitución.
 */
export function resolveRectificationType(tipo: string | null): RectificationType {
  return tipo === 'abono' ? RectificationType.DIFFERENCES : RectificationType.SUBSTITUTION;
}

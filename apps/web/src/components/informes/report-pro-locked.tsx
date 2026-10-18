import Link from 'next/link';
import { ArrowRight, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';

/** Shown to non-PRO tenants. The backend also enforces the plan (403). */
export function ReportProLocked() {
  return (
    <EmptyState
      icon={Lock}
      title="Los informes son una función del plan PRO"
      description="Genera informes de ingresos, gastos, clientes y artículos, descárgalos en Excel y consulta el histórico."
      action={
        <Button asChild className="gap-2">
          <Link href="/dashboard/ajustes/plan">
            Ver planes
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    />
  );
}

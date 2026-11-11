import { Plug } from 'lucide-react';
import type { Plan } from '@easyfactura/shared-types';
import { Card, CardContent } from '@/components/ui/card';

/** Replaces the plan selector when the ERP includes and manages the plan. */
export function ErpIncludedPlan({ plan }: { plan?: Plan }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plan</h1>
        <p className="text-sm text-muted-foreground mt-1">Tu plan lo gestiona tu ERP.</p>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Plug className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-primary">Plan incluido en tu ERP</p>
              {plan && (
                <p className="text-sm font-medium mt-1">
                  Tienes todas las funciones de {plan.name}.
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                No tienes que elegir ni pagar ningún plan aquí. Para cualquier cambio en tu
                suscripción, contacta con el proveedor de tu ERP.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

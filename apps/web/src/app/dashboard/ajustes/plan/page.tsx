'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Zap, Crown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth-store';
import { Plan } from '@easyfactura/shared-types';

const PLAN_INFO = {
  [Plan.FREE]: {
    label: 'Gratuito',
    price: '0€',
    description: 'Perfecto para empezar',
    features: [
      'Hasta 10 facturas/mes',
      '1 usuario',
      '5 clientes',
      'Soporte por email',
      'VeriFactu básico',
    ],
  },
  [Plan.BASIC]: {
    label: 'Básico',
    price: '9€',
    description: 'Para autónomos que comienzan',
    features: [
      'Hasta 50 facturas/mes',
      '1 usuario',
      'Hasta 50 clientes',
      'Soporte prioritario',
      'VeriFactu completo',
    ],
  },
  [Plan.PROFESSIONAL]: {
    label: 'Profesional',
    price: '19€',
    description: 'Para autónomos activos',
    features: [
      'Facturas ilimitadas',
      'Hasta 3 usuarios',
      'Clientes ilimitados',
      'Soporte prioritario',
      'VeriFactu completo',
      'Informes avanzados',
      'Plantillas personalizadas',
    ],
  },
};

const ALL_PLANS = [Plan.FREE, Plan.BASIC, Plan.PROFESSIONAL];

export default function AjustesPlanPage() {
  const currentTenant = useAuthStore((s) => s.currentTenant);
  const currentPlan = currentTenant?.plan ?? Plan.FREE;

  return (
    <div className="space-y-6">
      {/* Plan actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Plan Actual
          </CardTitle>
          <CardDescription>Tu suscripción activa</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-primary bg-primary/5">
            <Zap className="h-4 w-4 text-primary" />
            <AlertDescription>
              Estás en el plan <strong>{PLAN_INFO[currentPlan].label}</strong>.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Comparativa de planes */}
      <div className="grid gap-6 md:grid-cols-3">
        {ALL_PLANS.map((plan) => {
          const info = PLAN_INFO[plan];
          const isCurrent = plan === currentPlan;
          return (
            <Card key={plan} className={isCurrent ? 'border-primary shadow-lg' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{info.label}</CardTitle>
                    <CardDescription className="mt-1">{info.description}</CardDescription>
                  </div>
                  {plan === Plan.PROFESSIONAL && !isCurrent && (
                    <Badge variant="default" className="gap-1">
                      <Zap className="h-3 w-3" />
                      Popular
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{info.price}</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {info.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Plan actual
                  </Button>
                ) : (
                  <Button className="w-full" disabled>
                    Cambiar plan — Próximamente
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Método de pago */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Facturación y Pagos
              </CardTitle>
              <CardDescription>Gestión de suscripción y método de pago</CardDescription>
            </div>
            <Badge variant="secondary">Próximamente</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription>
              Pronto podrás gestionar tu método de pago, consultar el historial de facturas de
              suscripción y cambiar de plan directamente desde aquí.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

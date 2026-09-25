'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Check, Zap, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store/auth-store';
import { Plan } from '@easyfactura/shared-types';
import { PRICING } from '@easyfactura/brand-config';
import { useState } from 'react';

const STARTER = PRICING.starter;
const PRO = PRICING.pro;

export default function AjustesPlanPage() {
  const currentTenant = useAuthStore((s) => s.currentTenant);
  const currentPlan = currentTenant?.plan ?? Plan.FREE;
  const [annual, setAnnual] = useState(true);

  const isFreeStarter = currentPlan === Plan.FREE;
  const isBasicStarter = currentPlan === Plan.BASIC;
  const isPro = currentPlan === Plan.PROFESSIONAL;

  const starterPrice = annual ? STARTER.annualMonthly : STARTER.monthly;
  const proPrice = annual ? PRO.annualMonthly : PRO.monthly;

  const currentPrice = isPro ? proPrice : starterPrice;
  const currentPlanName = isPro ? 'Plan PRO' : 'Plan Starter';
  const currentPlanDesc = isPro
    ? 'Facturas ilimitadas + Gestión de gastos'
    : 'Hasta 60 facturas al año';

  return (
    <div className="space-y-6">
      {/* Plan actual */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPro ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">{currentPlanName}</CardTitle>
                <CardDescription className="text-sm">{currentPlanDesc}</CardDescription>
              </div>
            </div>
            <div className="text-right">
              {isFreeStarter ? (
                <>
                  <p className="text-2xl font-bold line-through text-muted-foreground">
                    {currentPrice.toFixed(2).replace('.', ',')}€
                  </p>
                  <p className="text-xs text-muted-foreground">/mes</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold">{currentPrice.toFixed(2).replace('.', ',')}€</p>
                  <p className="text-xs text-muted-foreground">/mes</p>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        {isFreeStarter && (
          <CardContent className="pt-0">
            <Badge className="gap-1 bg-green-100 text-green-700 hover:bg-green-100 border-0">
              <Zap className="h-3 w-3" />
              Gratis hasta 2027
            </Badge>
          </CardContent>
        )}
      </Card>

      {/* Toggle facturación */}
      <div className="flex items-center justify-center gap-4">
        <span
          className={`text-sm font-medium ${!annual ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          Mensual
        </span>
        <button
          onClick={() => setAnnual(!annual)}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${annual ? 'bg-primary' : 'bg-muted'}`}
          role="switch"
          aria-checked={annual}
        >
          <span
            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition duration-200 ${annual ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
        <span
          className={`text-sm font-medium ${annual ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          Anual
        </span>
        {annual && (
          <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">
            Ahorra hasta 60€/año
          </Badge>
        )}
      </div>

      {/* Comparativa de planes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan Starter */}
        <Card className={`relative overflow-hidden ${!isPro ? 'ring-2 ring-primary' : ''}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Plan Starter</CardTitle>
                <CardDescription className="mt-1">Para empezar</CardDescription>
              </div>
              {!isPro && (
                <Badge className="gap-1 bg-primary/10 text-primary border-0 hover:bg-primary/10 hover:text-primary pointer-events-none">
                  <Check className="h-3 w-3" />
                  Tu plan
                </Badge>
              )}
            </div>
            <div className="mt-4">
              {isFreeStarter ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold line-through text-muted-foreground">
                      {starterPrice.toFixed(2).replace('.', ',')}€
                    </span>
                    <span className="text-3xl font-bold text-green-600">0€</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="mt-2 text-xs border-green-200 text-green-700 bg-green-50"
                  >
                    Gratis hasta 2027
                  </Badge>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">
                      {starterPrice.toFixed(2).replace('.', ',')}€
                    </span>
                    <span className="text-muted-foreground">/ mes</span>
                  </div>
                  {annual && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {STARTER.annualTotal.toFixed(2).replace('.', ',')}€/año
                    </p>
                  )}
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col justify-between flex-1 min-h-[200px]">
            <ul className="space-y-2">
              {[
                'Hasta 60 facturas al año',
                'Clientes ilimitados',
                'PDF profesional personalizable',
                'Presupuestos y proformas',
                'Facturas recurrentes automáticas',
                'VeriFactu automático (hash + QR)',
                'Envío directo a la AEAT',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-4">
              {!isPro ? (
                <Button variant="outline" className="w-full" disabled>
                  Plan actual
                </Button>
              ) : (
                <Button className="w-full" disabled>
                  Seleccionar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan PRO */}
        <Card className={`relative overflow-hidden ${isPro ? 'ring-2 ring-primary' : ''}`}>
          <div className="absolute top-0 left-0 right-0" />
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Plan PRO</CardTitle>
                <CardDescription className="mt-1">Todo incluido</CardDescription>
              </div>
              {isPro && (
                <Badge className="gap-1 bg-primary/10 text-primary border-0 hover:bg-primary/10 hover:text-primary pointer-events-none">
                  <Check className="h-3 w-3" />
                  Tu plan
                </Badge>
              )}
            </div>
            <div className="mt-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{proPrice.toFixed(2).replace('.', ',')}€</span>
                <span className="text-muted-foreground">/ mes</span>
              </div>
              {annual && (
                <p className="text-xs text-muted-foreground mt-1">
                  {PRO.annualTotal.toFixed(2).replace('.', ',')}€/año
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex flex-col justify-between flex-1 min-h-[200px]">
            <ul className="space-y-2">
              {[
                'Facturas ilimitadas',
                'Gestión de gastos',
                'Todo lo del plan Starter',
                'Sin límite de facturas',
                'Para negocios en crecimiento',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-4">
              {isPro ? (
                <Button variant="outline" className="w-full" disabled>
                  Plan actual
                </Button>
              ) : (
                <Button className="w-full" disabled>
                  Seleccionar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Método de pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-4 w-4" />
            Facturación y Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Pronto podrás gestionar tu método de pago, consultar el historial de facturas de
              suscripción y cambiar de plan.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

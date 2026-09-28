'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCurrentSubscription, useAvailablePlans, useSubscriptionUsage, useChangePlan } from '@/hooks/use-subscription';
import { PlanTier, PlanCycle, Plan } from '@easyfactura/shared-types';
import { PRICING } from '@easyfactura/brand-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, Zap, ArrowUpCircle, ArrowDownCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const STARTER = PRICING.starter;
const PRO = PRICING.pro;
const CURRENT_YEAR = new Date().getFullYear();

const CYCLE_LABELS: Record<PlanCycle, string> = {
  [PlanCycle.MONTHLY]: 'Mensual',
  [PlanCycle.YEARLY]: 'Anual',
  [PlanCycle.FREE]: 'Gratuito',
};

const TIER_LABELS: Record<PlanTier, string> = {
  [PlanTier.BASIC]: 'Básico',
  [PlanTier.PROFESSIONAL]: 'PRO',
};

function getPrice(cycle: PlanCycle, tier: PlanTier): { monthly: string; note?: string; annualTotal?: string; monthlyEquivalent?: string } {
  if (cycle === PlanCycle.FREE) {
    return { monthly: 'Gratis' };
  }
  const isYearly = cycle === PlanCycle.YEARLY;
  const isPro = tier === PlanTier.PROFESSIONAL;
  const data = isPro ? PRO : STARTER;
  const price = isYearly ? data.annualMonthly : data.monthly;
  return {
    monthly: `${price.toFixed(2).replace('.', ',')}€`,
    note: isYearly ? `/mes` : '/mes',
    annualTotal: isYearly ? `${data.annualTotal.toFixed(2).replace('.', ',')}€` : undefined,
    monthlyEquivalent: isYearly ? `${data.annualMonthly.toFixed(2).replace('.', ',')}€/mes` : undefined,
  };
}

interface PlanCardProps {
  plan: Plan;
  isCurrent: boolean;
  isUpgrade: boolean;
  usage: { invoicesThisYear: number; maxInvoicesBasic: number | null } | undefined;
  onSelect: (plan: Plan) => void;
  loading: boolean;
}

function PlanCard({ plan, isCurrent, isUpgrade, usage, onSelect, loading }: PlanCardProps) {
  const price = getPrice(plan.cycle, plan.tier);
  const isFree = plan.cycle === PlanCycle.FREE;
  const exceedsLimit = plan.tier === PlanTier.BASIC && usage && plan.cycle !== PlanCycle.FREE
    ? usage.invoicesThisYear > (plan.limits.maxInvoicesPerYear ?? 0)
    : false;

  return (
    <Card className={cn(
      'relative flex flex-col',
      isCurrent && 'ring-2 ring-primary',
      exceedsLimit && 'opacity-75',
      isFree && 'border-green-300 bg-green-50/30'
    )}>
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary text-xs shadow-sm">
            <Check className="h-3 w-3" />
            Tu plan
          </Badge>
        </div>
      )}
      {isFree && (
        <div className="absolute -top-3 right-4">
          <Badge className="gap-1 bg-green-600 text-white hover:bg-green-600 text-xs shadow-sm animate-pulse">
            ¡Gratis hasta 2027!
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">{plan.name}</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              {TIER_LABELS[plan.tier]} · {CYCLE_LABELS[plan.cycle]}
            </CardDescription>
          </div>
          {plan.tier === PlanTier.PROFESSIONAL && (
            <Zap className="h-4 w-4 text-primary mt-1" />
          )}
        </div>

        <div className="mt-3">
          {plan.cycle === PlanCycle.YEARLY && !isFree ? (
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-foreground">
                  {price.annualTotal}
                </span>
                <span className="text-xs text-muted-foreground">/año</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {price.monthlyEquivalent} · <span className="font-medium">Un solo pago anual</span>
              </p>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-2xl font-bold", isFree ? 'text-green-600' : 'text-foreground')}>
                {price.monthly}
              </span>
              {!isFree && price.note && (
                <span className="text-xs text-muted-foreground">{price.note}</span>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 pt-0">
        <ul className="space-y-1.5 flex-1">
          {plan.tier === PlanTier.BASIC ? (
            <>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Hasta {plan.limits.maxInvoicesPerYear} facturas/año</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Clientes y productos ilimitados</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>PDFs y presupuestos</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-destructive">
                <X className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Gestión de gastos</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-destructive">
                <X className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Soporte personalizado</span>
              </li>
            </>
          ) : (
            <>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Facturas ilimitadas</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Gestión de gastos completa</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Proveedores y recurrentes</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Soporte personalizado</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>Todo lo del plan Básico</span>
              </li>
            </>
          )}
        </ul>

        <div className="mt-4 pt-3">
          {isCurrent ? (
            <Button variant="outline" className="w-full border-primary text-primary disabled:opacity-100" disabled>
              Plan actual
            </Button>
          ) : exceedsLimit ? (
            <Button variant="secondary" className="w-full" disabled title={`Superas el límite de ${plan.limits.maxInvoicesPerYear} facturas anuales`}>
              No disponible
            </Button>
          ) : isUpgrade ? (
            <Button className="w-full" onClick={() => onSelect(plan)} disabled={loading}>
              Cambiar a {plan.name}
            </Button>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => onSelect(plan)} disabled={loading}>
              Cambiar a {plan.name}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ChangePlanModalProps {
  plan: Plan | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isPending: boolean;
  isUpgrade: boolean;
  usage: { invoicesThisYear: number; maxInvoicesBasic: number | null } | undefined;
}

function ChangePlanModal({
  plan,
  open,
  onCancel,
  onConfirm,
  isPending,
  isUpgrade,
  usage,
}: ChangePlanModalProps) {
  if (!plan) return null;

  const wouldExceedLimit =
    !isUpgrade &&
    plan.tier === PlanTier.BASIC &&
    usage &&
    usage.invoicesThisYear > (plan.limits.maxInvoicesPerYear ?? 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUpgrade ? (
              <ArrowUpCircle className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-amber-500 shrink-0" />
            )}
            {isUpgrade ? 'Mejorar tu plan' : 'Cambiar a un plan inferior'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Vas a cambiar a{' '}
            <strong className="text-foreground">{plan.name}</strong>.
            {isUpgrade
              ? ' El cambio es inmediato y gratuito.'
              : ' Este cambio es inmediato.'}
          </p>

          {isUpgrade ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-1.5">
              <p className="text-sm font-medium text-green-800">Lo que ganas:</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  Facturas ilimitadas
                </li>
                <li className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  Gestión de gastos
                </li>
                <li className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  Proveedores y gastos recurrentes
                </li>
              </ul>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1.5">
              <p className="text-sm font-medium text-amber-800">Lo que pierdes:</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 text-sm text-amber-700">
                  <X className="h-3.5 w-3.5 shrink-0" />
                  Gestión de gastos
                </li>
                <li className="flex items-center gap-2 text-sm text-amber-700">
                  <X className="h-3.5 w-3.5 shrink-0" />
                  Proveedores y gastos recurrentes
                </li>
                <li className="flex items-center gap-2 text-sm text-amber-700">
                  <X className="h-3.5 w-3.5 shrink-0" />
                  Máximo {plan.limits.maxInvoicesPerYear} facturas/año
                </li>
              </ul>
            </div>
          )}

          {!isUpgrade && usage && (
            <div className="rounded-lg border border-muted bg-muted/30 p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Llevas <strong className="text-foreground">{usage.invoicesThisYear}</strong>{' '}
                facturas en {CURRENT_YEAR}.
                {wouldExceedLimit && (
                  <span className="block mt-1 text-amber-600 font-medium">
                    Superas el límite de {plan.limits.maxInvoicesPerYear} facturas anuales.
                    No puedes cambiar a este plan.
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            variant={isUpgrade ? 'default' : 'destructive'}
            onClick={onConfirm}
            disabled={isPending || wouldExceedLimit}
          >
            {isPending ? 'Cambiando...' : 'Confirmar cambio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AjustesPlanPage() {
  const { updateCurrentTenant, currentTenant } = useAuthStore();
  const { data: subscription, isLoading: subLoading } = useCurrentSubscription();
  const { data: plans, isLoading: plansLoading } = useAvailablePlans();
  const { data: usage } = useSubscriptionUsage();
  const changePlan = useChangePlan();

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const currentPlan = subscription?.plan;
  const isLoading = subLoading || plansLoading;

  const groupedPlans = plans?.reduce(
    (acc, plan) => {
      const key = plan.tier;
      if (!acc[key]) acc[key] = [];
      acc[key].push(plan);
      return acc;
    },
    {} as Record<PlanTier, Plan[]>
  );

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedPlan) return;
    try {
      await changePlan.mutateAsync(selectedPlan.slug);
      setModalOpen(false);
      setSelectedPlan(null);
    } catch {
      // Error toast already shown by the mutation
    }
  };

  const handleCancel = () => {
    setModalOpen(false);
    setSelectedPlan(null);
  };

  const isUpgrade = selectedPlan
    ? currentPlan?.tier === PlanTier.BASIC && selectedPlan.tier === PlanTier.PROFESSIONAL
    : false;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compara los planes y cambia cuando lo necesites.
        </p>
      </div>

      {/* Plan actual */}
      {currentPlan && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tu plan actual</p>
                  <p className="text-lg font-bold text-primary">{currentPlan.name}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {TIER_LABELS[currentPlan.tier]} · {CYCLE_LABELS[currentPlan.cycle]}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Oferta gratuita hasta 2027 */}
      <Alert className="bg-green-50 border-green-200">
        <Info className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 text-sm">
          <span className="font-medium">¡Oferta especial!</span> Ambos planes gratuitos son gratis hasta 2027. ¡Aprovéchala!
        </AlertDescription>
      </Alert>

      {/* Comparativa de planes */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-8 pb-8">
          {/* PROFESSIONAL */}
          {groupedPlans?.[PlanTier.PROFESSIONAL] && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-semibold">Planes PRO</h2>
                <Badge variant="secondary" className="text-xs">
                  Facturación ilimitada + Gastos
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedPlans[PlanTier.PROFESSIONAL].map((plan) => {
                  const isCurrent = plan.slug === currentPlan?.slug;
                  const isUpgrade = currentPlan?.tier === PlanTier.BASIC;
                  return (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      isCurrent={isCurrent}
                      isUpgrade={isUpgrade}
                      usage={usage}
                      onSelect={handleSelectPlan}
                      loading={changePlan.isPending}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* BASIC */}
          {groupedPlans?.[PlanTier.BASIC] && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-base font-semibold">Planes Básico</h2>
                <Badge variant="secondary" className="text-xs">
                  Hasta 60 facturas/año
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {groupedPlans[PlanTier.BASIC].map((plan) => {
                  const isCurrent = plan.slug === currentPlan?.slug;
                  const isUpgrade = currentPlan?.tier === PlanTier.BASIC;
                  return (
                    <PlanCard
                      key={plan.id}
                      plan={plan}
                      isCurrent={isCurrent}
                      isUpgrade={isUpgrade}
                      usage={usage}
                      onSelect={handleSelectPlan}
                      loading={changePlan.isPending}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <ChangePlanModal
        plan={selectedPlan}
        open={modalOpen}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        isPending={changePlan.isPending}
        isUpgrade={isUpgrade}
        usage={usage}
      />
    </div>
  );
}

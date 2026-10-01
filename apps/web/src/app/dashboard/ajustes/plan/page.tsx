'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useCurrentSubscription,
  useAvailablePlans,
  useSubscriptionUsage,
  useChangePlan,
  useSetPreferredPlan,
} from '@/hooks/use-subscription';
import { PlanTier, PlanCycle, Plan } from '@easyfactura/shared-types';
import { PRICING } from '@easyfactura/brand-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FaqSection from '@/components/FaqSection';
import {
  Check,
  Zap,
  ArrowUpCircle,
  ArrowDownCircle,
  Info,
  X,
  Sparkles,
  Gift,
  Users,
  CheckCircle2,
  Calendar,
  ArrowRight,
  ReceiptText,
  Building2,
  PiggyBank,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BillingCycleToggle, BillingCycle } from '@/components/ui/billing-cycle-toggle';
import { useQueryClient } from '@tanstack/react-query';

const STARTER = PRICING.starter;
const PRO = PRICING.pro;

const CYCLE_LABELS: Record<PlanCycle, string> = {
  [PlanCycle.MONTHLY]: 'Mensual',
  [PlanCycle.YEARLY]: 'Anual',
  [PlanCycle.FREE]: 'Gratuito',
};

const TIER_LABELS: Record<PlanTier, string> = {
  [PlanTier.BASIC]: 'Básico',
  [PlanTier.PROFESSIONAL]: 'PRO',
};

const ALL_FEATURES = [
  'VeriFactu',
  'Facturas ilimitadas',
  'Clientes y productos ilimitados',
  'Presupuestos y proformas',
  'Rectificativas y abonos',
  'Facturación recurrente',
  'Plantillas personalizadas',
  'Tu asesor tiene tus facturas siempre al día',
  'Gestión avanzada de gastos',
  'Análisis de rentabilidad',
  'Lectura inteligente de gastos (pronto)',
  'Gestión de proveedores',
  'Automatizaciones con IA (pronto)',
  'Informes profesionales en segundos',
  'Soporte prioritario',
];

const BASIC_FEATURES = ALL_FEATURES.slice(0, 8);
const PRO_FEATURES = ALL_FEATURES.slice(8);

interface PlanDisplayProps {
  name: string;
  description?: string;
  highlighted?: boolean;
  cycle: BillingCycle;
  monthlyPrice: string;
  annualMonthlyPrice: string;
  annualTotal: string;
  annualSavings: string;
  isCurrent: boolean;
  isFreePlan: boolean;
  preferredPlanSlug?: string | null;
  currentCycle?: PlanCycle;
  onSelectMonthly: () => void;
  onSelectAnnual: () => void;
  onSelectPreference: () => void;
  loading: boolean;
}

function PlanDisplay({
  name,
  description,
  highlighted,
  cycle,
  monthlyPrice,
  annualMonthlyPrice,
  annualTotal,
  annualSavings,
  isCurrent,
  isFreePlan,
  preferredPlanSlug,
  currentCycle,
  onSelectMonthly,
  onSelectAnnual,
  onSelectPreference,
  loading,
}: PlanDisplayProps) {
  const isPro = name === 'PRO';
  const features = isPro ? ALL_FEATURES : BASIC_FEATURES;
  const excludedFeatures = isPro ? [] : PRO_FEATURES;

  const isCurrentMonthly = isCurrent && currentCycle === PlanCycle.MONTHLY;
  const isCurrentAnnual = isCurrent && currentCycle === PlanCycle.YEARLY;

  const planSlug = isPro
    ? cycle === 'monthly'
      ? 'PROFESSIONAL_MONTHLY'
      : 'PROFESSIONAL_YEARLY'
    : cycle === 'monthly'
      ? 'BASIC_MONTHLY'
      : 'BASIC_YEARLY';
  const isPreferred = preferredPlanSlug === planSlug;

  const displayPrice = cycle === 'monthly' ? monthlyPrice : annualTotal;
  const displaySublabel =
    cycle === 'monthly' ? '/mes' : `/año · ${annualMonthlyPrice}/mes · Ahorra ${annualSavings}`;

  return (
    <Card
      className={cn(
        'relative flex flex-col',
        isCurrent && 'ring-2 ring-primary',
        highlighted && !isCurrent && 'border-primary/50',
      )}
    >
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <Badge className="gap-1 bg-primary text-primary-foreground hover:bg-primary text-xs shadow-sm">
            <Check className="h-3 w-3" />
            Tu plan
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl flex items-center gap-2">
              {name}
              {isPro && <Zap className="h-5 w-5 text-primary" />}
            </CardTitle>
          </div>
          {highlighted && (
            <Badge className="gap-1 bg-primary text-white hover:bg-primary text-xs">
              <Users className="h-3 w-3" />
              El más elegido
            </Badge>
          )}
        </div>

        {description && <p className="text-sm text-muted-foreground">{description}</p>}

        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          {!isFreePlan ? (
            <>
              <div className="text-center mb-3">
                <span className="text-3xl font-bold">{displayPrice}</span>
                <span className="text-sm text-muted-foreground ml-1">
                  {cycle === 'monthly' ? '/mes' : '/año'}
                </span>
              </div>

              {cycle === 'annual' && (
                <div className="bg-green-100 text-green-700 text-center py-2 px-3 rounded-md mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 inline mr-1" />
                    Ahorras {annualSavings} al año
                  </p>
                  <p className="text-xs">Equivale a {annualMonthlyPrice}/mes</p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={cycle === 'monthly' ? onSelectMonthly : onSelectAnnual}
                disabled={
                  loading ||
                  (isCurrent && (cycle === 'monthly' ? isCurrentMonthly : isCurrentAnnual))
                }
                variant={
                  isCurrent && (cycle === 'monthly' ? isCurrentMonthly : isCurrentAnnual)
                    ? 'outline'
                    : 'default'
                }
              >
                {isCurrent && (cycle === 'monthly' ? isCurrentMonthly : isCurrentAnnual)
                  ? 'Plan actual'
                  : cycle === 'monthly'
                    ? 'Elegir mensual'
                    : 'Elegir anual'}
              </Button>
            </>
          ) : (
            <>
              <div className="text-center mb-3">
                <span className="text-3xl font-bold">{displayPrice}</span>
                <span className="text-sm text-muted-foreground ml-1">
                  {cycle === 'monthly' ? '/mes' : '/año'}
                </span>
                <p className="text-xs text-muted-foreground mt-1">desde 2027</p>
              </div>

              {cycle === 'annual' && (
                <div className="bg-green-100 text-green-700 text-center py-2 px-3 rounded-md mb-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4 inline mr-1" />
                    Ahorras {annualSavings} al año
                  </p>
                  <p className="text-xs">Equivale a {annualMonthlyPrice}/mes</p>
                </div>
              )}

              <Button
                className="w-full"
                onClick={onSelectPreference}
                disabled={loading || isPreferred}
                variant={isPreferred ? 'outline' : 'default'}
              >
                {isPreferred ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Seleccionado para 2027
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Seleccionar para 2027
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ul className="space-y-1.5">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
          {excludedFeatures.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-destructive">
              <X className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
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
  currentPlan: Plan | undefined;
}

function ChangePlanModal({
  plan,
  open,
  onCancel,
  onConfirm,
  isPending,
  isUpgrade,
  usage,
  currentPlan,
}: ChangePlanModalProps) {
  if (!plan) return null;

  const wouldExceedLimit =
    !isUpgrade &&
    plan.tier === PlanTier.BASIC &&
    usage &&
    usage.invoicesThisYear > (plan.limits.maxInvoicesPerYear ?? 0);

  const isFreeToPaid = currentPlan?.cycle === PlanCycle.FREE && plan.cycle !== PlanCycle.FREE;
  const isPaidToSameTier =
    currentPlan?.cycle !== PlanCycle.FREE &&
    plan.cycle !== PlanCycle.FREE &&
    currentPlan?.tier === plan.tier;

  const getTimingMessage = () => {
    if (isFreeToPaid) {
      return 'El cambio es inmediato y gratuito.';
    }
    if (isPaidToSameTier) {
      return 'El cambio se aplicará al final del mes actual.';
    }
    return 'Este cambio se aplicará al final del mes actual.';
  };

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
            Vas a cambiar a <strong className="text-foreground">{plan.name}</strong>.{' '}
            {getTimingMessage()}
          </p>

          {isUpgrade ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 space-y-1.5">
              <p className="text-sm font-medium text-green-800">Lo que ganas:</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  Gestión completa de gastos
                </li>
                <li className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  Proveedores y facturación recurrente
                </li>
                <li className="flex items-center gap-2 text-sm text-green-700">
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  Funciones de IA
                </li>
              </ul>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1.5">
              <p className="text-sm font-medium text-amber-800">Lo que pierdes:</p>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 text-sm text-amber-700">
                  <X className="h-3.5 w-3.5 shrink-0" />
                  Gestión completa de gastos
                </li>
                <li className="flex items-center gap-2 text-sm text-amber-700">
                  <X className="h-3.5 w-3.5 shrink-0" />
                  Proveedores y facturación recurrente
                </li>
                <li className="flex items-center gap-2 text-sm text-amber-700">
                  <X className="h-3.5 w-3.5 shrink-0" />
                  Funciones de IA
                </li>
              </ul>
            </div>
          )}

          {!isUpgrade && usage && (
            <div className="rounded-lg border border-muted bg-muted/30 p-3 flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Llevas <strong className="text-foreground">{usage.invoicesThisYear}</strong>{' '}
                facturas emitidas.
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
  const setPreferredPlan = useSetPreferredPlan();
  const queryClient = useQueryClient();

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [preferredModalOpen, setPreferredModalOpen] = useState(false);
  const [selectedPreferredSlug, setSelectedPreferredSlug] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>('annual');

  const currentPlan = subscription?.plan;
  const isFreePlan = currentPlan?.cycle === PlanCycle.FREE;
  const isBasicFreePlan = currentPlan?.slug === 'BASIC_FREE';
  const preferredPlanSlug = subscription?.preferredPlanSlug;
  const isLoading = subLoading || plansLoading;

  const handleActivatePro = async () => {
    try {
      await changePlan.mutateAsync('PROFESSIONAL_FREE');
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      window.location.reload();
    } catch {
      // Error is handled by the mutation
    }
  };

  const basicPlans = plans?.filter((p) => p.tier === PlanTier.BASIC);
  const proPlans = plans?.filter((p) => p.tier === PlanTier.PROFESSIONAL);

  const basicMonthly = basicPlans?.find((p) => p.cycle === PlanCycle.MONTHLY);
  const basicAnnual = basicPlans?.find((p) => p.cycle === PlanCycle.YEARLY);
  const proMonthly = proPlans?.find((p) => p.cycle === PlanCycle.MONTHLY);
  const proAnnual = proPlans?.find((p) => p.cycle === PlanCycle.YEARLY);

  const BASIC_MONTHLY_PRICE = STARTER.monthly.toFixed(2).replace('.', ',') + '€';
  const BASIC_ANNUAL_PRICE = STARTER.annualMonthly.toFixed(2).replace('.', ',') + '€';
  const BASIC_ANNUAL_TOTAL = STARTER.annualTotal.toFixed(2).replace('.', ',') + '€';
  const BASIC_ANNUAL_SAVINGS = STARTER.annualSaving.toFixed(2).replace('.', ',') + '€';

  const PRO_MONTHLY_PRICE = PRO.monthly.toFixed(2).replace('.', ',') + '€';
  const PRO_ANNUAL_PRICE = PRO.annualMonthly.toFixed(2).replace('.', ',') + '€';
  const PRO_ANNUAL_TOTAL = PRO.annualTotal.toFixed(2).replace('.', ',') + '€';
  const PRO_ANNUAL_SAVINGS = PRO.annualSaving.toFixed(2).replace('.', ',') + '€';

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setModalOpen(true);
  };

  const handleSelectPreference = (slug: string) => {
    setSelectedPreferredSlug(slug);
    setPreferredModalOpen(true);
  };

  const handleConfirmPreferred = async () => {
    try {
      await setPreferredPlan.mutateAsync(selectedPreferredSlug);
      setPreferredModalOpen(false);
      setSelectedPreferredSlug(null);
    } catch {
      // Error toast already shown by the mutation
    }
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

  const handleCancelPreferred = () => {
    setPreferredModalOpen(false);
    setSelectedPreferredSlug(null);
  };

  const isUpgrade = selectedPlan
    ? currentPlan?.tier === PlanTier.BASIC && selectedPlan.tier === PlanTier.PROFESSIONAL
    : false;

  const basicIsCurrent = currentPlan?.tier === PlanTier.BASIC;
  const proIsCurrent = currentPlan?.tier === PlanTier.PROFESSIONAL;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Elige el plan que mejor se adapte a tu negocio.
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

      {/* Banner para usuarios BASIC_FREE */}
      {isBasicFreePlan && (
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Gift className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Activa PRO gratuitamente</h3>
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">Gratis hasta 2027</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Desbloquea todas las funcionalidades PRO sin coste hasta 2027.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={handleActivatePro} disabled={changePlan.isPending} size="lg" className="gap-2">
                  <Gift className="h-4 w-4" />
                  {changePlan.isPending ? 'Activando...' : 'Activar PRO gratuito'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promoción de lanzamiento */}
      <Alert className="bg-green-50 border-green-200 py-4">
        <Gift className="h-5 w-5 text-green-600 shrink-0" />
        <AlertDescription className="text-green-800">
          <span className="font-semibold text-base">¡Promoción de lanzamiento!</span>
          <span className="block text-sm mt-0.5">
            Disfruta de NovaFactura PRO gratis hasta 2027. Después, tu plan costará según la tabla
            inferior.
          </span>
        </AlertDescription>
      </Alert>

      {/* Toggle de ciclo de facturación */}
      <div className="flex justify-center">
        <BillingCycleToggle value={cycle} onChange={setCycle} annualBadge="Ahorra hasta 60€" />
      </div>

      {/* Comparativa de planes */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="h-[500px] animate-pulse" />
          <Card className="h-[500px] animate-pulse" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 pb-8">
          {/* BÁSICO */}
          {basicMonthly && basicAnnual && (
            <PlanDisplay
              name="Básico"
              description="Para empezar a facturar sin complicaciones."
              cycle={cycle}
              monthlyPrice={BASIC_MONTHLY_PRICE}
              annualMonthlyPrice={BASIC_ANNUAL_PRICE}
              annualTotal={BASIC_ANNUAL_TOTAL}
              annualSavings={BASIC_ANNUAL_SAVINGS}
              isCurrent={basicIsCurrent ?? false}
              isFreePlan={isFreePlan ?? false}
              preferredPlanSlug={preferredPlanSlug}
              currentCycle={currentPlan?.tier === PlanTier.BASIC ? currentPlan.cycle : undefined}
              onSelectMonthly={() => handleSelectPlan(basicMonthly)}
              onSelectAnnual={() => handleSelectPlan(basicAnnual)}
              onSelectPreference={() =>
                handleSelectPreference(cycle === 'monthly' ? 'BASIC_MONTHLY' : 'BASIC_YEARLY')
              }
              loading={changePlan.isPending}
            />
          )}

          {/* PRO */}
          {proMonthly && proAnnual && (
            <PlanDisplay
              name="PRO"
              highlighted
              cycle={cycle}
              monthlyPrice={PRO_MONTHLY_PRICE}
              annualMonthlyPrice={PRO_ANNUAL_PRICE}
              annualTotal={PRO_ANNUAL_TOTAL}
              annualSavings={PRO_ANNUAL_SAVINGS}
              isCurrent={proIsCurrent ?? false}
              isFreePlan={isFreePlan ?? false}
              preferredPlanSlug={preferredPlanSlug}
              currentCycle={
                currentPlan?.tier === PlanTier.PROFESSIONAL ? currentPlan.cycle : undefined
              }
              onSelectMonthly={() => handleSelectPlan(proMonthly)}
              onSelectAnnual={() => handleSelectPlan(proAnnual)}
              onSelectPreference={() =>
                handleSelectPreference(
                  cycle === 'monthly' ? 'PROFESSIONAL_MONTHLY' : 'PROFESSIONAL_YEARLY',
                )
              }
              loading={changePlan.isPending}
            />
          )}
        </div>
      )}

      <FaqSection
        faqs={[
          {
            q: '¿Puedo cancelar cuando quiera?',
            a: 'Sí, puedes cancelar tu suscripción en cualquier momento desde los ajustes de tu cuenta. Seguirás teniendo acceso a tu plan hasta final del período contratado.',
          },
          {
            q: '¿Cuándo se me cobra?',
            a: 'El cobro se realiza al inicio de cada período de facturación (mensual o anual, dependiendo del plan que elijas). Si eliges el plan anual, el pago es único.',
          },
          {
            q: '¿Qué pasa con mis datos si cancelo?',
            a: 'Todos tus datos (facturas, clientes, productos) permanecen seguros y accesibles. Aunque canceles tu suscripción, podrás exportar toda tu información en cualquier momento.',
          },
          {
            q: '¿Puedo cambiar de plan más adelante?',
            a: 'Sí, puedes cambiar de plan en cualquier momento. Si cambias de un plan mensual a uno anual, el cambio se aplicará al final del mes actual para que no pierdas ningún día.',
          },
        ]}
        title="Preguntas frecuentes sobre los planes"
      />

      <ChangePlanModal
        plan={selectedPlan}
        open={modalOpen}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        isPending={changePlan.isPending}
        isUpgrade={isUpgrade}
        usage={usage}
        currentPlan={currentPlan}
      />

      <Dialog open={preferredModalOpen} onOpenChange={(o) => !o && handleCancelPreferred()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              Seleccionar plan para 2027
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-muted bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">¿Qué significa esto?</strong>
                <br />
                Estás seleccionando el plan que tendrás a partir de 2027. No se te cobrará nada
                ahora. Te informaremos cuando se acerque la fecha.
              </p>
            </div>
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 inline mr-1" />
                Podrás cambiar de opinión en cualquier momento antes de 2027.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelPreferred}
              disabled={setPreferredPlan.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirmPreferred} disabled={setPreferredPlan.isPending}>
              {setPreferredPlan.isPending ? 'Guardando...' : 'Confirmar selección'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

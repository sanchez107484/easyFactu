'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { OnboardingSteps } from '@/components/onboarding/onboarding-steps';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useOnboardingStore } from '@/hooks/use-onboarding';
import { useTenant, useUpdateTenant, useCompleteSetup } from '@/hooks/use-tenant';
import { useCreateSeries, useUpdateSeries, useInvoiceSeries } from '@/hooks/use-invoice-series';
import { useInvoiceDefaults, useUpdateInvoiceDefaults } from '@/hooks/use-invoice-defaults';
import { AccountType, SeriesType, PaymentMethod } from '@easyfactura/shared-types';
import { PROVINCES, PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  User,
  Building2,
  Briefcase,
  Network,
  Sparkles,
  Loader2,
  PartyPopper,
  Save,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  InvoiceSeriesFormFields,
  invoiceSeriesEditSchema,
  InvoiceSeriesEditValues,
} from '@/components/invoice-series/invoice-series-form-fields';
import {
  PrefixYearWarningDialog,
  prefixContainsYear,
} from '@/components/invoice-series/prefix-year-warning-dialog';

// --------------------------------
// Schemas
// --------------------------------

const accountTypeSchema = z.object({
  accountType: z.nativeEnum(AccountType),
});

const companyDataSchema = z.object({
  businessName: z.string().min(2, 'Mínimo 2 caracteres'),
  nif: z.string().min(9, 'NIF/CIF inválido').max(9),
  address: z.string().min(1, 'La dirección es obligatoria'),
  postalCode: z.string().regex(/^\d{5}$/, 'Código postal inválido'),
  city: z.string().min(1, 'La ciudad es obligatoria'),
  province: z.string().min(1, 'Selecciona una provincia'),
  phone: z.string().optional(),
});

const invoiceDefaultsSchema = z.object({
  paymentMethod: z.nativeEnum(PaymentMethod).optional().nullable(),
  dueDays: z.number().int().min(0).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

type AccountTypeFormData = z.infer<typeof accountTypeSchema>;
type CompanyDataFormData = z.infer<typeof companyDataSchema>;
type InvoiceDefaultsFormData = z.infer<typeof invoiceDefaultsSchema>;

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Account Types Config
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const accountTypes = [
  {
    value: AccountType.INDIVIDUAL,
    icon: User,
    label: 'Autónomo Individual',
    description: 'Trabajo por mi cuenta sin empleados ni socios',
  },
  {
    value: AccountType.BUSINESS,
    icon: Building2,
    label: 'Empresa / Pyme',
    description: 'Tengo empleados o soy sociedad mercantil',
  },
  {
    value: AccountType.AGENCY,
    icon: Briefcase,
    label: 'Gestoría / Asesoría',
    description: 'Gestiono la facturación de varios clientes',
  },
  {
    value: AccountType.COLLABORATIVE,
    icon: Network,
    label: 'Colaborativo',
    description: 'Colaboro con otros profesionales o autónomos',
  },
];

const steps = [
  { number: 1, title: 'Tipo de cuenta', description: 'Tu situación' },
  { number: 2, title: 'Datos fiscales', description: 'Información legal' },
  { number: 3, title: 'Serie de facturas', description: 'Numeración' },
  { number: 4, title: 'Preferencias', description: 'Configuración' },
];

// --------------------------------
// Shared button row
// --------------------------------

function StepActions({
  isSaving,
  onBack,
  isFirst = false,
  isLast = false,
}: {
  isSaving: boolean;
  onBack: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  return (
    <div className={`flex gap-3 ${isFirst ? '' : ''}`}>
      {!isFirst && (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSaving}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>
      )}
      <Button
        type="submit"
        disabled={isSaving}
        className={isFirst ? 'w-full' : 'flex-1'}
        size={isFirst ? 'lg' : 'default'}
      >
        {isSaving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Guardando...
          </>
        ) : isLast ? (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Guardar y finalizar
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Guardar y continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Step 1 â€” Tipo de cuenta
// Pre-fills from tenant.accountType (DB). Saves to tenant on submit.
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Step1AccountType({ onSuccess }: { onSuccess: () => void }) {
  const { data: tenant, isLoading: isLoadingTenant } = useTenant();
  const updateTenant = useUpdateTenant();

  const form = useForm<AccountTypeFormData>({
    resolver: zodResolver(accountTypeSchema),
    // 'values' keeps the form in sync with the DB value reactively
    values: {
      accountType: tenant?.accountType ?? AccountType.INDIVIDUAL,
    },
  });

  async function handleSubmit(data: AccountTypeFormData) {
    await updateTenant.mutateAsync({ accountType: data.accountType });
    onSuccess();
  }

  if (isLoadingTenant) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-56 mx-auto" />
          <Skeleton className="h-4 w-72 mx-auto" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">¿Cuál es tu situación?</h2>
        <p className="mt-2 text-muted-foreground">Esto nos ayudará a personalizar tu experiencia</p>
      </div>

      <Controller
        control={form.control}
        name="accountType"
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onValueChange={field.onChange}
            className="grid gap-4 sm:grid-cols-2"
          >
            {accountTypes.map((type) => (
              <Label
                key={type.value}
                htmlFor={type.value}
                className={`flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-6 transition-all hover:bg-muted/50 ${
                  field.value === type.value ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <type.icon
                    className={`h-6 w-6 ${field.value === type.value ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                  <RadioGroupItem value={type.value} id={type.value} />
                </div>
                <div>
                  <div className="font-semibold">{type.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{type.description}</div>
                </div>
              </Label>
            ))}
          </RadioGroup>
        )}
      />

      {form.formState.errors.accountType && (
        <p className="text-sm text-destructive">{form.formState.errors.accountType.message}</p>
      )}

      <StepActions isSaving={updateTenant.isPending} onBack={() => {}} isFirst />
    </form>
  );
}

// --------------------------------
// Step 2 — Datos fiscales
// Pre-fills from tenant (DB). Saves to tenant on submit.
// --------------------------------

function Step2CompanyData({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const { data: tenant, isLoading: isLoadingTenant } = useTenant();
  const updateTenant = useUpdateTenant();

  const form = useForm<CompanyDataFormData>({
    resolver: zodResolver(companyDataSchema),
    values: {
      businessName: tenant?.businessName ?? '',
      nif: tenant?.nif ?? '',
      address: tenant?.address ?? '',
      postalCode: tenant?.postalCode ?? '',
      city: tenant?.city ?? '',
      province: tenant?.province ?? '',
      phone: tenant?.phone ?? '',
    },
  });

  async function handleSubmit(data: CompanyDataFormData) {
    await updateTenant.mutateAsync(data);
    onSuccess();
  }

  if (isLoadingTenant) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Completa tus datos fiscales</h2>
        <p className="mt-2 text-muted-foreground">Esta información aparecerá en tus facturas</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="businessName">Nombre comercial o razón social *</Label>
          <Input
            id="businessName"
            placeholder="Mi Empresa S.L."
            {...form.register('businessName')}
          />
          {form.formState.errors.businessName && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.businessName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="nif">NIF / CIF *</Label>
          <Input
            id="nif"
            placeholder="B12345678"
            {...form.register('nif')}
            onChange={(e) => form.setValue('nif', e.target.value.toUpperCase())}
          />
          {form.formState.errors.nif && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.nif.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input id="phone" placeholder="+34 900 000 000" {...form.register('phone')} />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="address">Dirección fiscal *</Label>
          <Input id="address" placeholder="Calle Mayor, 1" {...form.register('address')} />
          {form.formState.errors.address && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.address.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="postalCode">Código Postal *</Label>
          <Input id="postalCode" placeholder="28001" {...form.register('postalCode')} />
          {form.formState.errors.postalCode && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.postalCode.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="city">Ciudad *</Label>
          <Input id="city" placeholder="Madrid" {...form.register('city')} />
          {form.formState.errors.city && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.city.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="province">Provincia *</Label>
          <Controller
            control={form.control}
            name="province"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="province">
                  <SelectValue placeholder="Selecciona provincia" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p.code} value={p.name}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {form.formState.errors.province && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.province.message}
            </p>
          )}
        </div>
      </div>

      <StepActions isSaving={updateTenant.isPending} onBack={onBack} />
    </form>
  );
}

// --------------------------------
// Step 3 — Serie de facturas
// Pre-fills from existing invoice series (DB). Saves series on submit.
// ---------------------------------

function Step3InvoiceSeries({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const currentYear = new Date().getFullYear();
  const { data: seriesData, isLoading: isLoadingSeries } = useInvoiceSeries(currentYear);
  const createSeries = useCreateSeries();
  const updateSeries = useUpdateSeries();
  const [pendingData, setPendingData] = useState<InvoiceSeriesEditValues | null>(null);

  const existingSeries = seriesData?.data?.find((s) => s.type === SeriesType.INVOICE);

  const form = useForm<InvoiceSeriesEditValues>({
    resolver: zodResolver(invoiceSeriesEditSchema),
    values: existingSeries
      ? {
          name: existingSeries.name,
          prefix: existingSeries.prefix,
          isDefault: existingSeries.isDefault,
          nextNumber: undefined,
        }
      : { name: '', prefix: '', isDefault: true, nextNumber: undefined },
  });

  async function performSubmit(data: InvoiceSeriesEditValues) {
    if (existingSeries) {
      await updateSeries.mutateAsync({
        id: existingSeries.id,
        data: {
          name: data.name,
          prefix: data.prefix,
          isDefault: true,
          ...(data.nextNumber && { nextNumber: data.nextNumber }),
        },
      });
    } else {
      await createSeries.mutateAsync({
        code: 'F',
        name: data.name,
        prefix: data.prefix,
        type: SeriesType.INVOICE,
        year: currentYear,
        isDefault: true,
        ...(data.nextNumber && { nextNumber: data.nextNumber }),
      });
    }
    onSuccess();
  }

  async function handleSubmit(data: InvoiceSeriesEditValues) {
    if (!prefixContainsYear(data.prefix, currentYear)) {
      setPendingData(data);
      return;
    }
    await performSubmit(data);
  }

  const isSaving = createSeries.isPending || updateSeries.isPending;

  if (isLoadingSeries) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-72 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Configura tu numeración de facturas</h2>
        <p className="mt-2 text-muted-foreground">
          Define cómo se numerarán tus facturas del {currentYear}
        </p>
      </div>

      {existingSeries && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Serie actual:</span>
          <span className="font-mono font-semibold">{existingSeries.code}</span>
          <Badge variant="outline" className="ml-auto text-xs">
            {existingSeries.type === SeriesType.INVOICE ? 'Factura' : 'Rectificativa'}
          </Badge>
        </div>
      )}

      <InvoiceSeriesFormFields
        form={form}
        year={currentYear}
        showIsDefault={false}
        showNextNumber
      />

      <StepActions isSaving={isSaving} onBack={onBack} />
    </form>

    <PrefixYearWarningDialog
      open={pendingData !== null}
      onClose={() => setPendingData(null)}
      onConfirm={() => pendingData && performSubmit(pendingData)}
      prefix={pendingData?.prefix ?? ''}
      year={currentYear}
      confirmLabel="Sí, continuar sin año"
      isPending={isSaving}
    />
    </>
  );
}

// ---------------------------------
// Step 4 — Preferencias de facturación
// Pre-fills from invoiceDefaults (DB). Saves defaults + marks setup complete.
// ---------------------------------

function Step4InvoiceDefaults({
  onSuccess,
  onBack,
}: {
  onSuccess: () => void;
  onBack: () => void;
}) {
  const { data: defaults, isLoading: isLoadingDefaults } = useInvoiceDefaults();
  const updateDefaults = useUpdateInvoiceDefaults();
  const completeSetupMutation = useCompleteSetup();

  const form = useForm<InvoiceDefaultsFormData>({
    resolver: zodResolver(invoiceDefaultsSchema),
    values: {
      paymentMethod: (defaults?.paymentMethod as PaymentMethod) ?? null,
      dueDays: defaults?.dueDays ?? null,
      notes: defaults?.notes ?? '',
    },
  });

  async function handleSubmit(data: InvoiceDefaultsFormData) {
    await updateDefaults.mutateAsync({
      paymentMethod: data.paymentMethod,
      dueDays: data.dueDays,
      notes: data.notes,
    });
    await completeSetupMutation.mutateAsync();
    onSuccess();
  }

  const isSaving = updateDefaults.isPending || completeSetupMutation.isPending;

  if (isLoadingDefaults) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-80 mx-auto" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Preferencias de facturación</h2>
        <p className="mt-2 text-muted-foreground">
          Configura valores por defecto para tus facturas (puedes cambiarlo después)
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="paymentMethod">Método de pago predeterminado</Label>
          <Controller
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <Select
                value={field.value || 'none'}
                onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Sin predeterminado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin predeterminado</SelectItem>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label htmlFor="dueDays">Días de vencimiento por defecto</Label>
          <Controller
            control={form.control}
            name="dueDays"
            render={({ field }) => (
              <Select
                value={field.value != null ? String(field.value) : 'none'}
                onValueChange={(v) => field.onChange(v === 'none' ? null : Number(v))}
              >
                <SelectTrigger id="dueDays">
                  <SelectValue placeholder="Sin vencimiento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin vencimiento</SelectItem>
                  <SelectItem value="15">15 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                  <SelectItem value="45">45 días</SelectItem>
                  <SelectItem value="60">60 días</SelectItem>
                  <SelectItem value="90">90 días</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label htmlFor="notes">Notas predeterminadas (opcional)</Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Ej: Gracias por su confianza..."
            {...form.register('notes')}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Aparecerán automáticamente en cada factura nueva
          </p>
        </div>
      </div>

      <StepActions isSaving={isSaving} onBack={onBack} isLast />
    </form>
  );
}

// ---------------------------------
// Completion Screen
// ---------------------------------

function CompletionScreen({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
        <PartyPopper className="h-10 w-10 text-green-600" />
      </div>

      <h2 className="mb-3 text-3xl font-bold">¡Todo listo!</h2>
      <p className="mx-auto max-w-md text-lg text-muted-foreground">
        Tu cuenta está configurada y lista para empezar a facturar cumpliendo con VeriFactu.
      </p>

      <div className="mx-auto mt-8 max-w-md space-y-3 rounded-xl border bg-muted/30 p-6">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium">Tipo de cuenta configurado</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium">Datos fiscales guardados</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium">Serie de facturación creada</span>
        </div>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm font-medium">Preferencias configuradas</span>
        </div>
      </div>

      <Button onClick={onGoToDashboard} size="lg" className="mt-8">
        Ir al panel de control
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------------------------------
// Main Page
// ---------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const { currentStep, completedSteps, setStep, completeStep, resetOnboarding } =
    useOnboardingStore();

  function handleStepSuccess(stepNumber: number) {
    completeStep(stepNumber);
    setStep(stepNumber + 1);
    if (stepNumber < 4) {
      toast.success(`Paso ${stepNumber} guardado`);
    }
  }

  function handleGoToDashboard() {
    resetOnboarding();
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-muted/50 to-background">
      <div className="container max-w-4xl px-4 py-12">
        {currentStep < 5 && (
          <div className="mb-12">
            <OnboardingSteps
              steps={steps}
              currentStep={currentStep}
              completedSteps={completedSteps}
            />
          </div>
        )}

        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-8 md:p-12">
            {currentStep === 1 ? (
              <Step1AccountType onSuccess={() => handleStepSuccess(1)} />
            ) : currentStep === 2 ? (
              <Step2CompanyData onSuccess={() => handleStepSuccess(2)} onBack={() => setStep(1)} />
            ) : currentStep === 3 ? (
              <Step3InvoiceSeries
                onSuccess={() => handleStepSuccess(3)}
                onBack={() => setStep(2)}
              />
            ) : currentStep === 4 ? (
              <Step4InvoiceDefaults
                onSuccess={() => handleStepSuccess(4)}
                onBack={() => setStep(3)}
              />
            ) : (
              <CompletionScreen onGoToDashboard={handleGoToDashboard} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

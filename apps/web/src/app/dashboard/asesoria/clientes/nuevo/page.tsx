'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { PROVINCES } from '@easyfactura/shared-constants';
import { validateNif } from '@easyfactura/shared-validators';
import { AccountType } from '@easyfactura/shared-types';
import { useAuthStore } from '@/store/auth-store';
import { useCreateDirectClient, useInviteClient, useCheckNif } from '@/hooks/use-agency';
import { Button } from '@/components/ui/button';
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
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  Globe,
  Loader2,
  Mail,
  Network,
  User,
  UserCheck,
  Users,
} from 'lucide-react';
import { SectionLabel } from '@/components/common/section-label';

// ==================== ACCOUNT TYPES ====================

const ACCOUNT_TYPE_OPTIONS = [
  {
    value: AccountType.INDIVIDUAL,
    icon: User,
    label: 'Autónomo Individual',
    description: 'Trabaja por su cuenta sin empleados ni socios',
  },
  {
    value: AccountType.BUSINESS,
    icon: Building2,
    label: 'Empresa / Pyme',
    description: 'Tiene empleados o es sociedad mercantil',
  },
  {
    value: AccountType.AGENCY,
    icon: Briefcase,
    label: 'Gestoría / Asesoría',
    description: 'Gestiona la facturación de varios clientes',
  },
  {
    value: AccountType.COLLABORATIVE,
    icon: Network,
    label: 'Colaborativo',
    description: 'Colabora con otros profesionales o autónomos',
  },
] as const;

// ==================== SCHEMA ====================

const schema = z.object({
  accountType: z.nativeEnum(AccountType),
  businessName: z
    .string()
    .min(2, 'El nombre comercial es obligatorio (mínimo 2 caracteres)')
    .max(100, 'Máximo 100 caracteres'),
  legalName: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  nif: z
    .string()
    .min(1, 'El NIF/CIF es obligatorio')
    .refine((v) => validateNif(v.toUpperCase().trim()).isValid, {
      message: 'NIF/CIF no válido',
    }),
  email: z.string().min(1, 'El email es obligatorio').email('Formato de email no válido'),
  phone: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
  address: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
  postalCode: z.string().max(5, 'Código postal inválido').optional().or(z.literal('')),
  city: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  province: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
  notes: z.string().max(1000, 'Máximo 1000 caracteres').optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

// ==================== HELPERS ====================

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive mt-1.5">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

function getApiErrorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { data?: { code?: string } } }).response?.data?.code
  ) {
    return (error as { response: { data: { code: string } } }).response.data.code;
  }
  return null;
}

// ==================== CONFLICT BANNERS ====================

interface NifConflictInfo {
  email: string;
  businessName: string;
}

function AlreadyInPortfolioBanner({ info }: { info: NifConflictInfo }) {
  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950/30 p-4">
      <div className="flex items-start gap-3">
        <Users className="h-5 w-5 text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary-900 dark:text-primary-200">
            Este cliente ya está en tu cartera
          </p>
          <p className="mt-1 text-sm text-primary-700 dark:text-primary-300">
            <span className="font-medium">{info.businessName}</span> ({info.email}) ya figura como
            cliente tuyo. No es necesario volver a añadirlo.
          </p>
        </div>
      </div>
    </div>
  );
}

function NifConflictBanner({
  info,
  isCheckingNif,
  onInvite,
  isInviting,
}: {
  info: NifConflictInfo;
  isCheckingNif: boolean;
  onInvite: () => void;
  isInviting: boolean;
}) {
  return (
    <div className="rounded-xl border border-proforma-200 bg-proforma-50 dark:border-proforma-800 dark:bg-proforma-950/30 p-4">
      <div className="flex items-start gap-3">
        <UserCheck className="h-5 w-5 text-proforma-600 dark:text-proforma-400 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-proforma-900 dark:text-proforma-200">
            Este NIF ya tiene una cuenta en la aplicación
          </p>
          <p className="mt-1 text-sm text-proforma-700 dark:text-proforma-300">
            <span className="font-medium">{info.businessName}</span> ya está registrado con el email{' '}
            <span className="font-mono font-medium">{info.email}</span>. Para añadirlo a tu cartera,
            envía una invitación y podrán vincular su cuenta.
          </p>
          <div className="mt-3">
            <Button
              size="sm"
              variant="default"
              onClick={onInvite}
              disabled={isInviting || isCheckingNif}
              className="bg-proforma-600 hover:bg-proforma-700 text-white"
            >
              {isInviting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Mail className="mr-1.5 h-3.5 w-3.5" />
              )}
              Enviar invitación a {info.email}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== PAGE ====================

export default function NuevoClienteAsesoriaPage() {
  const router = useRouter();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const createMutation = useCreateDirectClient();
  const inviteMutation = useInviteClient();

  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountType: AccountType.INDIVIDUAL,
      businessName: '',
      legalName: '',
      nif: '',
      email: '',
      phone: '',
      address: '',
      postalCode: '',
      city: '',
      province: '',
      notes: '',
    },
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const selectedAccountType = watch('accountType');
  const watchedNif = watch('nif') ?? '';

  // Real-time NIF detection
  const { nifCheck, isCheckingNif } = useCheckNif(watchedNif);
  const hasNifConflict =
    nifCheck?.status === 'EXISTS_CAN_INVITE' || nifCheck?.status === 'ALREADY_IN_PORTFOLIO';

  const onSubmit = useCallback(
    async (data: FormData) => {
      // Block submission when conflict detected in real-time
      if (hasNifConflict) return;
      try {
        await createMutation.mutateAsync({
          accountType: data.accountType,
          businessName: data.businessName.trim(),
          legalName: data.legalName?.trim() || undefined,
          nif: data.nif.trim().toUpperCase(),
          email: data.email.trim(),
          phone: data.phone?.trim() || undefined,
          address: data.address?.trim() || undefined,
          postalCode: data.postalCode?.trim() || undefined,
          city: data.city?.trim() || undefined,
          province: data.province?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
        });
        router.push('/dashboard/asesoria/clientes');
      } catch (err) {
        // Fallback: surface EMAIL_EXISTS inline if real-time check missed it
        const code = getApiErrorCode(err);
        if (code === 'EMAIL_EXISTS') {
          form.setError('email', {
            message: 'Este email ya está registrado en otra cuenta. Usa un email diferente.',
          });
        }
      }
    },
    [createMutation, form, hasNifConflict, router],
  );

  const handleInvite = useCallback(async () => {
    const email = nifCheck?.email;
    if (!email) return;
    await inviteMutation.mutateAsync({ inviteeEmail: email });
    router.push('/dashboard/asesoria/clientes');
  }, [inviteMutation, nifCheck, router]);

  if (!isAgency) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* ── Header fijo ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/asesoria/clientes">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">Mis clientes</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium">Añadir cliente</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/asesoria/clientes">
            <Button variant="outline" size="sm" disabled={createMutation.isPending}>
              Cancelar
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending || hasNifConflict || isCheckingNif}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Añadiendo...
              </>
            ) : isCheckingNif ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Comprobando NIF...
              </>
            ) : (
              'Añadir cliente'
            )}
          </Button>
        </div>
      </div>

      {/* ── Contenido scrollable ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* NIF conflict banners — shown in real time as the user types */}
        {nifCheck?.status === 'ALREADY_IN_PORTFOLIO' && nifCheck.email && (
          <div className="mb-5">
            <AlreadyInPortfolioBanner
              info={{ email: nifCheck.email, businessName: nifCheck.businessName ?? '' }}
            />
          </div>
        )}
        {nifCheck?.status === 'EXISTS_CAN_INVITE' && nifCheck.email && (
          <div className="mb-5">
            <NifConflictBanner
              info={{ email: nifCheck.email, businessName: nifCheck.businessName ?? '' }}
              isCheckingNif={isCheckingNif}
              onInvite={handleInvite}
              isInviting={inviteMutation.isPending}
            />
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-5">
            {/* ── Tipo de cliente ── */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={User}>Tipo de cliente</SectionLabel>
              <Controller
                control={control}
                name="accountType"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
                  >
                    {ACCOUNT_TYPE_OPTIONS.map((type) => {
                      const Icon = type.icon;
                      const isSelected = field.value === type.value;
                      return (
                        <Label
                          key={type.value}
                          htmlFor={type.value}
                          className={`flex cursor-pointer flex-col gap-3 rounded-xl border-2 p-4 transition-all hover:bg-muted/50 ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <Icon
                              className={`h-5 w-5 ${
                                isSelected ? 'text-primary' : 'text-muted-foreground'
                              }`}
                            />
                            <RadioGroupItem value={type.value} id={type.value} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{type.label}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {type.description}
                            </div>
                          </div>
                        </Label>
                      );
                    })}
                  </RadioGroup>
                )}
              />
              {errors.accountType && <FieldError message={errors.accountType.message} />}
            </div>

            {/* ── FILA 1: Identificación + Contacto (2 columnas) ── */}
            <div className="grid grid-cols-2 gap-5">
              {/* Identificación de la empresa */}
              <div className="rounded-xl border bg-card p-5">
                <SectionLabel icon={Building2}>Identificación de la empresa</SectionLabel>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">
                      {selectedAccountType === AccountType.INDIVIDUAL
                        ? 'Nombre y apellidos'
                        : 'Nombre comercial'}{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="businessName"
                      placeholder={
                        selectedAccountType === AccountType.INDIVIDUAL
                          ? 'Ej: Juan Pérez García'
                          : 'Ej: ACME Soluciones S.L.'
                      }
                      {...register('businessName')}
                    />
                    <FieldError message={errors.businessName?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="legalName">
                      Razón social{' '}
                      <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="legalName"
                      placeholder="Ej: ACME Soluciones Tecnológicas, S.L."
                      {...register('legalName')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Nombre legal completo si difiere del nombre comercial
                    </p>
                    <FieldError message={errors.legalName?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nif">
                      {selectedAccountType === AccountType.INDIVIDUAL ? 'DNI / NIE' : 'NIF / CIF'}{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nif"
                      placeholder={
                        selectedAccountType === AccountType.INDIVIDUAL ? '12345678Z' : 'B12345678'
                      }
                      className="uppercase font-mono tracking-wider"
                      {...register('nif', {
                        onChange: (e) => {
                          e.target.value = e.target.value.toUpperCase();
                        },
                      })}
                      maxLength={9}
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      {selectedAccountType === AccountType.INDIVIDUAL
                        ? 'DNI (8 dígitos + letra) o NIE (X/Y/Z + 7 dígitos + letra)'
                        : 'CIF de la sociedad (letra + 7 dígitos)'}
                    </p>
                    <FieldError message={errors.nif?.message} />
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="rounded-xl border bg-card p-5">
                <SectionLabel icon={Briefcase}>Información de contacto</SectionLabel>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="contacto@empresa.com"
                      autoComplete="off"
                      {...register('email')}
                    />
                    <p className="text-xs text-muted-foreground">
                      Se usará para el acceso del cliente a NovaFactura
                    </p>
                    <FieldError message={errors.email?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      Teléfono{' '}
                      <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="666 123 456"
                      autoComplete="tel"
                      {...register('phone')}
                    />
                    <FieldError message={errors.phone?.message} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── FILA 2: Dirección fiscal ── */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={Globe}>Dirección fiscal</SectionLabel>
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 space-y-2">
                  <Label htmlFor="address">
                    Calle y número{' '}
                    <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="address"
                    placeholder="Calle Principal, 123, 2°A"
                    autoComplete="street-address"
                    {...register('address')}
                  />
                  <FieldError message={errors.address?.message} />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="postalCode">
                    C. Postal{' '}
                    <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="postalCode"
                    placeholder="28001"
                    maxLength={5}
                    autoComplete="postal-code"
                    {...register('postalCode')}
                  />
                  <FieldError message={errors.postalCode?.message} />
                </div>

                <div className="col-span-4 space-y-2">
                  <Label htmlFor="city">
                    Ciudad{' '}
                    <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="Madrid"
                    autoComplete="address-level2"
                    {...register('city')}
                  />
                  <FieldError message={errors.city?.message} />
                </div>

                <div className="col-span-4 space-y-2">
                  <Label>
                    Provincia{' '}
                    <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                  </Label>
                  <Select
                    onValueChange={(v) => setValue('province', v)}
                    value={watch('province') ?? ''}
                  >
                    <SelectTrigger>
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
                  <FieldError message={errors.province?.message} />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    defaultValue="ES"
                    className="uppercase"
                    readOnly
                    tabIndex={-1}
                  />
                </div>
              </div>
            </div>

            {/* ── FILA 3: Notas internas ── */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel>
                Notas internas{' '}
                <span className="text-muted-foreground text-xs font-normal normal-case tracking-normal">
                  (opcional)
                </span>
              </SectionLabel>
              <Textarea
                placeholder="Información adicional sobre este cliente (no aparece en las facturas)..."
                rows={3}
                {...register('notes')}
              />
              <FieldError message={errors.notes?.message} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

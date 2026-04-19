'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
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
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  Loader2,
  Mail,
  Network,
  Send,
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
    description: 'Trabaja por su cuenta sin empleados',
  },
  {
    value: AccountType.BUSINESS,
    icon: Building2,
    label: 'Empresa / Pyme',
    description: 'Tiene empleados o es sociedad',
  },
  {
    value: AccountType.AGENCY,
    icon: Briefcase,
    label: 'Gestoría / Asesoría',
    description: 'Gestiona la facturación de otros',
  },
  {
    value: AccountType.COLLABORATIVE,
    icon: Network,
    label: 'Colaborativo',
    description: 'Colabora con otros profesionales',
  },
] as const;

// ==================== SCHEMA ====================

const schema = z.object({
  accountType: z.nativeEnum(AccountType),
  businessName: z
    .string()
    .min(2, 'El nombre es obligatorio (mínimo 2 caracteres)')
    .max(100, 'Máximo 100 caracteres'),
  nif: z
    .string()
    .min(1, 'El NIF/CIF es obligatorio')
    .refine((v) => validateNif(v.toUpperCase().trim()).isValid, {
      message: 'NIF/CIF no válido',
    }),
  email: z.string().min(1, 'El email es obligatorio').email('Formato de email no válido'),
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
            <span className="font-medium">{info.businessName}</span> ya está registrado con el
            email <span className="font-mono font-medium">{info.email}</span>. Envíale una
            invitación para vincular su cuenta existente.
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

// ==================== SUCCESS BANNER ====================

function SuccessBanner({ email, businessName }: { email: string; businessName: string }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
        <div className="min-w-0">
          <p className="text-base font-semibold text-green-900 dark:text-green-200">
            Cliente añadido correctamente
          </p>
          <p className="mt-1.5 text-sm text-green-700 dark:text-green-300 leading-relaxed">
            Se ha enviado un email de activación a{' '}
            <span className="font-mono font-medium">{email}</span>. Cuando{' '}
            <span className="font-medium">{businessName}</span> haga clic en el enlace, podrá
            crear su contraseña y completar su perfil desde el onboarding.
          </p>
          <p className="mt-2 text-xs text-green-600 dark:text-green-400">
            Ya puedes gestionar su cuenta desde el panel.
          </p>
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

  const [successInfo, setSuccessInfo] = useState<{
    email: string;
    businessName: string;
  } | null>(null);

  const isAgency = currentTenant?.accountType === AccountType.AGENCY;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      accountType: AccountType.INDIVIDUAL,
      businessName: '',
      nif: '',
      email: '',
      notes: '',
    },
  });

  const selectedAccountType = watch('accountType');
  const watchedNif = watch('nif') ?? '';

  // Real-time NIF detection
  const { nifCheck, isCheckingNif } = useCheckNif(watchedNif);
  const hasNifConflict =
    nifCheck?.status === 'EXISTS_CAN_INVITE' || nifCheck?.status === 'ALREADY_IN_PORTFOLIO';

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (hasNifConflict) return;

      try {
        await createMutation.mutateAsync({
          accountType: data.accountType,
          businessName: data.businessName.trim(),
          nif: data.nif.trim().toUpperCase(),
          email: data.email.trim(),
          notes: data.notes?.trim() || undefined,
        });
        setSuccessInfo({ email: data.email.trim(), businessName: data.businessName.trim() });
      } catch (err) {
        const code = getApiErrorCode(err);
        if (code === 'EMAIL_EXISTS') {
          setError('email', {
            message: 'Este email ya está registrado en otra cuenta. Usa un email diferente.',
          });
        }
      }
    },
    [createMutation, hasNifConflict, setError],
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
          {successInfo ? (
            <Button size="sm" onClick={() => router.push('/dashboard/asesoria/clientes')}>
              Ver mis clientes
            </Button>
          ) : (
            <>
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
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Añadir y enviar invitación
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Contenido scrollable ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Success banner */}
        {successInfo && (
          <div className="mb-6 max-w-2xl">
            <SuccessBanner email={successInfo.email} businessName={successInfo.businessName} />
          </div>
        )}

        {/* NIF conflict banners */}
        {!successInfo && nifCheck?.status === 'ALREADY_IN_PORTFOLIO' && nifCheck.email && (
          <div className="mb-5 max-w-2xl">
            <AlreadyInPortfolioBanner
              info={{ email: nifCheck.email, businessName: nifCheck.businessName ?? '' }}
            />
          </div>
        )}
        {!successInfo && nifCheck?.status === 'EXISTS_CAN_INVITE' && nifCheck.email && (
          <div className="mb-5 max-w-2xl">
            <NifConflictBanner
              info={{ email: nifCheck.email, businessName: nifCheck.businessName ?? '' }}
              isCheckingNif={isCheckingNif}
              onInvite={handleInvite}
              isInviting={inviteMutation.isPending}
            />
          </div>
        )}

        {!successInfo && (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-5 max-w-2xl">
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
                      className="grid gap-3 sm:grid-cols-2"
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

              {/* ── Datos del cliente ── */}
              <div className="rounded-xl border bg-card p-5">
                <SectionLabel icon={Building2}>Datos del cliente</SectionLabel>
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
                    <FieldError message={errors.nif?.message} />
                  </div>

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
                      El cliente recibirá aquí un enlace para activar su cuenta y crear su
                      contraseña.
                    </p>
                    <FieldError message={errors.email?.message} />
                  </div>
                </div>
              </div>

              {/* ── Notas internas ── */}
              <div className="rounded-xl border bg-card p-5">
                <SectionLabel>
                  Notas internas{' '}
                  <span className="text-muted-foreground text-xs font-normal normal-case tracking-normal">
                    (opcional)
                  </span>
                </SectionLabel>
                <Textarea
                  placeholder="Información adicional sobre este cliente visible solo para tu asesoría..."
                  rows={3}
                  {...register('notes')}
                />
                <FieldError message={errors.notes?.message} />
              </div>

              {/* ── Info callout ── */}
              <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                      ¿Qué recibirá el cliente?
                    </p>
                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      Se enviará un email con un enlace seguro para que el cliente active su
                      cuenta, cree su contraseña y complete su perfil desde el onboarding.
                      Mientras tanto, ya puedes gestionar su cuenta desde tu panel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

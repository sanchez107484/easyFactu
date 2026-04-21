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
import { useCreateDirectClient, useInviteClient, useCheckIdentifier } from '@/hooks/use-agency';
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
  UserPlus,
  Users,
} from 'lucide-react';
import { SectionLabel } from '@/components/common/section-label';
import { cn } from '@/lib/utils';

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
            <span className="font-medium">{info.businessName}</span> ya está registrado con el email{' '}
            <span className="font-mono font-medium">{info.email}</span>. Envíale una invitación para
            vincular su cuenta existente.
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
            <span className="font-medium">{businessName}</span> haga clic en el enlace, podrá crear
            su contraseña y completar su perfil desde el onboarding.
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
  const watchedEmail = watch('email') ?? '';

  // Busca en tiempo real tanto por NIF (cuando es válido) como por email
  const activeIdentifier = watchedNif.trim().length >= 9 ? watchedNif.trim() : watchedEmail.trim();
  const { data: identifierCheck, isFetching: isCheckingIdentifier } =
    useCheckIdentifier(activeIdentifier);
  const hasConflict =
    identifierCheck?.status === 'EXISTS_CAN_INVITE' ||
    identifierCheck?.status === 'ALREADY_IN_PORTFOLIO';

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (hasConflict) return;

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
    [createMutation, hasConflict, setError],
  );

  const handleInvite = useCallback(async () => {
    const email =
      identifierCheck?.status === 'EXISTS_CAN_INVITE' ||
      identifierCheck?.status === 'ALREADY_IN_PORTFOLIO'
        ? identifierCheck.email
        : undefined;
    if (!email) return;
    await inviteMutation.mutateAsync({ inviteeEmail: email });
    router.push('/dashboard/asesoria/clientes');
  }, [inviteMutation, identifierCheck, router]);

  if (!isAgency) {
    router.replace('/dashboard');
    return null;
  }

  return (
    <div className="-m-6 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
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
          <span className="text-sm font-medium">Registrar nuevo cliente</span>
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
                disabled={createMutation.isPending || hasConflict || isCheckingIdentifier}
                className="bg-agency-600 hover:bg-agency-700 text-white"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Registrando...
                  </>
                ) : isCheckingIdentifier ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Comprobando...
                  </>
                ) : (
                  <>
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                    Registrar y enviar acceso
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Cuerpo: dos paneles sin scroll ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Panel izquierdo: contexto informativo ── */}
        <div className="w-72 shrink-0 flex flex-col overflow-hidden bg-gradient-to-b from-agency-600 to-agency-800 text-white">
          <div className="flex flex-1 flex-col gap-5 p-6 overflow-hidden">
            {/* Icono + título + descripción */}
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 mb-3">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-base font-bold leading-snug">
                Registrar nuevo cliente en la plataforma
              </h1>
              <p className="mt-2 text-sm text-agency-100 leading-relaxed">
                Estás creando una <strong className="text-white">cuenta nueva</strong> para un
                cliente tuyo. Puedes gestionar su facturación de inmediato y él recibirá un enlace
                para acceder cuando quiera.
              </p>
              <button
                type="button"
                onClick={() => router.push('/dashboard/asesoria/clientes')}
                className="mt-2 text-xs text-agency-300 underline underline-offset-2 hover:text-white"
              >
                ¿Ya tiene cuenta? Usa «Vincular cliente» →
              </button>
            </div>

            {/* Pasos */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-agency-300">
                ¿Qué ocurre al registrar?
              </p>
              {[
                { n: '1', text: 'Se crea su cuenta con los datos que introduces.' },
                {
                  n: '2',
                  text: 'Accedes de inmediato a su espacio para completar sus datos y emitir facturas.',
                },
                {
                  n: '3',
                  text: 'Recibe un email con enlace (7 días) para activar su propio acceso.',
                },
                {
                  n: '4',
                  text: 'Tú gestionas su facturación, él puede consultarla cuando active su cuenta.',
                },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                    {n}
                  </span>
                  <p className="text-xs text-agency-100 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Aviso diferencia con clientes a facturar */}
          <div className="shrink-0 mx-4 mb-4 rounded-xl bg-white/10 border border-white/20 p-4">
            <p className="text-xs font-semibold text-white">¿No es lo que buscas?</p>
            <p className="mt-1 text-xs text-agency-200 leading-relaxed">
              Si solo necesitas facturarle como destinatario de tus facturas, añádelo desde{' '}
              <strong className="text-white">Clientes para facturar</strong>.
            </p>
            <button
              type="button"
              onClick={() => router.push('/dashboard/clientes/nuevo')}
              className="mt-1.5 text-xs text-agency-300 underline underline-offset-2 hover:text-white"
            >
              Ir a Clientes para facturar →
            </button>
          </div>
        </div>

        {/* ── Panel derecho: formulario o éxito ── */}
        <div className="flex flex-1 flex-col overflow-hidden bg-muted/20">
          {successInfo ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <div className="w-full max-w-lg">
                <SuccessBanner email={successInfo.email} businessName={successInfo.businessName} />
              </div>
            </div>
          ) : (
            <>
              {/* Banners de conflicto */}
              {identifierCheck?.status === 'ALREADY_IN_PORTFOLIO' && identifierCheck.email && (
                <div className="px-6 pt-4 shrink-0">
                  <AlreadyInPortfolioBanner
                    info={{
                      email: identifierCheck.email,
                      businessName: identifierCheck.businessName ?? '',
                    }}
                  />
                </div>
              )}
              {identifierCheck?.status === 'EXISTS_CAN_INVITE' && identifierCheck.email && (
                <div className="px-6 pt-4 shrink-0">
                  <NifConflictBanner
                    info={{
                      email: identifierCheck.email,
                      businessName: identifierCheck.businessName ?? '',
                    }}
                    isCheckingNif={isCheckingIdentifier}
                    onInvite={handleInvite}
                    isInviting={inviteMutation.isPending}
                  />
                </div>
              )}

              {/* Formulario */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="flex flex-1 flex-col gap-5 px-6 py-5 overflow-hidden"
              >
                {/* Tipo de cuenta — fila horizontal compacta */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Tipo de cuenta
                  </p>
                  <Controller
                    control={control}
                    name="accountType"
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-4 gap-2"
                      >
                        {ACCOUNT_TYPE_OPTIONS.map((type) => {
                          const Icon = type.icon;
                          const isSelected = field.value === type.value;
                          return (
                            <Label
                              key={type.value}
                              htmlFor={`type-${type.value}`}
                              className={cn(
                                'flex cursor-pointer items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 transition-all hover:bg-muted/50',
                                isSelected
                                  ? 'border-agency-500 bg-agency-50 dark:bg-agency-950/30'
                                  : 'border-border bg-card',
                              )}
                            >
                              <RadioGroupItem
                                value={type.value}
                                id={`type-${type.value}`}
                                className="sr-only"
                              />
                              <Icon
                                className={cn(
                                  'h-4 w-4 shrink-0',
                                  isSelected
                                    ? 'text-agency-600 dark:text-agency-400'
                                    : 'text-muted-foreground',
                                )}
                              />
                              <span
                                className={cn(
                                  'text-sm font-medium leading-none',
                                  isSelected ? 'text-agency-700 dark:text-agency-300' : '',
                                )}
                              >
                                {type.label}
                              </span>
                            </Label>
                          );
                        })}
                      </RadioGroup>
                    )}
                  />
                  {errors.accountType && <FieldError message={errors.accountType.message} />}
                </div>

                {/* Nombre + NIF en dos columnas */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
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

                  <div className="space-y-1.5">
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
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email">
                    Email de acceso <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contacto@empresa.com"
                    autoComplete="off"
                    {...register('email')}
                  />
                  <p className="text-xs text-muted-foreground">
                    El cliente usará este email para iniciar sesión. Aquí recibirá el enlace de
                    activación.
                  </p>
                  <FieldError message={errors.email?.message} />
                </div>

                {/* Notas internas */}
                <div className="space-y-1.5">
                  <Label htmlFor="notes">
                    Notas internas{' '}
                    <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="Información adicional sobre este cliente, visible solo para tu asesoría..."
                    rows={2}
                    {...register('notes')}
                  />
                  <FieldError message={errors.notes?.message} />
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

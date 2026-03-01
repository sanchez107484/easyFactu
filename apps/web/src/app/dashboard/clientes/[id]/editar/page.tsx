'use client';

import { useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { validateNif } from '@easyfactura/shared-validators';
import { CustomerType, UpdateCustomerInput } from '@easyfactura/shared-types';
import { PROVINCES } from '@easyfactura/shared-constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  User,
  Briefcase,
  Building2,
  Globe,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomer, useUpdateCustomer, useCustomerByNif } from '@/hooks/use-customers';

// ==================== TYPES & CONSTANTS ====================

type FormData = z.infer<typeof formSchema>;

interface TypeOption {
  value: CustomerType;
  label: string;
  description: string;
  icon: React.ReactNode;
  nifLabel: string;
  nifPlaceholder: string;
  nifHint: string;
  showLegalName: boolean;
  legalNameLabel: string;
  isIntracommunity: boolean;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: CustomerType.INDIVIDUAL,
    label: 'Particular',
    description: 'Persona física sin actividad económica',
    icon: <User className="h-5 w-5" />,
    nifLabel: 'DNI / NIE',
    nifPlaceholder: '12345678Z',
    nifHint: 'DNI (8 dígitos + letra) o NIE (X/Y/Z + 7 dígitos + letra)',
    showLegalName: false,
    legalNameLabel: '',
    isIntracommunity: false,
  },
  {
    value: CustomerType.SELF_EMPLOYED,
    label: 'Autónomo',
    description: 'Trabajador por cuenta propia',
    icon: <Briefcase className="h-5 w-5" />,
    nifLabel: 'NIF / DNI',
    nifPlaceholder: '12345678Z',
    nifHint: 'DNI (8 dígitos + letra) o NIE (X/Y/Z + 7 dígitos + letra)',
    showLegalName: false,
    legalNameLabel: '',
    isIntracommunity: false,
  },
  {
    value: CustomerType.COMPANY,
    label: 'Empresa',
    description: 'S.L., S.A. u otras formas societarias',
    icon: <Building2 className="h-5 w-5" />,
    nifLabel: 'CIF',
    nifPlaceholder: 'B12345678',
    nifHint: 'CIF de la sociedad (una letra + 7 dígitos)',
    showLegalName: true,
    legalNameLabel: 'Razón social',
    isIntracommunity: false,
  },
  {
    value: CustomerType.INTRACOMMUNITY,
    label: 'Intracomunitario',
    description: 'Empresa o particular de la UE',
    icon: <Globe className="h-5 w-5" />,
    nifLabel: 'NIF intracomunitario',
    nifPlaceholder: 'DE123456789',
    nifHint: 'Número de IVA intracomunitario del país de origen',
    showLegalName: false,
    legalNameLabel: '',
    isIntracommunity: true,
  },
];

// ==================== ZOD SCHEMA ====================

const formSchema = z
  .object({
    type: z.nativeEnum(CustomerType),
    name: z.string().min(1, 'El nombre es obligatorio').max(200),
    nif: z
      .string()
      .min(1, 'El NIF/CIF es obligatorio')
      .refine((val) => validateNif(val).isValid, {
        message: 'NIF/CIF no válido',
      }),
    legalName: z.string().max(100, 'Máximo 100 caracteres').optional(),
    email: z.string().email('Formato de email no válido').optional(),
    phone: z.string().optional(),
    address: z.string().max(200).optional(),
    postalCode: z.string().max(10).optional(),
    city: z.string().max(100).optional(),
    province: z.string().max(100).optional(),
    country: z.string().length(2).optional(),
    notes: z.string().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type !== CustomerType.INTRACOMMUNITY && data.nif) {
      const cleanedNif = data.nif
        .toUpperCase()
        .trim()
        .replace(/[\s.-]/g, '');
      const result = validateNif(cleanedNif);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NIF/CIF no válido para el tipo seleccionado',
          path: ['nif'],
        });
      }
    }
  });

// ==================== HELPERS ====================

function buildUpdateInput(data: FormData): UpdateCustomerInput {
  return {
    type: data.type,
    name: data.name.trim(),
    legalName: data.legalName?.trim() || undefined,
    nif: data.nif.trim().toUpperCase(),
    email: data.email?.trim() || undefined,
    phone: data.phone?.trim() || undefined,
    address: data.address?.trim() || '',
    postalCode: data.postalCode?.trim() || '',
    city: data.city?.trim() || '',
    province: data.province?.trim() || '',
    country: data.country || 'ES',
    notes: data.notes?.trim() || undefined,
  };
}

// ==================== SUB-COMPONENTS ====================

function SectionLabel({ icon: Icon, children }: { icon?: any; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 mb-4">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
        {children}
      </p>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive mt-1.5">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

function PageSkeleton() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="flex items-center justify-between px-6 py-3 border-b shrink-0">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-5">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ==================== INNER FORM ====================
// Igual que en NuevoClientePage, separamos el form en un componente hijo
// para que useForm() se inicialice con los defaultValues ya cargados del backend.

interface EditFormProps {
  customerId: string;
  defaultValues: FormData;
  originalNif: string;
}

function EditCustomerForm({ customerId, defaultValues, originalNif }: EditFormProps) {
  const router = useRouter();
  const updateMutation = useUpdateCustomer();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const selectedType = form.watch('type');
  const watchedNif = form.watch('nif') ?? '';
  const currentTypeOption = TYPE_OPTIONS.find((o) => o.value === selectedType) ?? TYPE_OPTIONS[0]!;

  // FIX: skip=true cuando el NIF actual es igual al original — no alertar al propio cliente
  const nifChanged = watchedNif.toUpperCase().trim() !== originalNif.toUpperCase().trim();
  const { existingCustomer, isSearching } = useCustomerByNif(watchedNif, !nifChanged);

  const handleTypeSelect = useCallback(
    (type: CustomerType) => {
      form.setValue('type', type, { shouldValidate: false });
      // Solo reset del NIF si cambia de/a intracomunitario
      if (type === CustomerType.INTRACOMMUNITY || selectedType === CustomerType.INTRACOMMUNITY) {
        form.resetField('nif');
      }
      form.resetField('legalName');
      if (type === CustomerType.INTRACOMMUNITY) {
        form.setValue('country', '');
        form.resetField('province');
        form.resetField('postalCode');
      } else if (selectedType === CustomerType.INTRACOMMUNITY) {
        form.setValue('country', 'ES');
      }
    },
    [form, selectedType],
  );

  const onSubmit = async (data: FormData) => {
    if (existingCustomer) return;
    await updateMutation.mutateAsync({ id: customerId, data: buildUpdateInput(data) });
    router.push(`/dashboard/clientes/${customerId}`);
  };

  const isSubmitting = updateMutation.isPending;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/clientes/${customerId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">Clientes</span>
          <span className="text-muted-foreground/40">/</span>
          <Link
            href={`/dashboard/clientes/${customerId}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {defaultValues.name}
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium">Editar</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/clientes/${customerId}`}>
            <Button variant="outline" size="sm" disabled={isSubmitting}>
              Cancelar
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting || !!existingCustomer}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cambios'
            )}
          </Button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* ── FILA 1: Tipo ── */}
          <div className="rounded-xl border bg-card p-5">
            <SectionLabel icon={User}>Tipo de cliente</SectionLabel>
            <div className="grid grid-cols-4 gap-3">
              {TYPE_OPTIONS.map((option) => {
                const isSelected = selectedType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleTypeSelect(option.value)}
                    className={cn(
                      'relative flex items-start gap-3 p-4 rounded-lg border-2 text-left transition-all',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background hover:border-primary/40 hover:bg-muted/30',
                    )}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-md shrink-0 mt-0.5',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {option.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm">{option.label}</p>
                        {isSelected && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                        {option.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── FILA 2: Identificación + Contacto ── */}
          <div className="grid grid-cols-2 gap-5">
            {/* Identificación fiscal */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={Building2}>Identificación fiscal</SectionLabel>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nombre comercial <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...form.register('name')}
                    placeholder={
                      selectedType === CustomerType.COMPANY
                        ? 'Ej: ACME Solutions'
                        : 'Ej: Juan Pérez García'
                    }
                  />
                  <FieldError message={form.formState.errors.name?.message} />
                </div>

                {currentTypeOption.showLegalName && (
                  <div className="space-y-2">
                    <Label htmlFor="legalName">{currentTypeOption.legalNameLabel}</Label>
                    <Input
                      id="legalName"
                      {...form.register('legalName')}
                      placeholder="Ej: ACME Solutions Tecnológicas, S.L."
                    />
                    <p className="text-xs text-muted-foreground">
                      Nombre legal completo que aparecerá en las facturas
                    </p>
                    <FieldError message={form.formState.errors.legalName?.message} />
                  </div>
                )}

                {/* NIF con spinner */}
                <div className="space-y-2">
                  <Label htmlFor="nif">
                    {currentTypeOption.nifLabel} <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="nif"
                      {...form.register('nif', {
                        onChange: (e) => {
                          if (!currentTypeOption.isIntracommunity) {
                            e.target.value = e.target.value.toUpperCase();
                          }
                        },
                      })}
                      placeholder={currentTypeOption.nifPlaceholder}
                      className={cn(
                        'pr-8',
                        !currentTypeOption.isIntracommunity && 'uppercase font-mono tracking-wider',
                      )}
                      maxLength={currentTypeOption.isIntracommunity ? 20 : 9}
                      autoComplete="off"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{currentTypeOption.nifHint}</p>
                  <FieldError message={form.formState.errors.nif?.message} />
                </div>

                {/* Banner duplicado — solo si el NIF cambió y coincide con OTRO cliente */}
                {existingCustomer && nifChanged && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4">
                    <div className="flex items-start gap-3">
                      <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                          Este NIF ya pertenece a otro cliente
                        </p>
                        <div className="mt-2 rounded-md bg-white/60 dark:bg-black/20 border border-amber-200/50 dark:border-amber-700/50 p-3 space-y-0.5">
                          <p className="text-sm font-medium">{existingCustomer.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {existingCustomer.nif}
                          </p>
                          {existingCustomer.email && (
                            <p className="text-xs text-muted-foreground">
                              {existingCustomer.email}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="mt-3 w-full border-amber-300 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
                          onClick={() => router.push(`/dashboard/clientes/${existingCustomer.id}`)}
                        >
                          <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                          Ver ficha del cliente
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contacto */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={Briefcase}>Información de contacto</SectionLabel>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="cliente@ejemplo.com"
                  />
                  <FieldError message={form.formState.errors.email?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    {...form.register('phone')}
                    placeholder="666 123 456"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── FILA 3: Dirección ── */}
          <div className="rounded-xl border bg-card p-5">
            <SectionLabel icon={Globe}>Dirección fiscal</SectionLabel>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6 space-y-2">
                <Label htmlFor="address">Calle y número</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder="Calle Principal, 123, 2°A"
                />
              </div>

              {!currentTypeOption.isIntracommunity && (
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="postalCode">C. Postal</Label>
                  <Input
                    id="postalCode"
                    {...form.register('postalCode')}
                    placeholder="28001"
                    maxLength={5}
                  />
                  <FieldError message={form.formState.errors.postalCode?.message} />
                </div>
              )}

              <div
                className={cn(
                  'space-y-2',
                  currentTypeOption.isIntracommunity ? 'col-span-6' : 'col-span-4',
                )}
              >
                <Label htmlFor="city">Ciudad</Label>
                <Input id="city" {...form.register('city')} placeholder="Madrid" />
              </div>

              {!currentTypeOption.isIntracommunity && (
                <div className="col-span-4 space-y-2">
                  <Label>Provincia</Label>
                  <Select
                    value={form.watch('province') ?? ''}
                    onValueChange={(v) => form.setValue('province', v)}
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
                </div>
              )}

              <div
                className={cn(
                  'space-y-2',
                  currentTypeOption.isIntracommunity ? 'col-span-6' : 'col-span-2',
                )}
              >
                <Label htmlFor="country">
                  País
                  {currentTypeOption.isIntracommunity && (
                    <span className="text-destructive"> *</span>
                  )}
                </Label>
                <Input
                  id="country"
                  {...form.register('country')}
                  placeholder={currentTypeOption.isIntracommunity ? 'DE' : 'ES'}
                  maxLength={2}
                  className="uppercase"
                  readOnly={!currentTypeOption.isIntracommunity}
                />
                {currentTypeOption.isIntracommunity && (
                  <p className="text-xs text-muted-foreground">Código ISO alpha-2</p>
                )}
                <FieldError message={form.formState.errors.country?.message} />
              </div>
            </div>
          </div>

          {/* ── FILA 4: Notas ── */}
          <div className="rounded-xl border bg-card p-5">
            <SectionLabel>Notas internas</SectionLabel>
            <Textarea
              {...form.register('notes')}
              placeholder="Información adicional sobre este cliente (no aparece en las facturas)..."
              rows={3}
            />
            <FieldError message={form.formState.errors.notes?.message} />
          </div>
        </form>
      </div>
    </div>
  );
}

// ==================== PAGE (shell) ====================
// Espera a que el cliente cargue del backend antes de montar el form,
// igual que el patrón de NuevaFacturaPage con duplicado.

export default function EditarClientePage() {
  const params = useParams();
  const id = params.id as string;

  const { data: customer, isLoading, error } = useCustomer(id);

  if (isLoading) return <PageSkeleton />;

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">No se pudo cargar el cliente</p>
        <Link href="/dashboard/clientes">
          <Button variant="outline">Volver a clientes</Button>
        </Link>
      </div>
    );
  }

  // Transformar el Customer del backend a FormData
  // Los campos del backend pueden venir como null, los convertimos a '' para los inputs
  const defaultValues: FormData = {
    type: customer.type as CustomerType,
    name: customer.name ?? '',
    legalName: customer.legalName ?? '',
    nif: customer.nif ?? '',
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    address: customer.address ?? '',
    postalCode: customer.postalCode ?? '',
    city: customer.city ?? '',
    province: customer.province ?? '',
    country: customer.country ?? 'ES',
    notes: customer.notes ?? '',
  };

  return (
    <EditCustomerForm customerId={id} defaultValues={defaultValues} originalNif={customer.nif} />
  );
}

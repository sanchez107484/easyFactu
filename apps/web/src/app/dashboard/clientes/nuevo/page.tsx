'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { validateNif } from '@easyfactura/shared-validators';
import { CustomerType, CreateCustomerInput } from '@easyfactura/shared-types';
import { PROVINCES } from '@easyfactura/shared-constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useCreateCustomer, useCustomerByNif } from '@/hooks/use-customers';

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
    name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
    nif: z.string().min(1, 'El NIF/CIF es obligatorio'),
    type: z.nativeEnum(CustomerType).optional(),
    legalName: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
    email: z.string().email('Formato de email no válido').optional().or(z.literal('')),
    phone: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
    address: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
    postalCode: z.string().max(10).optional().or(z.literal('')),
    city: z.string().max(100).optional().or(z.literal('')),
    province: z.string().max(100).optional().or(z.literal('')),
    country: z.string().length(2, 'Código de país de 2 letras').default('ES').optional(),
    notes: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
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

function buildCreateInput(data: FormData): CreateCustomerInput {
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

// ==================== PAGE ====================

export default function NuevoClientePage() {
  const router = useRouter();
  const createMutation = useCreateCustomer();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: CustomerType.INDIVIDUAL,
      country: 'ES',
    },
  });

  const selectedType = form.watch('type');
  const watchedNif = form.watch('nif') ?? '';
  const currentTypeOption = TYPE_OPTIONS.find((o) => o.value === selectedType) ?? TYPE_OPTIONS[0]!;

  // Detección de NIF duplicado en tiempo real
  const { existingCustomer, isSearching } = useCustomerByNif(watchedNif);

  const handleTypeSelect = useCallback(
    (type: CustomerType) => {
      form.setValue('type', type, { shouldValidate: false });
      form.resetField('nif');
      form.resetField('legalName');
      if (type === CustomerType.INTRACOMMUNITY) {
        form.setValue('country', '');
        form.resetField('province');
        form.resetField('postalCode');
      } else {
        form.setValue('country', 'ES');
      }
    },
    [form],
  );

  const onSubmit = async (data: FormData) => {
    // Bloqueamos el submit si el NIF ya existe — el banner ya informa al usuario
    if (existingCustomer) return;
    await createMutation.mutateAsync(buildCreateInput(data));
    router.push('/dashboard/clientes');
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/clientes">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">Clientes</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium">Nuevo cliente</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/clientes">
            <Button variant="outline" size="sm" disabled={createMutation.isPending}>
              Cancelar
            </Button>
          </Link>
          <Button
            size="sm"
            onClick={form.handleSubmit(onSubmit)}
            disabled={createMutation.isPending || !!existingCustomer}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar cliente'
            )}
          </Button>
        </div>
      </div>

      {/* ── Contenido scrollable ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
          {/* ── FILA 1: Tipo de cliente ── */}
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
                    autoComplete="organization"
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

                {/* NIF con spinner de búsqueda */}
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

                {/* Banner de duplicado — aparece inline dentro de la card */}
                {existingCustomer && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40 p-4">
                    <div className="flex items-start gap-3">
                      <UserCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                          Este NIF ya existe en tu cartera
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
                    autoComplete="email"
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
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── FILA 3: Dirección fiscal ── */}
          <div className="rounded-xl border bg-card p-5">
            <SectionLabel icon={Globe}>Dirección fiscal</SectionLabel>
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-6 space-y-2">
                <Label htmlFor="address">Calle y número</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder="Calle Principal, 123, 2°A"
                  autoComplete="street-address"
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
                    autoComplete="postal-code"
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
                <Input
                  id="city"
                  {...form.register('city')}
                  placeholder="Madrid"
                  autoComplete="address-level2"
                />
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

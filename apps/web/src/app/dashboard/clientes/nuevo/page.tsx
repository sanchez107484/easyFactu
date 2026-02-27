'use client';

import { useCallback } from 'react';
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
  MapPin,
  Phone,
  Mail,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateCustomer } from '@/hooks/use-customers';

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
    icon: <User className="h-4 w-4" />,
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
    icon: <Briefcase className="h-4 w-4" />,
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
    icon: <Building2 className="h-4 w-4" />,
    nifLabel: 'CIF',
    nifPlaceholder: 'B12345678',
    nifHint: 'CIF de la sociedad (una letra + 7 dígitos)',
    showLegalName: true,
    legalNameLabel: 'Razón social (nombre legal)',
    isIntracommunity: false,
  },
  {
    value: CustomerType.INTRACOMMUNITY,
    label: 'Intracomunitario',
    description: 'Empresa o particular de la UE',
    icon: <Globe className="h-4 w-4" />,
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
    name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
    legalName: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
    nif: z.string().min(1, 'El NIF/CIF es obligatorio'),
    email: z.string().email('Formato de email no válido').optional().or(z.literal('')),
    phone: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
    address: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
    postalCode: z.string().max(10).optional().or(z.literal('')),
    city: z.string().max(100).optional().or(z.literal('')),
    province: z.string().max(100).optional().or(z.literal('')),
    country: z.string().length(2, 'Código de país de 2 letras').default('ES'),
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
    <p className="flex items-center gap-1.5 text-xs text-destructive mt-1.5">
      <AlertCircle className="h-3 w-3 shrink-0" />
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
  const currentTypeOption = TYPE_OPTIONS.find((o) => o.value === selectedType) ?? TYPE_OPTIONS[0]!;

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
    await createMutation.mutateAsync(buildCreateInput(data));
    router.push('/dashboard/clientes');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* ── Header — mismo patrón que el resto de páginas ── */}
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
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Guardando...' : 'Guardar cliente'}
          </Button>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="flex-1 overflow-y-auto">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
            {/* ── SECCIÓN 1: Tipo de cliente ── */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={BadgeCheck}>Tipo de cliente</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TYPE_OPTIONS.map((option) => {
                  const isSelected = selectedType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleTypeSelect(option.value)}
                      className={cn(
                        'relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 text-center transition-all',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:border-primary/40 hover:bg-muted/30',
                      )}
                    >
                      <div
                        className={cn(
                          'p-2 rounded-md',
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {option.icon}
                      </div>
                      <div>
                        <p className="text-xs font-semibold leading-tight">{option.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── SECCIÓN 2: Identificación fiscal ── */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={FileText}>Identificación fiscal</SectionLabel>
              <div className="space-y-4">
                <div className="space-y-1.5">
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
                  <div className="space-y-1.5">
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

                <div className="space-y-1.5">
                  <Label htmlFor="nif">
                    {currentTypeOption.nifLabel} <span className="text-destructive">*</span>
                  </Label>
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
                    className={cn(!currentTypeOption.isIntracommunity && 'uppercase font-mono')}
                    maxLength={currentTypeOption.isIntracommunity ? 20 : 9}
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">{currentTypeOption.nifHint}</p>
                  <FieldError message={form.formState.errors.nif?.message} />
                </div>
              </div>
            </div>

            {/* ── SECCIÓN 3: Contacto ── */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={Mail}>Contacto</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
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
                <div className="space-y-1.5">
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

            {/* ── SECCIÓN 4: Dirección ── */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={MapPin}>Dirección fiscal</SectionLabel>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="address">Calle y número</Label>
                  <Input
                    id="address"
                    {...form.register('address')}
                    placeholder="Calle Principal, 123, 2°A"
                    autoComplete="street-address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {!currentTypeOption.isIntracommunity && (
                    <div className="space-y-1.5">
                      <Label htmlFor="postalCode">Código postal</Label>
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
                      'space-y-1.5',
                      currentTypeOption.isIntracommunity && 'col-span-2',
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
                </div>

                {!currentTypeOption.isIntracommunity ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
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
                    <div className="space-y-1.5">
                      <Label htmlFor="country">País</Label>
                      <Input
                        id="country"
                        {...form.register('country')}
                        placeholder="ES"
                        maxLength={2}
                        className="uppercase"
                        readOnly
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label htmlFor="country">
                      País <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="country"
                      {...form.register('country')}
                      placeholder="DE"
                      maxLength={2}
                      className="uppercase w-24"
                    />
                    <p className="text-xs text-muted-foreground">
                      Código ISO 3166-1 alpha-2 (ej: FR, DE, IT)
                    </p>
                    <FieldError message={form.formState.errors.country?.message} />
                  </div>
                )}
              </div>
            </div>

            {/* ── SECCIÓN 5: Notas internas ── */}
            <div className="rounded-xl border bg-card p-5">
              <SectionLabel icon={FileText}>Notas internas</SectionLabel>
              <Textarea
                {...form.register('notes')}
                placeholder="Información adicional sobre este cliente (no aparece en facturas)..."
                rows={3}
              />
              <FieldError message={form.formState.errors.notes?.message} />
            </div>

            {/* ── Botones mobile — visibles solo en pantallas pequeñas ── */}
            <div className="flex items-center justify-end gap-3 pt-2 pb-8 sm:hidden">
              <Link href="/dashboard/clientes">
                <Button type="button" variant="outline" disabled={createMutation.isPending}>
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Guardando...' : 'Guardar cliente'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

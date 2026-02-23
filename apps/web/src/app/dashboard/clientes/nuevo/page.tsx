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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
    description: 'Persona fisica sin actividad economica',
    icon: <User className="h-5 w-5" />,
    nifLabel: 'DNI / NIE',
    nifPlaceholder: '12345678Z',
    nifHint: 'DNI (8 digitos + letra) o NIE (X/Y/Z + 7 digitos + letra)',
    showLegalName: false,
    legalNameLabel: '',
    isIntracommunity: false,
  },
  {
    value: CustomerType.SELF_EMPLOYED,
    label: 'Autonomo',
    description: 'Trabajador por cuenta propia',
    icon: <Briefcase className="h-5 w-5" />,
    nifLabel: 'NIF / DNI',
    nifPlaceholder: '12345678Z',
    nifHint: 'DNI (8 digitos + letra) o NIE (X/Y/Z + 7 digitos + letra)',
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
    nifHint: 'CIF de la sociedad (una letra + 7 digitos)',
    showLegalName: true,
    legalNameLabel: 'Razon social (nombre legal)',
    isIntracommunity: false,
  },
  {
    value: CustomerType.INTRACOMMUNITY,
    label: 'Intracomunitario',
    description: 'Empresa o particular de la UE',
    icon: <Globe className="h-5 w-5" />,
    nifLabel: 'NIF intracomunitario',
    nifPlaceholder: 'DE123456789',
    nifHint: 'Numero de IVA intracomunitario del pais de origen',
    showLegalName: false,
    legalNameLabel: '',
    isIntracommunity: true,
  },
];

// ==================== ZOD SCHEMA ====================

const formSchema = z
  .object({
    type: z.nativeEnum(CustomerType),
    name: z.string().min(2, 'Minimo 2 caracteres').max(100, 'Maximo 100 caracteres'),
    legalName: z.string().max(100, 'Maximo 100 caracteres').optional().or(z.literal('')),
    nif: z.string().min(1, 'El NIF/CIF es obligatorio'),
    email: z.string().email('Formato de email no valido').optional().or(z.literal('')),
    phone: z.string().max(20, 'Maximo 20 caracteres').optional().or(z.literal('')),
    address: z.string().max(200, 'Maximo 200 caracteres').optional().or(z.literal('')),
    postalCode: z.string().max(10).optional().or(z.literal('')),
    city: z.string().max(100).optional().or(z.literal('')),
    province: z.string().max(100).optional().or(z.literal('')),
    country: z.string().length(2, 'Codigo de pais de 2 letras').default('ES'),
    notes: z.string().max(500, 'Maximo 500 caracteres').optional().or(z.literal('')),
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
          message: 'NIF/CIF no valido para el tipo seleccionado',
          path: ['nif'],
        });
      }
    }
  });

// ==================== HELPER ====================

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

interface TypeCardProps {
  option: TypeOption;
  selected: boolean;
  onSelect: () => void;
}

function TypeCard({ option, selected, onSelect }: TypeCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative w-full text-left p-4 rounded-lg border-2 transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-background hover:border-primary/40 hover:bg-muted/30',
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-md shrink-0',
            selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          {option.icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm">{option.label}</p>
            {selected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{option.description}</p>
        </div>
      </div>
    </button>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive mt-1">
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
  const currentTypeOption = TYPE_OPTIONS.find((o) => o.value === selectedType) ?? TYPE_OPTIONS[0];

  const handleTypeSelect = useCallback(
    (type: CustomerType) => {
      form.setValue('type', type, { shouldValidate: false });
      // Reset NIF when changing type to avoid validation bleeding
      form.resetField('nif');
      form.resetField('legalName');
      // Reset province and postalCode for intracommunitary
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
    <div className="w-full max-w-6xl mx-auto py-8">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <div className="flex flex-col md:flex-row gap-8">
          {/* Lado izquierdo: tipo y fiscal */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <Link href="/dashboard/clientes">
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Nuevo cliente</h1>
                <p className="text-sm text-muted-foreground">
                  Añade un cliente a tu cartera de facturación
                </p>
              </div>
            </div>
            <div>
              <h2 className="font-semibold mb-2 text-base">Tipo de cliente</h2>
              <div className="grid grid-cols-2 gap-3">
                {TYPE_OPTIONS.map((option) => (
                  <TypeCard
                    key={option.value}
                    option={option}
                    selected={selectedType === option.value}
                    onSelect={() => handleTypeSelect(option.value)}
                  />
                ))}
              </div>
            </div>
            <div className="mt-6">
              <h2 className="font-semibold mb-2 text-base flex items-center gap-2">
                Identificación fiscal
                <Badge variant="outline" className="text-xs font-normal">
                  {currentTypeOption.label}
                </Badge>
              </h2>
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
                        : 'Ej: Juan Perez Garcia'
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
                      placeholder="Ej: ACME Solutions Tecnologicas, S.L."
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
                    className={cn(!currentTypeOption.isIntracommunity && 'uppercase')}
                    maxLength={currentTypeOption.isIntracommunity ? 20 : 9}
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">{currentTypeOption.nifHint}</p>
                  <FieldError message={form.formState.errors.nif?.message} />
                </div>
              </div>
            </div>
          </div>
          {/* Lado derecho: contacto y dirección */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="font-semibold mb-2 text-base">Información de contacto</h2>
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
            <div>
              <h2 className="font-semibold mb-2 text-base">Dirección fiscal</h2>
              <div className="space-y-1.5">
                <Label htmlFor="address">Calle y número</Label>
                <Input
                  id="address"
                  {...form.register('address')}
                  placeholder="Calle Principal, 123, 2°A"
                  autoComplete="street-address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
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
                  className={cn('space-y-1.5', currentTypeOption.isIntracommunity && 'col-span-2')}
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
              {!currentTypeOption.isIntracommunity && (
                <div className="space-y-1.5 mt-2">
                  <Label htmlFor="province">Provincia</Label>
                  <Select
                    value={form.watch('province') ?? ''}
                    onValueChange={(v) => form.setValue('province', v)}
                  >
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
                </div>
              )}
              <div className="space-y-1.5 mt-2">
                <Label htmlFor="country">
                  País{' '}
                  {currentTypeOption.isIntracommunity && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                <Input
                  id="country"
                  {...form.register('country')}
                  placeholder="ES"
                  maxLength={2}
                  className="uppercase w-24"
                />
                <p className="text-xs text-muted-foreground">
                  Código ISO 3166-1 alpha-2 (ej: ES, FR, DE, IT)
                </p>
                <FieldError message={form.formState.errors.country?.message} />
              </div>
            </div>
            <div>
              <h2 className="font-semibold mb-2 text-base">Notas internas</h2>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Información adicional sobre este cliente (no aparece en facturas)..."
                rows={3}
              />
              <FieldError message={form.formState.errors.notes?.message} />
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
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
        </div>
      </form>
    </div>
  );
}

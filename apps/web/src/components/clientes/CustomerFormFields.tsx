'use client';

import { UseFormReturn } from 'react-hook-form';
import { Customer, CustomerType } from '@easyfactura/shared-types';
import { PROVINCES } from '@easyfactura/shared-constants';
import { CustomerFormData } from '@/lib/validators/customer.schema';
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
  User,
  Briefcase,
  Building2,
  Globe,
  Landmark,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionLabel } from '@/components/common/section-label';
import { Switch } from '@/components/ui/switch';

// ==================== TYPES & CONSTANTS ====================

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

export const TYPE_OPTIONS: TypeOption[] = [
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
    value: CustomerType.PUBLIC_ENTITY,
    label: 'Entidad Pública',
    description: 'Ayuntamiento, diputación u organismo público',
    icon: <Landmark className="h-5 w-5" />,
    nifLabel: 'CIF',
    nifPlaceholder: 'P1234567D',
    nifHint: 'CIF de la entidad pública (P/Q/S + 7 dígitos + letra de control)',
    showLegalName: true,
    legalNameLabel: 'Nombre oficial',
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

// ==================== INTERNAL SUB-COMPONENTS ====================

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive mt-1.5">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

// ==================== PROPS ====================

export interface CustomerFormFieldsProps {
  form: UseFormReturn<CustomerFormData>;
  existingCustomer: Customer | null;
  isSearching: boolean;
  onTypeSelect: (type: CustomerType) => void;
  /** Controla si el banner de NIF duplicado es visible */
  showDuplicateBanner: boolean;
  /** Texto del título del banner de duplicado (difiere entre creación y edición) */
  duplicateBannerTitle: string;
  /** Callback para navegar a la ficha del cliente duplicado */
  onDuplicateNavigate: (customerId: string) => void;
  /** Texto del botón de acción del banner de duplicado. Por defecto: "Ver ficha del cliente" */
  duplicateBannerActionLabel?: string;
  /**
   * Muestra el toggle REAGYP. Solo debe activarse cuando el tenant emisor está en régimen REAGYP.
   * Si true, el usuario puede marcar este cliente como "también REAGYP", lo que desactiva la
   * compensación agraria en sus facturas.
   */
  showReagypToggle?: boolean;
}

// ==================== COMPONENT ====================

export function CustomerFormFields({
  form,
  existingCustomer,
  isSearching,
  onTypeSelect,
  showDuplicateBanner,
  duplicateBannerTitle,
  onDuplicateNavigate,
  duplicateBannerActionLabel = 'Ver ficha del cliente',
  showReagypToggle = false,
}: CustomerFormFieldsProps) {
  const selectedType = form.watch('type');
  const currentTypeOption = TYPE_OPTIONS.find((o) => o.value === selectedType) ?? TYPE_OPTIONS[0]!;

  return (
    <div className="space-y-5">
      {/* ── FILA 1: Tipo de cliente ── */}
      <div className="rounded-xl border bg-card p-5">
        <SectionLabel icon={User}>Tipo de cliente</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((option) => {
            const isSelected = selectedType === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onTypeSelect(option.value)}
                title={option.description}
                className={cn(
                  'flex items-center gap-2 rounded-lg border-2 px-3.5 py-2 text-sm font-medium transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted/30',
                )}
              >
                <span
                  className={cn('shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')}
                >
                  {option.icon}
                </span>
                {option.label}
                {isSelected && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
        {/* Descripción del tipo seleccionado */}
        <p className="mt-2.5 text-xs text-muted-foreground">{currentTypeOption.description}</p>
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
                <Label htmlFor="legalName">
                  {currentTypeOption.legalNameLabel}{' '}
                  <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
                </Label>
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

            {/* Banner de duplicado */}
            {showDuplicateBanner && existingCustomer && (
              <div className="rounded-lg border border-customer-200 bg-customer-50 dark:border-customer-800 dark:bg-customer-950/40 p-4">
                <div className="flex items-start gap-3">
                  <UserCheck className="h-5 w-5 text-customer-600 dark:text-customer-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-customer-800 dark:text-customer-300">
                      {duplicateBannerTitle}
                    </p>
                    <div className="mt-2 rounded-md bg-white/60 dark:bg-black/20 border border-customer-200/50 dark:border-customer-700/50 p-3 space-y-0.5">
                      <p className="text-sm font-medium">{existingCustomer.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {existingCustomer.nif}
                      </p>
                      {existingCustomer.email && (
                        <p className="text-xs text-muted-foreground">{existingCustomer.email}</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full border-customer-300 text-customer-800 hover:bg-customer-100 dark:border-customer-700 dark:text-customer-300 dark:hover:bg-customer-900/40"
                      onClick={() => onDuplicateNavigate(existingCustomer.id)}
                    >
                      <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                      {duplicateBannerActionLabel}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Información de contacto */}
        <div className="rounded-xl border bg-card p-5">
          <SectionLabel icon={Briefcase}>Información de contacto</SectionLabel>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
              </Label>
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
              <Label htmlFor="phone">
                Teléfono{' '}
                <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
              </Label>
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
            <Label htmlFor="address">
              Calle y número{' '}
              <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
            </Label>
            <Input
              id="address"
              {...form.register('address')}
              placeholder="Calle Principal, 123, 2°A"
              autoComplete="street-address"
            />
          </div>

          {!currentTypeOption.isIntracommunity && (
            <div className="col-span-2 space-y-2">
              <Label htmlFor="postalCode">
                C. Postal{' '}
                <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
              </Label>
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
            <Label htmlFor="city">
              Ciudad <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
            </Label>
            <Input
              id="city"
              {...form.register('city')}
              placeholder="Madrid"
              autoComplete="address-level2"
            />
          </div>

          {!currentTypeOption.isIntracommunity && (
            <div className="col-span-4 space-y-2">
              <Label>
                Provincia{' '}
                <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
              </Label>
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
              {currentTypeOption.isIntracommunity ? (
                <span className="text-destructive"> *</span>
              ) : (
                <span className="text-muted-foreground text-xs font-normal"> (opcional)</span>
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

      {/* ── FILA 4: REAGYP (solo si el tenant emisor está en REAGYP) ── */}
      {showReagypToggle && (
        <div className="rounded-xl border bg-card p-5">
          <SectionLabel>Régimen fiscal del cliente</SectionLabel>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Este cliente también está en REAGYP</p>
              <p className="text-xs text-muted-foreground">
                Si está activo, la compensación agraria no se aplicará en sus facturas (operación
                B2B entre agricultores acogidos al régimen).
              </p>
              {form.watch('hasEquivalenceSurcharge') && (
                <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 mt-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Desactiva el Recargo de Equivalencia para marcar REAGYP.
                </p>
              )}
            </div>
            <Switch
              id="isReagyp"
              checked={form.watch('isReagyp') ?? false}
              disabled={!!form.watch('hasEquivalenceSurcharge')}
              onCheckedChange={(checked) => form.setValue('isReagyp', checked)}
            />
          </div>
        </div>
      )}

      {/* ── FILA 5: Recargo de Equivalencia ── */}
      <div className="rounded-xl border bg-card px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <SectionLabel>Recargo de Equivalencia</SectionLabel>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Aplica el recargo de equivalencia (Art. 161 LIVA). Tipos: 21%→5,2% | 10%→1,4% | 4%→0,5%.
              {showReagypToggle && ' Incompatible con REAGYP.'}
            </p>
            {showReagypToggle && form.watch('isReagyp') && (
              <p className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 mt-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Desactiva REAGYP para activar el Recargo de Equivalencia.
              </p>
            )}
            <FieldError message={form.formState.errors.hasEquivalenceSurcharge?.message} />
          </div>
          <Switch
            id="hasEquivalenceSurcharge"
            checked={form.watch('hasEquivalenceSurcharge') ?? false}
            disabled={showReagypToggle && !!form.watch('isReagyp')}
            onCheckedChange={(checked) => form.setValue('hasEquivalenceSurcharge', checked)}
          />
        </div>
      </div>

      {/* ── FILA 6: Notas internas ── */}
      <div className="rounded-xl border bg-card p-5">
        <SectionLabel>
          Notas internas{' '}
          <span className="text-muted-foreground text-xs font-normal normal-case tracking-normal">
            (opcional)
          </span>
        </SectionLabel>
        <Textarea
          {...form.register('notes')}
          placeholder="Información adicional sobre este cliente (no aparece en las facturas)..."
          rows={3}
        />
        <FieldError message={form.formState.errors.notes?.message} />
      </div>
    </div>
  );
}

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { validateNif } from '@easyfactura/shared-validators';
import { CustomerType, CreateCustomerInput, Customer } from '@easyfactura/shared-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
  AlertCircle,
  Loader2,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateCustomer, useCustomerByNif } from '@/hooks/use-customers';

// ==================== TYPES ====================

export interface QuickCreateCustomerModalProps {
  open: boolean;
  onClose: () => void;
  /** Se llama cuando el cliente se crea O cuando el usuario selecciona uno existente */
  onCustomerReady: (customer: Customer) => void;
}

// ==================== SCHEMA — solo campos esenciales para facturar ====================

const quickSchema = z
  .object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
    nif: z.string().min(1, 'El NIF/CIF es obligatorio'),
    type: z.nativeEnum(CustomerType),
    email: z.string().email('Email no válido').optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.type !== CustomerType.INTRACOMMUNITY && data.nif) {
      const clean = data.nif
        .toUpperCase()
        .trim()
        .replace(/[\s.-]/g, '');
      const result = validateNif(clean);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NIF/CIF no válido',
          path: ['nif'],
        });
      }
    }
  });

type QuickFormData = z.infer<typeof quickSchema>;

// ==================== TYPE SELECTOR ====================

const TYPE_OPTIONS: {
  value: CustomerType;
  label: string;
  icon: React.ReactNode;
  nifLabel: string;
  nifPlaceholder: string;
  isIntracommunity: boolean;
}[] = [
  {
    value: CustomerType.INDIVIDUAL,
    label: 'Particular',
    icon: <User className="h-4 w-4" />,
    nifLabel: 'DNI / NIE',
    nifPlaceholder: '12345678Z',
    isIntracommunity: false,
  },
  {
    value: CustomerType.SELF_EMPLOYED,
    label: 'Autónomo',
    icon: <Briefcase className="h-4 w-4" />,
    nifLabel: 'NIF / DNI',
    nifPlaceholder: '12345678Z',
    isIntracommunity: false,
  },
  {
    value: CustomerType.COMPANY,
    label: 'Empresa',
    icon: <Building2 className="h-4 w-4" />,
    nifLabel: 'CIF',
    nifPlaceholder: 'B12345678',
    isIntracommunity: false,
  },
  {
    value: CustomerType.INTRACOMMUNITY,
    label: 'UE',
    icon: <Globe className="h-4 w-4" />,
    nifLabel: 'NIF UE',
    nifPlaceholder: 'DE123456789',
    isIntracommunity: true,
  },
];

// ==================== DUPLICATE BANNER ====================

function DuplicateBanner({
  customer,
  onUseExisting,
}: {
  customer: Customer;
  onUseExisting: () => void;
}) {
  return (
    <div className="rounded-lg border border-customer-200 bg-customer-50 dark:border-customer-800 dark:bg-customer-950/40 p-4">
      <div className="flex items-start gap-3">
        <UserCheck className="h-5 w-5 text-customer-600 dark:text-customer-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-customer-800 dark:text-customer-300">
            Este NIF ya existe en tu cartera
          </p>
          <div className="mt-2 rounded-md bg-white/60 dark:bg-black/20 border border-customer-200/50 dark:border-customer-700/50 p-3 space-y-0.5">
            <p className="text-sm font-medium">{customer.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{customer.nif}</p>
            {customer.email && <p className="text-xs text-muted-foreground">{customer.email}</p>}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 border-customer-300 text-customer-800 hover:bg-customer-100 dark:border-customer-700 dark:text-customer-300 dark:hover:bg-customer-900/40 w-full"
            onClick={onUseExisting}
          >
            <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
            Usar este cliente para la factura
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==================== MODAL ====================

export function QuickCreateCustomerModal({
  open,
  onClose,
  onCustomerReady,
}: QuickCreateCustomerModalProps) {
  const createMutation = useCreateCustomer();

  const form = useForm<QuickFormData>({
    resolver: zodResolver(quickSchema),
    defaultValues: {
      type: CustomerType.INDIVIDUAL,
      name: '',
      nif: '',
      email: '',
    },
  });

  // Reset al abrir
  useEffect(() => {
    if (open) {
      form.reset({
        type: CustomerType.INDIVIDUAL,
        name: '',
        nif: '',
        email: '',
      });
    }
  }, [open, form]);

  const watchedType = form.watch('type');
  const watchedNif = form.watch('nif');

  const currentType = TYPE_OPTIONS.find((o) => o.value === watchedType) ?? TYPE_OPTIONS[0]!;

  // Búsqueda de duplicado en tiempo real
  const { existingCustomer, isSearching } = useCustomerByNif(watchedNif);

  const handleUseExisting = () => {
    if (existingCustomer) {
      onCustomerReady(existingCustomer);
      onClose();
    }
  };

  const onSubmit = async (data: QuickFormData) => {
    // Si existe duplicado, no dejamos crear — el usuario debe elegir explícitamente
    if (existingCustomer) return;

    const input: CreateCustomerInput = {
      type: data.type,
      name: data.name.trim(),
      nif: data.nif.trim().toUpperCase(),
      email: data.email?.trim() || undefined,
      country: data.type === CustomerType.INTRACOMMUNITY ? undefined : 'ES',
    };

    const newCustomer = await createMutation.mutateAsync(input);
    onCustomerReady(newCustomer);
    onClose();
  };

  const isSubmitting = createMutation.isPending;
  const hasExisting = !!existingCustomer;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>
            Añade los datos esenciales. Podrás completar la ficha completa más tarde.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5 mt-2">
          {/* Tipo */}
          <div className="grid grid-cols-4 gap-2">
            {TYPE_OPTIONS.map((option) => {
              const isSelected = watchedType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    form.setValue('type', option.value);
                    form.resetField('nif');
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 text-center transition-all text-xs font-medium',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted/30',
                  )}
                >
                  <div
                    className={cn(
                      'p-1.5 rounded-md',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {option.icon}
                  </div>
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="quick-name">
              Nombre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="quick-name"
              {...form.register('name')}
              placeholder={
                watchedType === CustomerType.COMPANY
                  ? 'Ej: ACME Solutions'
                  : 'Ej: Juan Pérez García'
              }
              autoComplete="off"
              autoFocus
            />
            {form.formState.errors.name && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* NIF con indicador de búsqueda */}
          <div className="space-y-2">
            <Label htmlFor="quick-nif">
              {currentType.nifLabel} <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="quick-nif"
                {...form.register('nif', {
                  onChange: (e) => {
                    if (!currentType.isIntracommunity) {
                      e.target.value = e.target.value.toUpperCase();
                    }
                  },
                })}
                placeholder={currentType.nifPlaceholder}
                className={cn(
                  'pr-8',
                  !currentType.isIntracommunity && 'uppercase font-mono tracking-wider',
                )}
                maxLength={currentType.isIntracommunity ? 20 : 9}
                autoComplete="off"
              />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {form.formState.errors.nif && (
              <p className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-3.5 w-3.5" />
                {form.formState.errors.nif.message}
              </p>
            )}
          </div>

          {/* Banner de duplicado — aparece automáticamente si se detecta */}
          {hasExisting && (
            <DuplicateBanner customer={existingCustomer!} onUseExisting={handleUseExisting} />
          )}

          {/* Email — solo visible si no hay duplicado */}
          {!hasExisting && (
            <div className="space-y-2">
              <Label htmlFor="quick-email">
                Email <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
              </Label>
              <Input
                id="quick-email"
                type="email"
                {...form.register('email')}
                placeholder="cliente@ejemplo.com"
                autoComplete="off"
              />
              {form.formState.errors.email && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            {!hasExisting && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear cliente'
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

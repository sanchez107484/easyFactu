'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { CustomerType, CreateCustomerInput, TaxRegime } from '@easyfactura/shared-types';
import { customerFormSchema, CustomerFormData } from '@/lib/validators/customer.schema';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCreateCustomer, useCustomerByNif } from '@/hooks/use-customers';
import { CustomerFormFields } from '@/components/clientes/CustomerFormFields';
import { AgencySharedPoolImport } from '@/components/clientes/AgencySharedPoolImport';
import { useTenant } from '@/hooks/use-tenant';

// ==================== TYPES & CONSTANTS ====================

type FormData = CustomerFormData;

// ==================== ZOD SCHEMA ====================

const formSchema = customerFormSchema;

// ==================== HELPERS ====================

function buildCreateInput(data: FormData): CreateCustomerInput {
  return {
    type: data.type,
    name: data.name.trim(),
    legalName: data.legalName?.trim() || undefined,
    nif: data.nif.trim().toUpperCase(),
    email: data.email?.trim() || undefined,
    phone: data.phone?.trim() || undefined,
    address: data.address?.trim() || undefined,
    postalCode: data.postalCode?.trim() || undefined,
    city: data.city?.trim() || undefined,
    province: data.province?.trim() || undefined,
    country: data.country || 'ES',
    notes: data.notes?.trim() || undefined,
    isReagyp: data.isReagyp ?? false,
  };
}

// ==================== PAGE ====================

export default function NuevoClientePage() {
  const router = useRouter();
  const createMutation = useCreateCustomer();
  const { data: tenant } = useTenant();
  const showReagypToggle = tenant?.taxRegime === TaxRegime.REAGYP;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: CustomerType.INDIVIDUAL,
      country: 'ES',
    },
  });

  const watchedNif = form.watch('nif') ?? '';

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
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <div className="mb-5">
            <AgencySharedPoolImport form={form} />
          </div>
          <CustomerFormFields
            form={form}
            existingCustomer={existingCustomer}
            isSearching={isSearching}
            onTypeSelect={handleTypeSelect}
            showDuplicateBanner={!!existingCustomer}
            duplicateBannerTitle="Este NIF ya existe en tu cartera"
            onDuplicateNavigate={(id) => router.push(`/dashboard/clientes/${id}`)}
            showReagypToggle={showReagypToggle}
          />
        </form>
      </div>
    </div>
  );
}

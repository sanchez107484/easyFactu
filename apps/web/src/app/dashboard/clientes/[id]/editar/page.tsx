'use client';

import { useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { CustomerType, UpdateCustomerInput, CustomerDirectoryEntry } from '@easyfactura/shared-types';
import { customerFormSchema, CustomerFormData } from '@/lib/validators/customer.schema';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useCustomer, useUpdateCustomer, useCustomerByNif, useDirectoryLookup } from '@/hooks/use-customers';
import { CustomerFormFields } from '@/components/clientes/CustomerFormFields';

// ==================== TYPES & CONSTANTS ====================

type FormData = CustomerFormData;

// ==================== ZOD SCHEMA ====================

const formSchema = customerFormSchema;

// ==================== HELPERS ====================

function buildUpdateInput(data: FormData): UpdateCustomerInput {
  return {
    type: data.type,
    name: data.name.trim(),
    legalName: (data.legalName ?? '').trim(),
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

  // FIX: skip=true cuando el NIF actual es igual al original — no alertar al propio cliente
  const nifChanged = watchedNif.toUpperCase().trim() !== originalNif.toUpperCase().trim();
  const { existingCustomer, isSearching } = useCustomerByNif(watchedNif, !nifChanged);

  // Sugerencia del directorio fiscal global (solo si el NIF cambió y no hay duplicado local)
  const shouldSkipDirectoryLookup = !nifChanged || !!existingCustomer;
  const { directorySuggestion } = useDirectoryLookup(
    watchedNif,
    selectedType,
    shouldSkipDirectoryLookup,
  );

  const handleDirectoryAutofill = useCallback(
    (entry: CustomerDirectoryEntry) => {
      form.setValue('name', entry.name, { shouldValidate: true });
      if (entry.legalName) form.setValue('legalName', entry.legalName);
      if (entry.address) form.setValue('address', entry.address);
      if (entry.postalCode) form.setValue('postalCode', entry.postalCode);
      if (entry.city) form.setValue('city', entry.city);
      if (entry.province) form.setValue('province', entry.province);
      form.setValue('country', entry.country || 'ES');
    },
    [form],
  );

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
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CustomerFormFields
            form={form}
            existingCustomer={existingCustomer}
            isSearching={isSearching}
            onTypeSelect={handleTypeSelect}
            showDuplicateBanner={!!existingCustomer && nifChanged}
            duplicateBannerTitle="Este NIF ya pertenece a otro cliente"
            onDuplicateNavigate={(id) => router.push(`/dashboard/clientes/${id}`)}
            directorySuggestion={directorySuggestion}
            onDirectoryAutofill={handleDirectoryAutofill}
          />
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

'use client';

import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CustomerType, CreateCustomerInput, Customer, CustomerDirectoryEntry } from '@easyfactura/shared-types';
import { customerFormSchema, CustomerFormData } from '@/lib/validators/customer.schema';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useCreateCustomer, useCustomerByNif, useDirectoryLookup } from '@/hooks/use-customers';
import { CustomerFormFields } from '@/components/clientes/CustomerFormFields';

// ==================== TYPES ====================

export interface QuickCreateCustomerModalProps {
  open: boolean;
  onClose: () => void;
  /** Se llama cuando el cliente se crea O cuando el usuario selecciona uno existente */
  onCustomerReady: (customer: Customer) => void;
}

// ==================== HELPERS ====================

function buildCreateInput(data: CustomerFormData): CreateCustomerInput {
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
  };
}

// ==================== MODAL ====================

export function QuickCreateCustomerModal({
  open,
  onClose,
  onCustomerReady,
}: QuickCreateCustomerModalProps) {
  const createMutation = useCreateCustomer();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      type: CustomerType.INDIVIDUAL,
      country: 'ES',
    },
  });

  // Reset al abrir
  useEffect(() => {
    if (open) {
      form.reset({
        type: CustomerType.INDIVIDUAL,
        country: 'ES',
      });
    }
  }, [open, form]);

  const watchedNif = form.watch('nif') ?? '';
  const watchedType = form.watch('type');

  const { existingCustomer, isSearching } = useCustomerByNif(watchedNif);

  // Sugerencia del directorio fiscal global (solo para entidades jurídicas, solo si no hay duplicado)
  const { directorySuggestion } = useDirectoryLookup(
    watchedNif,
    watchedType,
    !!existingCustomer,
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

  const handleUseExisting = (_customerId: string) => {
    if (existingCustomer) {
      onCustomerReady(existingCustomer);
      onClose();
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    // Si existe duplicado, no dejamos crear — el banner informa al usuario
    if (existingCustomer) return;

    const newCustomer = await createMutation.mutateAsync(buildCreateInput(data));
    onCustomerReady(newCustomer);
    onClose();
  };

  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Nuevo cliente</DialogTitle>
          <DialogDescription>
            Rellena los datos del cliente. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <CustomerFormFields
              form={form}
              existingCustomer={existingCustomer}
              isSearching={isSearching}
              onTypeSelect={handleTypeSelect}
              showDuplicateBanner={!!existingCustomer}
              duplicateBannerTitle="Este NIF ya existe en tu cartera"
              onDuplicateNavigate={handleUseExisting}
              duplicateBannerActionLabel="Usar este cliente para la factura"
              directorySuggestion={directorySuggestion}
              onDirectoryAutofill={handleDirectoryAutofill}
            />
          </form>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          {!existingCustomer && (
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
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
      </DialogContent>
    </Dialog>
  );
}

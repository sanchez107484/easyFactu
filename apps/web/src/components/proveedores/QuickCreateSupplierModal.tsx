'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Supplier, CreateSupplierInput } from '@easyfactura/shared-types';
import { supplierFormSchema, SupplierFormData } from '@/lib/validators/supplier.schema';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useCreateSupplier } from '@/hooks/use-suppliers';
import { SupplierFormFields } from './SupplierFormFields';

export interface QuickCreateSupplierModalProps {
  open: boolean;
  onClose: () => void;
  onSupplierReady: (supplier: Supplier) => void;
}

function buildCreateInput(data: SupplierFormData): CreateSupplierInput {
  return {
    name: data.name.trim(),
    legalName: data.legalName?.trim() || undefined,
    taxId: data.taxId?.trim().toUpperCase() || undefined,
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

export function QuickCreateSupplierModal({
  open,
  onClose,
  onSupplierReady,
}: QuickCreateSupplierModalProps) {
  const createMutation = useCreateSupplier();

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: '',
      legalName: '',
      taxId: '',
      email: '',
      phone: '',
      address: '',
      postalCode: '',
      city: '',
      province: '',
      country: 'ES',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        legalName: '',
        taxId: '',
        email: '',
        phone: '',
        address: '',
        postalCode: '',
        city: '',
        province: '',
        country: 'ES',
        notes: '',
      });
    }
  }, [open, form]);

  const onSubmit = async (data: SupplierFormData) => {
    const newSupplier = await createMutation.mutateAsync(buildCreateInput(data));
    onSupplierReady(newSupplier);
    onClose();
  };

  const isSubmitting = createMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Nuevo proveedor</DialogTitle>
          <DialogDescription>
            Rellena los datos del proveedor. Los campos marcados con * son obligatorios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <SupplierFormFields form={form} isSubmitting={isSubmitting} />
          </form>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear proveedor'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

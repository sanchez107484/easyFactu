'use client';

import { useRouter } from 'next/navigation';
import { useCreateSupplier } from '@/hooks/use-suppliers';
import { SupplierForm, SupplierFormData } from '../_components/supplier-form';

export default function NuevoProveedorPage() {
  const router = useRouter();
  const createMutation = useCreateSupplier();

  const onSubmit = async (data: SupplierFormData) => {
    await createMutation.mutateAsync({
      name: data.name,
      legalName: data.legalName || undefined,
      taxId: data.taxId || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      postalCode: data.postalCode || undefined,
      city: data.city || undefined,
      province: data.province || undefined,
      country: data.country || 'ES',
      notes: data.notes || undefined,
    });
    router.push('/dashboard/proveedores');
  };

  return (
    <SupplierForm
      mode="create"
      onSubmit={onSubmit}
      isPending={createMutation.isPending}
    />
  );
}

'use client';

import { useRouter, useParams } from 'next/navigation';
import { useSupplier, useUpdateSupplier } from '@/hooks/use-suppliers';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { SupplierForm, SupplierFormData } from '../_components/supplier-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditarProveedorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: supplier, isLoading, error } = useSupplier(id);
  const updateMutation = useUpdateSupplier();
  const canWrite = useHasProfessionalPlan();

  const onSubmit = async (data: SupplierFormData) => {
    await updateMutation.mutateAsync({
      id,
      data: {
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
      },
    });
    router.push('/dashboard/proveedores');
  };

  if (isLoading) {
    return (
      <div className="pb-10">
        <div className="flex items-center gap-3 mb-8">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="pb-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/proveedores">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              ←
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Editar proveedor</h1>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold">No se pudo cargar el proveedor</p>
          <p className="text-sm text-muted-foreground">
            Puede que haya sido eliminado o que no tengas permisos para editarlo.
          </p>
          <Link href="/dashboard/proveedores">
            <Button variant="outline" className="mt-2">
              Volver a proveedores
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SupplierForm
      mode="edit"
      supplier={supplier}
      onSubmit={onSubmit}
      isPending={updateMutation.isPending}
      readOnly={!canWrite}
    />
  );
}

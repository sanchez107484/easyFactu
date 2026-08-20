'use client';

import { useRouter, useParams } from 'next/navigation';
import { useExpense, useUpdateExpense } from '@/hooks/use-expenses';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { ExpenseForm, ExpenseFormData } from '../_components/expense-form';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function EditarGastoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: expense, isLoading, error } = useExpense(id);
  const updateMutation = useUpdateExpense();
  const canWrite = useHasProfessionalPlan();

  const onSubmit = async (data: ExpenseFormData) => {
    await updateMutation.mutateAsync({
      id,
      data: {
        date: data.date,
        description: data.description,
        categoryId: data.categoryId,
        supplierId: data.supplierId || null,
        clientId: data.clientId || null,
        baseAmount: data.baseAmount,
        vatRate: data.vatRate,
        notes: data.notes || null,
      },
    });
    router.push('/dashboard/gastos');
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
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="pb-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/gastos">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              ←
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Editar gasto</h1>
        </div>
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <AlertCircle className="h-10 w-10 text-destructive" />
          <p className="font-semibold">No se pudo cargar el gasto</p>
          <p className="text-sm text-muted-foreground">
            Puede que haya sido eliminado o que no tengas permisos para editarlo.
          </p>
          <Link href="/dashboard/gastos">
            <Button variant="outline" className="mt-2">
              Volver a gastos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ExpenseForm
      mode="edit"
      expense={expense}
      onSubmit={onSubmit}
      isPending={updateMutation.isPending}
      readOnly={!canWrite}
    />
  );
}

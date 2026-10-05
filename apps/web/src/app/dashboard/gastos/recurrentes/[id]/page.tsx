'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { RecurringExpenseForm } from '../_components/recurring-expense-form';
import { useRecurringExpense, useUpdateRecurringExpense } from '@/hooks/use-recurring-expenses';
import { useExpenseCategories } from '@/hooks/use-expense-categories';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useCustomers } from '@/hooks/use-customers';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { UpdateRecurringExpenseInput } from '@easyfactura/shared-types';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditarRecurrentePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const canWrite = useHasProfessionalPlan();

  const { data: recurringExpense, isLoading: isLoadingExpense } = useRecurringExpense(id);
  const { data: categories, isLoading: isLoadingCategories } = useExpenseCategories();
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useSuppliers({ limit: 500 });
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ limit: 500 });
  const mutation = useUpdateRecurringExpense();

  const onSubmit = async (values: UpdateRecurringExpenseInput) => {
    await mutation.mutateAsync({ id, data: values });
    router.push('/dashboard/gastos/recurrentes');
  };

  if (isLoadingExpense || isLoadingCategories || isLoadingSuppliers || isLoadingCustomers) {
    return (
      <div className="pb-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/dashboard/gastos" className="hover:text-foreground flex items-center gap-1">
            Gastos
            <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href="/dashboard/gastos/recurrentes" className="hover:text-foreground flex items-center gap-1">
            Recurrentes
            <ChevronRight className="h-4 w-4" />
          </Link>
          <span>Editar</span>
        </div>
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

  if (!recurringExpense) {
    return (
      <div className="pb-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard/gastos/recurrentes">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
              ←
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Editar gasto recurrente</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium">Gasto recurrente no encontrado.</p>
            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/gastos/recurrentes')} className="mt-4">
              Volver al listado
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <RecurringExpenseForm
      recurringExpense={recurringExpense}
      categories={categories ?? []}
      suppliers={suppliersData?.data ?? []}
      customers={customersData?.data ?? []}
      onSubmit={onSubmit}
      isSubmitting={mutation.isPending}
      readOnly={!canWrite}
    />
  );
}

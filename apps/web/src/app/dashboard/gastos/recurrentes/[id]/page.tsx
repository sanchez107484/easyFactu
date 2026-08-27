'use client';

import { useParams, useRouter } from 'next/navigation';
import { RecurringExpenseForm } from '../_components/recurring-expense-form';
import { useRecurringExpense, useUpdateRecurringExpense } from '@/hooks/use-recurring-expenses';
import { useExpenseCategories } from '@/hooks/use-expense-categories';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useCustomers } from '@/hooks/use-customers';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';
import { UpdateRecurringExpenseInput } from '@easyfactura/shared-types';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!recurringExpense) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
          <p className="text-destructive font-medium">Gasto recurrente no encontrado.</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/gastos/recurrentes')} className="mt-4">
            Volver al listado
          </Button>
        </CardContent>
      </Card>
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

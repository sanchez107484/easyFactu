'use client';

import { useRouter } from 'next/navigation';
import { RecurringExpenseForm } from '../_components/recurring-expense-form';
import { useCreateRecurringExpense } from '@/hooks/use-recurring-expenses';
import { useExpenseCategories } from '@/hooks/use-expense-categories';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useCustomers } from '@/hooks/use-customers';
import { CreateRecurringExpenseInput } from '@easyfactura/shared-types';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function NuevoRecurrentePage() {
  const router = useRouter();
  const mutation = useCreateRecurringExpense();
  const { data: categories, isLoading: isLoadingCategories } = useExpenseCategories();
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useSuppliers({ limit: 500 });
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ limit: 500 });

  const onSubmit = async (values: CreateRecurringExpenseInput) => {
    await mutation.mutateAsync(values);
    router.push('/dashboard/gastos/recurrentes');
  };

  if (isLoadingCategories || isLoadingSuppliers || isLoadingCustomers) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <RecurringExpenseForm
      categories={categories ?? []}
      suppliers={suppliersData?.data ?? []}
      customers={customersData?.data ?? []}
      onSubmit={onSubmit}
      isSubmitting={mutation.isPending}
    />
  );
}

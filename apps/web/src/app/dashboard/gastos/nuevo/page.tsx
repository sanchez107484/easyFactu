'use client';

import { useRouter } from 'next/navigation';
import { useCreateExpense } from '@/hooks/use-expenses';
import { ExpenseForm, ExpenseFormData } from '../_components/expense-form';

export default function NuevoGastoPage() {
  const router = useRouter();
  const createMutation = useCreateExpense();

  const onSubmit = async (data: ExpenseFormData) => {
    await createMutation.mutateAsync({
      date: data.date,
      description: data.description,
      categoryId: data.categoryId,
      supplierId: data.supplierId || null,
      clientId: data.clientId || null,
      baseAmount: data.baseAmount,
      vatRate: data.vatRate,
      notes: data.notes || null,
      attachmentId: data.attachmentId || null,
    });
    router.push('/dashboard/gastos');
  };

  return (
    <ExpenseForm
      mode="create"
      onSubmit={onSubmit}
      isPending={createMutation.isPending}
    />
  );
}

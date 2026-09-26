'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { useCreateExpense, useExpense } from '@/hooks/use-expenses';
import { useCreateRecurringExpense } from '@/hooks/use-recurring-expenses';
import { useUploadExpenseAttachment } from '@/hooks/use-expense-attachments';
import { ExpenseForm, ExpenseFormData } from '../_components/expense-form';
import { compressImage } from '@/lib/image-compression';

function DuplicateExpenseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  const isDuplicating = !!duplicateId;
  const { data: expenseToDuplicate, isLoading } = useExpense(duplicateId ?? '');
  const createMutation = useCreateExpense();
  const createRecurringMutation = useCreateRecurringExpense();
  const uploadMutation = useUploadExpenseAttachment();

  const onSubmit = async (data: ExpenseFormData, pendingFile: File | null) => {
    let attachmentId: string | null = null;

    if (pendingFile) {
      let fileToUpload = pendingFile;

      const isImage = pendingFile.type.startsWith('image/') && pendingFile.type !== 'image/gif';
      if (isImage) {
        const compressed = await compressImage(pendingFile, {
          maxWidth: 1920,
          maxHeight: 1920,
          maxSizeKB: 1024,
          quality: 0.8,
        });
        fileToUpload = compressed.file;
      }

      const uploaded = await uploadMutation.mutateAsync({ file: fileToUpload });
      attachmentId = uploaded.id;
    }

    if (data.isRecurring && data.recurringFrequency) {
      await createRecurringMutation.mutateAsync({
        description: data.description,
        categoryId: data.categoryId,
        supplierId: data.supplierId || null,
        clientId: data.clientId || null,
        baseAmount: data.baseAmount,
        vatRate: data.vatRate,
        frequency: data.recurringFrequency,
        startDate: data.recurringStartDate || new Date().toISOString().split('T')[0],
        endDate: data.recurringEndDate || null,
        notes: data.notes || null,
      });
      if (isDuplicating) {
        toast.success('Gasto recurrente duplicado correctamente');
      } else {
        toast.success('Gasto recurrente creado correctamente');
      }
      router.push('/dashboard/gastos');
    } else {
      const newExpense = await createMutation.mutateAsync({
        date: data.date,
        description: data.description,
        categoryId: data.categoryId,
        supplierId: data.supplierId || null,
        clientId: data.clientId || null,
        baseAmount: data.baseAmount,
        vatRate: data.vatRate,
        notes: data.notes || null,
        attachmentId: attachmentId,
      });
      if (isDuplicating) {
        toast.success('Gasto duplicado correctamente');
        router.push(`/dashboard/gastos/${newExpense.id}`);
      } else {
        toast.success('Gasto creado correctamente');
        router.push('/dashboard/gastos');
      }
    }
  };

  const isPending = createMutation.isPending || createRecurringMutation.isPending;

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando datos del gasto...</div>;
  }

  const expenseForForm = expenseToDuplicate
    ? { ...expenseToDuplicate, date: new Date().toISOString().split('T')[0] }
    : undefined;

  return (
    <ExpenseForm
      mode="create"
      onSubmit={onSubmit}
      isPending={isPending}
      expense={expenseForForm}
    />
  );
}

export default function NuevoGastoPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Cargando...</div>}>
      <DuplicateExpenseForm />
    </Suspense>
  );
}

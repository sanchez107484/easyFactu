'use client';

import { useRouter } from 'next/navigation';
import { useCreateExpense } from '@/hooks/use-expenses';
import { useCreateRecurringExpense } from '@/hooks/use-recurring-expenses';
import { useUploadExpenseAttachment } from '@/hooks/use-expense-attachments';
import { ExpenseForm, ExpenseFormData } from '../_components/expense-form';
import { compressImage } from '@/lib/image-compression';

export default function NuevoGastoPage() {
  const router = useRouter();
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
    } else {
      await createMutation.mutateAsync({
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
    }
    router.push('/dashboard/gastos');
  };

  const isPending = createMutation.isPending || createRecurringMutation.isPending;

  return (
    <ExpenseForm
      mode="create"
      onSubmit={onSubmit}
      isPending={isPending}
    />
  );
}

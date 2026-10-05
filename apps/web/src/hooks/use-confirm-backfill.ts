'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BackfillDialogData, ConfirmBackfillDialog } from '@/components/ui/confirm-backfill-dialog';

type GenerateFn<TData> = (id: string, data?: TData) => Promise<{ generatedCount: number }>;

interface UseConfirmBackfillOptions<TData = unknown> {
  generateFn: GenerateFn<TData>;
  itemType: 'expense' | 'invoice';
  onSuccessNavigateTo?: string;
}

export function useConfirmBackfill<TData = unknown>({
  generateFn,
  itemType,
  onSuccessNavigateTo,
}: UseConfirmBackfillOptions<TData>) {
  const queryClient = useQueryClient();
  const [dialogData, setDialogData] = useState<BackfillDialogData | null>(null);

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: TData }) => generateFn(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses', 'detail'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'summary'] });
      toast.success('Generación completada correctamente');
    },
  });

  const openDialog = useCallback((data: BackfillDialogData) => {
    setDialogData(data);
  }, []);

  const closeDialog = useCallback(() => {
    setDialogData(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!dialogData) return;
    await mutation.mutateAsync({ id: dialogData.id });
    setDialogData(null);
  }, [dialogData, mutation]);

  const ConfirmBackfillDialogComponent = useCallback(
    ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
      <ConfirmBackfillDialog
        open={open}
        onOpenChange={onOpenChange}
        data={dialogData}
        onConfirm={handleConfirm}
        isPending={mutation.isPending}
      />
    ),
    [dialogData, handleConfirm, mutation.isPending],
  );

  return {
    openDialog,
    closeDialog,
    isPending: mutation.isPending,
    ConfirmBackfillDialog: ConfirmBackfillDialogComponent,
  };
}

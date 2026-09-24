'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { expenseAttachmentApi, UploadAttachmentInput } from '@/lib/api/expense-attachment-api';
import { getApiErrorMessage } from '@/lib/api-error';

export function useUploadExpenseAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UploadAttachmentInput) => expenseAttachmentApi.upload(input),
    onSuccess: (_attachment, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'list'] });
      if (variables.expenseId) {
        queryClient.invalidateQueries({ queryKey: ['expenses', 'detail', variables.expenseId] });
      }
      toast.success('Adjunto subido correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteExpenseAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expenseAttachmentApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'list'] });
      toast.success('Adjunto eliminado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

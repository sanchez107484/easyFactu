'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { recurringExpenseApi } from '@/lib/api/recurring-expense-api';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  RecurringExpense,
  PaginatedResponse,
  QueryRecurringExpensesInput,
  CreateRecurringExpenseInput,
  UpdateRecurringExpenseInput,
  GenerateRecurringExpensesInput,
} from '@easyfactura/shared-types';

export function useRecurringExpenses(filters: QueryRecurringExpensesInput = {}) {
  return useQuery({
    queryKey: ['recurring-expenses', 'list', filters],
    queryFn: () => recurringExpenseApi.getAll(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useRecurringExpense(id: string) {
  return useQuery({
    queryKey: ['recurring-expenses', 'detail', id],
    queryFn: () => recurringExpenseApi.getById(id),
    enabled: Boolean(id),
  });
}

export function usePrefetchRecurringExpense() {
  const queryClient = useQueryClient();
  return (id: string) => {
    if (!id) return;
    void queryClient.prefetchQuery({
      queryKey: ['recurring-expenses', 'detail', id],
      queryFn: () => recurringExpenseApi.getById(id),
      staleTime: 30_000,
    });
  };
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecurringExpenseInput) => recurringExpenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses', 'list'] });
      toast.success('Gasto recurrente creado correctamente');
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecurringExpenseInput }) =>
      recurringExpenseApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses', 'detail', variables.id] });
      const isPausing = variables.data.isActive === false;
      toast.success(
        isPausing
          ? 'Gasto recurrente pausado'
          : 'Gasto recurrente activado'
      );
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recurringExpenseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses', 'list'] });
      toast.success('Gasto recurrente eliminado correctamente');
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useGenerateRecurringExpenses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: GenerateRecurringExpensesInput }) =>
      recurringExpenseApi.generate(id, data),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-expenses', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'summary'] });
      toast.success(`Se han generado ${result.generatedCount} gasto(s)`);
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export interface GenerateDialogState {
  item: RecurringExpense | null;
  isOpen: boolean;
}

export function useGenerateRecurringExpensesDialog() {
  const [dialogState, setDialogState] = useState<GenerateDialogState>({ item: null, isOpen: false });
  const mutation = useGenerateRecurringExpenses();

  const openDialog = useCallback((item: RecurringExpense) => {
    setDialogState({ item, isOpen: true });
  }, []);

  const closeDialog = useCallback(() => {
    if (!mutation.isPending) {
      setDialogState({ item: null, isOpen: false });
    }
  }, [mutation.isPending]);

  const confirmGenerate = useCallback(async () => {
    const item = dialogState.item;
    if (!item) return;

    try {
      await mutation.mutateAsync({ id: item.id });
      setDialogState({ item: null, isOpen: false });
    } catch {
      // Error handled by mutation
    }
  }, [dialogState.item, mutation]);

  return {
    dialogState,
    isPending: mutation.isPending,
    error: mutation.error,
    openDialog,
    closeDialog,
    confirmGenerate,
  };
}

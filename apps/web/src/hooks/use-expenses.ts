'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { expenseApi } from '@/lib/api/expense-api';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  QueryExpensesInput,
  CreateExpenseInput,
  UpdateExpenseInput,
} from '@easyfactura/shared-types';

export function useExpenses(filters: QueryExpensesInput = {}) {
  return useQuery({
    queryKey: ['expenses', 'list', filters],
    queryFn: () => expenseApi.getAll(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ['expenses', 'detail', id],
    queryFn: () => expenseApi.getById(id),
    enabled: Boolean(id),
  });
}

export function usePrefetchExpense() {
  const queryClient = useQueryClient();
  return (id: string) => {
    if (!id) return;
    void queryClient.prefetchQuery({
      queryKey: ['expenses', 'detail', id],
      queryFn: () => expenseApi.getById(id),
      staleTime: 30_000,
    });
  };
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseInput) => expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'summary'] });
      toast.success('Gasto creado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseInput }) => expenseApi.update(id, data),
    onSuccess: (expense) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'summary'] });
      queryClient.setQueryData(['expenses', 'detail', expense.id], expense);
      toast.success('Gasto actualizado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expenseApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['expenses', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['expenses', 'summary'] });
      queryClient.removeQueries({ queryKey: ['expenses', 'detail', id] });
      toast.success('Gasto eliminado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useExpenseSummary() {
  return useQuery({
    queryKey: ['expenses', 'summary'],
    queryFn: () => expenseApi.getSummary(),
    staleTime: 30_000,
  });
}

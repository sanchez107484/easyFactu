'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { customerApi } from '@/lib/api/customer-api';
import { seriesApi } from '@/lib/api/series-api';
import {
  QueryCustomersInput,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@easyfactura/shared-types';

function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message[0];
  }
  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

export function useCustomers(filters: QueryCustomersInput = {}) {
  return useQuery({
    queryKey: ['customers', 'list', filters],
    queryFn: () => customerApi.getAll({ ...filters, limit: 100 }),
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', 'detail', id],
    queryFn: () => customerApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCustomerInput) => customerApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente creado correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerInput }) =>
      customerApi.update(id, data),
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ['customers', 'list'] });
      queryClient.setQueryData(['customers', 'detail', customer.id], customer);
      toast.success('Cliente actualizado correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => customerApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cliente eliminado correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useInvoiceSeries(year?: number) {
  const currentYear = year ?? new Date().getFullYear();
  return useQuery({
    queryKey: ['invoice-series', 'list', currentYear],
    queryFn: () => seriesApi.getAll(currentYear),
  });
}

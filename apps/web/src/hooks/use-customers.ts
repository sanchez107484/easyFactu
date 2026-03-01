'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { customerApi } from '@/lib/api/customer-api';
import { seriesApi } from '@/lib/api/series-api';
import {
  Customer,
  PaginatedResponse,
  QueryCustomersInput,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@easyfactura/shared-types';

// ==================== HELPERS ====================

function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message[0];
  }
  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

// ==================== CUSTOMERS ====================

export function useCustomers(
  filters: QueryCustomersInput = {},
  options?: { enabled?: boolean; staleTime?: number },
) {
  return useQuery({
    queryKey: ['customers', 'list', filters],
    queryFn: () => customerApi.getAll({ ...filters, limit: 100 }),
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime,
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
    onSuccess: (newCustomer) => {
      // Add immediately to all cached list pages so Selects show the new customer right away
      queryClient.setQueriesData<PaginatedResponse<Customer>>(
        { queryKey: ['customers', 'list'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [newCustomer, ...old.data],
            meta: { ...old.meta, total: old.meta.total + 1 },
          };
        },
      );
      // Also invalidate so the server state is eventually reconciled
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

// ==================== NIF DUPLICATE DETECTION ====================

const NIF_DEBOUNCE_MS = 600;
const NIF_MIN_LENGTH = 7;

interface UseCustomerByNifResult {
  existingCustomer: Customer | null;
  isSearching: boolean;
}

/**
 * Busca un cliente por NIF con debounce de 600ms.
 * No lanza ninguna query si el NIF tiene menos de 7 caracteres.
 *
 * @param nif  - NIF a buscar (se normaliza internamente: uppercase, sin espacios ni puntos)
 * @param skip - desactiva la búsqueda (útil en modo edición del propio cliente)
 */
export function useCustomerByNif(nif: string, skip = false): UseCustomerByNifResult {
  const [debouncedNif, setDebouncedNif] = useState('');

  const cleanNif = nif
    .toUpperCase()
    .trim()
    .replace(/[\s.-]/g, '');

  useEffect(() => {
    if (skip || cleanNif.length < NIF_MIN_LENGTH) {
      setDebouncedNif('');
      return;
    }
    const timer = setTimeout(() => setDebouncedNif(cleanNif), NIF_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [cleanNif, skip]);

  const { data, isFetching } = useCustomers(
    { nif: debouncedNif, limit: 1 },
    {
      enabled: !!debouncedNif && !skip,
      staleTime: 30_000,
    },
  );

  return {
    existingCustomer: data?.data?.[0] ?? null,
    isSearching: isFetching && !!debouncedNif,
  };
}

// ==================== INVOICE SERIES ====================

export function useInvoiceSeries(year?: number) {
  const currentYear = year ?? new Date().getFullYear();
  return useQuery({
    queryKey: ['invoice-series', 'list', currentYear],
    queryFn: () => seriesApi.getAll(currentYear),
  });
}

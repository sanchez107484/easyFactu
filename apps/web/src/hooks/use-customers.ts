'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { customerApi } from '@/lib/api/customer-api';
import { getApiErrorMessage } from '@/lib/api-error';
import { seriesApi } from '@/lib/api/series-api';
import {
  Customer,
  SharedPoolCustomer,
  PaginatedResponse,
  QueryCustomersInput,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '@easyfactura/shared-types';

// ==================== CUSTOMERS ====================

export function useCustomers(
  filters: QueryCustomersInput = {},
  options?: { enabled?: boolean; staleTime?: number },
) {
  return useQuery({
    queryKey: ['customers', 'list', filters],
    queryFn: () => customerApi.getAll(filters),
    enabled: options?.enabled ?? true,
    staleTime: options?.staleTime ?? 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', 'detail', id],
    queryFn: () => customerApi.getById(id),
    enabled: Boolean(id),
  });
}

/**
 * Returns a prefetcher that warms the customer-detail cache on hover/focus.
 * Use it in list rows so the detail page renders instantly when clicked.
 */
export function usePrefetchCustomer() {
  const queryClient = useQueryClient();
  return (id: string) => {
    if (!id) return;
    void queryClient.prefetchQuery({
      queryKey: ['customers', 'detail', id],
      queryFn: () => customerApi.getById(id),
      staleTime: 30_000,
    });
  };
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
      // Mark list as stale so the next visit/mount reconciles with the server,
      // but do NOT trigger an immediate background refetch — that would race
      // with the parent form's setValue and could briefly clear the Select value.
      queryClient.invalidateQueries({ queryKey: ['customers', 'list'], refetchType: 'none' });
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
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['customers', 'list'] });
      queryClient.removeQueries({ queryKey: ['customers', 'detail', id] });
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

// ==================== AGENCY SHARED POOL ====================

const SHARED_POOL_MIN_LENGTH = 2;

/**
 * Searches customers across sibling tenants in the same agency network.
 * Only fires when the search term is at least 2 characters long.
 * Returns an empty array when no agency relation exists — never throws.
 */
export function useSharedCustomerPool(search: string) {
  const trimmed = search.trim();
  return useQuery({
    queryKey: ['customers', 'shared-pool', trimmed],
    queryFn: () => customerApi.getSharedPool(trimmed),
    enabled: trimmed.length >= SHARED_POOL_MIN_LENGTH,
    staleTime: 30_000,
    placeholderData: [] as SharedPoolCustomer[],
  });
}

/**
 * Copies a customer from the agency shared pool into the current tenant.
 * If the customer (by NIF) already exists locally, returns the existing one.
 * On success, updates the local customers cache so selects react immediately.
 */
export function useImportFromPool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (nif: string) => customerApi.importFromPool(nif),
    onSuccess: (importedCustomer) => {
      queryClient.setQueriesData<PaginatedResponse<Customer>>(
        { queryKey: ['customers', 'list'] },
        (old) => {
          if (!old) return old;
          if (old.data.some((c) => c.id === importedCustomer.id)) return old;
          return {
            ...old,
            data: [importedCustomer, ...old.data],
            meta: { ...old.meta, total: old.meta.total + 1 },
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['customers', 'list'], refetchType: 'none' });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

'use client';

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supplierApi } from '@/lib/api/supplier-api';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  Supplier,
  PaginatedResponse,
  QuerySuppliersInput,
  CreateSupplierInput,
  UpdateSupplierInput,
} from '@easyfactura/shared-types';

export function useSuppliers(filters: QuerySuppliersInput = {}) {
  return useQuery({
    queryKey: ['suppliers', 'list', filters],
    queryFn: () => supplierApi.getAll(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: ['suppliers', 'detail', id],
    queryFn: () => supplierApi.getById(id),
    enabled: Boolean(id),
  });
}

export function usePrefetchSupplier() {
  const queryClient = useQueryClient();
  return (id: string) => {
    if (!id) return;
    void queryClient.prefetchQuery({
      queryKey: ['suppliers', 'detail', id],
      queryFn: () => supplierApi.getById(id),
      staleTime: 30_000,
    });
  };
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierInput) => supplierApi.create(data),
    onSuccess: (newSupplier) => {
      queryClient.setQueriesData<PaginatedResponse<Supplier>>(
        { queryKey: ['suppliers', 'list'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: [newSupplier, ...old.data],
            meta: { ...old.meta, total: old.meta.total + 1 },
          };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'], refetchType: 'none' });
      toast.success('Proveedor creado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierInput }) => supplierApi.update(id, data),
    onSuccess: (supplier) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] });
      queryClient.setQueryData(['suppliers', 'detail', supplier.id], supplier);
      toast.success('Proveedor actualizado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => supplierApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', 'list'] });
      queryClient.removeQueries({ queryKey: ['suppliers', 'detail', id] });
      toast.success('Proveedor eliminado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

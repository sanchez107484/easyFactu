'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invoiceTemplateApi } from '@/lib/api/invoice-template-api';
import { CreateInvoiceTemplateInput, UpdateInvoiceTemplateInput } from '@easyfactura/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';

// ==================== QUERY KEYS ====================

export const templateKeys = {
  all: ['invoice-templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  default: () => [...templateKeys.all, 'default'] as const,
};

// ==================== QUERIES ====================

export function useInvoiceTemplates() {
  return useQuery({
    queryKey: templateKeys.lists(),
    queryFn: () => invoiceTemplateApi.getAll(),
    staleTime: 5 * 60_000,
  });
}

export function useInvoiceTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => invoiceTemplateApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useDefaultTemplate() {
  return useQuery({
    queryKey: templateKeys.default(),
    queryFn: () => invoiceTemplateApi.getDefault(),
  });
}

// ==================== MUTATIONS ====================

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceTemplateInput) => invoiceTemplateApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success('Plantilla creada correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceTemplateInput }) =>
      invoiceTemplateApi.update(id, data),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.setQueryData(templateKeys.detail(template.id), template);
      queryClient.invalidateQueries({ queryKey: templateKeys.default() });
      toast.success('Plantilla guardada correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useSetDefaultTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceTemplateApi.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templateKeys.default() });
      toast.success('Plantilla establecida como predeterminada');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceTemplateApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success('Plantilla eliminada correctamente');
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

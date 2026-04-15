'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AxiosError } from 'axios';
import { seriesApi } from '@/lib/api/series-api';
import { CreateInvoiceSeriesInput, UpdateInvoiceSeriesInput } from '@easyfactura/shared-types';

export const seriesKeys = {
  all: ['invoice-series'] as const,
  lists: () => [...seriesKeys.all, 'list'] as const,
  list: (year?: number) => [...seriesKeys.lists(), { year }] as const,
};

function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message[0];
  }
  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

export function useInvoiceSeries(year?: number) {
  return useQuery({
    queryKey: seriesKeys.list(year),
    queryFn: () => seriesApi.getAll(year),
    staleTime: 5 * 60_000,
  });
}

export function useCreateSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceSeriesInput) => seriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.lists() });
      toast.success('Serie de facturación creada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInvoiceSeriesInput }) =>
      seriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.lists() });
      toast.success('Serie actualizada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteSeries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => seriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.lists() });
      toast.success('Serie eliminada');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

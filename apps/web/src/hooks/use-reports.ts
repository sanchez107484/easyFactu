'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ProductAliasInput,
  ReportHistoryEntry,
  ReportRequest,
} from '@easyfactura/shared-types';
import { reportApi } from '@/lib/api/report-api';
import { getApiErrorMessage } from '@/lib/api-error';
import { triggerBlobDownload } from '@/lib/blob-download';
import { useHasProfessionalPlan } from '@/hooks/use-current-plan';

export const reportKeys = {
  all: ['reports'] as const,
  preview: (request: ReportRequest) => [...reportKeys.all, 'preview', request] as const,
  history: (page: number, limit: number) => [...reportKeys.all, 'history', page, limit] as const,
};

/** Preview data for the applied request. Pass null until the user applies the filters. */
export function useReportPreview(request: ReportRequest | null) {
  const isPro = useHasProfessionalPlan();
  return useQuery({
    queryKey: request ? reportKeys.preview(request) : reportKeys.all,
    queryFn: () => {
      if (!request) throw new Error('No hay ningún informe aplicado');
      return reportApi.preview(request);
    },
    enabled: isPro && request !== null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

export function useReportHistory(page: number, limit = 10) {
  const isPro = useHasProfessionalPlan();
  return useQuery({
    queryKey: reportKeys.history(page, limit),
    queryFn: () => reportApi.getHistory(page, limit),
    enabled: isPro,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ReportRequest) => reportApi.generate(request),
    onSuccess: ({ blob, filename }) => {
      triggerBlobDownload(blob, filename);
      queryClient.invalidateQueries({ queryKey: [...reportKeys.all, 'history'] });
      toast.success('Informe generado y guardado en el histórico');
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useDownloadHistoryReport() {
  return useMutation({
    mutationFn: (entry: ReportHistoryEntry) => reportApi.downloadFromHistory(entry),
    onSuccess: ({ blob, filename }) => triggerBlobDownload(blob, filename),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

/** Connects a free-text description to a catalog product, with a one-click undo. */
export function useLinkProductAlias() {
  const queryClient = useQueryClient();
  const refreshReports = () =>
    queryClient.invalidateQueries({ queryKey: [...reportKeys.all, 'preview'] });

  return useMutation({
    mutationFn: (input: ProductAliasInput) => reportApi.linkProductAlias(input),
    onSuccess: (alias) => {
      refreshReports();
      toast.success(`Conectado con «${alias.productName}»`, {
        description: 'Las líneas con este concepto cuentan ahora para ese artículo.',
        action: {
          label: 'Deshacer',
          onClick: () => {
            reportApi
              .deleteProductAlias(alias.id)
              .then(refreshReports)
              .catch((error: unknown) => toast.error(getApiErrorMessage(error)));
          },
        },
      });
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

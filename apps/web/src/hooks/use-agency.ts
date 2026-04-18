import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { agencyApi } from '@/lib/api/agency-api';
import { getErrorMessage } from '@/lib/api-client';
import { triggerBlobDownload } from '@/lib/blob-download';
import type {
  QueryAgencyClientsInput,
  CreateDirectClientInput,
  InviteClientInput,
  ExportContaPlusInput,
} from '@easyfactura/shared-types';

const AGENCY_KEYS = {
  all: ['agency'] as const,
  stats: () => [...AGENCY_KEYS.all, 'stats'] as const,
  clients: (query?: QueryAgencyClientsInput) => [...AGENCY_KEYS.all, 'clients', query] as const,
  client: (id: string) => [...AGENCY_KEYS.all, 'clients', id] as const,
  invitations: () => [...AGENCY_KEYS.all, 'invitations'] as const,
  sharedCustomers: (search?: string, page?: number) =>
    [...AGENCY_KEYS.all, 'shared-customers', search, page] as const,
  fiscalAlerts: (id: string) => [...AGENCY_KEYS.all, 'fiscal-alerts', id] as const,
  fiscalAlertsSummary: () => [...AGENCY_KEYS.all, 'fiscal-alerts-summary'] as const,
  exportLogs: (clientTenantId?: string, page?: number) =>
    [...AGENCY_KEYS.all, 'export-logs', clientTenantId, page] as const,
};

export function useAgencyStats() {
  return useQuery({
    queryKey: AGENCY_KEYS.stats(),
    queryFn: agencyApi.getStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAgencyClients(query?: QueryAgencyClientsInput) {
  return useQuery({
    queryKey: AGENCY_KEYS.clients(query),
    queryFn: () => agencyApi.getClients(query),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useAgencyClient(clientTenantId: string) {
  return useQuery({
    queryKey: AGENCY_KEYS.client(clientTenantId),
    queryFn: () => agencyApi.getClient(clientTenantId),
    staleTime: 30 * 1000,
  });
}

export function useUpdateClientNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientTenantId, notes }: { clientTenantId: string; notes: string }) =>
      agencyApi.updateClientNotes(clientTenantId, notes),
    onSuccess: (_data, { clientTenantId }) => {
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.client(clientTenantId) });
      toast.success('Notas guardadas');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCreateDirectClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDirectClientInput) => agencyApi.createDirectClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.all });
      toast.success('Cliente añadido correctamente');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useInviteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteClientInput) => agencyApi.inviteClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.all });
      toast.success('Invitación enviada correctamente');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRevokeClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientTenantId: string) => agencyApi.revokeClient(clientTenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.all });
      toast.success('Acceso revocado');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useAgencySharedCustomers(search?: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: AGENCY_KEYS.sharedCustomers(search, page),
    queryFn: () => agencyApi.getSharedCustomers(search, page),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useAgencyPendingInvitations() {
  return useQuery({
    queryKey: AGENCY_KEYS.invitations(),
    queryFn: agencyApi.getPendingInvitations,
    staleTime: 30 * 1000,
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => agencyApi.cancelInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.all });
      toast.success('Invitación cancelada');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useExportContaPlus() {
  return useMutation({
    mutationFn: ({
      clientTenantId,
      params,
    }: {
      clientTenantId: string;
      params: ExportContaPlusInput;
    }) => agencyApi.exportContaPlus(clientTenantId, params),
    onSuccess: ({ blob, filename, invoicesCount, totalRevenue }) => {
      triggerBlobDownload(blob, filename);
      toast.success(
        `${invoicesCount} factura${invoicesCount !== 1 ? 's' : ''} exportada${invoicesCount !== 1 ? 's' : ''} · ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalRevenue)}`,
      );
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useClientFiscalAlerts(clientTenantId: string, enabled = true) {
  return useQuery({
    queryKey: AGENCY_KEYS.fiscalAlerts(clientTenantId),
    queryFn: () => agencyApi.getFiscalAlerts(clientTenantId),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes — fiscal checks are expensive
  });
}

export function useFiscalAlertsSummary(enabled = true) {
  return useQuery({
    queryKey: AGENCY_KEYS.fiscalAlertsSummary(),
    queryFn: agencyApi.getFiscalAlertsSummary,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useExportLogs(clientTenantId?: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: AGENCY_KEYS.exportLogs(clientTenantId, page),
    queryFn: () => agencyApi.getExportLogs(clientTenantId, page),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
}

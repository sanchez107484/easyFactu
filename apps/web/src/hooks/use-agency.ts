import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { agencyApi } from '@/lib/api/agency-api';
import type { IdentifierCheckResult } from '@/lib/api/agency-api';
import { getErrorMessage } from '@/lib/api-client';
import { triggerBlobDownload } from '@/lib/blob-download';
import { validateNif } from '@easyfactura/shared-validators';
import { useDebounce } from '@/hooks/use-debounce';
import type {
  QueryAgencyClientsInput,
  CreateDirectClientInput,
  InviteClientInput,
  ExportContaPlusInput,
  ReceivedInvitation,
  MyAgencyRelation,
  AgencyInvitationFull,
} from '@easyfactura/shared-types';

const AGENCY_KEYS = {
  all: ['agency'] as const,
  stats: () => [...AGENCY_KEYS.all, 'stats'] as const,
  quarterlyIva: () => [...AGENCY_KEYS.all, 'quarterly-iva'] as const,
  clients: (query?: QueryAgencyClientsInput) => [...AGENCY_KEYS.all, 'clients', query] as const,
  client: (id: string) => [...AGENCY_KEYS.all, 'clients', id] as const,
  invitations: () => [...AGENCY_KEYS.all, 'invitations'] as const,
  allInvitations: () => [...AGENCY_KEYS.all, 'invitations-all'] as const,
  receivedInvitations: () => [...AGENCY_KEYS.all, 'received-invitations'] as const,
  myAgencies: () => [...AGENCY_KEYS.all, 'my-agencies'] as const,
  sharedCustomers: (search?: string, page?: number) =>
    [...AGENCY_KEYS.all, 'shared-customers', search, page] as const,
  fiscalAlerts: (id: string) => [...AGENCY_KEYS.all, 'fiscal-alerts', id] as const,
  fiscalAlertsSummary: () => [...AGENCY_KEYS.all, 'fiscal-alerts-summary'] as const,
  exportLogs: (clientTenantId?: string, page?: number) =>
    [...AGENCY_KEYS.all, 'export-logs', clientTenantId, page] as const,
};

export function useAgencyStats(enabled = true) {
  return useQuery({
    queryKey: AGENCY_KEYS.stats(),
    queryFn: agencyApi.getStats,
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled,
  });
}

export function useAgencyClients(query?: QueryAgencyClientsInput, enabled = true) {
  return useQuery({
    queryKey: AGENCY_KEYS.clients(query),
    queryFn: () => agencyApi.getClients(query),
    staleTime: 30 * 1000, // 30 seconds
    enabled,
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
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.clients() });
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.stats() });
      toast.success('Cliente añadido correctamente');
    },
    onError: (error) => {
      // NIF_EXISTS and EMAIL_EXISTS are handled inline by the page — skip toast
      const code = (error as { response?: { data?: { code?: string } } }).response?.data?.code;
      if (code === 'NIF_EXISTS' || code === 'EMAIL_EXISTS') return;
      toast.error(getErrorMessage(error));
    },
  });
}

export function useInviteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteClientInput) => agencyApi.inviteClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.invitations() });
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.stats() });
      toast.success('Invitación enviada correctamente');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCheckNif(nif: string) {
  const normalizedNif = nif.toUpperCase().trim();
  const isValidNif = normalizedNif.length >= 9 && validateNif(normalizedNif).isValid;

  const query = useQuery({
    queryKey: [...AGENCY_KEYS.all, 'check-nif', normalizedNif] as const,
    queryFn: () => agencyApi.checkNif(normalizedNif),
    enabled: isValidNif,
    staleTime: 30 * 1000,
    retry: false,
  });

  return {
    nifCheck: isValidNif ? query.data : undefined,
    isCheckingNif: query.isFetching,
  };
}

export function useCheckIdentifier(q: string) {
  const trimmed = q.trim();
  const isEmail = trimmed.includes('@');

  // NIF: debounce corto (el NIF tiene longitud fija, se completa de golpe)
  // Email: debounce largo (el usuario escribe libremente)
  const debounced = useDebounce(trimmed, isEmail ? 400 : 150);

  const isValidEmail = isEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(debounced);
  const isValidNif =
    !isEmail && debounced.length >= 9 && validateNif(debounced.toUpperCase()).isValid;
  const enabled = isValidEmail || isValidNif;

  return useQuery<IdentifierCheckResult>({
    queryKey: [...AGENCY_KEYS.all, 'check-identifier', debounced] as const,
    queryFn: () => agencyApi.checkIdentifier(debounced),
    enabled,
    staleTime: 30 * 1000,
    retry: false,
  });
}

export function useRevokeClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientTenantId: string) => agencyApi.revokeClient(clientTenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.clients() });
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.stats() });
      toast.success('Cliente dado de baja correctamente');
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

export function useAgencyPendingInvitations(enabled = true) {
  return useQuery({
    queryKey: AGENCY_KEYS.invitations(),
    queryFn: agencyApi.getPendingInvitations,
    staleTime: 30 * 1000,
    enabled,
  });
}

export function useReceivedInvitations() {
  return useQuery<ReceivedInvitation[]>({
    queryKey: AGENCY_KEYS.receivedInvitations(),
    queryFn: agencyApi.getReceivedInvitations,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => agencyApi.acceptInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.receivedInvitations() });
      toast.success('Te has vinculado a la asesoría correctamente');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useRejectInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => agencyApi.rejectInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.receivedInvitations() });
      toast.success('Has rechazado la invitación');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => agencyApi.cancelInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.invitations() });
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.stats() });
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

export function useAllInvitations() {
  return useQuery<AgencyInvitationFull[]>({
    queryKey: AGENCY_KEYS.allInvitations(),
    queryFn: agencyApi.getAllInvitations,
    staleTime: 30 * 1000,
  });
}

export function useMyAgencies() {
  return useQuery<MyAgencyRelation[]>({
    queryKey: AGENCY_KEYS.myAgencies(),
    queryFn: agencyApi.getMyAgencies,
    staleTime: 60 * 1000,
  });
}

export function useRevokeMyAgency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agencyTenantId: string) => agencyApi.revokeMyAgency(agencyTenantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AGENCY_KEYS.myAgencies() });
      toast.success('Acceso de la asesoría revocado correctamente');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
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

export function useAgencyQuarterlyIva() {
  return useQuery({
    queryKey: AGENCY_KEYS.quarterlyIva(),
    queryFn: agencyApi.getQuarterlyIvaSummary,
    staleTime: 5 * 60 * 1000,
  });
}

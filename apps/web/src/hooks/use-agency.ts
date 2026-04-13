import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { agencyApi } from '@/lib/api/agency-api';
import { getErrorMessage } from '@/lib/api-client';
import type {
  QueryAgencyClientsInput,
  CreateDirectClientInput,
  InviteClientInput,
} from '@easyfactura/shared-types';

const AGENCY_KEYS = {
  all: ['agency'] as const,
  stats: () => [...AGENCY_KEYS.all, 'stats'] as const,
  clients: (query?: QueryAgencyClientsInput) => [...AGENCY_KEYS.all, 'clients', query] as const,
  client: (id: string) => [...AGENCY_KEYS.all, 'clients', id] as const,
  invitations: () => [...AGENCY_KEYS.all, 'invitations'] as const,
  sharedCustomers: (search?: string) => [...AGENCY_KEYS.all, 'shared-customers', search] as const,
};

export function useAgencyStats() {
  return useQuery({
    queryKey: AGENCY_KEYS.stats(),
    queryFn: agencyApi.getStats,
  });
}

export function useAgencyClients(query?: QueryAgencyClientsInput) {
  return useQuery({
    queryKey: AGENCY_KEYS.clients(query),
    queryFn: () => agencyApi.getClients(query),
  });
}

export function useAgencyClient(clientTenantId: string) {
  return useQuery({
    queryKey: AGENCY_KEYS.client(clientTenantId),
    queryFn: () => agencyApi.getClient(clientTenantId),
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

export function useAgencySharedCustomers(search?: string, enabled = true) {
  return useQuery({
    queryKey: AGENCY_KEYS.sharedCustomers(search),
    queryFn: () => agencyApi.getSharedCustomers(search),
    enabled,
  });
}

export function useAgencyPendingInvitations() {
  return useQuery({
    queryKey: AGENCY_KEYS.invitations(),
    queryFn: agencyApi.getPendingInvitations,
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

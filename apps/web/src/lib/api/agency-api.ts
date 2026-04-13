import { apiClient } from '@/lib/api-client';
import { unwrapApiResponse } from '@/lib/api-response';
import type {
  AgencyClientWithDetails,
  AgencyClientDetail,
  AgencyInvitation,
  PaginatedResponse,
  CreateDirectClientInput,
  InviteClientInput,
  QueryAgencyClientsInput,
  Customer,
} from '@easyfactura/shared-types';

interface AgencyStats {
  totalClients: number;
  activeClients: number;
  pendingInvitations: number;
  clientsNeedingAttention: number;
}

export interface InvitationPublicInfo {
  inviteeName: string | null;
  agencyName: string;
  agencyNif: string;
  agencyCity: string | null;
  expiresAt: string;
  status: string;
}

export const agencyApi = {
  getStats: async (): Promise<AgencyStats> => {
    const response = await apiClient.get('/agency/stats');
    return unwrapApiResponse(response);
  },

  getClients: async (
    query?: QueryAgencyClientsInput,
  ): Promise<PaginatedResponse<AgencyClientWithDetails>> => {
    const response = await apiClient.get('/agency/clients', { params: query });
    return unwrapApiResponse(response);
  },

  createDirectClient: async (data: CreateDirectClientInput): Promise<AgencyClientWithDetails> => {
    const response = await apiClient.post('/agency/clients/direct', data);
    return unwrapApiResponse(response);
  },

  inviteClient: async (data: InviteClientInput): Promise<AgencyInvitation> => {
    const response = await apiClient.post('/agency/clients/invite', data);
    return unwrapApiResponse(response);
  },

  revokeClient: async (clientTenantId: string): Promise<void> => {
    await apiClient.delete(`/agency/clients/${clientTenantId}`);
  },

  acceptInvitation: async (token: string): Promise<AgencyClientWithDetails> => {
    const response = await apiClient.post(`/agency/invitations/${token}/accept`);
    return unwrapApiResponse(response);
  },

  getInvitationInfo: async (token: string): Promise<InvitationPublicInfo> => {
    const response = await apiClient.get(`/agency/invitations/${token}`);
    return unwrapApiResponse(response);
  },

  getPendingInvitations: async (): Promise<AgencyInvitation[]> => {
    const response = await apiClient.get('/agency/invitations');
    return unwrapApiResponse(response);
  },

  cancelInvitation: async (id: string): Promise<void> => {
    await apiClient.patch(`/agency/invitations/${id}/cancel`);
  },

  getClient: async (clientTenantId: string): Promise<AgencyClientDetail> => {
    const response = await apiClient.get(`/agency/clients/${clientTenantId}`);
    return unwrapApiResponse(response);
  },

  updateClientNotes: async (clientTenantId: string, notes: string): Promise<void> => {
    await apiClient.patch(`/agency/clients/${clientTenantId}/notes`, { notes });
  },

  getSharedCustomers: async (search?: string): Promise<Customer[]> => {
    const response = await apiClient.get('/agency/shared-customers', {
      params: search ? { search } : undefined,
    });
    return unwrapApiResponse(response);
  },
};

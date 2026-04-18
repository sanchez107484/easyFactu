import { apiClient } from '@/lib/api-client';
import { unwrapApiResponse } from '@/lib/api-response';
import type {
  AgencyStats,
  AgencyClientWithDetails,
  AgencyClientDetail,
  AgencyInvitation,
  PaginatedResponse,
  CreateDirectClientInput,
  InviteClientInput,
  QueryAgencyClientsInput,
  Customer,
  FiscalAlert,
  FiscalAlertSummaryItem,
  AgencyExportLogEntry,
  ExportContaPlusInput,
} from '@easyfactura/shared-types';

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

  getSharedCustomers: async (
    search?: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<Customer>> => {
    const response = await apiClient.get('/agency/shared-customers', {
      params: { search: search || undefined, page, limit },
    });
    return unwrapApiResponse(response);
  },

  /**
   * Downloads a ContaPlus .txt export for a client.
   * Returns a Blob so the caller can trigger a browser download.
   */
  exportContaPlus: async (
    clientTenantId: string,
    params: ExportContaPlusInput,
  ): Promise<{ blob: Blob; filename: string; invoicesCount: number; totalRevenue: number }> => {
    const response = await apiClient.get(`/agency/clients/${clientTenantId}/export/contaplus`, {
      params: { year: params.year, quarter: params.quarter },
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'] as string | undefined;
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] ?? `ContaPlus_${params.year}.txt`;
    const invoicesCount = parseInt(response.headers['x-invoices-count'] ?? '0', 10);
    const totalRevenue = parseFloat(response.headers['x-total-revenue'] ?? '0');

    return { blob: response.data as Blob, filename, invoicesCount, totalRevenue };
  },

  getFiscalAlerts: async (clientTenantId: string): Promise<FiscalAlert[]> => {
    const response = await apiClient.get(`/agency/clients/${clientTenantId}/fiscal-alerts`);
    return unwrapApiResponse(response);
  },

  getFiscalAlertsSummary: async (): Promise<FiscalAlertSummaryItem[]> => {
    const response = await apiClient.get('/agency/fiscal-alerts/summary');
    return unwrapApiResponse(response);
  },

  getExportLogs: async (
    clientTenantId?: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<AgencyExportLogEntry>> => {
    const response = await apiClient.get('/agency/export-logs', {
      params: { clientTenantId, page, limit },
    });
    return unwrapApiResponse(response);
  },
};

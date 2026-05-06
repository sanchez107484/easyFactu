import { apiClient } from '@/lib/api-client';
import { unwrapApiResponse } from '@/lib/api-response';
import type {
  AgencyStats,
  AgencyClientWithDetails,
  AgencyClientDetail,
  AgencyInvitation,
  AgencyInvitationFull,
  MyAgencyRelation,
  ReceivedInvitation,
  PaginatedResponse,
  CreateDirectClientInput,
  InviteClientInput,
  QueryAgencyClientsInput,
  Customer,
  FiscalAlert,
  FiscalAlertSummaryItem,
  AgencyExportLogEntry,
  ExportContaPlusInput,
  QuarterlyIvaSummary,
  ResendActivationInput,
  InvoicesForExportResponse,
  ExportInvoicesInput,
  ExportMode,
  ExportFormat,
  AgencyInvoicesQuery,
  AgencyInvoicesResponse,
  AgencyImpersonationLogQuery,
  AgencyImpersonationLogResponse,
} from '@easyfactura/shared-types';

export interface InvitationPublicInfo {
  inviteeName: string | null;
  agencyName: string;
  agencyNif: string;
  agencyCity: string | null;
  expiresAt: string;
  status: string;
}

export type NifCheckStatus = 'AVAILABLE' | 'ALREADY_IN_PORTFOLIO' | 'EXISTS_CAN_INVITE';

export interface NifCheckResult {
  status: NifCheckStatus;
  email?: string;
  businessName?: string;
}

export type IdentifierCheckStatus =
  | 'AVAILABLE'
  | 'ALREADY_IN_PORTFOLIO'
  | 'EXISTS_CAN_INVITE'
  | 'EMAIL_EXISTS';

export type IdentifierCheckResult =
  | { status: 'AVAILABLE'; identifierType?: 'nif' | 'email' }
  | { status: 'EMAIL_EXISTS' }
  | {
      status: 'ALREADY_IN_PORTFOLIO';
      email: string;
      businessName: string;
      nif: string;
      city: string | null;
      province: string | null;
    }
  | {
      status: 'EXISTS_CAN_INVITE';
      email: string;
      businessName: string;
      nif: string;
      city: string | null;
      province: string | null;
    };

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

  checkNif: async (nif: string): Promise<NifCheckResult> => {
    const response = await apiClient.get('/agency/clients/check-nif', { params: { nif } });
    return unwrapApiResponse(response);
  },

  checkIdentifier: async (q: string): Promise<IdentifierCheckResult> => {
    const response = await apiClient.get('/agency/clients/check-identifier', { params: { q } });
    return unwrapApiResponse(response);
  },

  acceptInvitation: async (token: string): Promise<AgencyClientWithDetails> => {
    const response = await apiClient.post(`/agency/invitations/${token}/accept`);
    return unwrapApiResponse(response);
  },
  rejectInvitation: async (token: string): Promise<void> => {
    await apiClient.post(`/agency/invitations/${token}/reject`);
  },

  getReceivedInvitations: async (): Promise<ReceivedInvitation[]> => {
    const response = await apiClient.get('/agency/invitations/received');
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

  getQuarterlyIvaSummary: async (): Promise<QuarterlyIvaSummary> => {
    const response = await apiClient.get('/agency/stats/quarterly-iva');
    return unwrapApiResponse(response);
  },

  /** Consolidated multi-client invoices with filters + aggregated summary. */
  getAllClientsInvoices: async (
    query: AgencyInvoicesQuery = {},
  ): Promise<AgencyInvoicesResponse> => {
    const response = await apiClient.get('/agency/invoices', { params: query });
    return unwrapApiResponse(response);
  },

  /** Audit trail of agency users impersonating client tenants. */
  getImpersonationLogs: async (
    query: AgencyImpersonationLogQuery = {},
  ): Promise<AgencyImpersonationLogResponse> => {
    const response = await apiClient.get('/agency/impersonation-logs', { params: query });
    return unwrapApiResponse(response);
  },

  /** Returns all invitations sent by the agency (across all statuses). */
  getAllInvitations: async (): Promise<AgencyInvitationFull[]> => {
    const response = await apiClient.get('/agency/invitations/all');
    return unwrapApiResponse(response);
  },

  /** Returns agencies that have active access to the current client tenant. */
  getMyAgencies: async (): Promise<MyAgencyRelation[]> => {
    const response = await apiClient.get('/agency/my-agencies');
    return unwrapApiResponse(response);
  },

  /** Client revokes an agency's access to their account. */
  revokeMyAgency: async (agencyTenantId: string): Promise<void> => {
    await apiClient.delete(`/agency/my-agencies/${agencyTenantId}`);
  },

  /**
   * Resend the activation link to the client. Optionally updates the email first.
   * Throws 409 if the client has already verified their email.
   */
  resendActivation: async (
    clientTenantId: string,
    data: ResendActivationInput,
  ): Promise<{ email: string }> => {
    const response = await apiClient.post(
      `/agency/clients/${clientTenantId}/resend-activation`,
      data,
    );
    return unwrapApiResponse(response);
  },

  // ─── New export API (3-mode export system) ────────────────────────────────

  /**
   * Returns the list of invoices and their export status for the preview modal.
   * mode=PENDING → only never-exported by this agency
   * mode=PERIOD  → all confirmed in the given date range
   * mode=MANUAL  → all confirmed (caller selects via checkboxes)
   */
  getInvoicesForExport: async (
    clientTenantId: string,
    mode: ExportMode,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<InvoicesForExportResponse> => {
    const response = await apiClient.get(`/agency/clients/${clientTenantId}/invoices-for-export`, {
      params: { mode, dateFrom, dateTo },
    });
    return unwrapApiResponse(response);
  },

  /**
   * Runs the export, registers InvoiceExportEvents, and returns a downloadable blob.
   */
  exportInvoices: async (
    clientTenantId: string,
    data: ExportInvoicesInput,
  ): Promise<{ blob: Blob; filename: string; invoicesCount: number; totalRevenue: number }> => {
    const response = await apiClient.post(`/agency/clients/${clientTenantId}/export`, data, {
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'] as string | undefined;
    const filenameMatch = disposition?.match(/filename="?([^"]+)"?/);
    const filename = filenameMatch?.[1] ?? `export_${clientTenantId}.txt`;
    const invoicesCount = parseInt(response.headers['x-invoices-count'] ?? '0', 10);
    const totalRevenue = parseFloat(response.headers['x-total-revenue'] ?? '0');

    return { blob: response.data as Blob, filename, invoicesCount, totalRevenue };
  },

  /** Returns the agency's preferred export software, or null if not set. */
  getPreferredExportFormat: async (): Promise<{ format: ExportFormat | null }> => {
    const response = await apiClient.get('/agency/export/preferred-format');
    return unwrapApiResponse(response);
  },

  /** Persists the agency's preferred export software. */
  updatePreferredExportFormat: async (format: ExportFormat): Promise<void> => {
    await apiClient.patch('/agency/export/preferred-format', { format });
  },
};

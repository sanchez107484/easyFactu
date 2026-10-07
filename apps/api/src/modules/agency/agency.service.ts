import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AgencyClientService } from './agency-client.service';
import { AgencyInvitationService } from './agency-invitation.service';
import { AgencyInvoiceService } from './agency-invoice.service';
import { AgencyStatsService } from './agency-stats.service';
import { AgencyImpersonationService } from './agency-impersonation.service';
import { AgencyRequestService } from './agency-request.service';
import { CreateDirectClientDto } from './dto/create-direct-client.dto';
import { InviteClientDto } from './dto/invite-client.dto';
import { QueryAgencyClientsDto } from './dto/query-agency-clients.dto';
import { QueryAgencyInvoicesDto } from './dto/query-agency-invoices.dto';
import { QueryImpersonationLogsDto } from './dto/query-impersonation-logs.dto';
import { ResendActivationDto } from './dto/resend-activation.dto';
import { SendAgencyRequestDto } from './dto/send-agency-request.dto';
import { QueryAgencyRequestsDto } from './dto/query-agency-requests.dto';

@Injectable()
export class AgencyService {
  constructor(
    private prisma: PrismaService,
    private clientService: AgencyClientService,
    private invitationService: AgencyInvitationService,
    private invoiceService: AgencyInvoiceService,
    private statsService: AgencyStatsService,
    private impersonationService: AgencyImpersonationService,
    private requestService: AgencyRequestService,
  ) {}

  // ─── Stats ──────────────────────────────────────────────────────────────

  getAgencyStats(agencyTenantId: string) {
    return this.statsService.getAgencyStats(agencyTenantId);
  }

  getQuarterlyIvaSummary(agencyTenantId: string) {
    return this.statsService.getQuarterlyIvaSummary(agencyTenantId);
  }

  getFiscalAlertsSummary(agencyTenantId: string) {
    return this.statsService.getFiscalAlertsSummary(agencyTenantId);
  }

  // ─── Clients ────────────────────────────────────────────────────────────

  findAllClients(agencyTenantId: string, query: QueryAgencyClientsDto) {
    return this.clientService.findAllClients(agencyTenantId, query);
  }

  findOneClient(agencyTenantId: string, clientTenantId: string) {
    return this.clientService.findOneClient(agencyTenantId, clientTenantId);
  }

  updateClientNotes(agencyTenantId: string, clientTenantId: string, notes: string) {
    return this.clientService.updateClientNotes(agencyTenantId, clientTenantId, notes);
  }

  revokeClient(agencyTenantId: string, clientTenantId: string, terminatedByUserId: string) {
    return this.clientService.revokeClient(agencyTenantId, clientTenantId, terminatedByUserId);
  }

  findSharedCustomers(agencyTenantId: string, search?: string, page = 1, limit = 20) {
    return this.clientService.findSharedCustomers(agencyTenantId, search, page, limit);
  }

  findMyAgencies(clientTenantId: string) {
    return this.clientService.findMyAgencies(clientTenantId);
  }

  revokeMyAgency(clientTenantId: string, agencyTenantId: string, terminatedByUserId: string) {
    return this.clientService.revokeMyAgency(clientTenantId, agencyTenantId, terminatedByUserId);
  }

  getExportLogs(agencyTenantId: string, clientTenantId?: string, page = 1, limit = 20) {
    return this.clientService.getExportLogs(agencyTenantId, clientTenantId, page, limit);
  }

  // ─── Public search ───────────────────────────────────────────────────────

  searchAgencyPublic(q: string) {
    return this.invitationService.searchAgencyPublic(q);
  }

  // ─── Invitations ────────────────────────────────────────────────────────

  checkNif(agencyTenantId: string, nif: string) {
    return this.invitationService.checkNif(agencyTenantId, nif);
  }

  checkIdentifier(agencyTenantId: string, q: string) {
    return this.invitationService.checkIdentifier(agencyTenantId, q);
  }

  createDirectClient(agencyTenantId: string, addedByUserId: string, dto: CreateDirectClientDto) {
    return this.invitationService.createDirectClient(agencyTenantId, addedByUserId, dto);
  }

  resendActivation(agencyTenantId: string, clientTenantId: string, dto: ResendActivationDto) {
    return this.invitationService.resendActivation(agencyTenantId, clientTenantId, dto);
  }

  inviteClient(agencyTenantId: string, dto: InviteClientDto) {
    return this.invitationService.inviteClient(agencyTenantId, dto);
  }

  findInvitationByToken(token: string) {
    return this.invitationService.findInvitationByToken(token);
  }

  acceptInvitation(token: string, clientTenantId: string, userId: string, userEmail: string) {
    return this.invitationService.acceptInvitation(token, clientTenantId, userId, userEmail);
  }

  rejectInvitation(token: string, clientTenantId: string, userEmail: string) {
    return this.invitationService.rejectInvitation(token, clientTenantId, userEmail);
  }

  findPendingInvitations(agencyTenantId: string) {
    return this.invitationService.findPendingInvitations(agencyTenantId);
  }

  findAllInvitations(agencyTenantId: string) {
    return this.invitationService.findAllInvitations(agencyTenantId);
  }

  cancelInvitation(agencyTenantId: string, invitationId: string) {
    return this.invitationService.cancelInvitation(agencyTenantId, invitationId);
  }

  getReceivedInvitations(userEmail: string) {
    return this.invitationService.getReceivedInvitations(userEmail);
  }

  // ─── Invoices ───────────────────────────────────────────────────────────

  findAllClientsInvoices(agencyTenantId: string, query: QueryAgencyInvoicesDto) {
    return this.invoiceService.findAllClientsInvoices(agencyTenantId, query);
  }

  // ─── Impersonation ──────────────────────────────────────────────────────

  findImpersonationLogs(agencyTenantId: string, query: QueryImpersonationLogsDto) {
    return this.impersonationService.findImpersonationLogs(agencyTenantId, query);
  }

  // ─── Agency Requests (client-initiated) ─────────────────────────────────

  sendAgencyRequest(clientTenantId: string, dto: SendAgencyRequestDto) {
    return this.requestService.sendAgencyRequest(clientTenantId, dto);
  }

  findReceivedRequests(agencyTenantId: string, query: QueryAgencyRequestsDto) {
    return this.requestService.findReceivedRequests(agencyTenantId, query);
  }

  findMyRequests(clientTenantId: string, query: QueryAgencyRequestsDto) {
    return this.requestService.findMyRequests(clientTenantId, query);
  }

  acceptAgencyRequest(agencyTenantId: string, requestId: string, userId: string) {
    return this.requestService.acceptAgencyRequest(agencyTenantId, requestId, userId);
  }

  rejectAgencyRequest(agencyTenantId: string, requestId: string, reason?: string) {
    return this.requestService.rejectAgencyRequest(agencyTenantId, requestId, reason);
  }

  cancelAgencyRequest(clientTenantId: string, requestId: string) {
    return this.requestService.cancelAgencyRequest(clientTenantId, requestId);
  }

  getReceivedRequestsCount(agencyTenantId: string) {
    return this.requestService.getReceivedRequestsCount(agencyTenantId);
  }

  sendAgencyReferral(clientTenantId: string, dto: { agencyEmail: string; message?: string }) {
    return this.requestService.sendAgencyReferral(clientTenantId, dto);
  }

  findMyReferrals(clientTenantId: string) {
    return this.requestService.findMyReferrals(clientTenantId);
  }

  acceptViaEmailToken(requestId: string, token: string) {
    return this.requestService.acceptViaEmailToken(requestId, token);
  }
}

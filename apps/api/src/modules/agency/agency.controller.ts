import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AgencyService } from './agency.service';
import { CreateDirectClientDto } from './dto/create-direct-client.dto';
import { InviteClientDto } from './dto/invite-client.dto';
import { QueryAgencyClientsDto } from './dto/query-agency-clients.dto';
import { QueryAgencyInvoicesDto } from './dto/query-agency-invoices.dto';
import { QueryImpersonationLogsDto } from './dto/query-impersonation-logs.dto';
import { ResendActivationDto } from './dto/resend-activation.dto';
import {
  ExportInvoicesDto,
  QueryInvoicesForExportDto,
  UpdatePreferredFormatDto,
} from './dto/export-invoices.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SkipAgencyGuard } from '../../common/decorators/skip-agency-guard.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgencyAccessGuard } from '../../common/guards/agency-access.guard';
import { AgencyExportService } from './agency-export.service';
import { FiscalValidatorService } from './fiscal-validator.service';

@ApiTags('agency')
@ApiBearerAuth()
@Controller('agency')
@UseGuards(JwtAuthGuard, AgencyAccessGuard)
export class AgencyController {
  constructor(
    private readonly agencyService: AgencyService,
    private readonly agencyExportService: AgencyExportService,
    private readonly fiscalValidatorService: FiscalValidatorService
  ) {}

  // ─── Stats / hub overview ───────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas resumen del panel de asesoría' })
  @ApiResponse({ status: 200, description: 'Estadísticas devueltas correctamente' })
  getStats(@CurrentTenant() tenantId: string) {
    return this.agencyService.getAgencyStats(tenantId);
  }

  @Get('stats/quarterly-iva')
  @ApiOperation({ summary: 'Resumen de IVA trimestral agregado de todos los clientes activos' })
  @ApiResponse({ status: 200, description: 'Resumen IVA del trimestre en curso' })
  getQuarterlyIvaSummary(@CurrentTenant() tenantId: string) {
    return this.agencyService.getQuarterlyIvaSummary(tenantId);
  }

  // ─── Consolidated invoices across all clients ──────────────────────────

  @Get('invoices')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({
    summary: 'Listado consolidado de facturas de todos los clientes con filtros y resumen agregado',
  })
  @ApiResponse({ status: 200, description: 'Facturas paginadas con totales del filtro actual' })
  findAllClientsInvoices(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryAgencyInvoicesDto
  ) {
    return this.agencyService.findAllClientsInvoices(tenantId, query);
  }

  // ─── Impersonation audit log ──────────────────────────────────

  @Get('impersonation-logs')
  @ApiOperation({
    summary: 'Auditoría: registro de accesos de los usuarios de la asesoría como cliente',
  })
  @ApiResponse({ status: 200, description: 'Listado paginado del log de impersonación' })
  findImpersonationLogs(
    @CurrentTenant() tenantId: string,
    @Query() query: QueryImpersonationLogsDto
  ) {
    return this.agencyService.findImpersonationLogs(tenantId, query);
  }

  // ─── Client management ─────────────────────────────────────────────────

  @Get('clients')
  @ApiOperation({ summary: 'Listar clientes de la asesoría' })
  findAllClients(@CurrentTenant() tenantId: string, @Query() query: QueryAgencyClientsDto) {
    return this.agencyService.findAllClients(tenantId, query);
  }

  @Post('clients/direct')
  @ApiOperation({ summary: 'Dar de alta un cliente directamente (crea su tenant)' })
  @ApiResponse({ status: 201, description: 'Cliente creado y vinculado' })
  @ApiResponse({ status: 409, description: 'NIF ya registrado' })
  createDirectClient(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDirectClientDto
  ) {
    return this.agencyService.createDirectClient(tenantId, userId, dto);
  }

  @Post('clients/invite')
  @ApiOperation({ summary: 'Invitar a un cliente existente/nuevo por email' })
  @ApiResponse({ status: 201, description: 'Invitación enviada' })
  inviteClient(@CurrentTenant() tenantId: string, @Body() dto: InviteClientDto) {
    return this.agencyService.inviteClient(tenantId, dto);
  }

  @Delete('clients/:clientTenantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revocar acceso a un cliente' })
  @ApiResponse({ status: 204, description: 'Acceso revocado' })
  revokeClient(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('clientTenantId', ParseUUIDPipe) clientTenantId: string
  ) {
    return this.agencyService.revokeClient(tenantId, clientTenantId, userId);
  }

  @Get('clients/check-nif')
  @ApiOperation({ summary: 'Comprueba si un NIF ya tiene cuenta (detección en tiempo real)' })
  @ApiResponse({ status: 200, description: 'Estado del NIF' })
  checkNif(@CurrentTenant() tenantId: string, @Query('nif') nif: string) {
    return this.agencyService.checkNif(tenantId, nif);
  }

  @Get('clients/check-identifier')
  @ApiOperation({ summary: 'Comprueba un NIF o email para vinculación en tiempo real' })
  @ApiResponse({ status: 200, description: 'Estado del identificador' })
  checkIdentifier(@CurrentTenant() tenantId: string, @Query('q') q: string) {
    return this.agencyService.checkIdentifier(tenantId, q);
  }

  @Get('clients/:clientTenantId')
  @ApiOperation({ summary: 'Detalle de un cliente de la cartera' })
  findOneClient(
    @CurrentTenant() tenantId: string,
    @Param('clientTenantId', ParseUUIDPipe) clientTenantId: string
  ) {
    return this.agencyService.findOneClient(tenantId, clientTenantId);
  }

  @Patch('clients/:clientTenantId/notes')
  @ApiOperation({ summary: 'Actualizar notas de la relación con un cliente' })
  updateClientNotes(
    @CurrentTenant() tenantId: string,
    @Param('clientTenantId', ParseUUIDPipe) clientTenantId: string,
    @Body('notes') notes: string
  ) {
    return this.agencyService.updateClientNotes(tenantId, clientTenantId, notes);
  }

  @Post('clients/:clientTenantId/resend-activation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reenviar (o corregir email y reenviar) el enlace de activación de un cliente',
  })
  @ApiResponse({ status: 200, description: 'Enlace de activación enviado' })
  @ApiResponse({ status: 409, description: 'El cliente ya ha verificado su cuenta' })
  resendActivation(
    @CurrentTenant() tenantId: string,
    @Param('clientTenantId', ParseUUIDPipe) clientTenantId: string,
    @Body() dto: ResendActivationDto
  ) {
    return this.agencyService.resendActivation(tenantId, clientTenantId, dto);
  }

  // ─── Invitations ────────────────────────────────────────────────────────

  @Get('invitations')
  @ApiOperation({ summary: 'Listar invitaciones pendientes de la asesoría' })
  findPendingInvitations(@CurrentTenant() tenantId: string) {
    return this.agencyService.findPendingInvitations(tenantId);
  }

  /**
   * Returns ALL invitations sent by the agency across all statuses (for the history modal).
   * Declared BEFORE GET invitations/:token to avoid NestJS routing conflict.
   */
  @Get('invitations/all')
  @ApiOperation({ summary: 'Historial completo de invitaciones enviadas por la asesoría' })
  findAllInvitations(@CurrentTenant() tenantId: string) {
    return this.agencyService.findAllInvitations(tenantId);
  }

  /** Returns pending invitations received by the authenticated user (non-agency clients).
   *  Declared BEFORE GET invitations/:token to prevent NestJS capturing "received" as :token. */
  @SkipAgencyGuard()
  @Get('invitations/received')
  @ApiOperation({ summary: 'Invitaciones de asesoría recibidas por el usuario autenticado' })
  getReceivedInvitations(@CurrentUser('email') userEmail: string) {
    return this.agencyService.getReceivedInvitations(userEmail);
  }

  /**
   * Public endpoint — no auth required. Returns safe public info about the invitation.
   * AgencyAccessGuard is bypassed automatically because @Public() skips it.
   * Declared AFTER the static /received route to avoid conflict.
   */
  @Public()
  @Get('invitations/:token')
  @ApiOperation({ summary: 'Obtener información pública de una invitación (sin autenticación)' })
  @ApiResponse({ status: 200, description: 'Datos de la invitación' })
  @ApiResponse({ status: 404, description: 'Invitación no encontrada o expirada' })
  getInvitationInfo(@Param('token') token: string) {
    return this.agencyService.findInvitationByToken(token);
  }

  /** Called by the CLIENT (non-AGENCY tenant) to accept an invitation from an agency. */
  @SkipAgencyGuard()
  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Aceptar invitación de asesoría (llamado por el cliente)' })
  acceptInvitation(
    @Param('token') token: string,
    @CurrentTenant() clientTenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('email') userEmail: string
  ) {
    return this.agencyService.acceptInvitation(token, clientTenantId, userId, userEmail);
  }

  /** Called by the CLIENT (non-AGENCY tenant) to reject an invitation from an agency. */
  @SkipAgencyGuard()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('invitations/:token/reject')
  @ApiOperation({ summary: 'Rechazar invitación de asesoría (llamado por el cliente)' })
  rejectInvitation(
    @Param('token') token: string,
    @CurrentTenant() clientTenantId: string,
    @CurrentUser('email') userEmail: string
  ) {
    return this.agencyService.rejectInvitation(token, clientTenantId, userEmail);
  }

  @Patch('invitations/:id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar una invitación pendiente' })
  cancelInvitation(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.agencyService.cancelInvitation(tenantId, id);
  }

  // ─── Shared customer pool ───────────────────────────────────────────────

  @Get('shared-customers')
  @ApiOperation({ summary: 'Directorio de clientes compartidos de la asesoría (paginado)' })
  findSharedCustomers(
    @CurrentTenant() tenantId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    return this.agencyService.findSharedCustomers(
      tenantId,
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20
    );
  }

  // ─── Export: invoices preview + run + preferred format ─────────────────

  @Get('clients/:clientTenantId/invoices-for-export')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Vista previa de facturas para exportar (modal paso 2)' })
  @ApiResponse({ status: 200, description: 'Facturas con estado de exportación' })
  getInvoicesForExport(
    @CurrentTenant() tenantId: string,
    @Param('clientTenantId', ParseUUIDPipe) clientTenantId: string,
    @Query() query: QueryInvoicesForExportDto
  ) {
    return this.agencyExportService.getInvoicesForExport(
      tenantId,
      clientTenantId,
      query.mode,
      query.dateFrom,
      query.dateTo
    );
  }

  @Post('clients/:clientTenantId/export')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ejecutar exportación y descargar el archivo' })
  @ApiResponse({ status: 200, description: 'Archivo generado y descargado' })
  async exportInvoices(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('clientTenantId', ParseUUIDPipe) clientTenantId: string,
    @Body() body: ExportInvoicesDto,
    @Res() res: Response
  ) {
    const { fileBuffer, filename, invoicesCount, totalRevenue } =
      await this.agencyExportService.exportInvoices(
        tenantId,
        clientTenantId,
        userId,
        body.format,
        body.mode,
        body.dateFrom,
        body.dateTo,
        body.invoiceIds
      );

    res.setHeader('Content-Type', 'text/plain; charset=windows-1252');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(fileBuffer.length));
    res.setHeader('X-Invoices-Count', String(invoicesCount));
    res.setHeader('X-Total-Revenue', String(totalRevenue));
    res.send(fileBuffer);
  }

  @Get('export/preferred-format')
  @ApiOperation({ summary: 'Formato de exportación preferido de la asesoría' })
  @ApiResponse({ status: 200, description: 'Formato preferido' })
  getPreferredExportFormat(@CurrentTenant() tenantId: string) {
    return this.agencyExportService.getPreferredFormat(tenantId).then((format) => ({ format }));
  }

  @Patch('export/preferred-format')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Actualizar el formato de exportación preferido de la asesoría' })
  @ApiResponse({ status: 204, description: 'Formato actualizado' })
  async updatePreferredExportFormat(
    @CurrentTenant() tenantId: string,
    @Body() body: UpdatePreferredFormatDto
  ) {
    await this.agencyExportService.updatePreferredFormat(tenantId, body.format);
  }

  // ─── Fiscal validator ───────────────────────────────────────────────────

  @Get('fiscal-alerts/summary')
  @ApiOperation({ summary: 'Resumen de alertas fiscales de todos los clientes activos' })
  @ApiResponse({ status: 200, description: 'Array de clientes con sus conteos de alertas' })
  getFiscalAlertsSummary(@CurrentTenant() tenantId: string) {
    return this.agencyService.getFiscalAlertsSummary(tenantId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('clients/:clientTenantId/fiscal-alerts')
  @ApiOperation({ summary: 'Validación fiscal preventiva de un cliente' })
  @ApiResponse({ status: 200, description: 'Lista de alertas fiscales (puede estar vacía)' })
  getFiscalAlerts(
    @CurrentTenant() tenantId: string,
    @Param('clientTenantId', ParseUUIDPipe) clientTenantId: string
  ) {
    return this.fiscalValidatorService.validateClientFiscalHealth(tenantId, clientTenantId);
  }

  // ─── Export logs ───────────────────────────────────────────────────────

  @Get('export-logs')
  @ApiOperation({ summary: 'Historial de exportaciones realizadas' })
  @ApiResponse({ status: 200, description: 'Lista paginada de exports' })
  getExportLogs(
    @CurrentTenant() tenantId: string,
    @Query('clientTenantId') clientTenantId?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20
  ) {
    return this.agencyService.getExportLogs(tenantId, clientTenantId, page, limit);
  }

  // ─── My agencies (client side) ─────────────────────────────────────────

  /** Returns the agencies that currently manage the authenticated client tenant. */
  @SkipAgencyGuard()
  @Get('my-agencies')
  @ApiOperation({ summary: 'Asesorías que gestionan mi cuenta (llamado por el cliente)' })
  @ApiResponse({ status: 200, description: 'Lista de asesorías con acceso activo' })
  findMyAgencies(@CurrentTenant() clientTenantId: string) {
    return this.agencyService.findMyAgencies(clientTenantId);
  }

  /** Client revokes an agency's access to their account. */
  @SkipAgencyGuard()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('my-agencies/:agencyTenantId')
  @ApiOperation({ summary: 'Revocar acceso de una asesoría a mi cuenta (llamado por el cliente)' })
  @ApiResponse({ status: 204, description: 'Acceso revocado' })
  revokeMyAgency(
    @CurrentTenant() clientTenantId: string,
    @CurrentUser('id') userId: string,
    @Param('agencyTenantId', ParseUUIDPipe) agencyTenantId: string
  ) {
    return this.agencyService.revokeMyAgency(clientTenantId, agencyTenantId, userId);
  }
}

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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AgencyService } from './agency.service';
import { CreateDirectClientDto } from './dto/create-direct-client.dto';
import { InviteClientDto } from './dto/invite-client.dto';
import { QueryAgencyClientsDto } from './dto/query-agency-clients.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('agency')
@ApiBearerAuth()
@Controller('agency')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  // ─── Stats / hub overview ───────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas resumen del panel de asesoría' })
  @ApiResponse({ status: 200, description: 'Estadísticas devueltas correctamente' })
  getStats(@CurrentTenant() tenantId: string) {
    return this.agencyService.getAgencyStats(tenantId);
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
    @Param('clientTenantId', ParseUUIDPipe) clientTenantId: string
  ) {
    return this.agencyService.revokeClient(tenantId, clientTenantId);
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

  // ─── Invitations ────────────────────────────────────────────────────────

  /** Public endpoint — no auth required. Returns safe public info about the invitation. */
  @Public()
  @Get('invitations/:token')
  @ApiOperation({ summary: 'Obtener información pública de una invitación (sin autenticación)' })
  @ApiResponse({ status: 200, description: 'Datos de la invitación' })
  @ApiResponse({ status: 404, description: 'Invitación no encontrada o expirada' })
  getInvitationInfo(@Param('token') token: string) {
    return this.agencyService.findInvitationByToken(token);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'Listar invitaciones pendientes de la asesoría' })
  findPendingInvitations(@CurrentTenant() tenantId: string) {
    return this.agencyService.findPendingInvitations(tenantId);
  }

  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Aceptar invitación de asesoría (llamado por el cliente)' })
  acceptInvitation(
    @Param('token') token: string,
    @CurrentTenant() clientTenantId: string,
    @CurrentUser('id') userId: string
  ) {
    return this.agencyService.acceptInvitation(token, clientTenantId, userId);
  }

  @Patch('invitations/:id/cancel')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancelar una invitación pendiente' })
  cancelInvitation(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.agencyService.cancelInvitation(tenantId, id);
  }

  // ─── Shared customer pool ───────────────────────────────────────────────

  @Get('shared-customers')
  @ApiOperation({ summary: 'Directorio de clientes compartidos de la asesoría' })
  findSharedCustomers(@CurrentTenant() tenantId: string, @Query('search') search?: string) {
    return this.agencyService.findSharedCustomers(tenantId, search);
  }
}

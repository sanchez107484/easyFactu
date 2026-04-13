import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { RecurringInvoiceService } from './recurring-invoice.service';
import { RecurringInvoiceSchedulerService } from './recurring-invoice-scheduler.service';
import { CreateRecurringInvoiceDto } from './dto/create-recurring-invoice.dto';
import { UpdateRecurringInvoiceDto } from './dto/update-recurring-invoice.dto';
import { QueryRecurringInvoiceDto } from './dto/query-recurring-invoice.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUserRole } from '@easyfactura/shared-types';

@ApiTags('recurring-invoices')
@Controller('recurring-invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RecurringInvoiceController {
  constructor(
    private readonly recurringService: RecurringInvoiceService,
    private readonly schedulerService: RecurringInvoiceSchedulerService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear factura recurrente' })
  @ApiCreatedResponse({ description: 'Factura recurrente creada' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateRecurringInvoiceDto) {
    return this.recurringService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar facturas recurrentes (paginado)' })
  @ApiOkResponse({ description: 'Lista paginada de facturas recurrentes' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryRecurringInvoiceDto) {
    return this.recurringService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una factura recurrente' })
  @ApiOkResponse({ description: 'Factura recurrente encontrada' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringService.findOne(tenantId, id);
  }

  @Get(':id/generated-invoices')
  @ApiOperation({ summary: 'Listar facturas generadas por esta recurrente (MISSING-01)' })
  @ApiOkResponse({ description: 'Lista paginada de facturas generadas' })
  findGeneratedInvoices(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    return this.recurringService.findGeneratedInvoices(tenantId, id, page, limit);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar factura recurrente (BUG-01: recalcula nextRunDate)' })
  @ApiOkResponse({ description: 'Factura recurrente actualizada' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringInvoiceDto
  ) {
    return this.recurringService.update(tenantId, id, dto);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: 'Pausar factura recurrente' })
  @ApiOkResponse({ description: 'Factura recurrente pausada' })
  pause(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringService.pause(tenantId, id);
  }

  @Post(':id/resume')
  @ApiOperation({
    summary: 'Reanudar factura recurrente (BUG-02: recalcula nextRunDate desde hoy)',
  })
  @ApiOkResponse({ description: 'Factura recurrente reanudada' })
  resume(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringService.resume(tenantId, id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar factura recurrente' })
  @ApiOkResponse({ description: 'Factura recurrente cancelada' })
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringService.cancel(tenantId, id);
  }

  @Post(':id/skip-next')
  @ApiOperation({ summary: 'Saltar la siguiente generación (MISSING-03)' })
  @ApiOkResponse({ description: 'Próxima generación saltada, nextRunDate avanzada' })
  skipNext(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringService.skipNext(tenantId, id);
  }

  @Post(':id/generate-now')
  @ApiOperation({ summary: 'Generar una factura ahora mismo (MISSING-06)' })
  @ApiOkResponse({ description: 'Factura generada inmediatamente' })
  async generateNow(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    try {
      await this.schedulerService.generateNow(tenantId, id);
      return { message: 'Factura generada correctamente' };
    } catch (err) {
      throw new BadRequestException((err as Error).message);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar factura recurrente' })
  @ApiNoContentResponse({ description: 'Factura recurrente eliminada' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringService.remove(tenantId, id);
  }

  /**
   * BUG-06 FIX: Restricted to ADMIN and OWNER roles only.
   * Previously any valid JWT could trigger invoice generation for ALL tenants.
   */
  @Post('trigger-scheduler')
  @Roles(TenantUserRole.ADMIN, TenantUserRole.OWNER)
  @ApiOperation({ summary: 'Disparar el scheduler manualmente (solo ADMIN/OWNER)' })
  @ApiOkResponse({ description: 'Scheduler ejecutado' })
  async triggerScheduler() {
    const result = await this.schedulerService.triggerManually();
    return {
      message: 'Scheduler ejecutado correctamente',
      ...result,
    };
  }
}

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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiHeader,
} from '@nestjs/swagger';
import { RecurringInvoiceService } from './recurring-invoice.service';
import { RecurringInvoiceSchedulerService } from './recurring-invoice-scheduler.service';
import { CreateRecurringInvoiceDto } from './dto/create-recurring-invoice.dto';
import { UpdateRecurringInvoiceDto } from './dto/update-recurring-invoice.dto';
import { QueryRecurringInvoiceDto } from './dto/query-recurring-invoice.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SchedulerSecretGuard } from './guards/scheduler-secret.guard';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('recurring-invoices')
@Controller('recurring-invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecurringInvoiceController {
  constructor(
    private readonly recurringInvoiceService: RecurringInvoiceService,
    private readonly schedulerService: RecurringInvoiceSchedulerService
  ) {}

  // ==================== CRUD ====================

  @Post()
  @ApiOperation({ summary: 'Crear una factura recurrente' })
  @ApiCreatedResponse({ description: 'Factura recurrente creada' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateRecurringInvoiceDto) {
    return this.recurringInvoiceService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar facturas recurrentes (paginado)' })
  @ApiOkResponse({ description: 'Lista paginada de facturas recurrentes' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryRecurringInvoiceDto) {
    return this.recurringInvoiceService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una factura recurrente' })
  @ApiOkResponse({ description: 'Detalle de la factura recurrente con facturas generadas' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringInvoiceService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una factura recurrente' })
  @ApiOkResponse({ description: 'Factura recurrente actualizada (nextRunDate recalculada si cambia dayOfMonth o frequency)' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringInvoiceDto
  ) {
    return this.recurringInvoiceService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una factura recurrente' })
  @ApiNoContentResponse({ description: 'Factura recurrente eliminada' })
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.recurringInvoiceService.remove(tenantId, id);
  }

  // ==================== STATE TRANSITIONS ====================

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pausar una factura recurrente' })
  @ApiOkResponse({ description: 'Factura recurrente pausada' })
  pause(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringInvoiceService.pause(tenantId, id);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reanudar una factura recurrente (recalcula nextRunDate desde hoy)' })
  @ApiOkResponse({ description: 'Factura recurrente reanudada' })
  resume(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringInvoiceService.resume(tenantId, id);
  }

  @Post(':id/skip-next')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Saltar la siguiente generación programada' })
  @ApiOkResponse({ description: 'Siguiente generación saltada, nextRunDate avanzada' })
  skipNext(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringInvoiceService.skipNext(tenantId, id);
  }

  @Post(':id/generate-now')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar una factura inmediatamente sin esperar al scheduler' })
  @ApiCreatedResponse({ description: 'Factura generada como borrador' })
  generateNow(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringInvoiceService.generateNow(tenantId, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar una factura recurrente definitivamente' })
  @ApiOkResponse({ description: 'Factura recurrente cancelada' })
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringInvoiceService.cancel(tenantId, id);
  }

  // ==================== SCHEDULER TRIGGER (BUG-06 fix) ====================

  /**
   * BUG-06 fix: This endpoint is protected by SchedulerSecretGuard (X-Scheduler-Secret header)
   * instead of just JWT, preventing any authenticated user from triggering invoice generation
   * for all tenants.
   *
   * The @Public() decorator removes the JwtAuthGuard so the cron job does not need a JWT.
   * The SchedulerSecretGuard then validates the X-Scheduler-Secret header.
   */
  @Post('trigger-scheduler')
  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(SchedulerSecretGuard)
  @ApiOperation({ summary: 'Disparar el scheduler (solo acceso interno con X-Scheduler-Secret)' })
  @ApiHeader({ name: 'X-Scheduler-Secret', description: 'Secreto de autenticación del scheduler' })
  @ApiOkResponse({ description: 'Resultado del scheduler' })
  async triggerScheduler() {
    return this.schedulerService.runScheduler();
  }
}

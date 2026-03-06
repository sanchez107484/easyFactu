import { Controller, Get, Put, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { InvoiceDefaultsService } from './invoice-defaults.service';
import { UpdateInvoiceDefaultsDto } from './dto/update-invoice-defaults.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('invoice-defaults')
@Controller('invoice-defaults')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoiceDefaultsController {
  constructor(private invoiceDefaultsService: InvoiceDefaultsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener preferencias por defecto de factura del tenant' })
  @ApiOkResponse({ description: 'Preferencias actuales o null si no existen' })
  findOne(@CurrentTenant() tenantId: string) {
    return this.invoiceDefaultsService.findByTenant(tenantId);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Crear o actualizar preferencias por defecto de factura del tenant' })
  @ApiOkResponse({ description: 'Preferencias actualizadas' })
  upsert(@CurrentTenant() tenantId: string, @Body() dto: UpdateInvoiceDefaultsDto) {
    return this.invoiceDefaultsService.upsert(tenantId, dto);
  }
}

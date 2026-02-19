import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Post()
  @ApiOperation({ summary: 'Crear factura' })
  @ApiCreatedResponse({ description: 'Factura creada correctamente' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar facturas' })
  @ApiOkResponse({ description: 'Lista paginada de facturas' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryInvoiceDto) {
    return this.invoiceService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una factura' })
  @ApiOkResponse({ description: 'Factura encontrada' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar factura (solo borradores)' })
  @ApiOkResponse({ description: 'Factura actualizada correctamente' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto
  ) {
    return this.invoiceService.update(tenantId, id, dto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirmar factura y enviar a VeriFactu' })
  @ApiOkResponse({ description: 'Factura confirmada correctamente' })
  confirm(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.confirm(tenantId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar factura (solo borradores)' })
  @ApiOkResponse({ description: 'Factura eliminada correctamente' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.remove(tenantId, id);
  }
}

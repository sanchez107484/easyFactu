import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Header,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { InvoiceService } from './invoice.service';
import { InvoicePdfService } from '../invoice-templates/pdf/invoice-pdf.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { RectifyInvoiceDto } from './dto/rectify-invoice.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { UpdateInvoiceNotesDto } from './dto/update-invoice-notes.dto';
import { QueryStatsDto } from './dto/query-stats.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class UpdateQuoteStatusDto {
  @ApiProperty({ enum: ['PENDING', 'SENT', 'ACCEPTED', 'REJECTED'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['PENDING', 'SENT', 'ACCEPTED', 'REJECTED'])
  quoteAcceptanceStatus!: string;
}
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly pdfService: InvoicePdfService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear factura en borrador' })
  @ApiCreatedResponse({ description: 'Factura creada correctamente' })
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInvoiceDto
  ) {
    return this.invoiceService.create(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar facturas (paginado)' })
  @ApiOkResponse({ description: 'Lista paginada de facturas' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryInvoiceDto) {
    return this.invoiceService.findAll(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'KPIs y gráfico mensual de facturación' })
  @ApiOkResponse({ description: 'Estadísticas del año solicitado' })
  getStats(@CurrentTenant() tenantId: string, @Query() query: QueryStatsDto) {
    return this.invoiceService.getStats(tenantId, query.year);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Informe de ingresos, clientes top y resumen fiscal' })
  @ApiOkResponse({ description: 'Datos del informe para el rango de fechas' })
  getReports(@CurrentTenant() tenantId: string, @Query() query: QueryReportsDto) {
    return this.invoiceService.getReports(tenantId, query.fromDate, query.toDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle completo de una factura' })
  @ApiOkResponse({ description: 'Factura encontrada' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.findOne(tenantId, id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar factura en PDF' })
  @Header('Content-Type', 'application/pdf')
  async downloadPdf(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const { buffer, filename } = await this.pdfService.generate(tenantId, id);
    res.setHeader('Content-Disposition', `inline; filename="${filename}.pdf"`);
    res.send(buffer);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar factura (solo borradores)' })
  @ApiOkResponse({ description: 'Factura actualizada correctamente' })
  async update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto
  ) {
    const [result] = await Promise.all([
      this.invoiceService.update(tenantId, id, dto),
      this.pdfService.invalidateCache(id),
    ]);
    return result;
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar factura: asigna número, bloquea y envía a VeriFactu' })
  @ApiOkResponse({ description: 'Factura confirmada correctamente' })
  confirm(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.confirm(tenantId, id);
  }

  @Post(':id/convert-to-official')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convertir factura proforma a factura oficial (borrador estándar)' })
  @ApiOkResponse({ description: 'Factura proforma convertida a oficial correctamente' })
  convertToOfficial(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.convertToOfficial(tenantId, id);
  }

  @Post(':id/convert-to-proforma')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convertir borrador estándar a factura proforma' })
  @ApiOkResponse({ description: 'Borrador convertido a proforma correctamente' })
  convertToProforma(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.convertDraftToProforma(tenantId, id);
  }

  @Post(':id/paid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar factura como cobrada' })
  @ApiOkResponse({ description: 'Factura marcada como pagada' })
  markAsPaid(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.markAsPaid(tenantId, id);
  }

  @Delete(':id/paid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desmarcar factura como pagada (vuelve a confirmada)' })
  @ApiOkResponse({ description: 'Factura vuelve al estado confirmada' })
  unmarkAsPaid(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.unmarkAsPaid(tenantId, id);
  }

  @Post(':id/sent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar factura como enviada al cliente' })
  @ApiOkResponse({ description: 'Factura marcada como enviada' })
  markAsSent(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.markAsSent(tenantId, id);
  }

  @Delete(':id/sent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desmarcar factura como enviada (vuelve a confirmada)' })
  @ApiOkResponse({ description: 'Factura vuelve al estado confirmada' })
  unmarkAsSent(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.unmarkAsSent(tenantId, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar factura como borrador' })
  @ApiCreatedResponse({ description: 'Factura duplicada correctamente' })
  duplicate(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.duplicate(tenantId, id);
  }

  @Post(':id/rectify')
  @ApiOperation({ summary: 'Crear factura rectificativa' })
  @ApiCreatedResponse({ description: 'Factura rectificativa creada como borrador' })
  rectify(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RectifyInvoiceDto
  ) {
    return this.invoiceService.rectify(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar factura (solo borradores)' })
  @ApiNoContentResponse({ description: 'Factura eliminada correctamente' })
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await Promise.all([
      this.invoiceService.remove(tenantId, id),
      this.pdfService.invalidateCache(id),
    ]);
  }

  @Patch(':id/notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar notas de una factura (cualquier estado)' })
  @ApiOkResponse({ description: 'Notas actualizadas correctamente' })
  updateNotes(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceNotesDto
  ) {
    return this.invoiceService.updateNotes(tenantId, userId, id, dto);
  }

  // ==================== QUOTE ENDPOINTS ====================

  @Patch(':id/quote-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar estado de aceptación de un presupuesto' })
  @ApiOkResponse({ description: 'Estado del presupuesto actualizado' })
  updateQuoteStatus(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuoteStatusDto
  ) {
    return this.invoiceService.updateQuoteAcceptanceStatus(
      tenantId,
      id,
      dto.quoteAcceptanceStatus as any
    );
  }

  @Post(':id/convert-quote-to-proforma')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convertir presupuesto a factura proforma' })
  @ApiOkResponse({ description: 'Presupuesto convertido a proforma' })
  convertQuoteToProforma(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.convertQuoteToProforma(tenantId, id);
  }

  @Post(':id/convert-quote-to-official')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convertir presupuesto a borrador de factura oficial' })
  @ApiOkResponse({ description: 'Presupuesto convertido a borrador de factura oficial' })
  convertQuoteToOfficial(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceService.convertQuoteToOfficial(tenantId, id);
  }
}

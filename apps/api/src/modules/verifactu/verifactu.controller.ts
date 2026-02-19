import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { VerifactuService } from './services/verifactu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('verifactu')
@Controller('verifactu')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VerifactuController {
  constructor(private verifactuService: VerifactuService) {}

  @Post('invoice/:id/process')
  @ApiOperation({ summary: 'Procesar factura para VeriFactu (hash + XML + firma + envío AEAT)' })
  @ApiOkResponse({ description: 'Factura procesada correctamente' })
  processInvoice(@CurrentTenant() tenantId: string, @Param('id') invoiceId: string) {
    return this.verifactuService.processInvoice(tenantId, invoiceId);
  }

  @Post('invoice/:id/retry')
  @ApiOperation({ summary: 'Reintentar envío fallido a AEAT' })
  @ApiOkResponse({ description: 'Reintento de envío iniciado' })
  retrySubmission(@CurrentTenant() tenantId: string, @Param('id') invoiceId: string) {
    return this.verifactuService.retryFailedSubmission(tenantId, invoiceId);
  }

  @Get('invoice/:id/verify')
  @ApiOperation({ summary: 'Verificar integridad de la cadena de hash' })
  @ApiOkResponse({ description: 'Resultado de la verificación' })
  async verifyIntegrity(@CurrentTenant() tenantId: string, @Param('id') invoiceId: string) {
    const isValid = await this.verifactuService.verifyInvoiceIntegrity(tenantId, invoiceId);
    return { isValid };
  }

  @Get('invoice/:id/logs')
  @ApiOperation({ summary: 'Obtener logs de envíos VeriFactu de una factura' })
  @ApiOkResponse({ description: 'Logs de VeriFactu' })
  getLogs(@CurrentTenant() tenantId: string, @Param('id') invoiceId: string) {
    return this.verifactuService.getInvoiceLogs(tenantId, invoiceId);
  }
}

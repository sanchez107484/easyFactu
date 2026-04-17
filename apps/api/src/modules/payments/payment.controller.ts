import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payments')
@Controller('invoices/:invoiceId/payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un cobro parcial o total en una factura' })
  @ApiCreatedResponse({ description: 'Cobro registrado correctamente' })
  create(
    @CurrentTenant() tenantId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CreatePaymentDto
  ) {
    return this.paymentService.createPayment(tenantId, invoiceId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cobros de una factura' })
  @ApiOkResponse({ description: 'Lista de cobros de la factura' })
  findAll(@CurrentTenant() tenantId: string, @Param('invoiceId') invoiceId: string) {
    return this.paymentService.getPayments(tenantId, invoiceId);
  }

  @Delete(':paymentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar un cobro de una factura' })
  @ApiOkResponse({ description: 'Cobro eliminado y factura actualizada' })
  remove(
    @CurrentTenant() tenantId: string,
    @Param('invoiceId') invoiceId: string,
    @Param('paymentId') paymentId: string
  ) {
    return this.paymentService.deletePayment(tenantId, invoiceId, paymentId);
  }
}

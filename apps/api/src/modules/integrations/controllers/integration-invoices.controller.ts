import { Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Response } from 'express';
import { PlanTier } from '@easyfactura/shared-types';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { RequirePlan } from '../../../common/decorators/require-plan.decorator';
import { PlanGuard } from '../../../common/guards/plan.guard';
import {
  API_KEY_SECURITY,
  ApiIdempotentPost,
  ApiKeyErrorResponses,
} from '../decorators/integration-docs.decorators';
import {
  IntegrationBody,
  IntegrationEndpoint,
  IntegrationQuery,
} from '../decorators/integration-request.decorators';
import { FindInvoicesQueryDto } from '../dto/find-invoices-query.dto';
import { RegisterPaymentDto } from '../dto/integration-payment.dto';
import {
  IntegrationInvoiceListResponse,
  IntegrationInvoiceResponse,
  IntegrationPaymentResponse,
  ProblemDetailsResponse,
} from '../dto/integration-responses.dto';
import { IssueInvoiceDto } from '../dto/issue-invoice.dto';
import { ApiKeyRateLimitGuard } from '../guards/api-key-rate-limit.guard';
import { ApiKeyGuard, RequestWithPrincipal } from '../guards/api-key.guard';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { idempotencyContextFrom, sendIdempotentOutcome } from '../idempotency/idempotent-response';
import { INTEGRATIONS_V1_PATH } from '../integrations.constants';
import { ISSUE_INVOICE_EXAMPLES } from '../openapi/integration-examples';
import { IntegrationInvoiceActionsService } from '../services/integration-invoice-actions.service';
import { IntegrationInvoicesService } from '../services/integration-invoices.service';

/**
 * Clinic-scoped endpoints. The API key identifies the clinic; the global per-IP throttler is
 * skipped because one ERP calls for many clinics from the same IP; the limit is per key instead.
 */
@ApiTags('Facturas')
@ApiBearerAuth(API_KEY_SECURITY)
@ApiKeyErrorResponses()
@Controller(`${INTEGRATIONS_V1_PATH}/invoices`)
@Public()
@SkipThrottle()
@UseGuards(ApiKeyGuard, ApiKeyRateLimitGuard, PlanGuard)
@RequirePlan(PlanTier.PROFESSIONAL)
@IntegrationEndpoint()
export class IntegrationInvoicesController {
  constructor(
    private readonly invoices: IntegrationInvoicesService,
    private readonly actions: IntegrationInvoiceActionsService,
    private readonly idempotency: IdempotencyService
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Emite una factura completa o simplificada',
    description:
      'Crea o actualiza el pagador (customer) por externalId, convierte los precios con IVA incluido y confirma la factura. ' +
      'El total coincide al céntimo con la suma cobrada: si una línea no puede cuadrar sola, se añade una línea ' +
      '"Ajuste por redondeo (IVA incluido)" al mismo tipo. Responde con registrationStatus PENDING hasta que Hacienda conteste.',
  })
  @ApiIdempotentPost()
  @ApiBody({ type: IssueInvoiceDto, examples: ISSUE_INVOICE_EXAMPLES })
  @ApiCreatedResponse({ type: IntegrationInvoiceResponse })
  @ApiOkResponse({ type: IntegrationInvoiceResponse, description: 'Reintento idempotente' })
  @ApiConflictResponse({
    type: ProblemDetailsResponse,
    description: 'DUPLICATE_EXTERNAL_REF (incluye invoiceId)',
  })
  async issue(
    @CurrentTenant() tenantId: string,
    @IntegrationBody() dto: IssueInvoiceDto,
    @Req() request: RequestWithPrincipal,
    @Res() response: Response
  ): Promise<void> {
    const outcome = await this.idempotency.execute(idempotencyContextFrom(request), async () => ({
      status: HttpStatus.CREATED,
      body: await this.invoices.issue(tenantId, dto),
    }));
    sendIdempotentOutcome(response, outcome);
  }

  @Get()
  @ApiOperation({ summary: 'Busca por externalRef (recuperación tras un tiempo agotado)' })
  @ApiQuery({ name: 'externalRef', required: true, example: 'VENTA-2026-001234' })
  @ApiOkResponse({ type: IntegrationInvoiceListResponse, description: 'data vacío si no existe' })
  findByExternalRef(
    @CurrentTenant() tenantId: string,
    @IntegrationQuery() query: FindInvoicesQueryDto
  ): Promise<IntegrationInvoiceListResponse> {
    return this.invoices.findByExternalRef(tenantId, query.externalRef);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Estado y datos fiscales',
    description: 'Consulta con espera creciente mientras registrationStatus sea PENDING.',
  })
  @ApiOkResponse({ type: IntegrationInvoiceResponse })
  findOne(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string
  ): Promise<IntegrationInvoiceResponse> {
    return this.invoices.findOne(tenantId, id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'PDF de la factura' })
  @ApiProduces('application/pdf')
  @ApiOkResponse({ description: 'application/pdf' })
  async downloadPdf(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Res() response: Response
  ): Promise<void> {
    const { buffer, filename } = await this.actions.renderPdf(tenantId, id);
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(filename)}.pdf"`
    );
    response.send(buffer);
  }

  @Post(':id/payments')
  @ApiOperation({ summary: 'Registra un cobro' })
  @ApiIdempotentPost()
  @ApiBody({ type: RegisterPaymentDto })
  @ApiCreatedResponse({ type: IntegrationPaymentResponse })
  async registerPayment(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @IntegrationBody() dto: RegisterPaymentDto,
    @Req() request: RequestWithPrincipal,
    @Res() response: Response
  ): Promise<void> {
    const outcome = await this.idempotency.execute(idempotencyContextFrom(request), async () => ({
      status: HttpStatus.CREATED,
      body: await this.actions.registerPayment(tenantId, id, dto),
    }));
    sendIdempotentOutcome(response, outcome);
  }
}

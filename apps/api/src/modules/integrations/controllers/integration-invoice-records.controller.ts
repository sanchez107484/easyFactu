import { Controller, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
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
import { IntegrationBody, IntegrationEndpoint } from '../decorators/integration-request.decorators';
import { IntegrationInvoiceResponse } from '../dto/integration-responses.dto';
import {
  CancelInvoiceDto,
  ExchangeSimplifiedInvoicesDto,
  RectifyIssuedInvoiceDto,
} from '../dto/invoice-records.dto';
import { ApiKeyRateLimitGuard } from '../guards/api-key-rate-limit.guard';
import { ApiKeyGuard, RequestWithPrincipal } from '../guards/api-key.guard';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { idempotencyContextFrom, sendIdempotentOutcome } from '../idempotency/idempotent-response';
import { INTEGRATIONS_V1_PATH } from '../integrations.constants';
import {
  CANCEL_INVOICE_EXAMPLE,
  EXCHANGE_INVOICES_EXAMPLE,
  RECTIFY_INVOICE_EXAMPLE,
} from '../openapi/integration-examples';
import { IntegrationExchangesService } from '../services/integration-exchanges.service';
import { IntegrationInvoiceActionsService } from '../services/integration-invoice-actions.service';
import { IntegrationRectificationsService } from '../services/integration-rectifications.service';

/** Records that act on issued invoices: returns (R4/R5), exchanges (F3) and cancellations. */
@ApiTags('Facturas')
@ApiBearerAuth(API_KEY_SECURITY)
@ApiKeyErrorResponses()
@Controller(`${INTEGRATIONS_V1_PATH}/invoices`)
@Public()
@SkipThrottle()
@UseGuards(ApiKeyGuard, ApiKeyRateLimitGuard, PlanGuard)
@RequirePlan(PlanTier.PROFESSIONAL)
@IntegrationEndpoint()
export class IntegrationInvoiceRecordsController {
  constructor(
    private readonly rectifications: IntegrationRectificationsService,
    private readonly exchanges: IntegrationExchangesService,
    private readonly actions: IntegrationInvoiceActionsService,
    private readonly idempotency: IdempotencyService
  ) {}

  @Post('exchanges')
  @ApiOperation({
    summary: 'Canjea simplificadas por una factura completa (F3)',
    description:
      'Emite una factura completa con las líneas de una o varias simplificadas emitidas por la API, ' +
      'identificando al destinatario (NIF y domicilio obligatorios). Las simplificadas quedan ' +
      'registradas y apuntan a la F3 (exchangedByInvoiceId).',
  })
  @ApiIdempotentPost()
  @ApiBody({
    type: ExchangeSimplifiedInvoicesDto,
    examples: { canje: { value: EXCHANGE_INVOICES_EXAMPLE } },
  })
  @ApiCreatedResponse({ type: IntegrationInvoiceResponse })
  @ApiOkResponse({ type: IntegrationInvoiceResponse, description: 'Reintento idempotente' })
  async exchange(
    @CurrentTenant() tenantId: string,
    @IntegrationBody() dto: ExchangeSimplifiedInvoicesDto,
    @Req() request: RequestWithPrincipal,
    @Res() response: Response
  ): Promise<void> {
    const outcome = await this.idempotency.execute(idempotencyContextFrom(request), async () => ({
      status: HttpStatus.CREATED,
      body: await this.exchanges.exchange(tenantId, dto),
    }));
    sendIdempotentOutcome(response, outcome);
  }

  @Post(':id/rectifications')
  @ApiOperation({
    summary: 'Registra una devolución (rectificativa por diferencias)',
    description:
      'Emite una rectificativa con importes negativos: R5 si la original es simplificada, R4 si es ' +
      'completa. Las líneas llevan el importe devuelto IVA incluido, en positivo. La suma de ' +
      'devoluciones no puede superar el total de la factura original.',
  })
  @ApiIdempotentPost()
  @ApiBody({
    type: RectifyIssuedInvoiceDto,
    examples: { devolucion: { value: RECTIFY_INVOICE_EXAMPLE } },
  })
  @ApiCreatedResponse({ type: IntegrationInvoiceResponse, description: 'La rectificativa emitida' })
  @ApiOkResponse({ type: IntegrationInvoiceResponse, description: 'Reintento idempotente' })
  async rectify(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @IntegrationBody() dto: RectifyIssuedInvoiceDto,
    @Req() request: RequestWithPrincipal,
    @Res() response: Response
  ): Promise<void> {
    const outcome = await this.idempotency.execute(idempotencyContextFrom(request), async () => ({
      status: HttpStatus.CREATED,
      body: await this.rectifications.rectify(tenantId, id, dto),
    }));
    sendIdempotentOutcome(response, outcome);
  }

  @Post(':id/cancellation')
  @ApiOperation({
    summary: 'Anula el registro de una factura emitida por error',
    description:
      'Genera un registro de anulación VeriFactu encadenado. Solo para facturas que no debieron ' +
      'emitirse (p. ej. un ticket duplicado); una devolución es una rectificativa. No admite ' +
      'facturas con rectificativas emitidas ni simplificadas canjeadas. La factura pasa a status ' +
      'CANCELLED y cancellation.registrationStatus sigue el envío a Hacienda.',
  })
  @ApiIdempotentPost()
  @ApiBody({ type: CancelInvoiceDto, examples: { anulacion: { value: CANCEL_INVOICE_EXAMPLE } } })
  @ApiCreatedResponse({ type: IntegrationInvoiceResponse, description: 'La factura anulada' })
  @ApiOkResponse({ type: IntegrationInvoiceResponse, description: 'Reintento idempotente' })
  async cancel(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @IntegrationBody() dto: CancelInvoiceDto,
    @Req() request: RequestWithPrincipal,
    @Res() response: Response
  ): Promise<void> {
    const outcome = await this.idempotency.execute(idempotencyContextFrom(request), async () => ({
      status: HttpStatus.CREATED,
      body: await this.actions.cancel(tenantId, id, dto),
    }));
    sendIdempotentOutcome(response, outcome);
  }
}

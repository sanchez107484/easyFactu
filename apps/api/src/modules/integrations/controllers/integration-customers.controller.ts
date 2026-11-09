import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PlanTier } from '@easyfactura/shared-types';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { RequirePlan } from '../../../common/decorators/require-plan.decorator';
import { PlanGuard } from '../../../common/guards/plan.guard';
import { API_KEY_SECURITY, ApiKeyErrorResponses } from '../decorators/integration-docs.decorators';
import {
  IntegrationEndpoint,
  IntegrationQuery,
} from '../decorators/integration-request.decorators';
import { CustomerInvoicesQueryDto } from '../dto/customer-invoices-query.dto';
import { IntegrationCustomerInvoicesResponse } from '../dto/integration-responses.dto';
import { ApiKeyRateLimitGuard } from '../guards/api-key-rate-limit.guard';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { INTEGRATIONS_V1_PATH } from '../integrations.constants';
import { IntegrationCustomerInvoicesService } from '../services/integration-customer-invoices.service';

@ApiTags('Clientes')
@ApiBearerAuth(API_KEY_SECURITY)
@ApiKeyErrorResponses()
@Controller(`${INTEGRATIONS_V1_PATH}/customers`)
@Public()
@SkipThrottle()
@UseGuards(ApiKeyGuard, ApiKeyRateLimitGuard, PlanGuard)
@RequirePlan(PlanTier.PROFESSIONAL)
@IntegrationEndpoint()
export class IntegrationCustomersController {
  constructor(private readonly customerInvoices: IntegrationCustomerInvoicesService) {}

  @Get(':externalId/invoices')
  @ApiOperation({
    summary: 'Facturas de un pagador',
    description:
      'Facturas emitidas por la API al pagador (externalId), de la más reciente a la más antigua: ' +
      'ventas, devoluciones, canjes y anuladas. Paginado.',
  })
  @ApiOkResponse({ type: IntegrationCustomerInvoicesResponse })
  list(
    @CurrentTenant() tenantId: string,
    @Param('externalId') externalId: string,
    @IntegrationQuery() query: CustomerInvoicesQueryDto
  ): Promise<IntegrationCustomerInvoicesResponse> {
    return this.customerInvoices.list(tenantId, externalId, query);
  }
}

import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { PlanTier } from '@easyfactura/shared-types';
import { CurrentTenant } from '../../../common/decorators/current-tenant.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { RequirePlan } from '../../../common/decorators/require-plan.decorator';
import { PlanGuard } from '../../../common/guards/plan.guard';
import { API_KEY_SECURITY, ApiKeyErrorResponses } from '../decorators/integration-docs.decorators';
import { IntegrationBody, IntegrationEndpoint } from '../decorators/integration-request.decorators';
import { UpdateIntegrationSettingsDto } from '../dto/integration-settings.dto';
import { IntegrationSettingsResponse } from '../dto/integration-responses.dto';
import { ApiKeyRateLimitGuard } from '../guards/api-key-rate-limit.guard';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { INTEGRATIONS_V1_PATH } from '../integrations.constants';
import { IntegrationSettingsService } from '../services/integration-settings.service';

@ApiTags('Ajustes')
@ApiBearerAuth(API_KEY_SECURITY)
@ApiKeyErrorResponses()
@Controller(`${INTEGRATIONS_V1_PATH}/settings`)
@Public()
@SkipThrottle()
@UseGuards(ApiKeyGuard, ApiKeyRateLimitGuard, PlanGuard)
@RequirePlan(PlanTier.PROFESSIONAL)
@IntegrationEndpoint()
export class IntegrationSettingsController {
  constructor(private readonly settings: IntegrationSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Ajustes fiscales de la clínica' })
  @ApiOkResponse({ type: IntegrationSettingsResponse })
  get(@CurrentTenant() tenantId: string): Promise<IntegrationSettingsResponse> {
    return this.settings.get(tenantId);
  }

  @Patch()
  @ApiOperation({
    summary: 'Cambia el límite de la factura simplificada',
    description:
      '400 € con carácter general; hasta 3000 € si la actividad está en el art. 4.1 RD 1619/2012 ' +
      '(comercio minorista, como las ópticas). La clínica es responsable de que le corresponda.',
  })
  @ApiBody({ type: UpdateIntegrationSettingsDto })
  @ApiOkResponse({ type: IntegrationSettingsResponse })
  update(
    @CurrentTenant() tenantId: string,
    @IntegrationBody() dto: UpdateIntegrationSettingsDto
  ): Promise<IntegrationSettingsResponse> {
    return this.settings.update(tenantId, dto);
  }
}

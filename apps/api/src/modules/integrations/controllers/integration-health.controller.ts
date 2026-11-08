import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { IntegrationEndpoint } from '../decorators/integration-request.decorators';
import { HealthResponse, ProblemDetailsResponse } from '../dto/integration-responses.dto';
import { INTEGRATIONS_V1_PATH } from '../integrations.constants';
import { IntegrationHealthService } from '../services/integration-health.service';

@ApiTags('Estado')
@Controller(`${INTEGRATIONS_V1_PATH}/health`)
@Public()
@IntegrationEndpoint()
export class IntegrationHealthController {
  constructor(private readonly health: IntegrationHealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Estado del servicio',
    description: 'Sin autenticación ni datos. En mantenimiento responde 503 con Retry-After.',
  })
  @ApiOkResponse({ type: HealthResponse })
  @ApiServiceUnavailableResponse({ type: ProblemDetailsResponse, description: 'MAINTENANCE' })
  check(): Promise<HealthResponse> {
    return this.health.check();
  }
}

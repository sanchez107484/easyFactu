import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Public } from '../../../common/decorators/public.decorator';
import {
  PROVISIONING_SECURITY,
  ApiIdempotentPost,
  ProvisioningErrorResponses,
} from '../decorators/integration-docs.decorators';
import { IntegrationBody, IntegrationEndpoint } from '../decorators/integration-request.decorators';
import {
  IntegrationAccountResponse,
  IssuedApiKeyResponse,
  ProblemDetailsResponse,
} from '../dto/integration-responses.dto';
import { ProvisionAccountDto } from '../dto/provision-account.dto';
import { RequestWithPrincipal } from '../guards/api-key.guard';
import { ProvisioningSecretGuard } from '../guards/provisioning-secret.guard';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { idempotencyContextFrom, sendIdempotentOutcome } from '../idempotency/idempotent-response';
import { INTEGRATIONS_V1_PATH } from '../integrations.constants';
import { PROVISION_ACCOUNT_EXAMPLE } from '../openapi/integration-examples';
import { IntegrationAccountsService } from '../services/integration-accounts.service';

@ApiTags('Cuentas')
@ApiBearerAuth(PROVISIONING_SECURITY)
@ProvisioningErrorResponses()
@Controller(`${INTEGRATIONS_V1_PATH}/accounts`)
@Public()
@UseGuards(ProvisioningSecretGuard)
@IntegrationEndpoint()
export class IntegrationAccountsController {
  constructor(
    private readonly accounts: IntegrationAccountsService,
    private readonly idempotency: IdempotencyService
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Alta o vinculación de una clínica',
    description:
      'NIF nuevo: crea la cuenta (ACTIVE) con PRO gestionado por el ERP y devuelve la primera API key. ' +
      'NIF ya registrado: PENDING_CONSENT sin key hasta que el titular acepte por email. ' +
      'erpAccountId ya dado de alta: devuelve su estado (200) sin key.',
  })
  @ApiIdempotentPost()
  @ApiBody({ type: ProvisionAccountDto, examples: { alta: { value: PROVISION_ACCOUNT_EXAMPLE } } })
  @ApiCreatedResponse({ type: IntegrationAccountResponse })
  @ApiOkResponse({
    type: IntegrationAccountResponse,
    description: 'Reintento idempotente o cuenta ya existente (apiKey null)',
  })
  @ApiConflictResponse({ type: ProblemDetailsResponse, description: 'ACCOUNT_CONFLICT' })
  async provision(
    @IntegrationBody() dto: ProvisionAccountDto,
    @Req() request: RequestWithPrincipal,
    @Res() response: Response
  ): Promise<void> {
    const outcome = await this.idempotency.execute(idempotencyContextFrom(request), () =>
      this.accounts.provision(dto)
    );
    sendIdempotentOutcome(response, outcome);
  }

  @Get(':erpAccountId')
  @ApiOperation({
    summary: 'Estado del alta',
    description: 'PENDING_CONSENT, ACTIVE, GRACE o ENDED. Nunca devuelve la API key.',
  })
  @ApiOkResponse({ type: IntegrationAccountResponse })
  getAccount(@Param('erpAccountId') erpAccountId: string): Promise<IntegrationAccountResponse> {
    return this.accounts.getAccount(erpAccountId);
  }

  @Post(':erpAccountId/keys')
  @ApiOperation({
    summary: 'Nueva API key (rotación sin corte)',
    description:
      'La key se muestra una sola vez. Las anteriores siguen válidas 24 h. Requiere cuenta ACTIVE o GRACE.',
  })
  @ApiIdempotentPost()
  @ApiCreatedResponse({ type: IssuedApiKeyResponse })
  @ApiConflictResponse({ type: ProblemDetailsResponse, description: 'ACCOUNT_NOT_ACTIVE' })
  async issueKey(
    @Param('erpAccountId') erpAccountId: string,
    @Req() request: RequestWithPrincipal,
    @Res() response: Response
  ): Promise<void> {
    const outcome = await this.idempotency.execute(idempotencyContextFrom(request), async () => ({
      status: HttpStatus.CREATED,
      body: await this.accounts.issueKey(erpAccountId),
    }));
    sendIdempotentOutcome(response, outcome);
  }

  @Delete(':erpAccountId/keys/:keyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoca una API key al momento' })
  @ApiNoContentResponse({ description: 'Revocada (o ya lo estaba)' })
  async revokeKey(
    @Param('erpAccountId') erpAccountId: string,
    @Param('keyId') keyId: string
  ): Promise<void> {
    await this.accounts.revokeKey(erpAccountId, keyId);
  }
}

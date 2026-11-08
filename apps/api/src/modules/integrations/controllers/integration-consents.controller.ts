import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { IntegrationConsentService } from '../services/integration-consent.service';

/**
 * Web app endpoints (normal session, not part of the ERP contract): the OWNER of an existing
 * account reviews and accepts the ERP link from the emailed page.
 */
@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations/consents')
export class IntegrationConsentsController {
  constructor(private readonly consent: IntegrationConsentService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Datos de la solicitud de conexión con el ERP (solo el titular)' })
  describe(@Param('token') token: string, @CurrentUser('id') userId: string) {
    return this.consent.describe(token, userId);
  }

  @Post(':token/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acepta la conexión con el ERP: plan PRO gestionado por el ERP' })
  accept(@Param('token') token: string, @CurrentUser('id') userId: string) {
    return this.consent.accept(token, userId);
  }
}

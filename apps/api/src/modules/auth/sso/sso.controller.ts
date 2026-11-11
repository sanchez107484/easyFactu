import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../../common/decorators/public.decorator';
import { SsoExchangeDto } from './dto/sso-exchange.dto';
import { SsoService } from './sso.service';

@ApiTags('auth')
@Controller('auth/sso')
export class SsoController {
  constructor(private readonly ssoService: SsoService) {}

  // Each token works once; 20 req/min per IP covers page reloads and blocks enumeration.
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Public()
  @Post('exchange')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Canjear un token SSO del ERP por una sesión de NovaFactura' })
  @ApiResponse({ status: 200, description: 'Sesión abierta; incluye redirectTo' })
  @ApiResponse({ status: 400, description: 'Destino no permitido' })
  @ApiResponse({ status: 401, description: 'Token inválido, caducado o ya utilizado' })
  @ApiResponse({ status: 403, description: 'Integración inactiva o acceso retirado' })
  @ApiResponse({ status: 503, description: 'SSO no configurado en este despliegue' })
  async exchange(@Body() dto: SsoExchangeDto) {
    return this.ssoService.exchange(dto.token);
  }
}

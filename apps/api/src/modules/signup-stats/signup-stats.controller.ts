import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SIGNUP_STATS_TTL_SECONDS, SignupStats, SignupStatsService } from './signup-stats.service';

@ApiTags('signup-stats')
@Controller('signup-stats')
@Public()
export class SignupStatsController {
  constructor(private readonly signupStatsService: SignupStatsService) {}

  @Get()
  @Header(
    'Cache-Control',
    `public, max-age=${SIGNUP_STATS_TTL_SECONDS}, s-maxage=${SIGNUP_STATS_TTL_SECONDS}`
  )
  @ApiOperation({ summary: 'Número real de cuentas registradas (cacheado 1 hora)' })
  getStats(): Promise<SignupStats> {
    return this.signupStatsService.getStats();
  }
}

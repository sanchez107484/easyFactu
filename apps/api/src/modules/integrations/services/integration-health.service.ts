import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { HealthResponse } from '../dto/integration-responses.dto';
import { IntegrationErrorCode } from '../errors/integration-error-code';
import { IntegrationException } from '../errors/integration.exception';
import { INTEGRATIONS_ENV } from '../integrations.constants';

const MAINTENANCE_RETRY_AFTER_SECONDS = 300;
const DATABASE_RETRY_AFTER_SECONDS = 30;

/** Liveness for the ERP contingency check: no data in the response, only up or down. */
@Injectable()
export class IntegrationHealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async check(): Promise<HealthResponse> {
    if (this.config.get<string>(INTEGRATIONS_ENV.MAINTENANCE) === 'true') {
      throw new IntegrationException(
        IntegrationErrorCode.MAINTENANCE,
        'Servicio en mantenimiento programado',
        {
          retryAfterSeconds: MAINTENANCE_RETRY_AFTER_SECONDS,
        }
      );
    }
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new IntegrationException(
        IntegrationErrorCode.MAINTENANCE,
        'Servicio no disponible temporalmente',
        {
          retryAfterSeconds: DATABASE_RETRY_AFTER_SECONDS,
        }
      );
    }
    return { status: 'ok' };
  }
}

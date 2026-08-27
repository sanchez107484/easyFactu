import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ActivitySummaryService } from './activity-summary.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Plan } from '@easyfactura/shared-types';

@ApiTags('activity-summary')
@Controller('activity-summary')
@UseGuards(JwtAuthGuard, PlanGuard)
@ApiBearerAuth()
@RequirePlan(Plan.PROFESSIONAL)
export class ActivitySummaryController {
  constructor(private readonly activitySummaryService: ActivitySummaryService) {}

  @Get()
  @ApiOperation({ summary: 'Resumen combinado de ingresos y gastos (Mi actividad)' })
  @ApiOkResponse({ description: 'KPIs, gráfico mensual y top categorías de gasto' })
  getSummary(@CurrentTenant() tenantId: string) {
    return this.activitySummaryService.getSummary(tenantId);
  }
}

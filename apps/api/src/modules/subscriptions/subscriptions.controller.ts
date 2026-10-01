import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { ChangePlanDto } from './dto/change-plan.dto';
import { SetPreferredPlanDto } from './dto/set-preferred-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('subscriptions')
@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener la suscripción actual' })
  getCurrentSubscription(@CurrentTenant() tenantId: string) {
    return this.subscriptionsService.getCurrentSubscription(tenantId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'Obtener los planes disponibles' })
  getAvailablePlans() {
    return this.subscriptionsService.getAvailablePlans();
  }

  @Get('usage')
  @ApiOperation({ summary: 'Obtener uso actual del tenant para validación de downgrade' })
  getUsage(@CurrentTenant() tenantId: string) {
    return this.subscriptionsService.getUsage(tenantId);
  }

  @Post('change-plan')
  @ApiOperation({ summary: 'Cambiar de plan' })
  changePlan(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePlanDto,
  ) {
    return this.subscriptionsService.changePlan(tenantId, userId, dto);
  }

  @Post('preferred-plan')
  @ApiOperation({ summary: 'Guardar el plan preferido para después del período gratuito' })
  setPreferredPlan(
    @CurrentTenant() tenantId: string,
    @Body() dto: SetPreferredPlanDto,
  ) {
    return this.subscriptionsService.setPreferredPlan(tenantId, dto);
  }
}

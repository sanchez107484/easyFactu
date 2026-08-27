import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { RecurringExpensesService } from './recurring-expenses.service';
import { CreateRecurringExpenseDto } from './dto/create-recurring-expense.dto';
import { UpdateRecurringExpenseDto } from './dto/update-recurring-expense.dto';
import { QueryRecurringExpenseDto } from './dto/query-recurring-expense.dto';
import { GenerateRecurringExpensesDto } from './dto/generate-recurring-expenses.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantUserRole, Plan } from '@easyfactura/shared-types';

@ApiTags('recurring-expenses')
@Controller('recurring-expenses')
@UseGuards(JwtAuthGuard, PlanGuard)
@ApiBearerAuth()
export class RecurringExpensesController {
  constructor(private readonly recurringExpensesService: RecurringExpensesService) {}

  @Post()
  @RequirePlan(Plan.PROFESSIONAL)
  @Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Crear gasto recurrente' })
  @ApiCreatedResponse({ description: 'Gasto recurrente creado correctamente' })
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRecurringExpenseDto
  ) {
    return this.recurringExpensesService.create(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar gastos recurrentes' })
  @ApiOkResponse({ description: 'Lista paginada de gastos recurrentes' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryRecurringExpenseDto) {
    return this.recurringExpensesService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un gasto recurrente' })
  @ApiOkResponse({ description: 'Gasto recurrente encontrado' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.recurringExpensesService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePlan(Plan.PROFESSIONAL)
  @Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Actualizar gasto recurrente' })
  @ApiOkResponse({ description: 'Gasto recurrente actualizado correctamente' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateRecurringExpenseDto
  ) {
    return this.recurringExpensesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePlan(Plan.PROFESSIONAL)
  @Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Eliminar gasto recurrente' })
  @ApiNoContentResponse({ description: 'Gasto recurrente eliminado correctamente' })
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.recurringExpensesService.remove(tenantId, id);
  }

  @Post(':id/generate')
  @RequirePlan(Plan.PROFESSIONAL)
  @Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Generar gastos a partir de una suscripción recurrente' })
  @ApiOkResponse({ description: 'Gastos generados correctamente' })
  generate(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: GenerateRecurringExpensesDto
  ) {
    return this.recurringExpensesService.generate(tenantId, id, dto.upToDate);
  }
}

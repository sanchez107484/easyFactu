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
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantUserRole, Plan } from '@easyfactura/shared-types';

@ApiTags('expenses')
@Controller('expenses')
@UseGuards(JwtAuthGuard, PlanGuard)
@ApiBearerAuth()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @RequirePlan(Plan.PROFESSIONAL)
  @Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Crear gasto' })
  @ApiCreatedResponse({ description: 'Gasto creado correctamente' })
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateExpenseDto
  ) {
    return this.expensesService.create(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar gastos' })
  @ApiOkResponse({ description: 'Lista paginada de gastos' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryExpenseDto) {
    return this.expensesService.findAll(tenantId, query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen de gastos del mes y del año' })
  @ApiOkResponse({ description: 'Totales del periodo' })
  getSummary(@CurrentTenant() tenantId: string) {
    return this.expensesService.getSummary(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un gasto' })
  @ApiOkResponse({ description: 'Gasto encontrado' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.expensesService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequirePlan(Plan.PROFESSIONAL)
  @Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Actualizar gasto' })
  @ApiOkResponse({ description: 'Gasto actualizado correctamente' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto
  ) {
    return this.expensesService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePlan(Plan.PROFESSIONAL)
  @Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Eliminar gasto' })
  @ApiNoContentResponse({ description: 'Gasto eliminado correctamente' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.expensesService.remove(tenantId, id);
  }
}

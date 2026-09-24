import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { ExpenseCategoriesService } from './expense-categories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';


@ApiTags('expense-categories')
@Controller('expense-categories')
@UseGuards(JwtAuthGuard, PlanGuard)
@ApiBearerAuth()
export class ExpenseCategoriesController {
  constructor(private readonly expenseCategoriesService: ExpenseCategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorías de gasto' })
  @ApiOkResponse({ description: 'Categorías de gasto disponibles' })
  findAll() {
    return this.expenseCategoriesService.findAll();
  }
}

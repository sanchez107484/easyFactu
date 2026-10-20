import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlanTier, TenantUserRole } from '@easyfactura/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsProductAliasesService } from './reports-product-aliases.service';
import { CreateProductAliasDto } from './dto/product-alias.dto';

/** Link free-text invoice lines to catalog products from the sales report. */
@ApiTags('reports')
@Controller('reports/product-aliases')
@UseGuards(JwtAuthGuard, PlanGuard)
@ApiBearerAuth()
@RequirePlan(PlanTier.PROFESSIONAL)
@Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
export class ReportsProductAliasesController {
  constructor(private readonly aliasesService: ReportsProductAliasesService) {}

  @Post()
  @ApiOperation({ summary: 'Conectar una descripción de línea con un artículo del catálogo' })
  link(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() body: CreateProductAliasDto
  ) {
    return this.aliasesService.link(tenantId, userId, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deshacer una equivalencia' })
  remove(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.aliasesService.remove(tenantId, id);
  }
}

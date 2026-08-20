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
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { TenantUserRole, Plan } from '@easyfactura/shared-types';

@ApiTags('suppliers')
@Controller('suppliers')
@UseGuards(JwtAuthGuard, PlanGuard)
@ApiBearerAuth()
@RequirePlan(Plan.PROFESSIONAL)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Crear proveedor' })
  @ApiCreatedResponse({ description: 'Proveedor creado correctamente' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar proveedores' })
  @ApiOkResponse({ description: 'Lista paginada de proveedores' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QuerySupplierDto) {
    return this.suppliersService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un proveedor' })
  @ApiOkResponse({ description: 'Proveedor encontrado' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.suppliersService.findOne(tenantId, id);
  }

  @Put(':id')
  @Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Actualizar proveedor' })
  @ApiOkResponse({ description: 'Proveedor actualizado correctamente' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSupplierDto
  ) {
    return this.suppliersService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Eliminar proveedor' })
  @ApiNoContentResponse({ description: 'Proveedor eliminado correctamente' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.suppliersService.remove(tenantId, id);
  }
}

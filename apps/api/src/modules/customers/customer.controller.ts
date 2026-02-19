import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomerController {
  constructor(private customerService: CustomerService) {}

  @Post()
  @ApiOperation({ summary: 'Crear cliente' })
  @ApiCreatedResponse({ description: 'Cliente creado correctamente' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateCustomerDto) {
    return this.customerService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar clientes' })
  @ApiOkResponse({ description: 'Lista paginada de clientes' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryCustomerDto) {
    return this.customerService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente' })
  @ApiOkResponse({ description: 'Cliente encontrado' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.customerService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar cliente' })
  @ApiOkResponse({ description: 'Cliente actualizado correctamente' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto
  ) {
    return this.customerService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar cliente (soft delete)' })
  @ApiOkResponse({ description: 'Cliente desactivado correctamente' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.customerService.remove(tenantId, id);
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
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
} from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { ImportFromPoolDto } from './dto/import-from-pool.dto';
import { LookupCustomerDto } from './dto/lookup-customer.dto';
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

  // NOTE: Static routes must be declared before /:id to avoid param capture
  @Get('lookup')
  @ApiOperation({ summary: 'Buscar NIF en el directorio fiscal global (sugerencia de autorellenar)' })
  @ApiOkResponse({ description: 'Datos fiscales del directorio o null si no existe' })
  lookupDirectory(@Query() query: LookupCustomerDto) {
    return this.customerService.lookupDirectory(query.nif);
  }

  @Get('shared-pool')
  @ApiOperation({ summary: 'Buscar clientes en el directorio compartido de la asesoría' })
  @ApiOkResponse({ description: 'Clientes de otros tenants de la misma asesoría' })
  findSharedPool(@CurrentTenant() tenantId: string, @Query('search') search?: string) {
    return this.customerService.findAgencySharedPool(tenantId, search);
  }

  @Post('import-from-pool')
  @ApiOperation({ summary: 'Copiar un cliente del directorio compartido al tenant actual' })
  @ApiCreatedResponse({ description: 'Cliente copiado o ya existente devuelto' })
  importFromPool(@CurrentTenant() tenantId: string, @Body() dto: ImportFromPoolDto) {
    return this.customerService.importFromAgencyPool(tenantId, dto.nif);
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

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Reactivar cliente (deshacer soft delete)' })
  @ApiOkResponse({ description: 'Cliente reactivado correctamente' })
  restore(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.customerService.restore(tenantId, id);
  }
}

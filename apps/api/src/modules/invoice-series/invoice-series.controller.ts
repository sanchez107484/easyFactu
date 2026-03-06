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
import { InvoiceSeriesService } from './invoice-series.service';
import { CreateInvoiceSeriesDto } from './dto/create-invoice-series.dto';
import { UpdateInvoiceSeriesDto } from './dto/update-invoice-series.dto';
import { QueryInvoiceSeriesDto } from './dto/query-invoice-series.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUserRole } from '@easyfactura/shared-types';

@ApiTags('invoice-series')
@Controller('invoice-series')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvoiceSeriesController {
  constructor(private invoiceSeriesService: InvoiceSeriesService) {}

  @Post()
  @Roles(TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Crear serie de facturación' })
  @ApiCreatedResponse({ description: 'Serie creada correctamente' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateInvoiceSeriesDto) {
    return this.invoiceSeriesService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar series de facturación' })
  @ApiOkResponse({ description: 'Lista paginada de series' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryInvoiceSeriesDto) {
    return this.invoiceSeriesService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una serie de facturación' })
  @ApiOkResponse({ description: 'Serie encontrada' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceSeriesService.findOne(tenantId, id);
  }

  @Put(':id')
  @Roles(TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Actualizar serie de facturación' })
  @ApiOkResponse({ description: 'Serie actualizada correctamente' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceSeriesDto
  ) {
    return this.invoiceSeriesService.update(tenantId, id, dto);
  }

  @Post('create-for-new-year/:year')
  @Roles(TenantUserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear series para un nuevo año',
    description: 'Replica las series del año anterior para un nuevo año',
  })
  @ApiCreatedResponse({ description: 'Series creadas para el nuevo año' })
  createForNewYear(@CurrentTenant() tenantId: string, @Param('year') year: string) {
    return this.invoiceSeriesService.createSeriesForNewYear(tenantId, parseInt(year, 10));
  }

  @Delete(':id')
  @Roles(TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar serie de facturación' })
  @ApiNoContentResponse({ description: 'Serie eliminada correctamente' })
  delete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.invoiceSeriesService.delete(tenantId, id);
  }
}

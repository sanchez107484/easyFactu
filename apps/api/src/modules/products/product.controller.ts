import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductController {
  constructor(private productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Crear producto' })
  @ApiCreatedResponse({ description: 'Producto creado correctamente' })
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateProductDto) {
    return this.productService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  @ApiOkResponse({ description: 'Lista paginada de productos' })
  findAll(@CurrentTenant() tenantId: string, @Query() query: QueryProductDto) {
    return this.productService.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un producto' })
  @ApiOkResponse({ description: 'Producto encontrado' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.productService.findOne(tenantId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar producto' })
  @ApiOkResponse({ description: 'Producto actualizado correctamente' })
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto
  ) {
    return this.productService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar producto (soft delete)' })
  @ApiOkResponse({ description: 'Producto desactivado correctamente' })
  remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.productService.remove(tenantId, id);
  }
}

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
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiConsumes,
} from '@nestjs/swagger';
import { ProductService } from './product.service';
import { ProductImportService } from './product-import.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ConfirmImportDto } from './dto/confirm-import.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';

@ApiTags('products')
@Controller('products')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductController {
  constructor(
    private productService: ProductService,
    private productImportService: ProductImportService
  ) {}

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

  // NOTE: Static routes must be declared before /:id to avoid param capture

  @Get('import/template')
  @ApiOperation({ summary: 'Descargar plantilla Excel para importar productos' })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.productImportService.generateTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla-productos.xlsx"');
    res.end(buffer);
  }

  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Previsualizar importación de productos desde Excel' })
  @ApiOkResponse({ description: 'Vista previa de filas con validación' })
  previewImport(@CurrentTenant() tenantId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se ha enviado ningún archivo.');
    return this.productImportService.preview(tenantId, file);
  }

  @Post('import/confirm')
  @ApiOperation({ summary: 'Confirmar importación de productos' })
  @ApiCreatedResponse({ description: 'Resultado de la importación' })
  confirmImport(@CurrentTenant() tenantId: string, @Body() dto: ConfirmImportDto) {
    return this.productImportService.confirm(tenantId, dto.rows);
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

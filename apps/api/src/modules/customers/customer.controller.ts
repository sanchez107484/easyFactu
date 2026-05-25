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
import { CustomerService } from './customer.service';
import { CustomerImportService } from './customer-import.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { ImportFromPoolDto } from './dto/import-from-pool.dto';
import { ConfirmImportDto } from './dto/confirm-import.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CachedJwtUser } from '../auth/jwt-validation-cache.service';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CustomerController {
  constructor(
    private customerService: CustomerService,
    private customerImportService: CustomerImportService
  ) {}

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
  @Get('shared-pool')
  @ApiOperation({ summary: 'Buscar clientes en el directorio compartido de la asesoría' })
  @ApiOkResponse({ description: 'Clientes de otros tenants de la misma asesoría' })
  findSharedPool(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CachedJwtUser,
    @Query('search') search?: string
  ) {
    return this.customerService.findAgencySharedPool(tenantId, user.actingAsClient, search);
  }

  @Post('import-from-pool')
  @ApiOperation({ summary: 'Copiar un cliente del directorio compartido al tenant actual' })
  @ApiCreatedResponse({ description: 'Cliente copiado o ya existente devuelto' })
  importFromPool(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: CachedJwtUser,
    @Body() dto: ImportFromPoolDto
  ) {
    return this.customerService.importFromAgencyPool(tenantId, user.actingAsClient, dto.nif);
  }

  // ── Excel Import ─────────────────────────────────────────────────────────────

  @Get('import/template')
  @ApiOperation({ summary: 'Descargar plantilla Excel para importar clientes' })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.customerImportService.generateTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla-clientes.xlsx"');
    res.end(buffer);
  }

  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Previsualizar importación de clientes desde Excel' })
  @ApiOkResponse({ description: 'Vista previa de filas con validación' })
  previewImport(@CurrentTenant() tenantId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se ha enviado ningún archivo.');
    return this.customerImportService.preview(tenantId, file);
  }

  @Post('import/confirm')
  @ApiOperation({ summary: 'Confirmar importación de clientes' })
  @ApiCreatedResponse({ description: 'Resultado de la importación' })
  confirmImport(@CurrentTenant() tenantId: string, @Body() dto: ConfirmImportDto) {
    return this.customerImportService.confirm(tenantId, dto.rows);
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

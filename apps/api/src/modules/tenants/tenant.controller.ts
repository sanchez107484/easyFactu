import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import type { Express } from 'express';
import { TenantService } from './tenant.service';
import { UploadService } from './upload.service';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { SetupTenantDto } from './dto/setup-tenant.dto';
import { UploadCertificateDto } from './dto/upload-certificate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantUserRole } from '@easyfactura/shared-types';

@ApiTags('tenants')
@Controller('tenant')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TenantController {
  constructor(
    private tenantService: TenantService,
    private uploadService: UploadService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener datos de la empresa' })
  findOne(@CurrentTenant() tenantId: string) {
    return this.tenantService.findOne(tenantId);
  }

  @Put()
  @Roles(TenantUserRole.ADMIN)
  @ApiOperation({ summary: 'Actualizar datos de la empresa' })
  update(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateTenantDto
  ) {
    return this.tenantService.update(tenantId, userId, dto);
  }

  @Post('setup')
  @Roles(TenantUserRole.ADMIN)
  @ApiOperation({
    summary: 'Completar configuración inicial',
    description: 'Wizard de configuración inicial tras registro',
  })
  setup(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SetupTenantDto
  ) {
    return this.tenantService.setup(tenantId, userId, dto);
  }

  @Post('logo')
  @Roles(TenantUserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir logo de la empresa',
    description: 'Formatos permitidos: JPG, PNG, SVG. Máximo 2MB',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de logo (JPG, PNG o SVG)',
        },
      },
    },
  })
  async uploadLogo(@CurrentTenant() tenantId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }
    return this.uploadService.uploadLogo(tenantId, file);
  }

  @Delete('logo')
  @Roles(TenantUserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar logo de la empresa' })
  async deleteLogo(@CurrentTenant() tenantId: string) {
    await this.uploadService.deleteLogo(tenantId);
    return { message: 'Logo eliminado correctamente' };
  }

  @Post('certificate')
  @Roles(TenantUserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir certificado digital VeriFactu',
    description: 'Formatos permitidos: .pfx, .p12. Máximo 5MB. Se encripta con AES-256',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo de certificado (.pfx o .p12)',
        },
        password: {
          type: 'string',
          description: 'Contraseña del certificado',
        },
      },
      required: ['file', 'password'],
    },
  })
  async uploadCertificate(
    @CurrentTenant() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadCertificateDto
  ) {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo');
    }
    return this.uploadService.uploadCertificate(tenantId, file, dto.password);
  }

  @Delete('certificate')
  @Roles(TenantUserRole.ADMIN)
  @ApiOperation({ summary: 'Eliminar certificado digital' })
  async deleteCertificate(@CurrentTenant() tenantId: string) {
    await this.uploadService.deleteCertificate(tenantId);
    return { message: 'Certificado eliminado correctamente' };
  }
}

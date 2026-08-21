import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { ExpenseAttachmentsService } from './expense-attachments.service';
import { UploadExpenseAttachmentDto } from './dto/upload-expense-attachment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantUserRole, Plan } from '@easyfactura/shared-types';

@ApiTags('expense-attachments')
@Controller('expense-attachments')
@UseGuards(JwtAuthGuard, PlanGuard)
@ApiBearerAuth()
export class ExpenseAttachmentsController {
  constructor(private readonly expenseAttachmentsService: ExpenseAttachmentsService) {}

  @Post()
  @RequirePlan(Plan.PROFESSIONAL)
  @Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir adjunto de gasto' })
  @ApiCreatedResponse({ description: 'Adjunto subido correctamente' })
  upload(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadExpenseAttachmentDto
  ) {
    return this.expenseAttachmentsService.upload(tenantId, userId, file, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener metadatos de un adjunto' })
  @ApiOkResponse({ description: 'Metadatos del adjunto' })
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.expenseAttachmentsService.findOne(tenantId, id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Descargar adjunto' })
  @ApiOkResponse({ description: 'Contenido del archivo' })
  async download(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const { buffer, mimeType, fileName } = await this.expenseAttachmentsService.download(tenantId, id);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePlan(Plan.PROFESSIONAL)
  @Roles(TenantUserRole.OWNER, TenantUserRole.ADMIN, TenantUserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Eliminar adjunto' })
  @ApiNoContentResponse({ description: 'Adjunto eliminado correctamente' })
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.expenseAttachmentsService.remove(tenantId, id);
  }
}

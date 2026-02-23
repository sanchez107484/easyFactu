import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { InvoiceTemplateService } from './invoice-template.service';
import { InvoicePdfService } from './pdf/invoice-pdf.service';
import { CreateInvoiceTemplateDto } from './dto/create-invoice-template.dto';
import { UpdateInvoiceTemplateDto } from './dto/update-invoice-template.dto';

@UseGuards(JwtAuthGuard)
@Controller('invoice-templates')
export class InvoiceTemplateController {
  constructor(
    private readonly templateService: InvoiceTemplateService,
    private readonly pdfService: InvoicePdfService
  ) {}

  @Get()
  findAll(@CurrentTenant() tenantId: string) {
    return this.templateService.findAll(tenantId);
  }

  @Get('default')
  findDefault(@CurrentTenant() tenantId: string) {
    return this.templateService.findDefault(tenantId);
  }

  @Get(':id')
  findOne(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.templateService.findOne(tenantId, id);
  }

  @Post()
  create(@CurrentTenant() tenantId: string, @Body() dto: CreateInvoiceTemplateDto) {
    return this.templateService.create(tenantId, dto);
  }

  @Put(':id')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvoiceTemplateDto
  ) {
    return this.templateService.update(tenantId, id, dto);
  }

  @Post(':id/set-default')
  @HttpCode(HttpStatus.OK)
  setDefault(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.templateService.setDefault(tenantId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentTenant() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.templateService.remove(tenantId, id);
  }

  @Get(':id/preview')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'inline; filename="preview.pdf"')
  async preview(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response
  ) {
    const buffer = await this.pdfService.generatePreview(tenantId, id);
    res.send(buffer);
  }
}

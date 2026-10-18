import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { PlanTier } from '@easyfactura/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlanGuard } from '../../common/guards/plan.guard';
import { RequirePlan } from '../../common/decorators/require-plan.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';
import { ReportsHistoryService } from './reports-history.service';
import { ReportRequestDto } from './dto/report-request.dto';
import { QueryReportHistoryDto } from './dto/query-report-history.dto';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * PRO-only reports. When an agency acts as a client, the JWT carries the client's
 * tenantId, so PlanGuard checks the client's plan.
 */
@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, PlanGuard)
@ApiBearerAuth()
@RequirePlan(PlanTier.PROFESSIONAL)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly historyService: ReportsHistoryService
  ) {}

  /** POST because filters are arrays — keeps the request body typed and validated. */
  @Post('preview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Datos del informe para la vista previa' })
  @ApiOkResponse({ description: 'Datos agregados del informe' })
  preview(@CurrentTenant() tenantId: string, @Body() body: ReportRequestDto) {
    return this.reportsService.preview(tenantId, body);
  }

  @Post('generate')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar el informe en Excel y guardarlo en el histórico' })
  async generate(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('actingAsClient') actingAsClient: boolean | undefined,
    @Body() body: ReportRequestDto,
    @Res() res: Response
  ) {
    const { fileName, file } = await this.reportsService.generate(
      tenantId,
      { userId, actingAsClient: actingAsClient === true },
      body
    );
    sendXlsx(res, fileName, file);
  }

  @Get('history')
  @ApiOperation({ summary: 'Histórico de informes generados' })
  getHistory(@CurrentTenant() tenantId: string, @Query() query: QueryReportHistoryDto) {
    return this.historyService.list(tenantId, query);
  }

  @Get('history/:id/download')
  @ApiOperation({ summary: 'Descargar un informe del histórico' })
  async downloadFromHistory(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response
  ) {
    const { fileName, file } = await this.historyService.getFile(tenantId, id);
    sendXlsx(res, fileName, file);
  }
}

function sendXlsx(res: Response, fileName: string, file: Buffer): void {
  res.setHeader('Content-Type', XLSX_MIME_TYPE);
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.setHeader('Content-Length', String(file.length));
  res.send(file);
}

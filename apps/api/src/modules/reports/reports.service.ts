import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  ReportAppliedFilters,
  ReportData,
  ReportDimension,
  ReportOptions,
  ReportType,
} from '@easyfactura/shared-types';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportRequestDto } from './dto/report-request.dto';
import { ReportsFiltersService } from './reports-filters.service';
import { ReportsSummaryService } from './reports-summary.service';
import { ReportsExpensesService } from './reports-expenses.service';
import { ReportsSalesService } from './reports-sales.service';
import { ReportsCollectionsService } from './reports-collections.service';
import { ReportsReceivablesService } from './reports-receivables.service';
import { ReportsHistoryService } from './reports-history.service';
import { ReportsExcelService } from './excel/reports-excel.service';
import { ReportPeriod } from './report-period.helpers';
import { normalizeReportOptions, parseReportPeriod } from './report-request.validator';

export interface ReportActor {
  userId: string;
  actingAsClient: boolean;
}

export interface GeneratedReportFile {
  reportId: string;
  fileName: string;
  file: Buffer;
}

/** Orchestrates report building (preview) and Excel generation + history. */
@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly filtersService: ReportsFiltersService,
    private readonly summaryService: ReportsSummaryService,
    private readonly expensesService: ReportsExpensesService,
    private readonly salesService: ReportsSalesService,
    private readonly collectionsService: ReportsCollectionsService,
    private readonly receivablesService: ReportsReceivablesService,
    private readonly historyService: ReportsHistoryService,
    private readonly excelService: ReportsExcelService
  ) {}

  async preview(tenantId: string, dto: ReportRequestDto): Promise<ReportData> {
    const { report } = await this.buildReport(tenantId, dto);
    return report;
  }

  async generate(
    tenantId: string,
    actor: ReportActor,
    dto: ReportRequestDto
  ): Promise<GeneratedReportFile> {
    const [{ report, options, filters }, tenantName] = await Promise.all([
      this.buildReport(tenantId, dto),
      this.getTenantName(tenantId),
    ]);

    const file = await this.excelService.build(report, {
      tenantName,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      parameters: { options, filters },
    });
    const fileName = this.excelService.buildFileName(dto.type, dto.fromDate, dto.toDate);

    const reportId = await this.historyService.record({
      tenantId,
      userId: actor.userId,
      generatedByAgency: actor.actingAsClient,
      type: dto.type,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      parameters: { options, filters },
      fileName,
      file,
    });

    return { reportId, fileName, file };
  }

  private async buildReport(tenantId: string, dto: ReportRequestDto) {
    const period = parseReportPeriod(dto.fromDate, dto.toDate);
    const options = normalizeReportOptions(dto);
    const filters = await this.filtersService.resolveFilters(tenantId, dto);
    const report = await this.buildByType(tenantId, dto.type, period, options, filters);
    return { report, options, filters };
  }

  private buildByType(
    tenantId: string,
    type: ReportType,
    period: ReportPeriod,
    options: ReportOptions,
    filters: ReportAppliedFilters
  ): Promise<ReportData> {
    switch (type) {
      case ReportType.SUMMARY:
        return this.summaryService.build(tenantId, period, options);
      case ReportType.SALES:
        return this.salesService.build(tenantId, period, requireGroupBy(options), filters);
      case ReportType.EXPENSES:
        return this.expensesService.build(tenantId, period, requireGroupBy(options), filters);
      case ReportType.COLLECTIONS:
        return this.collectionsService.build(tenantId, period, requireGroupBy(options), filters);
      // A balance "as of" the end of the requested period.
      case ReportType.RECEIVABLES:
        return this.receivablesService.build(tenantId, period.to, options, filters);
    }
  }

  private async getTenantName(tenantId: string): Promise<string> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { businessName: true },
    });
    if (!tenant) throw new NotFoundException('Empresa no encontrada');
    return tenant.businessName;
  }
}

/** normalizeReportOptions() guarantees groupBy for grouped report types. */
function requireGroupBy(options: ReportOptions): ReportOptions & { groupBy: ReportDimension } {
  const { groupBy } = options;
  if (!groupBy) throw new BadRequestException('Indica cómo agrupar el informe');
  return { ...options, groupBy };
}

import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsProductAliasesController } from './reports-product-aliases.controller';
import { ReportsProductAliasesService } from './reports-product-aliases.service';
import { ReportsService } from './reports.service';
import { ReportsFiltersService } from './reports-filters.service';
import { ReportsSummaryService } from './reports-summary.service';
import { ReportsExpensesService } from './reports-expenses.service';
import { ReportsSalesService } from './reports-sales.service';
import { ReportsCollectionsService } from './reports-collections.service';
import { ReportsReceivablesService } from './reports-receivables.service';
import { ReportsCustomerMetricsService } from './reports-customer-metrics.service';
import { ReportsFreeTextLinesService } from './reports-free-text-lines.service';
import { GroupedQueryService } from './grouping/grouped-query.service';
import { GroupedReportService } from './grouping/grouped-report.service';
import { ReportsHistoryService } from './reports-history.service';
import { ReportsStorageService } from './reports-storage.service';
import { ReportsExcelService } from './excel/reports-excel.service';

@Module({
  controllers: [ReportsController, ReportsProductAliasesController],
  providers: [
    ReportsService,
    ReportsFiltersService,
    ReportsSummaryService,
    ReportsExpensesService,
    ReportsSalesService,
    ReportsCollectionsService,
    ReportsReceivablesService,
    ReportsCustomerMetricsService,
    ReportsFreeTextLinesService,
    ReportsProductAliasesService,
    GroupedQueryService,
    GroupedReportService,
    ReportsHistoryService,
    ReportsStorageService,
    ReportsExcelService,
  ],
})
export class ReportsModule {}

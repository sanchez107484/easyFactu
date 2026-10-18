import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ReportData, ReportParameters, ReportType } from '@easyfactura/shared-types';
import { ReportSheetHeader } from './report-workbook.helpers';
import { writeSummarySheets } from './summary-sheets';
import { writeCollectionsSheets, writeExpensesSheets, writeSalesSheets } from './grouped-sheets';
import { writeReceivablesSheets } from './receivables-sheets';
import { describeParameters, formatDateRange, formatIsoDate } from './report-labels';

const REPORT_TITLES: Record<ReportType, string> = {
  [ReportType.SUMMARY]: 'Informe de ingresos, gastos y resultado',
  [ReportType.SALES]: 'Informe de ventas',
  [ReportType.EXPENSES]: 'Informe de gastos',
  [ReportType.COLLECTIONS]: 'Informe de cobros realizados',
  [ReportType.RECEIVABLES]: 'Informe de cobros pendientes',
};

const FILE_SLUGS: Record<ReportType, string> = {
  [ReportType.SUMMARY]: 'resumen',
  [ReportType.SALES]: 'ventas',
  [ReportType.EXPENSES]: 'gastos',
  [ReportType.COLLECTIONS]: 'cobros',
  [ReportType.RECEIVABLES]: 'cobros-pendientes',
};

const TAX_BASE_NOTE =
  'Importes en base imponible (sin IVA ni IRPF) salvo que se indique lo contrario.';

/** Cash reports show real money in/out, so amounts include taxes. */
const CASH_REPORTS = new Set([ReportType.COLLECTIONS, ReportType.RECEIVABLES]);
const CASH_NOTE = 'Importes con IVA incluido (dinero cobrado o pendiente de cobrar).';

export interface ReportExcelContext {
  tenantName: string;
  fromDate: string;
  toDate: string;
  parameters: ReportParameters;
}

@Injectable()
export class ReportsExcelService {
  async build(report: ReportData, context: ReportExcelContext): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EasyFactura';
    workbook.created = new Date();

    const header = this.buildHeader(report, context);
    this.writeSheets(workbook, header, report);

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }

  buildFileName(type: ReportType, fromDate: string, toDate: string): string {
    return `informe-${FILE_SLUGS[type]}-${fromDate}_${toDate}.xlsx`;
  }

  private writeSheets(workbook: ExcelJS.Workbook, header: ReportSheetHeader, report: ReportData) {
    switch (report.type) {
      case ReportType.SUMMARY:
        return writeSummarySheets(workbook, header, report);
      case ReportType.SALES:
        return writeSalesSheets(workbook, header, report);
      case ReportType.EXPENSES:
        return writeExpensesSheets(workbook, header, report);
      case ReportType.COLLECTIONS:
        return writeCollectionsSheets(workbook, header, report);
      case ReportType.RECEIVABLES:
        return writeReceivablesSheets(workbook, header, report);
    }
  }

  private buildHeader(report: ReportData, context: ReportExcelContext): ReportSheetHeader {
    return {
      title: REPORT_TITLES[report.type],
      tenantName: context.tenantName,
      periodLabel:
        report.type === ReportType.RECEIVABLES
          ? `saldo a ${formatIsoDate(report.asOfDate)}`
          : formatDateRange(context),
      details: describeParameters(context.parameters, report.comparisonPeriod),
      note: CASH_REPORTS.has(report.type) ? CASH_NOTE : TAX_BASE_NOTE,
    };
  }
}

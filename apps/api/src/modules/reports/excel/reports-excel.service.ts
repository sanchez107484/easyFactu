import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ReportData, ReportParameters, ReportType } from '@easyfactura/shared-types';
import { ReportSheetHeader } from './report-workbook.helpers';
import { writeSummarySheets } from './summary-sheets';
import { writeExpensesSheets, writeSalesSheets } from './grouped-sheets';
import { describeParameters, formatDateRange } from './report-labels';

const REPORT_TITLES: Record<ReportType, string> = {
  [ReportType.SUMMARY]: 'Informe de ingresos, gastos y resultado',
  [ReportType.SALES]: 'Informe de ventas',
  [ReportType.EXPENSES]: 'Informe de gastos',
};

const FILE_SLUGS: Record<ReportType, string> = {
  [ReportType.SUMMARY]: 'resumen',
  [ReportType.SALES]: 'ventas',
  [ReportType.EXPENSES]: 'gastos',
};

const TAX_BASE_NOTE =
  'Importes en base imponible (sin IVA ni IRPF) salvo que se indique lo contrario.';

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
    }
  }

  private buildHeader(report: ReportData, context: ReportExcelContext): ReportSheetHeader {
    return {
      title: REPORT_TITLES[report.type],
      tenantName: context.tenantName,
      periodLabel: formatDateRange(context),
      details: describeParameters(context.parameters, report.comparisonPeriod),
      note: TAX_BASE_NOTE,
    };
  }
}

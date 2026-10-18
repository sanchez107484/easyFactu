import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  ReportComparison,
  ReportDimension,
  ReceivableAgingBucket,
  ReportGroupRow,
  ReportSortBy,
  ReportTimeGrouping,
  ReportType,
  SalesReport,
  SummaryReport,
} from '@easyfactura/shared-types';
import {
  buildBucketKeyMap,
  formatBucketLabel,
  getComparisonPeriod,
  listBuckets,
  toDateRange,
} from '../src/modules/reports/report-period.helpers';
import {
  normalizeReportOptions,
  parseReportPeriod,
} from '../src/modules/reports/report-request.validator';
import {
  applyTopN,
  attachComparison,
  buildTree,
  fillPeriodBuckets,
  sortRows,
} from '../src/modules/reports/grouping/grouped-rows.builder';
import {
  ReceivableInvoiceRow,
  agingBucketFor,
  buildCustomerRows,
  sumReceivables,
} from '../src/modules/reports/receivables.helpers';
import { RawGroupedRow } from '../src/modules/reports/grouping/grouped-source';
import { EXPENSE_METRICS_OPS } from '../src/modules/reports/grouping/expenses-source';
import { ReportsFiltersService } from '../src/modules/reports/reports-filters.service';
import { ReportsExcelService } from '../src/modules/reports/excel/reports-excel.service';
import { ReportRequestDto } from '../src/modules/reports/dto/report-request.dto';
import { PrismaService } from '../src/prisma/prisma.service';
import { parseHistoryParameters } from '../src/modules/reports/report-history-parameters';

const TENANT_ID = '11111111-1111-4111-8111-111111111111';
const CUSTOMER_A = '22222222-2222-4222-8222-222222222222';
const CUSTOMER_B = '33333333-3333-4333-8333-333333333333';

function period(fromDate: string, toDate: string) {
  return { from: new Date(fromDate), to: new Date(toDate) };
}

function request(overrides: Partial<ReportRequestDto>): ReportRequestDto {
  return Object.assign(new ReportRequestDto(), {
    type: ReportType.SALES,
    fromDate: '2026-01-01',
    toDate: '2026-03-31',
    groupBy: ReportDimension.CUSTOMER,
    ...overrides,
  });
}

function raw(partial: Partial<RawGroupedRow>): RawGroupedRow {
  return {
    k1: null,
    l1: null,
    s1: null,
    k2: null,
    l2: null,
    s2: null,
    amount: '0',
    units: null,
    cnt: BigInt(1),
    g1: 0,
    g2: 1,
    ...partial,
  };
}

function expenseRow(
  key: string,
  amount: number,
  previous?: number
): ReportGroupRow<{ amount: number; count: number }> {
  return {
    key,
    label: key,
    sublabel: null,
    metrics: { amount, count: 1 },
    previous: previous === undefined ? undefined : { amount: previous, count: 1 },
  };
}

describe('report period helpers', () => {
  it('lists quarter and year buckets', () => {
    const range = period('2025-11-15', '2026-04-01');
    expect(listBuckets(range, ReportTimeGrouping.QUARTER)).toEqual([
      '2025-Q4',
      '2026-Q1',
      '2026-Q2',
    ]);
    expect(listBuckets(range, ReportTimeGrouping.YEAR)).toEqual(['2025', '2026']);
  });

  it('formats bucket labels in Spanish', () => {
    expect(formatBucketLabel('2026-03')).toBe('Mar 2026');
    expect(formatBucketLabel('2026-Q1')).toBe('T1 2026');
    expect(formatBucketLabel('2026')).toBe('2026');
  });

  it('compares a whole quarter with the previous quarter', () => {
    const previous = getComparisonPeriod(
      period('2026-04-01', '2026-06-30'),
      ReportComparison.PREVIOUS_PERIOD
    );
    expect(previous && toDateRange(previous)).toEqual({
      fromDate: '2026-01-01',
      toDate: '2026-03-31',
    });
  });

  it('compares a partial range with the same number of previous days', () => {
    const previous = getComparisonPeriod(
      period('2026-03-10', '2026-03-19'),
      ReportComparison.PREVIOUS_PERIOD
    );
    expect(previous && toDateRange(previous)).toEqual({
      fromDate: '2026-02-28',
      toDate: '2026-03-09',
    });
  });

  it('compares with the same period of the previous year (clamping 29 Feb)', () => {
    const previous = getComparisonPeriod(
      period('2028-02-01', '2028-02-29'),
      ReportComparison.PREVIOUS_YEAR
    );
    expect(previous && toDateRange(previous)).toEqual({
      fromDate: '2027-02-01',
      toDate: '2027-02-28',
    });
  });

  it('maps comparison buckets onto current buckets by position', () => {
    const map = buildBucketKeyMap(
      period('2026-01-01', '2026-03-31'),
      period('2025-01-01', '2025-03-31'),
      ReportTimeGrouping.MONTH
    );
    expect(map.get('2025-02')).toBe('2026-02');
  });
});

describe('report request validation', () => {
  it('rejects periods longer than 24 months', () => {
    expect(() => parseReportPeriod('2024-01-01', '2026-01-01')).toThrow(BadRequestException);
    expect(() => parseReportPeriod('2024-01-01', '2025-12-31')).not.toThrow();
  });

  it('applies defaults and drops topN when grouping by period', () => {
    const options = normalizeReportOptions(request({ groupBy: ReportDimension.PERIOD, topN: 10 }));
    expect(options).toMatchObject({
      timeGrouping: ReportTimeGrouping.MONTH,
      comparison: ReportComparison.NONE,
      topN: undefined,
    });
  });

  it('rejects dimensions that do not belong to the report type', () => {
    expect(() => normalizeReportOptions(request({ groupBy: ReportDimension.CATEGORY }))).toThrow(
      BadRequestException
    );
  });

  it('rejects a breakdown equal to the grouping', () => {
    expect(() =>
      normalizeReportOptions(request({ breakdownBy: ReportDimension.CUSTOMER }))
    ).toThrow(BadRequestException);
  });

  it('requires a grouping for sales reports and forbids it for the summary', () => {
    expect(() => normalizeReportOptions(request({ groupBy: undefined }))).toThrow(
      BadRequestException
    );
    expect(() =>
      normalizeReportOptions(
        request({ type: ReportType.SUMMARY, groupBy: ReportDimension.CUSTOMER })
      )
    ).toThrow(BadRequestException);
  });
});

describe('ReportsFiltersService', () => {
  function buildService(found: { id: string; name: string }[]) {
    const findMany = jest.fn().mockResolvedValue(found);
    const prisma = { customer: { findMany } } as unknown as PrismaService;
    return { service: new ReportsFiltersService(prisma), findMany };
  }

  it('scopes multi-select lookups to the current tenant', async () => {
    const { service, findMany } = buildService([
      { id: CUSTOMER_A, name: 'A' },
      { id: CUSTOMER_B, name: 'B' },
    ]);
    const filters = await service.resolveFilters(
      TENANT_ID,
      request({ customerIds: [CUSTOMER_A, CUSTOMER_B] })
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: TENANT_ID, id: { in: [CUSTOMER_A, CUSTOMER_B] } },
      })
    );
    expect(filters.customers).toHaveLength(2);
  });

  it('fails when one of the ids belongs to another tenant', async () => {
    const { service } = buildService([{ id: CUSTOMER_A, name: 'A' }]);
    await expect(
      service.resolveFilters(TENANT_ID, request({ customerIds: [CUSTOMER_A, CUSTOMER_B] }))
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects filters that do not apply to the report type', async () => {
    const { service } = buildService([]);
    await expect(
      service.resolveFilters(
        TENANT_ID,
        request({ type: ReportType.EXPENSES, customerIds: [CUSTOMER_A] })
      )
    ).rejects.toThrow(BadRequestException);
  });
});

describe('grouped rows builder', () => {
  it('nests breakdown rows under their group and keeps the totals row', () => {
    const tree = buildTree(
      {
        totals: raw({ g1: 1, amount: '150', cnt: BigInt(3) }),
        groups: [
          raw({ k1: 'a', l1: 'Alfa', amount: '100' }),
          raw({ k1: 'b', l1: 'Beta', amount: '50' }),
        ],
        breakdown: [raw({ k1: 'a', k2: 'x', l2: 'Equis', amount: '100', g2: 0 })],
      },
      { groupBy: ReportDimension.CATEGORY, breakdownBy: ReportDimension.SUPPLIER },
      EXPENSE_METRICS_OPS
    );

    expect(tree.totals).toEqual({ amount: 150, count: 3 });
    expect(tree.rows.map((r) => r.label)).toEqual(['Alfa', 'Beta']);
    expect(tree.rows[0]?.children?.[0]).toMatchObject({ key: 'x', label: 'Equis' });
  });

  it('labels and sorts period groups chronologically', () => {
    const tree = buildTree(
      {
        totals: undefined,
        groups: [raw({ k1: '2026-02', amount: '90' }), raw({ k1: '2026-01', amount: '10' })],
        breakdown: [],
      },
      { groupBy: ReportDimension.PERIOD },
      EXPENSE_METRICS_OPS
    );
    expect(tree.rows.map((r) => r.label)).toEqual(['Ene 2026', 'Feb 2026']);
  });

  it('fills empty period buckets with zeros', () => {
    const rows = fillPeriodBuckets(
      [expenseRow('2026-02', 5)],
      ['2026-01', '2026-02'],
      EXPENSE_METRICS_OPS
    );
    expect(rows.map((r) => [r.key, r.metrics.amount])).toEqual([
      ['2026-01', 0],
      ['2026-02', 5],
    ]);
  });

  it('attaches comparison metrics through the key map', () => {
    const rows = attachComparison([expenseRow('2026-01', 10)], [expenseRow('2025-01', 8)], {
      group: new Map([['2025-01', '2026-01']]),
    });
    expect(rows[0]?.previous).toEqual({ amount: 8, count: 1 });
  });

  it('folds groups beyond topN into "Otros", including comparison values', () => {
    const rows = applyTopN(
      [expenseRow('a', 50, 40), expenseRow('b', 30), expenseRow('c', 20, 5)],
      1,
      EXPENSE_METRICS_OPS
    );
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({
      isOther: true,
      label: 'Otros (2)',
      metrics: { amount: 50, count: 2 },
      previous: { amount: 5, count: 1 },
    });
  });
});

describe('ReportsExcelService', () => {
  const excelService = new ReportsExcelService();

  async function readWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Uint8Array.from(buffer).buffer);
    return workbook;
  }

  function sheetValues(sheet: ExcelJS.Worksheet | undefined): unknown[][] {
    return (sheet?.getSheetValues() ?? [])
      .filter(Boolean)
      .map((row) => (row as unknown[]).slice(1));
  }

  it('adds previous and variation columns to the summary when comparing', async () => {
    const report: SummaryReport = {
      type: ReportType.SUMMARY,
      options: {
        timeGrouping: ReportTimeGrouping.QUARTER,
        comparison: ReportComparison.PREVIOUS_YEAR,
      },
      comparisonPeriod: { fromDate: '2025-01-01', toDate: '2025-03-31' },
      totals: { income: 200, expenses: 50, result: 150, invoicesCount: 2, expensesCount: 1 },
      previousTotals: { income: 100, expenses: 50, result: 50, invoicesCount: 1, expensesCount: 1 },
      buckets: [
        {
          period: '2026-Q1',
          label: 'T1 2026',
          income: 200,
          expenses: 50,
          result: 150,
          previous: { income: 100, expenses: 50, result: 50 },
        },
      ],
    };

    const workbook = await readWorkbook(
      await excelService.build(report, {
        tenantName: 'Mi Empresa SL',
        fromDate: '2026-01-01',
        toDate: '2026-03-31',
        parameters: { options: report.options, filters: {} },
      })
    );
    const values = sheetValues(workbook.getWorksheet('Resumen'));

    expect(values).toContainEqual([
      'Trimestre',
      'Ingresos',
      'Ingresos anterior',
      'Var. %',
      'Gastos',
      'Gastos anterior',
      'Var. %',
      'Resultado',
      'Resultado anterior',
      'Var. %',
    ]);
    expect(values).toContainEqual(['T1 2026', 200, 100, 1, 50, 50, 0, 150, 50, 2]);
  });

  it('writes a collapsible grouped sheet and a flat data sheet for sales', async () => {
    const report: SalesReport = {
      type: ReportType.SALES,
      options: {
        timeGrouping: ReportTimeGrouping.MONTH,
        comparison: ReportComparison.NONE,
        groupBy: ReportDimension.CUSTOMER,
        breakdownBy: ReportDimension.PRODUCT,
      },
      hasCustomerMetrics: false,
      totals: { invoiced: 100, units: 2, invoicesCount: 1, averagePrice: 50 },
      rows: [
        {
          key: CUSTOMER_A,
          label: 'ACME',
          sublabel: 'B123',
          metrics: { invoiced: 100, units: 2, invoicesCount: 1, averagePrice: 50 },
          children: [
            {
              key: 'p1',
              label: 'Consultoría',
              sublabel: 'C-1',
              metrics: { invoiced: 100, units: 2, invoicesCount: 1, averagePrice: 50 },
            },
          ],
        },
      ],
    };

    const workbook = await readWorkbook(
      await excelService.build(report, {
        tenantName: 'Mi Empresa SL',
        fromDate: '2026-01-01',
        toDate: '2026-03-31',
        parameters: {
          options: report.options,
          filters: { customers: [{ id: CUSTOMER_A, name: 'ACME' }] },
        },
      })
    );

    expect(workbook.worksheets.map((s) => s.name)).toEqual(['Agrupado', 'Datos']);
    const grouped = workbook.getWorksheet('Agrupado');
    const childRow = grouped
      ?.getRows(1, grouped.rowCount)
      ?.find((r) => String(r.getCell(1).value).includes('Consultoría'));
    expect(childRow?.outlineLevel).toBe(1);
    expect(sheetValues(grouped)).toContainEqual(['Filtros: Clientes: ACME']);
    expect(sheetValues(workbook.getWorksheet('Datos'))).toContainEqual([
      'ACME',
      'B123',
      'Consultoría',
      'C-1',
      100,
      2,
      1,
      50,
    ]);
  });

  it('builds a descriptive file name', () => {
    expect(excelService.buildFileName(ReportType.SALES, '2026-01-01', '2026-03-31')).toBe(
      'informe-ventas-2026-01-01_2026-03-31.xlsx'
    );
  });
});

describe('parseHistoryParameters', () => {
  it('upgrades rows generated before grouped reports existed', () => {
    expect(parseHistoryParameters({})).toEqual({
      options: { timeGrouping: ReportTimeGrouping.MONTH, comparison: ReportComparison.NONE },
      filters: {},
    });
    expect(parseHistoryParameters({ customer: { id: CUSTOMER_A, name: 'ACME' } }).filters).toEqual({
      customers: [{ id: CUSTOMER_A, name: 'ACME' }],
      products: undefined,
      categories: undefined,
      suppliers: undefined,
    });
  });

  it('returns current-format parameters unchanged', () => {
    const parameters = {
      options: {
        timeGrouping: ReportTimeGrouping.YEAR,
        comparison: ReportComparison.PREVIOUS_YEAR,
      },
      filters: { seriesCodes: ['A'] },
    };
    expect(parseHistoryParameters(parameters)).toEqual(parameters);
  });
});

describe('receivables helpers', () => {
  const asOf = new Date('2026-10-19');
  const pendingRow = (overrides: Partial<ReceivableInvoiceRow>): ReceivableInvoiceRow => ({
    id: 'i1',
    number: 'F-1',
    issue_date: new Date('2026-09-01'),
    due_date: new Date('2026-10-16'),
    total: '121',
    paid: '21',
    customer_id: CUSTOMER_A,
    customer_name: 'ACME',
    customer_nif: 'B1',
    ...overrides,
  });

  it('assigns aging buckets by days overdue', () => {
    expect(agingBucketFor(-5)).toBe(ReceivableAgingBucket.NOT_DUE);
    expect(agingBucketFor(0)).toBe(ReceivableAgingBucket.NOT_DUE);
    expect(agingBucketFor(30)).toBe(ReceivableAgingBucket.DAYS_1_30);
    expect(agingBucketFor(61)).toBe(ReceivableAgingBucket.DAYS_61_90);
    expect(agingBucketFor(91)).toBe(ReceivableAgingBucket.OVER_90);
  });

  it('groups invoices per customer, nets credit notes and sorts by balance', () => {
    const rows = buildCustomerRows(
      [
        pendingRow({}),
        pendingRow({
          id: 'i2',
          number: 'R-1',
          total: '-30',
          paid: '0',
          due_date: new Date('2026-11-01'),
        }),
        pendingRow({
          id: 'i3',
          customer_id: CUSTOMER_B,
          customer_name: 'Beta',
          total: '500',
          paid: '0',
          due_date: new Date('2026-06-01'),
        }),
      ],
      asOf
    );

    expect(rows.map((r) => [r.name, r.pendingGross])).toEqual([
      ['Beta', 500],
      ['ACME', 70],
    ]);
    expect(rows[1]?.aging).toMatchObject({ DAYS_1_30: 100, NOT_DUE: -30 });
    expect(rows[0]?.invoices[0]).toMatchObject({
      daysOverdue: 140,
      bucket: ReceivableAgingBucket.OVER_90,
    });

    const totals = sumReceivables(rows);
    expect(totals).toMatchObject({
      pendingGross: 570,
      overdueGross: 600,
      invoicesCount: 3,
      customersCount: 2,
    });
  });
});

describe('sorting and new report options', () => {
  it('sorts groups and their breakdown by the chosen metric', () => {
    const rows = sortRows(
      [
        { ...expenseRow('a', 100), metrics: { amount: 100, count: 1 } },
        {
          ...expenseRow('b', 10),
          metrics: { amount: 10, count: 9 },
          children: [
            expenseRow('x', 1),
            { ...expenseRow('y', 1), metrics: { amount: 1, count: 5 } },
          ],
        },
      ],
      (m) => m.count
    );
    expect(rows.map((r) => r.key)).toEqual(['b', 'a']);
    expect(rows[0]?.children?.map((c) => c.key)).toEqual(['y', 'x']);
  });

  it('forbids grouping in receivables and forces no comparison', () => {
    const base = request({
      type: ReportType.RECEIVABLES,
      groupBy: undefined,
      comparison: ReportComparison.PREVIOUS_YEAR,
    });
    expect(normalizeReportOptions(base).comparison).toBe(ReportComparison.NONE);
    expect(() => normalizeReportOptions({ ...base, groupBy: ReportDimension.CUSTOMER })).toThrow(
      BadRequestException
    );
  });

  it('accepts payment method grouping only for collections', () => {
    expect(
      normalizeReportOptions(
        request({ type: ReportType.COLLECTIONS, groupBy: ReportDimension.PAYMENT_METHOD })
      ).groupBy
    ).toBe(ReportDimension.PAYMENT_METHOD);
    expect(() =>
      normalizeReportOptions(request({ groupBy: ReportDimension.PAYMENT_METHOD }))
    ).toThrow(BadRequestException);
  });

  it('rejects sorting by margin outside sales and drops sorting for periods', () => {
    expect(() =>
      normalizeReportOptions(
        request({
          type: ReportType.EXPENSES,
          groupBy: ReportDimension.CATEGORY,
          sortBy: ReportSortBy.MARGIN,
        })
      )
    ).toThrow(BadRequestException);
    expect(
      normalizeReportOptions(
        request({ groupBy: ReportDimension.PERIOD, sortBy: ReportSortBy.UNITS })
      ).sortBy
    ).toBeUndefined();
  });
});

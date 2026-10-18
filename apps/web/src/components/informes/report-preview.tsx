'use client';

import { AlertCircle, FileBarChart } from 'lucide-react';
import { ReportData, ReportGroupRow, ReportType } from '@easyfactura/shared-types';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { getApiErrorMessage } from '@/lib/api-error';
import { SummaryReportPreview } from './summary-report-preview';
import { SalesReportPreview } from './sales-report-preview';
import { ExpensesReportPreview } from './expenses-report-preview';
import { CollectionsReportPreview } from './collections-report-preview';
import { ReceivablesReportPreview } from './receivables-report-preview';
import type { GroupedRowAction } from './grouped-report-table';

type RowActionResolver = (row: ReportGroupRow<unknown>) => GroupedRowAction | undefined;

interface ReportPreviewProps {
  data: ReportData | undefined;
  isLoading: boolean;
  error: unknown;
  getRowAction?: RowActionResolver;
}

function isReportEmpty(report: ReportData): boolean {
  switch (report.type) {
    case ReportType.SUMMARY:
      return report.totals.invoicesCount + report.totals.expensesCount === 0;
    case ReportType.SALES:
      return report.totals.invoicesCount === 0;
    case ReportType.EXPENSES:
    case ReportType.COLLECTIONS:
      return report.totals.count === 0;
    case ReportType.RECEIVABLES:
      return report.totals.invoicesCount === 0;
  }
}

function emptyMessage(report: ReportData | undefined) {
  if (report?.type === ReportType.RECEIVABLES) {
    return {
      title: 'No hay nada pendiente de cobro',
      description: 'Todas las facturas emitidas hasta esa fecha están cobradas.',
    };
  }
  return {
    title: 'No hay datos en este periodo',
    description: 'Prueba con otro periodo o quita los filtros.',
  };
}

export function ReportPreview({ data, isLoading, error, getRowAction }: ReportPreviewProps) {
  if (isLoading && !data) return <ReportPreviewSkeleton />;

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{getApiErrorMessage(error)}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || isReportEmpty(data)) {
    return <EmptyState icon={FileBarChart} {...emptyMessage(data)} />;
  }

  return <ReportPreviewContent report={data} getRowAction={getRowAction} />;
}

function ReportPreviewContent({
  report,
  getRowAction,
}: {
  report: ReportData;
  getRowAction?: RowActionResolver;
}) {
  switch (report.type) {
    case ReportType.SUMMARY:
      return <SummaryReportPreview report={report} />;
    case ReportType.SALES:
      return <SalesReportPreview report={report} getRowAction={getRowAction} />;
    case ReportType.EXPENSES:
      return <ExpensesReportPreview report={report} getRowAction={getRowAction} />;
    case ReportType.COLLECTIONS:
      return <CollectionsReportPreview report={report} getRowAction={getRowAction} />;
    case ReportType.RECEIVABLES:
      return <ReceivablesReportPreview report={report} />;
  }
}

function ReportPreviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

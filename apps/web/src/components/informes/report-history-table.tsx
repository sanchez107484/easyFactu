'use client';

import { useState } from 'react';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import { ReportHistoryEntry, ReportNamedRef, ReportParameters } from '@easyfactura/shared-types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDownloadHistoryReport, useReportHistory } from '@/hooks/use-reports';
import { formatDate, formatDateTime } from '@/lib/utils';
import { REPORT_TYPE_CONFIG, groupedLabelHeader } from './report-type-config';
import { ReportSection } from './report-section';
import { ReportTable } from './report-table';

const PAGE_SIZE = 10;

function describeType(entry: ReportHistoryEntry): string {
  const grouping = groupedLabelHeader(entry.parameters.options);
  const typeLabel = REPORT_TYPE_CONFIG[entry.type].label;
  return grouping ? `${typeLabel} · ${grouping}` : typeLabel;
}

function describeFilters({ filters, options }: ReportParameters): string {
  const namedGroups: (ReportNamedRef[] | undefined)[] = [
    filters.customers,
    filters.products,
    filters.categories,
    filters.suppliers,
  ];
  const parts = [
    ...namedGroups.flatMap((group) => group?.map((ref) => ref.name) ?? []),
    ...(filters.seriesCodes?.map((code) => `Serie ${code}`) ?? []),
    options.topN ? `Top ${options.topN}` : undefined,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(' · ') : '—';
}

export function ReportHistoryTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useReportHistory(page, PAGE_SIZE);
  const download = useDownloadHistoryReport();
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <ReportSection title="Histórico" description="Se conservan los 50 informes más recientes.">
      {isLoading && !data ? (
        <Skeleton className="h-40 w-full" />
      ) : error ? (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Error al cargar el histórico de informes.
        </p>
      ) : (
        <ReportTable
          rows={data?.data ?? []}
          getRowKey={(entry) => entry.id}
          emptyMessage="Todavía no has generado ningún informe."
          columns={[
            { header: 'Generado', render: (e) => formatDateTime(e.createdAt) },
            { header: 'Tipo', render: describeType },
            {
              header: 'Periodo',
              render: (e) => `${formatDate(e.fromDate)} – ${formatDate(e.toDate)}`,
            },
            {
              header: 'Filtros',
              render: (e) => <FiltersCell text={describeFilters(e.parameters)} />,
            },
            { header: 'Generado por', render: (e) => <GeneratedBy entry={e} /> },
            {
              header: 'Archivo',
              align: 'right',
              render: (e) => (
                <DownloadButton
                  entry={e}
                  isDownloading={download.isPending && download.variables?.id === e.id}
                  onDownload={() => download.mutate(e)}
                />
              ),
            },
          ]}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </ReportSection>
  );
}

function GeneratedBy({ entry }: { entry: ReportHistoryEntry }) {
  return (
    <span className="flex items-center gap-2">
      <span className="truncate">{entry.generatedBy?.name ?? '—'}</span>
      {entry.generatedByAgency && (
        <Badge variant="outline" className="shrink-0 text-[10px]">
          Asesoría
        </Badge>
      )}
    </span>
  );
}

interface DownloadButtonProps {
  entry: ReportHistoryEntry;
  isDownloading: boolean;
  onDownload: () => void;
}

function DownloadButton({ entry, isDownloading, onDownload }: DownloadButtonProps) {
  if (!entry.isFileAvailable) {
    return <span className="text-xs text-muted-foreground">No disponible</span>;
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5"
      onClick={onDownload}
      disabled={isDownloading}
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Excel
    </Button>
  );
}

function FiltersCell({ text }: { text: string }) {
  return (
    <span className="block max-w-[240px] truncate" title={text}>
      {text}
    </span>
  );
}

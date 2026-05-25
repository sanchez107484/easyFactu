'use client';

import { useState, useRef, useCallback, DragEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowLeft,
  RotateCcw,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api-error';
import { ImportRowPreview, ImportPreviewResult, ImportConfirmResult } from '@/lib/api/import-api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImportColumn {
  key: string;
  header: string;
  render?: (value: unknown) => React.ReactNode;
}

export interface ImportWizardConfig {
  entityName: string; // e.g. "clientes"
  entityNameSingular: string; // e.g. "cliente"
  columns: ImportColumn[];
  onPreview: (file: File) => Promise<ImportPreviewResult>;
  onConfirm: (rows: ImportRowPreview[]) => Promise<ImportConfirmResult>;
  onDownloadTemplate: () => Promise<Blob>;
  templateFileName: string;
  listHref: string; // e.g. "/dashboard/clientes"
  maxRows?: number;
}

type WizardStep = 'idle' | 'loading' | 'preview' | 'confirming' | 'done';

const ACCEPTED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const PAGE_SIZE = 10;

// ─── Helpers ────────────────────────────────────────────────────────────────────────────

function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
    return 'El archivo debe ser un Excel (.xlsx o .xls).';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'El archivo no puede superar los 5 MB.';
  }
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ImportRowPreview['status'] }) {
  if (status === 'valid') {
    return (
      <Badge className="gap-1 bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800">
        <CheckCircle2 className="h-3 w-3" />
        Válida
      </Badge>
    );
  }
  if (status === 'duplicate') {
    return (
      <Badge className="gap-1 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800">
        <AlertTriangle className="h-3 w-3" />
        Duplicado
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-red-100 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800">
      <XCircle className="h-3 w-3" />
      Error
    </Badge>
  );
}

function RowClass(status: ImportRowPreview['status']): string {
  if (status === 'valid') return 'bg-emerald-50/50 dark:bg-emerald-950/10';
  if (status === 'duplicate') return 'bg-amber-50/50 dark:bg-amber-950/10';
  return 'bg-red-50/50 dark:bg-red-950/10';
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ImportWizard({
  entityName,
  entityNameSingular,
  columns,
  onPreview,
  onConfirm,
  onDownloadTemplate,
  templateFileName,
  listHref,
  maxRows = 200,
}: ImportWizardConfig) {
  const [step, setStep] = useState<WizardStep>('idle');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [result, setResult] = useState<ImportConfirmResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Preview table UI state
  const [previewPage, setPreviewPage] = useState(1);
  const [sortKey, setSortKey] = useState('row');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<ImportRowPreview['status'] | 'all'>('all');
  // ── File validation ─────────────────────────────────────────────────────────

  // ── File processing ─────────────────────────────────────────────────────────

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setSelectedFile(file);
      setStep('loading');
      try {
        const result = await onPreview(file);
        setPreview(result);
        setPreviewPage(1);
        setSortKey('row');
        setSortDir('asc');
        setStatusFilter('all');
        setStep('preview');
      } catch (err) {
        setError(getApiErrorMessage(err));
        setStep('idle');
      }
    },
    [onPreview],
  );

  // ── Drag & drop ─────────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      // Reset so the same file can be re-selected after going back
      e.target.value = '';
    },
    [processFile],
  );

  // ── Confirm import ──────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    if (!preview) return;
    const validRows = preview.rows.filter((r) => r.status === 'valid');
    if (validRows.length === 0) return;

    setStep('confirming');
    try {
      const confirmResult = await onConfirm(validRows);
      setResult(confirmResult);
      setStep('done');
    } catch (err) {
      setError(getApiErrorMessage(err));
      setStep('preview');
    }
  };

  // ── Template download ───────────────────────────────────────────────────────

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const blob = await onDownloadTemplate();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = templateFileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDownloadingTemplate(false);
    }
  };

  // ── Reset ───────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setStep('idle');
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setPreviewPage(1);
    setSortKey('row');
    setSortDir('asc');
    setStatusFilter('all');
  };

  // ── Render: idle ────────────────────────────────────────────────────────────

  if (step === 'idle' || step === 'loading') {
    return (
      <div className="space-y-6 pb-6">
        {/* Step 1: Download template */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                1
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold">Descarga la plantilla Excel</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Descarga nuestra plantilla, rellénala con tus {entityName} y vuelve a subirla. Las
                  columnas marcadas con <span className="font-semibold text-foreground">*</span> son
                  obligatorias y aparecen con la cabecera en otro color.{' '}
                  <span className="text-foreground/70">
                    Las demás son opcionales: puedes dejarlas en blanco o incluso eliminar esas
                    columnas si no las necesitas.
                  </span>
                </p>
                <Button
                  variant="default"
                  size="sm"
                  className="mt-3"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                >
                  {downloadingTemplate ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Descargar plantilla Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Upload */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                2
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold">Sube tu archivo Excel</h2>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Máximo {maxRows} filas por importación. Solo ficheros .xlsx y .xls.
                </p>

                {/* Drop zone */}
                <div
                  className={cn(
                    'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer',
                    dragOver
                      ? 'border-primary bg-primary/10'
                      : 'border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10',
                    step === 'loading' && 'pointer-events-none opacity-60',
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                  {step === 'loading' ? (
                    <>
                      <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                      <p className="text-sm font-medium">Analizando {selectedFile?.name}…</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Validando filas y detectando duplicados
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                        {selectedFile ? (
                          <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
                        ) : (
                          <Upload className="h-7 w-7 text-muted-foreground" />
                        )}
                      </div>
                      {selectedFile ? (
                        <>
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Haz clic para cambiar el archivo
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium">
                            Arrastra aquí tu Excel o{' '}
                            <span className="text-primary underline underline-offset-2">
                              haz clic para seleccionar
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            .xlsx o .xls — máximo 5 MB
                          </p>
                        </>
                      )}
                    </>
                  )}
                </div>

                {error && (
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-destructive">
                    <XCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: preview ─────────────────────────────────────────────────────────

  if (step === 'preview' || step === 'confirming') {
    const { rows, summary } = preview!;
    const validCount = summary.valid;
    const canConfirm = validCount > 0;

    // Filter
    const filteredRows =
      statusFilter === 'all' ? rows : rows.filter((r) => r.status === statusFilter);

    // Sort
    const sortedRows = [...filteredRows].sort((a, b) => {
      let aVal: string;
      let bVal: string;
      if (sortKey === 'row') {
        aVal = String(a.row);
        bVal = String(b.row);
      } else if (sortKey === 'status') {
        aVal = a.status;
        bVal = b.status;
      } else {
        aVal = String(a.data[sortKey] ?? '');
        bVal = String(b.data[sortKey] ?? '');
      }
      const cmp = aVal.localeCompare(bVal, 'es', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

    // Paginate
    const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
    const safePage = Math.min(previewPage, totalPages);
    const pageRows = sortedRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const toggleSort = (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
      setPreviewPage(1);
    };

    const sortIconFor = (colKey: string) => {
      if (sortKey !== colKey)
        return <ChevronsUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
      return sortDir === 'asc' ? (
        <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
      ) : (
        <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
      );
    };

    return (
      <div className="space-y-5 pb-6">
        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground mr-1">
            {summary.total} fila{summary.total !== 1 ? 's' : ''} analizadas —
          </span>
          <button
            onClick={() => {
              setStatusFilter('all');
              setPreviewPage(1);
            }}
            className={cn(
              'text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
              statusFilter === 'all'
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground',
            )}
          >
            Todas ({summary.total})
          </button>
          {summary.valid > 0 && (
            <button
              onClick={() => {
                setStatusFilter('valid');
                setPreviewPage(1);
              }}
              className={cn(
                'gap-1 inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
                statusFilter === 'valid'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800',
              )}
            >
              <CheckCircle2 className="h-3 w-3" />
              Válidas ({summary.valid})
            </button>
          )}
          {summary.errors > 0 && (
            <button
              onClick={() => {
                setStatusFilter('error');
                setPreviewPage(1);
              }}
              className={cn(
                'gap-1 inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
                statusFilter === 'error'
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-950/60 dark:text-red-400 dark:border-red-800',
              )}
            >
              <XCircle className="h-3 w-3" />
              Con error ({summary.errors})
            </button>
          )}
          {summary.duplicates > 0 && (
            <button
              onClick={() => {
                setStatusFilter('duplicate');
                setPreviewPage(1);
              }}
              className={cn(
                'gap-1 inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full border transition-colors',
                statusFilter === 'duplicate'
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800',
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              Duplicados ({summary.duplicates})
            </button>
          )}
        </div>

        {/* Error from confirm */}
        {error && (
          <p className="flex items-center gap-1.5 text-sm text-destructive">
            <XCircle className="h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        {/* Preview table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 border-b bg-muted/80 backdrop-blur-sm">
                  <tr>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground w-12 cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort('row')}
                    >
                      Fila{sortIconFor('row')}
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium text-muted-foreground w-28 cursor-pointer select-none hover:text-foreground"
                      onClick={() => toggleSort('status')}
                    >
                      Estado{sortIconFor('status')}
                    </th>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap cursor-pointer select-none hover:text-foreground"
                        onClick={() => toggleSort(col.key)}
                      >
                        {col.header}
                        {sortIconFor(col.key)}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Error / Aviso
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pageRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length + 3}
                        className="px-4 py-8 text-center text-sm text-muted-foreground"
                      >
                        No hay filas con el filtro seleccionado.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row) => (
                      <tr key={row.row} className={cn('transition-colors', RowClass(row.status))}>
                        <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                          {row.row}
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={row.status} />
                        </td>
                        {columns.map((col) => (
                          <td key={col.key} className="px-4 py-2.5 max-w-[200px] truncate">
                            {col.render
                              ? col.render(row.data[col.key])
                              : String(row.data[col.key] ?? '—')}
                          </td>
                        ))}
                        <td className="px-4 py-2.5 max-w-[250px]">
                          {row.errorMessage ? (
                            <span className="text-xs text-destructive">{row.errorMessage}</span>
                          ) : row.warningMessage ? (
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              ⚠️ {row.warningMessage}
                            </span>
                          ) : row.status === 'duplicate' ? (
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              Ya existe en tu cuenta (se saltará)
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-xs text-muted-foreground">
                  {(safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, sortedRows.length)} de {sortedRows.length}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm tabular-nums">
                    {safePage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button variant="outline" onClick={handleReset} disabled={step === 'confirming'}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a subir archivo
          </Button>

          <Button onClick={handleConfirm} disabled={!canConfirm || step === 'confirming'}>
            {step === 'confirming' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {step === 'confirming'
              ? 'Importando…'
              : `Importar ${validCount} ${entityNameSingular}${validCount !== 1 ? 's' : ''} válido${validCount !== 1 ? 's' : ''}`}
          </Button>
        </div>

        {!canConfirm && (
          <p className="text-sm text-muted-foreground">
            No hay filas válidas para importar. Corrige los errores en el Excel y vuelve a subirlo.
          </p>
        )}
      </div>
    );
  }

  // ── Render: done ────────────────────────────────────────────────────────────

  return (
    <Card className="w-full">
      <CardContent className="flex flex-col items-center text-center p-12 gap-6">
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">¡Importación completada!</h2>
          <p className="text-muted-foreground">
            Los datos han sido procesados y añadidos a tu cuenta.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-8 py-4 border-y w-full justify-center">
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {result!.imported}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {entityNameSingular}
              {result!.imported !== 1 ? 's' : ''} importado{result!.imported !== 1 ? 's' : ''}
            </p>
          </div>
          {result!.skipped > 0 && (
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500">{result!.skipped}</p>
              <p className="text-sm text-muted-foreground mt-1">
                duplicado{result!.skipped !== 1 ? 's' : ''} saltado
                {result!.skipped !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <RotateCcw className="mr-2 h-4 w-4" />
            Importar más {entityName}
          </Button>
          <Link href={listHref} className="flex-1">
            <Button className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Ver {entityName}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

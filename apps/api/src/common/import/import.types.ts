// ── Shared import types used by CustomerImportService and ProductImportService ──

export interface ImportRowPreview {
  row: number;
  status: 'valid' | 'error' | 'duplicate';
  errorMessage?: string;
  data: Record<string, unknown>;
}

export interface ImportPreviewResult {
  rows: ImportRowPreview[];
  summary: {
    total: number;
    valid: number;
    errors: number;
    duplicates: number;
  };
}

export interface ImportConfirmResult {
  imported: number;
  skipped: number;
}

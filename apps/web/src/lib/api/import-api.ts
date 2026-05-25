import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface ImportRowPreview {
  row: number;
  status: 'valid' | 'error' | 'duplicate';
  errorMessage?: string;
  warningMessage?: string;
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

// ─── Import API ───────────────────────────────────────────────────────────────

function postFormFile<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  return apiClient
    .post<ApiResponse<T>>(path, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    })
    .then(unwrapApiResponse);
}

export const importApi = {
  // ── Customers ──────────────────────────────────────────────────────────────

  previewCustomers: (file: File) =>
    postFormFile<ImportPreviewResult>('/customers/import/preview', file),

  confirmCustomers: (rows: ImportRowPreview[]): Promise<ImportConfirmResult> =>
    apiClient
      .post<ApiResponse<ImportConfirmResult>>('/customers/import/confirm', { rows })
      .then(unwrapApiResponse),

  downloadCustomerTemplate: (): Promise<Blob> =>
    apiClient
      .get('/customers/import/template', { responseType: 'blob' })
      .then((r) => r.data as Blob),

  // ── Products ───────────────────────────────────────────────────────────────

  previewProducts: (file: File) =>
    postFormFile<ImportPreviewResult>('/products/import/preview', file),

  confirmProducts: (rows: ImportRowPreview[]): Promise<ImportConfirmResult> =>
    apiClient
      .post<ApiResponse<ImportConfirmResult>>('/products/import/confirm', { rows })
      .then(unwrapApiResponse),

  downloadProductTemplate: (): Promise<Blob> =>
    apiClient
      .get('/products/import/template', { responseType: 'blob' })
      .then((r) => r.data as Blob),
};

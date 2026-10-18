import axios from 'axios';
import { apiClient } from '../api-client';
import { unwrapApiResponse, ApiResponse } from '../api-response';
import {
  PaginatedResponse,
  ReportData,
  ReportHistoryEntry,
  ReportRequest,
} from '@easyfactura/shared-types';

export interface ReportFile {
  blob: Blob;
  filename: string;
}

function extractFilename(disposition: string | undefined, fallback: string): string {
  const match = disposition?.match(/filename="?([^"]+)"?/);
  return match?.[1] ?? fallback;
}

/**
 * Blob responses hide the backend's JSON error body. Parse it back so
 * getErrorMessage() can show the real message (e.g. "El periodo no puede superar...").
 */
async function rethrowBlobError(error: unknown): Promise<never> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      error.response.data = JSON.parse(await error.response.data.text());
    } catch {
      // Not JSON — keep the original error untouched.
    }
  }
  throw error;
}

export const reportApi = {
  preview: (request: ReportRequest): Promise<ReportData> =>
    apiClient.post<ApiResponse<ReportData>>('/reports/preview', request).then(unwrapApiResponse),

  generate: async (request: ReportRequest): Promise<ReportFile> => {
    const response = await apiClient
      .post('/reports/generate', request, { responseType: 'blob' })
      .catch(rethrowBlobError);
    return {
      blob: response.data as Blob,
      filename: extractFilename(response.headers['content-disposition'], 'informe.xlsx'),
    };
  },

  getHistory: (page: number, limit: number): Promise<PaginatedResponse<ReportHistoryEntry>> =>
    apiClient
      .get<ApiResponse<PaginatedResponse<ReportHistoryEntry>>>('/reports/history', {
        params: { page, limit },
      })
      .then(unwrapApiResponse),

  downloadFromHistory: async (entry: ReportHistoryEntry): Promise<ReportFile> => {
    const response = await apiClient
      .get(`/reports/history/${entry.id}/download`, { responseType: 'blob' })
      .catch(rethrowBlobError);
    return {
      blob: response.data as Blob,
      filename: extractFilename(response.headers['content-disposition'], entry.fileName),
    };
  },
};

import { BadRequestException } from '@nestjs/common';
import type * as ExcelJS from 'exceljs';

const ACCEPTED_MIME = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function validateImportFile(file: Express.Multer.File): void {
  if (!file) {
    throw new BadRequestException('No se ha enviado ningún archivo.');
  }
  if (!ACCEPTED_MIME.has(file.mimetype)) {
    throw new BadRequestException('Solo se aceptan archivos Excel (.xlsx o .xls).');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new BadRequestException('El archivo supera el tamaño máximo permitido de 5 MB.');
  }
}

export function getCellString(row: ExcelJS.Row, colIndex: number): string | undefined {
  const val = row.getCell(colIndex).value;
  if (val === null || val === undefined) return undefined;
  // Rich text cells
  if (typeof val === 'object' && !Array.isArray(val) && 'richText' in val) {
    return (
      (val as ExcelJS.CellRichTextValue).richText
        .map((r) => r.text)
        .join('')
        .trim() || undefined
    );
  }
  // Hyperlink cells — Excel stores emails/URLs as { text, hyperlink } objects
  if (typeof val === 'object' && !Array.isArray(val) && 'hyperlink' in val) {
    const text = String((val as { text: unknown }).text ?? '').trim();
    return text || undefined;
  }
  const str = String(val).trim();
  return str || undefined;
}

export function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

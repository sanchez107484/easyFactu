import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductType } from '@easyfactura/shared-types';
import type {
  ImportRowPreview,
  ImportPreviewResult,
  ImportConfirmResult,
} from '../../common/import/import.types';
import {
  validateImportFile,
  getCellString,
  isPrismaUniqueConstraintError,
} from '../../common/import/import.utils';

export type { ImportRowPreview, ImportPreviewResult, ImportConfirmResult };

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_ROWS = 200;
const VALID_TAX_RATES = new Set([0, 4, 10, 21]);

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  PRODUCT: 'Producto',
  SERVICE: 'Servicio',
};
const VALID_PRODUCT_TYPES = new Set<string>(Object.keys(PRODUCT_TYPE_LABELS));

// Reverse map: Spanish label (lowercase) → enum value
const LABEL_TO_PRODUCT_TYPE = new Map<string, ProductType>(
  Object.entries(PRODUCT_TYPE_LABELS).map(([k, v]) => [v.toLowerCase(), k as ProductType])
);

// ── Column definitions ─────────────────────────────────────────────────────────

interface ColDef {
  header: string;
  key: string;
  width: number;
  required: boolean;
}

const COLUMNS: ColDef[] = [
  { header: 'Nombre (*)', key: 'name', width: 35, required: true },
  { header: 'Precio unitario € (*)', key: 'unitPrice', width: 22, required: true },
  { header: 'IVA % (*)', key: 'taxRate', width: 12, required: true },
  { header: 'Tipo (*)', key: 'type', width: 15, required: true },
  { header: 'Descripción', key: 'description', width: 38, required: false },
  { header: 'IRPF %', key: 'irpfRate', width: 12, required: false },
  { header: 'Unidad', key: 'unit', width: 15, required: false },
  { header: 'Referencia / SKU', key: 'reference', width: 20, required: false },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Accepts Spanish label ("Servicio") or English enum key ("SERVICE") → returns enum or undefined */
function normalizeProductType(raw: string): ProductType | undefined {
  const trimmed = raw.trim();
  if (VALID_PRODUCT_TYPES.has(trimmed.toUpperCase())) return trimmed.toUpperCase() as ProductType;
  return LABEL_TO_PRODUCT_TYPE.get(trimmed.toLowerCase());
}

function getCellNumber(row: ExcelJS.Row, colIndex: number): number | undefined {
  const val = row.getCell(colIndex).value;
  if (val === null || val === undefined) return undefined;
  if (typeof val === 'number') return val;
  const num = Number(String(val).trim().replace(',', '.'));
  return isNaN(num) ? undefined : num;
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable()
export class ProductImportService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Template ────────────────────────────────────────────────────────────────

  async generateTemplate(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'EasyFactura';
    const ws = wb.addWorksheet('Productos', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    ws.columns = COLUMNS.map((col) => ({ key: col.key, width: col.width }));

    // Header row
    const headerRow = ws.getRow(1);
    COLUMNS.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: col.required ? 'FF059669' : 'FF64748B' }, // emerald-600 for products
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
    headerRow.height = 24;

    // Example row
    const exampleRow = ws.addRow({
      name: 'Ejemplo Servicio',
      unitPrice: 150,
      taxRate: 21,
      type: 'Servicio',
      description: 'Consultoría estratégica por hora',
      irpfRate: 15,
      unit: 'hora',
      reference: 'CONS-001',
    });
    exampleRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD1FAE5' }, // emerald-100
      };
      cell.font = { italic: true, color: { argb: 'FF065F46' }, name: 'Calibri' };
    });
    exampleRow.height = 20;

    // Number format for price and rate columns
    for (let rowIdx = 2; rowIdx <= MAX_ROWS + 2; rowIdx++) {
      ws.getCell(rowIdx, 2).numFmt = '#,##0.00';
      ws.getCell(rowIdx, 3).numFmt = '0';
      ws.getCell(rowIdx, 6).numFmt = '0';
    }

    // Dropdown: Tipo (column 4) and IVA (column 3) — from row 2 to include example row
    const typeValues = Object.values(PRODUCT_TYPE_LABELS).join(',');
    for (let rowIdx = 2; rowIdx <= MAX_ROWS + 2; rowIdx++) {
      ws.getCell(rowIdx, 4).dataValidation = {
        type: 'list',
        formulae: [`"${typeValues}"`],
        showErrorMessage: true,
        errorTitle: 'Tipo inválido',
        error: `Valores válidos: ${typeValues}`,
      };
      ws.getCell(rowIdx, 3).dataValidation = {
        type: 'list',
        formulae: ['"0,4,10,21"'],
        showErrorMessage: true,
        errorTitle: 'IVA inválido',
        error: 'Valores válidos: 0, 4, 10, 21',
      };
    }

    const buffer = await wb.xlsx.writeBuffer();
    return buffer as unknown as Buffer;
  }

  // ── Preview ─────────────────────────────────────────────────────────────────

  async preview(tenantId: string, file: Express.Multer.File): Promise<ImportPreviewResult> {
    validateImportFile(file);

    const wb = new ExcelJS.Workbook();
    // ExcelJS declares its own Buffer interface (extends ArrayBuffer) separate from Node.js Buffer.
    // The Parameters helper extracts the exact type ExcelJS expects so the cast is precise.
    type XlsxLoadData = Parameters<typeof wb.xlsx.load>[0];
    await wb.xlsx.load(file.buffer as unknown as XlsxLoadData);
    const ws = wb.worksheets[0];

    if (!ws) {
      throw new BadRequestException('El archivo Excel está vacío o no tiene hojas.');
    }

    // Collect data rows (skip header row 1)
    const parsedRows: Array<{
      rowNumber: number;
      rawData: {
        name?: string;
        unitPrice?: number;
        taxRate?: number;
        type?: string;
        description?: string;
        irpfRate?: number;
        unit?: string;
        reference?: string;
      };
    }> = [];

    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      // Skip if user left the example row placeholder unchanged
      if (rowNumber === 2 && getCellString(row, 1) === 'Ejemplo Servicio') return;
      parsedRows.push({
        rowNumber,
        rawData: {
          name: getCellString(row, 1),
          unitPrice: getCellNumber(row, 2),
          taxRate: getCellNumber(row, 3),
          type: getCellString(row, 4),
          description: getCellString(row, 5),
          irpfRate: getCellNumber(row, 6),
          unit: getCellString(row, 7),
          reference: getCellString(row, 8),
        },
      });
    });

    if (parsedRows.length === 0) {
      throw new BadRequestException(
        'El archivo no contiene datos. Recuerda que la primera fila es la cabecera.'
      );
    }

    if (parsedRows.length > MAX_ROWS) {
      throw new BadRequestException(
        `El archivo supera el límite de ${MAX_ROWS} filas. Divide el archivo en partes más pequeñas.`
      );
    }

    // Batch duplicate check by name (case-insensitive, per tenant)
    const names = parsedRows
      .map((r) => r.rawData.name?.toLowerCase().trim())
      .filter((n): n is string => !!n);

    const existingNameSet = await this.findExistingNames(tenantId, names);

    // Build intra-file name map (name → first row it appears in)
    const nameFirstRowMap = new Map<string, number>();
    for (const { rowNumber, rawData } of parsedRows) {
      if (rawData.name) {
        const key = rawData.name.trim().toLowerCase();
        if (!nameFirstRowMap.has(key)) nameFirstRowMap.set(key, rowNumber);
      }
    }

    // Validate each row
    const rows: ImportRowPreview[] = parsedRows.map(({ rowNumber, rawData }) => {
      const errors: string[] = [];
      const resolvedData: Record<string, unknown> = {};
      let warningMessage: string | undefined;

      // name — required
      if (!rawData.name) {
        errors.push('El nombre es obligatorio');
      } else {
        resolvedData.name = rawData.name;
        // Intra-file duplicate check
        const nameKey = rawData.name.trim().toLowerCase();
        const firstSeen = nameFirstRowMap.get(nameKey);
        if (firstSeen !== undefined && firstSeen !== rowNumber) {
          errors.push(`Nombre duplicado en este Excel (ya aparece en la fila ${firstSeen})`);
        }
      }

      // unitPrice — defaults to 0 if empty, with a warning
      if (rawData.unitPrice === undefined || rawData.unitPrice === null) {
        resolvedData.unitPrice = 0;
        warningMessage = 'Precio no indicado, se importará como 0,00 €';
      } else if (rawData.unitPrice < 0) {
        errors.push('El precio unitario no puede ser negativo');
      } else {
        resolvedData.unitPrice = rawData.unitPrice;
      }

      // taxRate — required, must be 0/4/10/21
      if (rawData.taxRate === undefined || rawData.taxRate === null) {
        errors.push('El IVA es obligatorio');
      } else if (!VALID_TAX_RATES.has(rawData.taxRate)) {
        errors.push(`IVA inválido: ${rawData.taxRate}. Valores permitidos: 0, 4, 10, 21`);
      } else {
        resolvedData.taxRate = rawData.taxRate;
      }

      // type — required; accepts Spanish label or English enum key
      if (!rawData.type) {
        errors.push('El tipo es obligatorio');
      } else {
        const resolvedType = normalizeProductType(rawData.type);
        if (!resolvedType) {
          errors.push(
            `Tipo inválido: "${rawData.type}". Usa: ${Object.values(PRODUCT_TYPE_LABELS).join(' o ')}`
          );
        } else {
          resolvedData.type = resolvedType;
        }
      }

      // description — optional
      if (rawData.description) resolvedData.description = rawData.description;

      // irpfRate — optional, must be non-negative number
      if (rawData.irpfRate !== undefined && rawData.irpfRate !== null) {
        if (rawData.irpfRate < 0) {
          errors.push('El IRPF no puede ser negativo');
        } else {
          resolvedData.irpfRate = rawData.irpfRate;
        }
      }

      // unit — optional
      if (rawData.unit) resolvedData.unit = rawData.unit;

      // reference — optional
      if (rawData.reference) resolvedData.reference = rawData.reference;

      if (errors.length > 0) {
        return {
          row: rowNumber,
          status: 'error',
          errorMessage: errors.join('. '),
          data: resolvedData,
        };
      }

      // Duplicate check by name
      const lowerName = String(resolvedData.name ?? '')
        .toLowerCase()
        .trim();
      if (existingNameSet.has(lowerName)) {
        return {
          row: rowNumber,
          status: 'duplicate',
          errorMessage: 'Ya existe un producto con este nombre',
          data: resolvedData,
        };
      }

      return { row: rowNumber, status: 'valid', warningMessage, data: resolvedData };
    });

    const valid = rows.filter((r) => r.status === 'valid').length;
    const errors = rows.filter((r) => r.status === 'error').length;
    const duplicates = rows.filter((r) => r.status === 'duplicate').length;

    return {
      rows,
      summary: { total: rows.length, valid, errors, duplicates },
    };
  }

  // ── Confirm ─────────────────────────────────────────────────────────────────

  async confirm(
    tenantId: string,
    rows: Array<{ row: number; status: string; data: Record<string, unknown> }>
  ): Promise<ImportConfirmResult> {
    const validRows = rows.filter((r) => r.status === 'valid');
    let imported = 0;
    let skipped = 0;

    for (const { data } of validRows) {
      try {
        // Check for reference conflicts (already validated in preview but race condition possible)
        if (data.reference) {
          const existing = await this.prisma.product.findFirst({
            where: { tenantId, reference: String(data.reference) },
            select: { id: true },
          });
          if (existing) {
            skipped++;
            continue;
          }
        }

        await this.prisma.product.create({
          data: {
            tenantId,
            name: String(data.name),
            unitPrice: Number(data.unitPrice),
            taxRate: Number(data.taxRate),
            type: String(data.type ?? ProductType.SERVICE) as never,
            description: data.description ? String(data.description) : undefined,
            unit: data.unit ? String(data.unit) : 'unidad',
            reference: data.reference ? String(data.reference) : undefined,
          },
        });
        imported++;
      } catch (error) {
        if (isPrismaUniqueConstraintError(error)) {
          skipped++;
        } else {
          throw error;
        }
      }
    }

    return { imported, skipped };
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private async findExistingNames(tenantId: string, names: string[]): Promise<Set<string>> {
    if (names.length === 0) return new Set();

    const existing = await this.prisma.product.findMany({
      where: {
        tenantId,
        name: { in: names, mode: 'insensitive' },
      },
      select: { name: true },
    });

    return new Set(existing.map((p) => p.name.toLowerCase()));
  }
}

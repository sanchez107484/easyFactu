import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomerType } from '@easyfactura/shared-types';
import { validateNif } from '@easyfactura/shared-validators';
import { COUNTRIES } from '@easyfactura/shared-constants';
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

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  COMPANY: 'Empresa',
  SELF_EMPLOYED: 'Autónomo',
  INDIVIDUAL: 'Particular',
  PUBLIC_ENTITY: 'Entidad Pública',
  INTRACOMMUNITY: 'Intracomunitario',
};

const VALID_CUSTOMER_TYPES = new Set<string>(Object.keys(CUSTOMER_TYPE_LABELS));

// Reverse map: Spanish label (lowercase) → enum value
const LABEL_TO_TYPE = new Map<string, CustomerType>(
  Object.entries(CUSTOMER_TYPE_LABELS).map(([k, v]) => [v.toLowerCase(), k as CustomerType])
);

// ── Column definitions ─────────────────────────────────────────────────────────

interface ColDef {
  header: string;
  key: string;
  width: number;
  required: boolean;
}

const COLUMNS: ColDef[] = [
  { header: 'Nombre (*)', key: 'name', width: 32, required: true },
  { header: 'NIF / CIF / NIE (*)', key: 'nif', width: 20, required: true },
  { header: 'Tipo (*)', key: 'type', width: 22, required: true },
  { header: 'Email', key: 'email', width: 30, required: false },
  { header: 'Teléfono', key: 'phone', width: 17, required: false },
  { header: 'Dirección', key: 'address', width: 32, required: false },
  { header: 'Código postal', key: 'postalCode', width: 15, required: false },
  { header: 'Ciudad', key: 'city', width: 22, required: false },
  { header: 'Provincia', key: 'province', width: 22, required: false },
  { header: 'País', key: 'country', width: 10, required: false },
  { header: 'Notas', key: 'notes', width: 38, required: false },
];

// ── Country lookup maps ───────────────────────────────────────────────────────

// name (lowercase) → ISO code
const COUNTRY_NAME_TO_CODE = new Map<string, string>(
  COUNTRIES.map((c) => [c.name.toLowerCase(), c.code]),
);
// ISO code (uppercase) → ISO code (for direct code input like "ES")
const COUNTRY_CODES = new Set<string>(COUNTRIES.map((c) => c.code));

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Accepts a Spanish country name ("España") or ISO code ("ES") → returns ISO code or undefined */
function normalizeCountry(raw: string): string | undefined {
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  if (COUNTRY_CODES.has(upper)) return upper;
  return COUNTRY_NAME_TO_CODE.get(trimmed.toLowerCase());
}

function normalizeType(raw: string): CustomerType | undefined {
  const trimmed = raw.trim();
  // Accept English enum keys (COMPANY, SELF_EMPLOYED, …) for backwards compat
  if (VALID_CUSTOMER_TYPES.has(trimmed.toUpperCase())) return trimmed.toUpperCase() as CustomerType;
  // Accept Spanish labels (Empresa, Autónomo, …)
  return LABEL_TO_TYPE.get(trimmed.toLowerCase()) ?? undefined;
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable()
export class CustomerImportService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Template ────────────────────────────────────────────────────────────────

  async generateTemplate(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'EasyFactura';
    const ws = wb.addWorksheet('Clientes', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    // Column widths
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
        fgColor: { argb: col.required ? 'FF2563EB' : 'FF64748B' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
    headerRow.height = 24;

    // Example row
    const exampleRow = ws.addRow({
      name: 'Empresa Ejemplo S.L.',
      nif: 'B12345678',
      type: 'Empresa',
      email: 'contacto@ejemplo.com',
      phone: '912345678',
      address: 'Calle Mayor 1',
      postalCode: '28001',
      city: 'Madrid',
      province: 'Madrid',
      country: 'España',
      notes: '',
    });
    exampleRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDBEAFE' },
      };
      cell.font = { italic: true, color: { argb: 'FF1E40AF' }, name: 'Calibri' };
    });
    exampleRow.height = 20;

    // Hidden "Listas" sheet — stores long dropdown values (country list > 255 chars)
    const listsSheet = wb.addWorksheet('Listas');
    listsSheet.state = 'veryHidden';
    COUNTRIES.forEach((c, i) => {
      listsSheet.getCell(i + 1, 1).value = c.name;
    });

    // Dropdown: Tipo (column 3) and País (column 10)
    const typeValues = Object.values(CUSTOMER_TYPE_LABELS).join(',');
    const countryRange = `Listas!$A$1:$A$${COUNTRIES.length}`;
    for (let rowIdx = 2; rowIdx <= MAX_ROWS + 2; rowIdx++) {
      const typeCell = ws.getCell(rowIdx, 3);
      typeCell.dataValidation = {
        type: 'list',
        formulae: [`"${typeValues}"`],
        showErrorMessage: true,
        errorTitle: 'Tipo inválido',
        error: `Valores válidos: ${typeValues}`,
      };

      const countryCell = ws.getCell(rowIdx, 10);
      countryCell.dataValidation = {
        type: 'list',
        formulae: [countryRange],
        showErrorMessage: true,
        errorTitle: 'País inválido',
        error: 'Selecciona un país de la lista desplegable.',
      };
    }

    const rawBuffer = await wb.xlsx.writeBuffer();
    return rawBuffer as unknown as Buffer;
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

    // Collect data rows (skip header at row 1)
    const parsedRows: Array<{ rowNumber: number; data: Record<string, string | undefined> }> = [];
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      // Skip if user left the example row placeholder unchanged
      if (rowNumber === 2 && getCellString(row, 1) === 'Empresa Ejemplo S.L.') return;
      parsedRows.push({
        rowNumber,
        data: {
          name: getCellString(row, 1),
          nif: getCellString(row, 2),
          type: getCellString(row, 3),
          email: getCellString(row, 4),
          phone: getCellString(row, 5),
          address: getCellString(row, 6),
          postalCode: getCellString(row, 7),
          city: getCellString(row, 8),
          province: getCellString(row, 9),
          country: getCellString(row, 10),
          notes: getCellString(row, 11),
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

    // Intra-file NIF → first-seen row (detect duplicates within the same Excel)
    const nifFirstRowMap = new Map<string, number>(); // normalized NIF → first rowNumber
    for (const { rowNumber, data } of parsedRows) {
      if (data.nif) {
        const upper = data.nif.toUpperCase().trim();
        if (!nifFirstRowMap.has(upper)) nifFirstRowMap.set(upper, rowNumber);
      }
    }

    // Batch DB duplicate check: collect unique NIFs and query once
    const normalizedNifMap = new Map<string, string>(); // normalized → original
    for (const { data } of parsedRows) {
      if (data.nif) {
        normalizedNifMap.set(data.nif.toUpperCase().trim(), data.nif);
      }
    }

    const existingNifSet = await this.findExistingNifs(tenantId, [...normalizedNifMap.keys()]);

    // Validate each row
    const rows: ImportRowPreview[] = parsedRows.map(({ rowNumber, data }) => {
      const errors: string[] = [];
      const resolvedData: Record<string, unknown> = {};

      // name — required
      if (!data.name) {
        errors.push('El nombre es obligatorio');
      } else {
        resolvedData.name = data.name;
      }

      // nif — required + format + intra-file duplicate
      if (!data.nif) {
        errors.push('El NIF/CIF/NIE es obligatorio');
      } else {
        const upperNif = data.nif.toUpperCase().trim();
        const nifValidation = validateNif(upperNif);
        if (!nifValidation.isValid) {
          errors.push(`NIF/CIF/NIE inválido: ${nifValidation.message ?? 'formato incorrecto'}`);
        } else {
          const firstSeen = nifFirstRowMap.get(upperNif);
          if (firstSeen !== undefined && firstSeen !== rowNumber) {
            errors.push(`NIF duplicado en este Excel (ya aparece en la fila ${firstSeen})`);
          } else {
            resolvedData.nif = upperNif;
          }
        }
      }

      // type — required
      if (!data.type) {
        errors.push('El tipo es obligatorio');
      } else {
        const resolvedType = normalizeType(data.type);
        if (!resolvedType) {
          errors.push(
            `Tipo inválido: "${data.type}". Usa: ${Object.values(CUSTOMER_TYPE_LABELS).join(', ')}`
          );
        } else {
          resolvedData.type = resolvedType;
        }
      }

      // email — optional, basic format check
      if (data.email) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
          errors.push(`Email inválido: "${data.email}"`);
        } else {
          resolvedData.email = data.email;
        }
      }

      // phone — optional, pass through
      if (data.phone) resolvedData.phone = data.phone;

      // address — optional
      if (data.address) resolvedData.address = data.address;

      // postalCode — optional, 5 digits for ES
      if (data.postalCode) {
        const pc = data.postalCode.replace(/\s/g, '');
        resolvedData.postalCode = pc;
      }

      // city — optional
      if (data.city) resolvedData.city = data.city;

      // province — optional
      if (data.province) resolvedData.province = data.province;

      // country — optional, default ES; accepts Spanish name or ISO code
      if (data.country) {
        const isoCode = normalizeCountry(data.country);
        if (!isoCode) {
          errors.push(`País no reconocido: "${data.country}". Usa el nombre en español o el código ISO (ej. España / ES).`);
        } else {
          resolvedData.country = isoCode;
        }
      } else {
        resolvedData.country = 'ES';
      }

      // notes — optional
      if (data.notes) resolvedData.notes = data.notes;

      if (errors.length > 0) {
        return {
          row: rowNumber,
          status: 'error',
          errorMessage: errors.join('. '),
          data: resolvedData,
        };
      }

      // Duplicate check (only when NIF was valid and resolved)
      const upperNif = String(resolvedData.nif ?? '').toUpperCase();
      if (upperNif && existingNifSet.has(upperNif)) {
        return {
          row: rowNumber,
          status: 'duplicate',
          errorMessage: 'Ya existe un cliente con este NIF',
          data: resolvedData,
        };
      }

      return { row: rowNumber, status: 'valid', data: resolvedData };
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
        await this.prisma.customer.create({
          data: {
            tenantId,
            name: String(data.name),
            nif: String(data.nif).toUpperCase().trim(),
            type: String(data.type ?? CustomerType.COMPANY) as never,
            email: data.email ? String(data.email) : undefined,
            phone: data.phone ? String(data.phone) : undefined,
            address: data.address ? String(data.address) : undefined,
            postalCode: data.postalCode ? String(data.postalCode) : undefined,
            city: data.city ? String(data.city) : undefined,
            province: data.province ? String(data.province) : undefined,
            country: data.country ? String(data.country) : 'ES',
            notes: data.notes ? String(data.notes) : undefined,
          },
        });
        imported++;
      } catch (error) {
        // Gracefully skip if another user created the same NIF concurrently
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

  private async findExistingNifs(tenantId: string, nifs: string[]): Promise<Set<string>> {
    if (nifs.length === 0) return new Set();

    const existing = await this.prisma.customer.findMany({
      where: { tenantId, nif: { in: nifs, mode: 'insensitive' } },
      select: { nif: true },
    });

    return new Set(existing.map((c) => c.nif.toUpperCase()));
  }
}

import type { ExportFormat } from '@easyfactura/shared-types';

export interface SoftwareInfo {
  /** Display name of the accounting software. */
  name: string;
  /** Short label for compact UI (e.g. badge initials). */
  initials: string;
  /** File extension produced (e.g. ".txt"). */
  fileExtension: string;
  /** Tailwind background class for the brand badge. */
  brandBg: string;
  /** Tailwind text class for the brand badge. */
  brandText: string;
  /** Tailwind ring/border class used when card is selected. */
  brandRing: string;
  /** Tailwind soft background for the branded chip in the top bar. */
  brandBgSoft: string;
  /** Tailwind border color for the branded chip in the top bar. */
  brandBorder: string;
  /** One-line description for the card. */
  tagline: string;
  /** Whether export to this software is currently available. */
  available: boolean;
  /** Step-by-step import instructions. */
  steps: string[];
  /** Optional tips shown after the steps. */
  tips?: string[];
}

export const SOFTWARE_INFO: Record<ExportFormat, SoftwareInfo> = {
  CONTAPLUS: {
    name: 'ContaPlus',
    initials: 'CP',
    fileExtension: '.txt',
    brandBg: 'bg-blue-600',
    brandText: 'text-white',
    brandRing: 'ring-blue-500',
    brandBgSoft: 'bg-blue-50 dark:bg-blue-950/40',
    brandBorder: 'border-blue-200 dark:border-blue-800',
    tagline: 'Líder en gestión contable para pymes',
    available: true,
    steps: [
      'Abre ContaPlus y entra en la empresa del cliente.',
      'Ve al menú Archivo → Importar → Facturas emitidas.',
      'Selecciona el archivo .txt descargado desde tu carpeta de descargas.',
      'Verifica el mapeo de campos: Fecha, Número, NIF, Base imponible, Cuota IVA.',
      'Confirma la importación. ContaPlus generará los asientos automáticamente.',
    ],
    tips: [
      'El archivo está codificado en Windows-1252 para máxima compatibilidad.',
      'Si ContaPlus no detecta los acentos, asegúrate de no haber abierto el archivo en otro programa antes.',
    ],
  },
  A3CON: {
    name: 'A3CON',
    initials: 'A3',
    fileExtension: '.txt',
    brandBg: 'bg-orange-600',
    brandText: 'text-white',
    brandRing: 'ring-orange-500',
    brandBgSoft: 'bg-orange-50 dark:bg-orange-950/40',
    brandBorder: 'border-orange-200 dark:border-orange-800',
    tagline: 'La solución profesional de Wolters Kluwer',
    available: false,
    steps: ['Próximamente disponible.', 'Si necesitas exportar a A3CON urgentemente, contáctanos.'],
  },
  EXCEL: {
    name: 'Excel',
    initials: 'XL',
    fileExtension: '.xlsx',
    brandBg: 'bg-emerald-600',
    brandText: 'text-white',
    brandRing: 'ring-emerald-500',
    brandBgSoft: 'bg-emerald-50 dark:bg-emerald-950/40',
    brandBorder: 'border-emerald-200 dark:border-emerald-800',
    tagline: 'Hoja de cálculo universal para análisis',
    available: false,
    steps: [
      'Próximamente disponible.',
      'Mientras tanto, puedes exportar a ContaPlus y abrirlo en Excel.',
    ],
  },
};

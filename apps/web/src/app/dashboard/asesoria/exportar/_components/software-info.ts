import type { ExportFormat } from '@easyfactura/shared-types';

export interface SoftwareInfo {
  /** Display name of the accounting software. */
  name: string;
  /** Short label for compact UI (e.g. badge initials). */
  initials: string;
  /** Path to a logo image in /public (e.g. '/programas/favicon-cegid.png'). Replaces initials when present. */
  logoUrl?: string;
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
  CEGID: {
    name: 'Cegid Contasimple',
    initials: 'CS',
    logoUrl: '/programas/favicon-cegid.png',
    fileExtension: '.xlsx',
    brandBg: 'bg-emerald-600',
    brandText: 'text-white',
    brandRing: 'ring-emerald-500',
    brandBgSoft: 'bg-emerald-50 dark:bg-emerald-950/40',
    brandBorder: 'border-emerald-200 dark:border-emerald-800',
    tagline: 'Excel compatible con Cegid Contasimple',
    available: true,
    steps: [
      'Descarga el archivo .xlsx desde la sección de exportaciones.',
      'Abre Cegid Contasimple y ve al menú Facturación → Importar en el menú lateral izquierdo.',
      'Selecciona el tipo de datos: "Facturas emitidas".',
      'Arrastra el archivo .xlsx al recuadro de importación o haz clic en "Seleccionar archivo".',
      'Cegid detectará automáticamente las columnas porque los nombres de cabecera coinciden exactamente con el formato requerido.',
      'Revisa el resumen de la importación: verifica que el número de facturas sea correcto.',
      'Haz clic en "Continuar" y después en "Importar" para finalizar.',
    ],
    tips: [
      'El archivo tiene una fila de cabecera y una fila por cada línea de factura — es el formato nativo de Cegid Contasimple.',
      'Si un cliente tiene varias líneas, los datos de cabecera (serie, número, cliente…) solo aparecen en la primera línea de cada factura.',
      'Puedes reabrir esta guía en cualquier momento desde el botón "Cómo importar" de la barra superior.',
    ],
  },
  DIAMACON: {
    name: 'Diamacon',
    initials: 'DM',
    logoUrl: '/programas/icono-diamacon.jpg',
    fileExtension: '.xlsx',
    brandBg: 'bg-violet-600',
    brandText: 'text-white',
    brandRing: 'ring-violet-500',
    brandBgSoft: 'bg-violet-50 dark:bg-violet-950/40',
    brandBorder: 'border-violet-200 dark:border-violet-800',
    tagline: 'Software de gestión de Comeralia',
    available: false,
    steps: ['Próximamente disponible.'],
  },
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
    available: false,
    steps: ['Próximamente disponible.'],
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
};

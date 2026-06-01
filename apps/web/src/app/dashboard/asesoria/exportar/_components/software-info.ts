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
  /** Optional external help URL (e.g. vendor documentation). */
  helpUrl?: string;
  /** Label for the helpUrl link. */
  helpUrlLabel?: string;
}

export const SOFTWARE_INFO: Record<ExportFormat, SoftwareInfo> = {
  CEGID: {
    name: 'Cegid ',
    initials: 'CS',
    logoUrl: '/programas/favicon-cegid.png',
    fileExtension: '.xlsx',
    brandBg: 'bg-emerald-600',
    brandText: 'text-white',
    brandRing: 'ring-emerald-500',
    brandBgSoft: 'bg-emerald-50 dark:bg-emerald-950/40',
    brandBorder: 'border-emerald-200 dark:border-emerald-800',
    tagline: 'Excel compatible con Cegid ',
    available: true,
    steps: [
      'Descarga el archivo .xlsx desde la secci\u00f3n de exportaciones.',
      'Abre Cegid  y ve al men\u00fa Facturaci\u00f3n \u2192 Importar en el men\u00fa lateral izquierdo.',
      'Selecciona el tipo de datos: "Facturas emitidas".',
      'Arrastra el archivo .xlsx al recuadro de importaci\u00f3n o haz clic en "Seleccionar archivo".',
      'Cegid detectar\u00e1 autom\u00e1ticamente las columnas porque los nombres de cabecera coinciden exactamente con el formato requerido.',
      'Revisa el resumen de la importaci\u00f3n: verifica que el n\u00famero de facturas sea correcto.',
      'Haz clic en "Continuar" y despu\u00e9s en "Importar" para finalizar.',
    ],
    tips: [
      'El archivo tiene una fila de cabecera y una fila por cada l\u00ednea de factura \u2014 es el formato nativo de Cegid .',
      'Si un cliente tiene varias l\u00edneas, los datos de cabecera (serie, n\u00famero, cliente\u2026) solo aparecen en la primera l\u00ednea de cada factura.',
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
    tagline: 'Excel compatible con Diamacon (Comeralia)',
    available: true,
    steps: [
      'Descarga el archivo .xlsx desde la secci\u00f3n de exportaciones.',
      'Abre Diamacon y accede al m\u00f3dulo de Facturaci\u00f3n.',
      'Ve a la opci\u00f3n de Importar facturas y selecciona el archivo .xlsx descargado.',
      'Revisa el resumen de la importaci\u00f3n y verifica que el n\u00famero de facturas sea correcto.',
      'Confirma la importaci\u00f3n para finalizar.',
    ],
    tips: [
      'La primera vez que importes el Excel en Diamacon, te pedir\u00e1 enlazar cada columna con sus correspondientes campos.',
      'Si un cliente tiene varias l\u00edneas, los datos de cabecera (serie, n\u00famero, cliente\u2026) solo aparecen en la primera l\u00ednea de cada factura.',
    ],
  },
  A3CON: {
    name: 'a3asesor Con (Wolters Kluwer)',
    initials: 'A3',
    logoUrl: '/programas/A3Logo.png',
    fileExtension: '.xlsx',
    brandBg: 'bg-orange-600',
    brandText: 'text-white',
    brandRing: 'ring-orange-500',
    brandBgSoft: 'bg-orange-50 dark:bg-orange-950/40',
    brandBorder: 'border-orange-200 dark:border-orange-800',
    tagline: 'La soluci\u00f3n profesional de Wolters Kluwer',
    available: true,
    steps: [
      'Descarga el archivo .xlsx desde la secci\u00f3n de exportaciones.',
      'Abre A3CON y ve al m\u00f3dulo Importador de datos (Ficheros \u2192 Importar \u2192 Excel).',
      'Selecciona el tipo de fichero \u201cFacturas emitidas\u201d.',
      'Crea o selecciona una plantilla de importaci\u00f3n. En la configuraci\u00f3n indica qu\u00e9 columna corresponde a cada campo: Fecha factura (col. A), N\u00famero (col. B), NIF (col. D), Nombre (col. E), Base imponible (col. G), Tipo IVA (col. H), Cuota IVA (col. I), Tipo Retenci\u00f3n (col. L), Cuota Retenci\u00f3n (col. M), Total (col. N).',
      'Indica que los datos empiezan en la fila 2 (la fila 1 es la cabecera).',
      'Selecciona el archivo .xlsx descargado y ejecuta la importaci\u00f3n.',
      'Revisa el resumen y confirma para finalizar.',
    ],
    tips: [
      'El archivo contiene una fila por factura (no por l\u00ednea), lo que simplifica la configuraci\u00f3n en A3CON.',
      'Una vez configurada la plantilla, gu\u00e1rdala en A3CON para reutilizarla en futuras importaciones.',
      'Si una factura tiene l\u00edneas con distintos tipos de IVA, la columna \u201cTipo IVA\u201d muestra el tipo dominante (el de mayor importe). Revisa esas facturas manualmente.',
    ],
    helpUrl: 'https://a3responde.wolterskluwer.com/es/s/article/plantillas-de-importacion-de-excel',
    helpUrlLabel:
      'Gu\u00eda oficial: Plantillas de importaci\u00f3n de Excel \u2014 Wolters Kluwer',
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
    tagline: 'L\u00edder en gesti\u00f3n contable para pymes',
    available: false,
    steps: ['Pr\u00f3ximamente disponible.'],
  },
};

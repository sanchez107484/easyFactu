/**
 * Single source of truth for VeriFactu legal deadlines (YMYL content).
 *
 * Every page that mentions VeriFactu deadlines MUST use these values — never
 * hardcode dates in prose. Internal contradictions in legal/fiscal content
 * degrade quality rankings and erode user trust.
 *
 * Canonical status (updated 2026-10-26): software adaptado 29-jul-2025 ·
 * obligación para empresas y autónomos aplazada a octubre de 2028 según la
 * nota de Hacienda del 5-oct-2026, pendiente de publicación en el BOE.
 */
export interface VerifactuDeadline {
  /** ISO date or month, used in <time dateTime> */
  iso: string;
  /** Human-readable Spanish date */
  label: string;
  /** Who the deadline applies to */
  audience: string;
  /** What becomes mandatory on that date */
  description: string;
}

/** Date this calendar was last reviewed; shown as "Actualizado" on legal pages. */
export const VERIFACTU_CALENDAR_UPDATED_AT = { iso: '2026-10-26', label: '26 de octubre de 2026' };

export const VERIFACTU_ANNOUNCED_DEADLINE = {
  iso: '2028-10',
  label: 'octubre de 2028',
  /** Short sentence reused across pages. */
  summary: 'Hacienda ha anunciado octubre de 2028 (pendiente de BOE)',
  source: {
    name: 'Nota informativa del Ministerio de Hacienda (5 de octubre de 2026)',
    url: 'https://www.hacienda.gob.es/sgt/gabsehacienda/nota-informativa-verifactu.pdf',
  },
} as const;

export const VERIFACTU_DEADLINES: readonly VerifactuDeadline[] = [
  {
    iso: '2025-07-29',
    label: '29 de julio de 2025',
    audience: 'Productores y comercializadores de software',
    description:
      'El software de facturación solo puede comercializarse adaptado al Reglamento VeriFactu.',
  },
  {
    iso: VERIFACTU_ANNOUNCED_DEADLINE.iso,
    label: 'Octubre de 2028 (anunciado)',
    audience: 'Sociedades y autónomos',
    description:
      'Hacienda ha anunciado el aplazamiento de la obligación de facturar con software adaptado a VeriFactu hasta octubre de 2028, para que coincida con la factura electrónica obligatoria. Pendiente de publicación en el BOE.',
  },
];

export interface VerifactuLaw {
  name: string;
  url: string;
}

export const VERIFACTU_LEGISLATION: readonly VerifactuLaw[] = [
  {
    name: 'Ley 11/2021, de 9 de julio (Ley Antifraude)',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2021-9433',
  },
  {
    name: 'Real Decreto 1007/2023, de 5 de diciembre (Reglamento VeriFactu)',
    url: 'https://www.boe.es/eli/es/rd/2023/12/05/1007',
  },
  {
    name: 'Real Decreto-ley 15/2025, de 2 de diciembre (plazos vigentes en el BOE)',
    url: 'https://www.boe.es/eli/es/rdl/2025/12/02/15',
  },
];

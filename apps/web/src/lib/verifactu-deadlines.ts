/**
 * Single source of truth for VeriFactu legal deadlines (YMYL content).
 *
 * Every page that mentions VeriFactu deadlines MUST use these values — never
 * hardcode dates in prose. Internal contradictions in legal/fiscal content
 * degrade quality rankings and erode user trust.
 *
 * Canonical table: software adaptado 29-jul-2025 · sociedades 1-ene-2027 ·
 * autónomos 1-jul-2027.
 */
export interface VerifactuDeadline {
  /** ISO date, used in <time dateTime> */
  iso: string;
  /** Human-readable Spanish date */
  label: string;
  /** Who the deadline applies to */
  audience: string;
  /** What becomes mandatory on that date */
  description: string;
}

export const VERIFACTU_DEADLINES: readonly VerifactuDeadline[] = [
  {
    iso: '2025-07-29',
    label: '29 de julio de 2025',
    audience: 'Productores y comercializadores de software',
    description:
      'El software de facturación solo puede comercializarse adaptado al Reglamento VeriFactu.',
  },
  {
    iso: '2027-01-01',
    label: '1 de enero de 2027',
    audience: 'Sociedades (SL, SA y demás personas jurídicas)',
    description: 'Obligación de emitir facturas con software adaptado a VeriFactu.',
  },
  {
    iso: '2027-07-01',
    label: '1 de julio de 2027',
    audience: 'Autónomos (persona física en estimación directa)',
    description: 'Obligación de emitir facturas con software adaptado a VeriFactu.',
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
    name: 'Real Decreto 254/2025, de 1 de abril (plazos de aplicación)',
    url: 'https://www.boe.es/eli/es/rd/2025/04/01/254',
  },
];

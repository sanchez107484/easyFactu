import Link from 'next/link';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { VERIFACTU_ANNOUNCED_DEADLINE } from '@/lib/verifactu-deadlines';

/** Hub ↔ subpage links of the factura electrónica cluster (HU-17). */
export const E_INVOICE_PAGES = [
  {
    href: '/factura-electronica',
    label: 'Factura electrónica en España: qué es y fechas',
    description: 'La guía principal: definición, calendario y test para saber si te afecta.',
  },
  {
    href: '/factura-electronica/facturae',
    label: '¿Qué es Facturae?',
    description: 'El formato XML oficial: versiones, firma, FACe y cómo generarlo.',
  },
  {
    href: '/factura-electronica/ejemplos',
    label: 'Ejemplos de factura electrónica',
    description: 'La misma factura en PDF y en XML Facturae, y cuándo vale cada una.',
  },
] as const;

export function eInvoiceRelatedLinks(currentHref: string) {
  return [
    ...E_INVOICE_PAGES.filter((page) => page.href !== currentHref),
    {
      href: '/facturacion-online',
      label: 'Programa de facturación online',
      description: 'Lo que hace por un autónomo en el día a día.',
    },
    {
      href: '/precios',
      label: 'Precio del programa de facturación',
      description: 'Gratis hasta 2027, con VeriFactu incluido.',
    },
    { href: '/verifactu', label: '¿Qué es VeriFactu?', description: 'La otra obligación de 2028.' },
  ];
}

const DIFFERENCES = [
  { aspect: 'Ley que la regula', fe: 'Ley 18/2022 (Crea y Crece)', vf: 'Ley 11/2021 (Antifraude)' },
  {
    aspect: '¿A quién afecta?',
    fe: 'Facturas entre empresas y autónomos (B2B)',
    vf: 'Cualquier factura emitida con programa (B2B y B2C)',
  },
  {
    aspect: '¿Qué obliga?',
    fe: 'Enviar la factura en formato estructurado (Facturae, UBL…)',
    vf: 'Registro con hash encadenado, QR y, si procede, envío a la AEAT',
  },
  {
    aspect: 'Fecha (hasta 8 M€)',
    fe: `${VERIFACTU_ANNOUNCED_DEADLINE.label} (anunciado)`,
    vf: `${VERIFACTU_ANNOUNCED_DEADLINE.label} (anunciado)`,
  },
  { aspect: '¿Son excluyentes?', fe: 'No', vf: 'No: un mismo programa puede cumplir las dos' },
];

const FORMATS = [
  {
    name: 'Facturae (XML)',
    usage: 'Estándar oficial español. Obligatorio en facturas al sector público.',
    pros: 'Lo leen automáticamente los programas de la Administración y de las empresas.',
  },
  {
    name: 'UBL',
    usage: 'Estándar europeo (norma EN 16931) para intercambios entre empresas.',
    pros: 'Facilita facturar a clientes de otros países.',
  },
  {
    name: 'EDIFACT',
    usage: 'Intercambio EDI de grandes empresas, logística y distribución.',
    pros: 'Muy implantado en cadenas de suministro.',
  },
  {
    name: 'PDF',
    usage: 'Factura digital válida hoy, pero no estructurada.',
    pros: 'Fácil de ver. No servirá como factura electrónica B2B obligatoria.',
  },
];

export function DifferencesTable() {
  return (
    <div className="mb-10 mt-4 overflow-x-auto rounded-2xl border border-neutral-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-50">
            <th scope="col" className="px-5 py-3 text-left font-semibold text-slate-700">
              Aspecto
            </th>
            <th scope="col" className="px-5 py-3 text-left font-semibold text-emerald-700">
              Factura electrónica
            </th>
            <th scope="col" className="px-5 py-3 text-left font-semibold text-blue-700">
              VeriFactu
            </th>
          </tr>
        </thead>
        <tbody>
          {DIFFERENCES.map((row, index) => (
            <tr key={row.aspect} className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}>
              <th scope="row" className="px-5 py-3 text-left font-medium text-slate-700">
                {row.aspect}
              </th>
              <td className="px-5 py-3 text-slate-600">{row.fe}</td>
              <td className="px-5 py-3 text-slate-600">{row.vf}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FormatsGrid() {
  return (
    <div className="mb-10 mt-4 grid gap-4 sm:grid-cols-2">
      {FORMATS.map((format) => (
        <div key={format.name} className="rounded-xl border border-neutral-100 p-5">
          <p className="mb-1 font-bold text-slate-900">{format.name}</p>
          <p className="mb-2 text-sm text-slate-600">{format.usage}</p>
          <p className="text-xs text-emerald-700">
            <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />
            {format.pros}
          </p>
        </div>
      ))}
    </div>
  );
}

export function SubpageCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {E_INVOICE_PAGES.slice(1).map((page) => (
        <Link
          key={page.href}
          href={page.href}
          className="group rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 transition hover:border-emerald-300 hover:shadow-md"
        >
          <p className="flex items-center gap-2 font-bold text-slate-900 group-hover:text-emerald-700">
            {page.label}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </p>
          <p className="mt-1 text-sm text-slate-600">{page.description}</p>
        </Link>
      ))}
    </div>
  );
}

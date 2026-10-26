import { ExternalLink } from 'lucide-react';
import { INTRACOMMUNITY_LEGAL_NOTES } from '@easyfactura/shared-constants';
import { CopyTextButton } from '@/components/marketing/copy-text-button';
import {
  TemplateDownloads,
  type TemplateDownload,
} from '@/components/marketing/template-downloads';

export const VIES_URL = 'https://ec.europa.eu/taxation_customs/vies/';

const TEMPLATE_FILES: readonly TemplateDownload[] = [
  {
    href: '/plantillas/plantilla-factura-intracomunitaria.xlsx',
    format: 'Excel',
    description: 'Calcula la base y el total solo. Incluye las dos menciones legales.',
  },
  {
    href: '/plantillas/plantilla-factura-intracomunitaria.docx',
    format: 'Word',
    description: 'Para editar a mano y exportar a PDF.',
  },
  {
    href: '/plantillas/plantilla-factura-intracomunitaria.pdf',
    format: 'PDF',
    description: 'Modelo para imprimir o ver todos los campos.',
  },
];

interface InvoiceExample {
  title: string;
  vatLabel: 'Sin IVA' | 'Con IVA';
  customer: string;
  concept: string;
  base: string;
  vat: string;
  total: string;
  note: string;
}

const EXAMPLES: readonly InvoiceExample[] = [
  {
    title: 'Servicios a una empresa de la UE',
    vatLabel: 'Sin IVA',
    customer: 'Agentur Beispiel GmbH · NIF-IVA DE123456789 (válido en VIES)',
    concept: 'Diseño y desarrollo de página web',
    base: '2.000,00 €',
    vat: '0,00 €',
    total: '2.000,00 €',
    note: INTRACOMMUNITY_LEGAL_NOTES.SERVICES,
  },
  {
    title: 'Venta de bienes a una empresa de la UE',
    vatLabel: 'Sin IVA',
    customer: 'Exemple SARL · NIF-IVA FR12345678901 (válido en VIES)',
    concept: '50 cajas de aceite de oliva virgen extra (6 × 1 l)',
    base: '1.500,00 €',
    vat: '0,00 €',
    total: '1.500,00 €',
    note: `${INTRACOMMUNITY_LEGAL_NOTES.GOODS} Guarda la prueba del transporte a Francia.`,
  },
  {
    title: 'Servicios a un particular de la UE',
    vatLabel: 'Con IVA',
    customer: 'Particular residente en Portugal (sin NIF-IVA)',
    concept: 'Diseño de logotipo',
    base: '400,00 €',
    vat: '84,00 € (IVA español 21 %)',
    total: '484,00 €',
    note: 'Sin NIF-IVA del cliente no hay inversión del sujeto pasivo: los servicios generales a particulares tributan en España.',
  },
  {
    title: 'Venta online de bienes a un particular de la UE',
    vatLabel: 'Con IVA',
    customer: 'Particular residente en Italia (sin NIF-IVA)',
    concept: 'Juego de vajilla de cerámica',
    base: '120,00 €',
    vat: '25,20 € (IVA español 21 %)',
    total: '145,20 €',
    note: 'IVA español mientras tus ventas a distancia a particulares de la UE no pasen de 10.000 € al año. Por encima, aplicas el IVA del país del cliente y lo declaras en la ventanilla única (OSS).',
  },
];

const NIF_EXAMPLES = [
  { country: 'España', example: 'ESB12345678', pattern: 'ES + NIF o CIF' },
  { country: 'Alemania', example: 'DE123456789', pattern: 'DE + 9 dígitos' },
  { country: 'Francia', example: 'FR12345678901', pattern: 'FR + 2 caracteres + 9 dígitos' },
  { country: 'Portugal', example: 'PT123456789', pattern: 'PT + 9 dígitos' },
  { country: 'Italia', example: 'IT12345678901', pattern: 'IT + 11 dígitos' },
];

export function TemplateDownloadSection() {
  return (
    <section id="plantilla" className="border-b border-slate-100 py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-3 text-2xl font-bold text-slate-900">
          Plantilla de factura intracomunitaria gratis
        </h2>
        <p className="mb-6 text-slate-600">
          Descarga el modelo en el formato que uses. Sustituye los campos entre corchetes y deja
          solo la mención legal que corresponda (bienes o servicios).
        </p>
        <TemplateDownloads files={TEMPLATE_FILES} />
      </div>
    </section>
  );
}

function ExampleCard({ example }: { example: InvoiceExample }) {
  const rows = [
    ['Cliente', example.customer],
    ['Concepto', example.concept],
    ['Base imponible', example.base],
    ['IVA', example.vat],
    ['Total', example.total],
  ];
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-bold text-slate-900">{example.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${example.vatLabel === 'Sin IVA' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}
        >
          {example.vatLabel}
        </span>
      </div>
      <dl className="space-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-slate-500">{label}</dt>
            <dd className="text-right font-medium text-slate-800">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
        {example.note}
      </p>
    </article>
  );
}

export function InvoiceExamplesSection() {
  return (
    <section id="ejemplos" className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-3 text-2xl font-bold text-slate-900">
          Ejemplos de factura intracomunitaria
        </h2>
        <p className="mb-8 text-slate-600">
          Cuatro casos habituales: bienes y servicios, a empresas (sin IVA) y a particulares (con
          IVA). Datos ficticios.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {EXAMPLES.map((example) => (
            <ExampleCard key={example.title} example={example} />
          ))}
        </div>
      </div>
    </section>
  );
}

const MENTIONS = [
  { label: 'Venta de bienes', text: INTRACOMMUNITY_LEGAL_NOTES.GOODS },
  { label: 'Prestación de servicios', text: INTRACOMMUNITY_LEGAL_NOTES.SERVICES },
];

export function LegalMentionsSection() {
  return (
    <div id="mencion-legal" className="mt-8 space-y-3">
      <h3 className="text-lg font-bold text-slate-900">
        Coletilla legal de inversión del sujeto pasivo
      </h3>
      <p className="text-sm text-slate-600">
        Es obligatoria en toda factura intracomunitaria sin IVA. Cópiala tal cual:
      </p>
      {MENTIONS.map((mention) => (
        <div
          key={mention.label}
          className="rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-indigo-900">{mention.label}</p>
            <CopyTextButton text={mention.text} label="Copiar coletilla" />
          </div>
          <p className="text-sm leading-relaxed text-indigo-800">{mention.text}</p>
        </div>
      ))}
    </div>
  );
}

export function NifViesSection() {
  return (
    <section id="nif-intracomunitario" className="bg-slate-50 py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-3 text-2xl font-bold text-slate-900">
          Ejemplo de NIF intracomunitario y cómo validarlo en VIES
        </h2>
        <p className="mb-6 text-slate-600">
          El NIF intracomunitario (NIF-IVA) es el código del país seguido del número fiscal. En
          España es <strong>ES + tu NIF</strong>, y solo es válido si estás dado de alta en el
          Registro de Operadores Intracomunitarios (ROI).
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">
                  País
                </th>
                <th scope="col" className="px-4 py-2.5 font-semibold">
                  Ejemplo
                </th>
                <th scope="col" className="hidden px-4 py-2.5 font-semibold sm:table-cell">
                  Formato
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {NIF_EXAMPLES.map((row) => (
                <tr key={row.country}>
                  <td className="px-4 py-2.5 text-slate-700">{row.country}</td>
                  <td className="px-4 py-2.5 font-mono text-slate-900">{row.example}</td>
                  <td className="hidden px-4 py-2.5 text-slate-500 sm:table-cell">{row.pattern}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <a
          href={VIES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Comprobar un NIF-IVA en VIES (Comisión Europea)
          <ExternalLink className="h-4 w-4" />
        </a>
        <p className="mt-3 text-xs text-slate-500">
          Guarda el justificante de la consulta con su fecha junto a la factura.
        </p>
      </div>
    </section>
  );
}

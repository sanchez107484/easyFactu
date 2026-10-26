import { ReagypCompensationCalculator } from '@/components/marketing/reagyp-compensation-calculator';
import {
  TemplateDownloads,
  type TemplateDownload,
} from '@/components/marketing/template-downloads';

const EXAMPLE_FILES: readonly TemplateDownload[] = [
  {
    href: '/plantillas/ejemplo-factura-agricultor-reagyp.xlsx',
    format: 'Excel',
    description: 'Ejemplo editable: cambia el importe y la compensación se recalcula.',
  },
  {
    href: '/plantillas/ejemplo-factura-agricultor-reagyp.pdf',
    format: 'PDF',
    description: 'Ejemplo rellenado para imprimir o enseñar a tu comprador.',
  },
];

const EXAMPLE_HEADER = [
  ['Serie y número', 'REA-2026-014'],
  ['Fecha de expedición', '15/10/2026 (entrega el 12/10/2026)'],
  ['Expide (comprador)', 'Cooperativa Agrícola Ejemplo, S. Coop. · NIF F00000000'],
  ['Titular de la explotación', 'Juan Ejemplo García · NIF 12345678Z · Tudela (Navarra)'],
  ['Concepto', 'Almendra en cáscara, 5.000 kg × 0,90 €/kg'],
];

const EXAMPLE_TOTALS = [
  ['Importe de la entrega', '4.500,00 €'],
  ['Compensación REAGYP 12 %', '540,00 €'],
  ['Total a pagar', '5.040,00 €'],
];

export function ReagypInvoiceExampleSection() {
  return (
    <section id="ejemplo-factura-reagyp" className="py-20 md:py-24">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Ejemplo de factura de agricultor en REAGYP
        </h2>
        <p className="mb-8 max-w-3xl text-gray-600 dark:text-gray-300">
          En el régimen especial agrario no se cobra IVA: el comprador te paga una compensación a
          tanto alzado sobre el precio. Normalmente el documento lo expide el comprador (una
          cooperativa, una empresa o un almacén) y tú lo firmas. Este es un ejemplo con datos
          ficticios de una venta de almendra:
        </p>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <dl className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
            {EXAMPLE_HEADER.map(([label, value]) => (
              <div key={label} className="grid gap-1 px-5 py-3 sm:grid-cols-[220px_1fr]">
                <dt className="font-semibold text-gray-700 dark:text-gray-300">{label}</dt>
                <dd className="text-gray-600 dark:text-gray-400">{value}</dd>
              </div>
            ))}
          </dl>
          <dl className="space-y-1.5 border-t border-gray-200 bg-green-50 px-5 py-4 text-sm dark:border-gray-800 dark:bg-green-950/30">
            {EXAMPLE_TOTALS.map(([label, value], index) => (
              <div
                key={label}
                className={`flex justify-between ${index === EXAMPLE_TOTALS.length - 1 ? 'border-t border-green-200 pt-2 text-base font-bold dark:border-green-900' : ''}`}
              >
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
            Mención: operación acogida al régimen especial de la agricultura, ganadería y pesca
            (arts. 124 a 134 bis de la Ley 37/1992 del IVA). Incluye la firma del titular de la
            explotación.
          </p>
        </div>
        <h3 className="mb-4 mt-10 text-lg font-bold text-gray-900 dark:text-white">
          Descarga el ejemplo rellenado
        </h3>
        <TemplateDownloads files={EXAMPLE_FILES} />
      </div>
    </section>
  );
}

export function ReagypCalculatorSection() {
  return (
    <section
      id="calculadora-compensacion-reagyp"
      className="border-y border-gray-100 bg-gray-50 py-20 dark:border-gray-800 dark:bg-gray-900/50 md:py-24"
    >
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          Calculadora de la compensación REAGYP
        </h2>
        <p className="mb-8 text-gray-600 dark:text-gray-300">
          La compensación es del <strong>12 %</strong> en explotaciones agrícolas y forestales y del{' '}
          <strong>10,5 %</strong> en las ganaderas y pesqueras (artículo 130 de la Ley del IVA). Se
          calcula sobre el precio de venta, sin incluir otros impuestos ni gastos accesorios.
        </p>
        <ReagypCompensationCalculator />
        <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
          Si vendes a un particular o a otro agricultor en REAGYP, no hay compensación. Si tributas
          en módulos, el comprador puede tener que retenerte IRPF: consulta tu caso con tu asesor.
        </p>
      </div>
    </section>
  );
}

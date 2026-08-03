import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import CtaDarkSection from '@/components/CtaDarkSection';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import SiteHeader from '@/components/site-header';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';

export const novafacturaFacturaProformaMetadata: Metadata = {
  title: `Factura proforma — Qué es y para qué sirve 2026 | ${brandConfig.app.name}`,
  description:
    'La factura proforma no tiene valor fiscal ni devenga IVA. Te explicamos cuándo usarla y sus diferencias con el presupuesto.',
  keywords: [
    'factura proforma',
    'que es una factura proforma',
    'factura proforma ejemplo',
    'diferencia factura proforma y factura',
    'cuando usar factura proforma',
    'factura proforma validez legal',
    'factura proforma vs presupuesto',
    'como hacer una factura proforma',
    'factura proforma tiene valor fiscal',
    'factura proforma exportacion',
  ],
  alternates: { canonical: `${brandConfig.app.url}/facturas/proforma` },
  openGraph: {
    title: `Factura proforma — Qué es y para qué sirve | ${brandConfig.app.name}`,
    description:
      'La factura proforma no tiene valor fiscal ni devenga IVA. Te explicamos cuándo usarla y sus diferencias con el presupuesto.',
    url: `${brandConfig.app.url}/facturas/proforma`,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: `Factura proforma — Qué es y para qué sirve | ${brandConfig.app.name}`,
    description:
      'La factura proforma no tiene valor fiscal ni devenga IVA. Te explicamos cuándo usarla y sus diferencias con el presupuesto.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Factura proforma: Qué es y para qué sirve 2026',
  description:
    'La factura proforma no tiene valor fiscal ni devenga IVA. Te explicamos cuándo usarla y sus diferencias con el presupuesto.',
  author: { '@type': 'Organization', name: brandConfig.app.name, url: brandConfig.app.url },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    logo: { '@type': 'ImageObject', url: `${brandConfig.app.url}${brandConfig.logos.main}` },
  },
  datePublished: '2025-01-15',
  dateModified: '2026-05-19',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿La factura proforma tiene valor legal?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. La factura proforma es un documento informativo, no tiene valor fiscal ni contable. No genera obligación de pago por sí misma, no devenga IVA y no debe incluirse en las declaraciones tributarias. Su único valor es servir de referencia para la operación futura o para trámites aduaneros.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puedo deducir el IVA de una factura proforma?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Al no ser una factura oficial, el IVA que aparece en una proforma no es deducible. Para deducir el IVA necesitas la factura definitiva que sí tiene validez fiscal.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto tiempo tiene validez una factura proforma?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La validez de una factura proforma la establece el emisor. Lo habitual es indicar en el propio documento la fecha de validez de la oferta (por ejemplo, "válida hasta el 31/01/2026"). Si no se indica, se asume que refleja las condiciones en la fecha de emisión.',
      },
    },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    { '@type': 'ListItem', position: 2, name: 'Facturas', item: `${brandConfig.app.url}/facturas` },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Factura proforma',
      item: `${brandConfig.app.url}/facturas/proforma`,
    },
  ],
};

const comparison = [
  {
    aspect: 'Valor fiscal',
    presupuesto: 'Ninguno',
    proforma: 'Ninguno',
    factura: 'Sí — se declara a Hacienda',
  },
  { aspect: 'Devenga IVA', presupuesto: 'No', proforma: 'No', factura: 'Sí' },
  {
    aspect: 'Obliga al pago',
    presupuesto: 'No (salvo aceptación firmada)',
    proforma: 'No',
    factura: 'Sí',
  },
  {
    aspect: 'Numeración obligatoria',
    presupuesto: 'Recomendada, no obligatoria',
    proforma: 'No (se suele indicar como "PROFORMA")',
    factura: 'Sí — correlativa y sin saltos',
  },
  { aspect: 'Aparece en contabilidad', presupuesto: 'No', proforma: 'No', factura: 'Sí' },
  {
    aspect: 'Uso aduanero',
    presupuesto: 'No',
    proforma: 'Sí — exportaciones e importaciones',
    factura: 'Sí — pero solo si es la definitiva',
  },
];

const useCases = [
  {
    icon: '✈️',
    title: 'Exportaciones e importaciones',
    desc: 'La aduana pide una proforma para calcular aranceles antes de que se complete la operación.',
  },
  {
    icon: '🏦',
    title: 'Solicitud de financiación',
    desc: 'Bancos o entidades de leasing piden proformas para verificar el importe de la compra antes de aprobar el crédito.',
  },
  {
    icon: '📋',
    title: 'Presupuesto formal',
    desc: 'Cuando un cliente pide un presupuesto con formato de factura, sin que esto genere obligación fiscal aún.',
  },
  {
    icon: '🛡️',
    title: 'Reservas y señales',
    desc: 'El cliente abona una señal para reservar el servicio antes de que se preste. La proforma anticipa el total.',
  },
];

const faqs = [
  {
    q: '¿La factura proforma tiene valor legal o fiscal en España?',
    a: 'No. La factura proforma es un documento informativo previo a la venta que no tiene valor fiscal ni contable. No genera obligación de pago, no devenga IVA (no hay hecho imponible hasta que se produce la entrega del bien o la prestación del servicio), no debe incluirse en declaraciones tributarias y no puede usarse para deducir el IVA. Es simplemente una propuesta comercial con formato similar al de una factura.',
  },
  {
    q: '¿Puedo deducir el IVA de una factura proforma?',
    a: 'No. Solo puedes deducir el IVA soportado con una factura definitiva (o simplificada en determinados casos). La proforma no es válida para deducción de IVA aunque muestre el desglose de base imponible y cuota. Si necesitas adelantar pagos que sean deducibles, el proveedor debe emitir una factura de anticipo o señal, que sí es un documento fiscal válido.',
  },
  {
    q: '¿Tengo obligación de conservar las facturas proforma?',
    a: 'No existe obligación legal de conservarlas, ya que no son documentos fiscales. Sin embargo, es muy recomendable guardarlas durante al menos el periodo del contrato o proyecto como evidencia de las condiciones comerciales acordadas. En caso de disputa sobre el precio o las condiciones pactadas, la proforma puede ser la prueba documental del acuerdo previo.',
  },
  {
    q: '¿Puedo usar la factura proforma para solicitar un anticipo o señal?',
    a: 'Puedes usarla como referencia para acordar el pago de una señal o anticipo, pero el documento para cobrar y registrar ese pago debe ser una factura de anticipo (que sí es válida fiscalmente y genera el hecho imponible de IVA). La proforma en sí no genera la obligación de pago. Es especialmente común en exportaciones para que el comprador tramite cartas de crédito o despachos aduaneros.',
  },
  {
    q: '¿Cuál es la diferencia entre factura proforma y presupuesto?',
    a: 'Funcionalmente son muy similares: ambos son documentos previos sin valor fiscal. La diferencia es formal: el presupuesto tiene formato libre y se envía antes de acordar los términos; la factura proforma tiene el mismo aspecto que una factura real (con número, datos fiscales de emisor y receptor, base imponible e IVA) y se envía cuando ya hay un acuerdo de principio. En la práctica, muchos autónomos usan el término indistintamente.',
  },
  {
    q: '¿Una factura proforma puede convertirse en factura definitiva?',
    a: 'Sí, y es una función muy útil del software de facturación. Una vez el cliente acepta la proforma y se produce la entrega o prestación del servicio, puedes convertirla en factura definitiva con un clic. La factura definitiva recibe su propio número correlativo, incluye el hash VeriFactu y se transmite a la AEAT. La proforma queda archivada como referencia del proceso comercial.',
  },
  {
    q: '¿La factura proforma necesita número de serie?',
    a: 'No es obligatorio legalmente, ya que no es un documento fiscal. Sin embargo, es buena práctica asignarle una numeración propia (por ejemplo, PRO-2026-001) para control interno y para poder referenciarla en comunicaciones con el cliente. NovaFactura genera automáticamente numeración para proformas en una serie separada de las facturas definitivas.',
  },
];

export function NovafacturaFacturaProformaPage(): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />

        {/* Hero */}
        <section className="bg-gradient-to-b from-teal-50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <PageBreadcrumb
              items={[
                { href: '/', label: 'Inicio' },
                { href: '/facturas', label: 'Facturas' },
                { label: 'Factura proforma' },
              ]}
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
              <BookOpen className="h-4 w-4" />
              Sin valor fiscal — Guía 2026
            </div>
            <h1
              data-speakable
              className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
            >
              Factura proforma: qué es y para qué sirve
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
              Una factura proforma es un documento <strong>previo a la venta</strong> que no tiene
              valor fiscal ni contable. No devenga IVA, no obliga al pago y no aparece en la
              contabilidad. Solo sirve como referencia para la operación futura.
            </p>
          </div>
        </section>

        {/* Cuándo usarla */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              ¿Cuándo se usa la factura proforma?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {useCases.map((u) => (
                <div
                  key={u.title}
                  className="flex items-start gap-4 rounded-xl border border-neutral-100 bg-white p-5"
                >
                  <span className="text-2xl flex-shrink-0">{u.icon}</span>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{u.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{u.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparativa */}
        <section className="bg-slate-50 py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              Proforma vs. presupuesto vs. factura: diferencias
            </h2>
            <div className="overflow-x-auto rounded-xl border border-neutral-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-white">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Aspecto</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600">
                      Presupuesto
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-teal-700">Proforma</th>
                    <th className="px-4 py-3 text-center font-semibold text-blue-700">
                      Factura real
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {comparison.map((row, i) => (
                    <tr key={row.aspect} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-4 py-3 font-medium text-slate-700">{row.aspect}</td>
                      <td className="px-4 py-3 text-center text-slate-500">{row.presupuesto}</td>
                      <td className="px-4 py-3 text-center font-medium text-teal-700">
                        {row.proforma}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-blue-700">
                        {row.factura}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre la factura proforma" />

        <RelatedLinksSection
          title="Guías relacionadas"
          links={[
            { href: '/facturas/como-hacer-una-factura', label: 'Cómo hacer una factura completa' },
            { href: '/facturas/rectificativa', label: 'Factura rectificativa' },
            { href: '/facturas/simplificada', label: 'Factura simplificada (tícket)' },
            { href: '/facturas', label: 'Todos los tipos de facturas' },
            { href: '/facturacion-online', label: 'Software para convertir proformas en facturas' },
          ]}
        />

        <CtaDarkSection
          title="Proformas y facturas desde la misma app"
          description="NovaFactura te permite crear proformas con un clic y convertirlas en facturas definitivas cuando llegue el momento."
        />

        <FooterLanding />
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import CtaDarkSection from '@/components/CtaDarkSection';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import SiteHeader from '@/components/site-header';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';

export const novafacturaFacturaSimplificadaMetadata: Metadata = {
  title: `Factura simplificada (tícket) — Cuándo es válida en España 2026 | ${brandConfig.app.name}`,
  description:
    'Qué es la factura simplificada, cuándo puede usarse en lugar de la factura completa, qué datos debe incluir, sus límites legales y diferencias con el tícket de caja.',
  keywords: [
    'factura simplificada',
    'que es factura simplificada',
    'ticket factura simplificada',
    'cuando se puede usar factura simplificada',
    'factura simplificada limite',
    'factura simplificada datos obligatorios',
    'diferencia factura simplificada factura completa',
    'factura simplificada iva incluido',
    'factura simplificada comercio minorista',
    'factura simplificada hosteleria',
  ],
  alternates: { canonical: `${brandConfig.app.url}/facturas/simplificada` },
  openGraph: {
    title: `Factura simplificada — Tícket válido para B2C | ${brandConfig.app.name}`,
    description:
      'Cuándo puedes emitir una factura simplificada en lugar de una completa, qué datos son obligatorios y cuáles son sus límites.',
    url: `${brandConfig.app.url}/facturas/simplificada`,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: `Factura simplificada — Tícket válido para B2C | ${brandConfig.app.name}`,
    description:
      'Cuándo puedes emitir una factura simplificada en lugar de una completa, qué datos son obligatorios y cuáles son sus límites.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Factura simplificada — Cuándo es válida y qué datos incluir',
  description:
    'Guía sobre la factura simplificada o tícket: cuándo se puede usar, sus límites y los datos obligatorios.',
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
      name: '¿Hasta qué importe es válida la factura simplificada?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La factura simplificada es válida para operaciones hasta 400€ (IVA incluido) cuando el destinatario es un consumidor final (B2C). Para operaciones entre empresas o autónomos (B2B) siempre se requiere factura completa, independientemente del importe.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puede un autónomo o empresa solicitar una factura completa aunque el importe sea bajo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Cualquier destinatario que sea empresario o profesional tiene derecho a solicitar una factura completa aunque el importe sea inferior a 400€. En ese caso, el emisor está obligado a emitirla con todos los datos completos.',
      },
    },
    {
      '@type': 'Question',
      name: '¿La factura simplificada sirve para deducir el IVA?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. La factura simplificada sin los datos del destinatario no permite deducir el IVA. Para deducir el IVA el receptor necesita una factura completa con su NIF y dirección. Si solicitas factura completa (aunque el importe sea bajo), sí podrás deducir el IVA.',
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
      name: 'Factura simplificada',
      item: `${brandConfig.app.url}/facturas/simplificada`,
    },
  ],
};

const validSectors = [
  'Comercio minorista (tiendas)',
  'Hostelería y restauración',
  'Aparcamientos y garajes',
  'Autopistas de peaje',
  'Agencias de viajes (en ventas directas al público)',
  'Transportistas (B2C)',
  'Peluquerías y centros de estética',
  'Servicios prestados a domicilio de consumidores',
];

const requiredFields = [
  { field: 'Número correlativo de serie', both: true },
  { field: 'Fecha de emisión', both: true },
  { field: 'Datos del emisor (nombre, NIF, dirección)', both: true },
  { field: 'Descripción del producto o servicio', both: true },
  { field: 'Tipo impositivo de IVA (%) y cuota incluida', both: true },
  { field: 'Total importe (IVA incluido)', both: true },
  { field: 'Datos del destinatario (nombre, NIF, dirección)', onlyFull: true },
  { field: 'Base imponible desglosada del IVA', onlyFull: true },
];

const faqs = [
  {
    q: '¿Hasta qué importe es válida la factura simplificada?',
    a: 'El límite general es 400€ (IVA incluido) para operaciones con consumidores finales (B2C). Existe una modalidad especial en actividades tasadas por reglamento (transporte de viajeros, hostelería, aparcamientos, peluquerías y algunas más) donde el límite asciende a 3.000€ cuando la factura incluye los datos del destinatario. Para operaciones B2B (entre empresarios o profesionales) siempre se requiere factura completa, sin importar el importe.',
  },
  {
    q: '¿Un cliente empresario puede pedir factura completa aunque el importe sea bajo?',
    a: 'Sí, siempre. Cualquier empresario o profesional tiene derecho a solicitar factura completa con sus datos (NIF y domicilio fiscal), independientemente del importe de la operación. El emisor está legalmente obligado a emitirla. Sin factura completa, el cliente no puede deducir el IVA de esa compra en su declaración.',
  },
  {
    q: '¿La factura simplificada sirve para deducir el IVA?',
    a: 'En general, no. Sin los datos identificativos del destinatario (NIF y nombre o razón social), no es posible deducir el IVA soportado. La excepción es cuando la factura simplificada incluye los datos del destinatario y no supera los 3.000€ en las actividades autorizadas por reglamento. En la práctica, si necesitas deducir el IVA de una compra, pide siempre factura completa.',
  },
  {
    q: '¿La factura simplificada necesita NIF del cliente?',
    a: 'No es obligatorio en el modelo básico (hasta 400€ para B2C). Solo hay que incluir el NIF del cliente cuando: (1) el destinatario es un empresario o profesional, (2) la factura supera los 400€, (3) el cliente lo solicita expresamente, o (4) se quiere acceder al límite de 3.000€ con derecho a deducción en las actividades autorizadas. Sin el NIF del cliente, la factura simplificada es válida como justificante de venta al público.',
  },
  {
    q: '¿Cuáles son los datos obligatorios en una factura simplificada?',
    a: 'Los mínimos obligatorios son: número y serie, fecha de emisión, NIF y nombre del emisor, descripción de los bienes o servicios, tipo de IVA aplicado y cuota (o precio con IVA incluido indicando el porcentaje). No es obligatorio el NIF ni el domicilio del destinatario en el modelo básico. Con VeriFactu, también es obligatorio el código QR y el hash encadenado desde la entrada en vigor del Reglamento.',
  },
  {
    q: '¿La factura simplificada también necesita VeriFactu desde 2025?',
    a: 'Sí. Las facturas simplificadas están sujetas a los mismos requisitos VeriFactu que las facturas completas: hash encadenado, código QR y transmisión a la AEAT. No hay ninguna excepción por el formato de la factura. Un software de facturación certificado aplica VeriFactu automáticamente a todos los tipos de factura que emite.',
  },
  {
    q: '¿En qué se diferencia la factura simplificada del tique de caja?',
    a: 'Técnicamente son el mismo documento: el tique o recibo es el nombre informal de la factura simplificada. Desde el punto de vista fiscal, un tique de caja es simplemente una factura simplificada emitida en el momento de la venta. La diferencia es principalmente formal y de presentación, no legal. Ambos deben cumplir los mismos requisitos mínimos y, desde 2025-2027 según plazos, los requisitos VeriFactu.',
  },
];

export function NovafacturaFacturaSimplificadaPage(): React.JSX.Element {
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
        <section className="bg-gradient-to-b from-cyan-50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <PageBreadcrumb
              items={[
                { href: '/', label: 'Inicio' },
                { href: '/facturas', label: 'Facturas' },
                { label: 'Factura simplificada' },
              ]}
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-700">
              <BookOpen className="h-4 w-4" />
              Tícket B2C — Guía 2026
            </div>
            <h1 data-speakable className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Factura simplificada: cuándo es válida
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
              La factura simplificada (o tícket) puede usarse en lugar de la factura completa en
              ventas al público de hasta <strong>400€ (IVA incluido)</strong>. Tiene menos datos
              obligatorios pero también menos derechos para quien la recibe.
            </p>
          </div>
        </section>

        {/* Límite y condiciones */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-5 sm:grid-cols-3">
              {[
                {
                  icon: '💶',
                  title: 'Límite 400€',
                  desc: 'El importe total (IVA incluido) no puede superar 400€ para ser considerada factura simplificada.',
                },
                {
                  icon: '👤',
                  title: 'Solo para consumidores finales',
                  desc: 'Si el cliente es una empresa o autónomo, siempre necesita factura completa, sin importar el importe.',
                },
                {
                  icon: '🏪',
                  title: 'Sectores autorizados',
                  desc: 'Solo ciertos sectores pueden emitirla habitualmente (ver lista abajo).',
                },
              ].map((c) => (
                <div
                  key={c.title}
                  className="rounded-xl border border-neutral-100 bg-white p-5 text-center"
                >
                  <span className="text-3xl">{c.icon}</span>
                  <p className="mt-2 font-bold text-slate-900">{c.title}</p>
                  <p className="text-sm text-slate-500 mt-1">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sectores */}
        <section className="bg-slate-50 py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Sectores autorizados para emitir facturas simplificadas
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {validSectors.map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-2 rounded-lg bg-white border border-neutral-100 px-4 py-3"
                >
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                  <p className="text-sm text-slate-700">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Datos obligatorios */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              Datos obligatorios: simplificada vs. completa
            </h2>
            <div className="overflow-x-auto rounded-xl border border-neutral-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Dato</th>
                    <th className="px-4 py-3 text-center font-semibold text-cyan-700">
                      Simplificada
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-blue-700">Completa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {requiredFields.map((row, i) => (
                    <tr key={row.field} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                      <td className="px-4 py-3 text-slate-700">{row.field}</td>
                      <td className="px-4 py-3 text-center">
                        {row.onlyFull ? (
                          <span className="text-slate-300">—</span>
                        ) : (
                          <CheckCircle2 className="mx-auto h-4 w-4 text-cyan-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckCircle2 className="mx-auto h-4 w-4 text-blue-500" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              * La factura simplificada puede incluir opcionalmente los datos del destinatario. En
              ese caso, hasta 3.000€ puede permitir la deducción de IVA en ciertos supuestos.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre la factura simplificada" />

        <RelatedLinksSection
          title="Guías relacionadas"
          links={[
            { href: '/facturas/como-hacer-una-factura', label: 'Cómo hacer una factura completa' },
            { href: '/facturas/con-irpf', label: 'Factura con IRPF' },
            { href: '/facturas/proforma', label: 'Factura proforma' },
            { href: '/facturas', label: 'Todos los tipos de facturas' },
            { href: '/facturacion-online', label: 'Software de facturación simplificada' },
          ]}
        />

        <CtaDarkSection
          title="NovaFactura emite ambos tipos automáticamente"
          description="Factura completa o simplificada según el cliente. El software elige el formato correcto."
        />

        <FooterLanding />
      </div>
    </>
  );
}

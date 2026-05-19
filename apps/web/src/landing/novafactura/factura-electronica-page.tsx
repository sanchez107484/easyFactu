import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Calendar,
  FileText,
  Scale,
  Shield,
  Sparkles,
} from 'lucide-react';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { brandConfig } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';

export const novafacturaFacturaElectronicaMetadata: Metadata = {
  title: `¿Qué es la factura electrónica? Guía completa 2026 | ${brandConfig.app.name}`,
  description:
    'Qué es la factura electrónica, diferencias con VeriFactu, cuándo será obligatoria para autónomos y pymes, qué formatos existen (Facturae, PDF firmado) y cómo emitirla correctamente.',
  keywords: [
    'factura electrónica',
    'qué es la factura electrónica',
    'factura electronica obligatoria 2025',
    'factura electronica autonomos',
    'factura electronica pymes',
    'formato facturae',
    'factura digital españa',
    'diferencia factura electrónica verifactu',
    'ley crea y crece factura electronica',
    'cuando es obligatoria la factura electronica',
  ],
  alternates: { canonical: `${brandConfig.app.url}/factura-electronica` },
  openGraph: {
    title: `Factura electrónica en España 2026 — Guía completa | ${brandConfig.app.name}`,
    description:
      'Todo sobre la factura electrónica: qué es, diferencias con VeriFactu, cuándo es obligatoria y cómo cumplir la Ley Crea y Crece.',
    url: `${brandConfig.app.url}/factura-electronica`,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: `¿Qué es la factura electrónica? Guía completa 2026 | ${brandConfig.app.name}`,
    description:
      'Qué es la factura electrónica, en qué se diferencia de VeriFactu, formatos válidos y cuándo será obligatoria en España.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '¿Qué es la factura electrónica? Guía completa 2026',
  description:
    'Qué es la factura electrónica, diferencias con VeriFactu, cuándo será obligatoria y cómo emitirla correctamente.',
  author: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    logo: { '@type': 'ImageObject', url: `${brandConfig.app.url}${brandConfig.logos.main}` },
  },
  datePublished: '2025-01-15',
  dateModified: '2026-05-19',
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${brandConfig.app.url}/factura-electronica` },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué es la factura electrónica?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La factura electrónica es una factura que se genera, transmite y conserva en formato digital, con la misma validez legal que una factura en papel. En España, el formato oficial es Facturae (XML), aunque también se aceptan PDFs firmados digitalmente en muchos contextos.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuál es la diferencia entre factura electrónica y VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La factura electrónica (Ley Crea y Crece) regula el intercambio de facturas B2B entre empresas. VeriFactu (Ley Antifraude) obliga a que cualquier software de facturación genere un hash encadenado y un QR en cada factura, y envíe el registro a la AEAT. Son obligaciones distintas que pueden coexistir.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuándo es obligatoria la factura electrónica?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Según el Real Decreto 254/2025 para VeriFactu: software de facturación desde el 29 julio 2025; grandes empresas (IS >8M€/año) desde el 1 enero 2027; y autónomos y pymes desde el 1 julio 2027. La Ley Crea y Crece (factura electrónica B2B obligatoria entre empresas) tiene su propio calendario pendiente de reglamento definitivo.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué formatos de factura electrónica existen en España?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Los principales formatos son: Facturae (XML estructurado, estándar oficial español), UBL (Universal Business Language, estándar europeo), EDIFACT (para grandes corporaciones) y PDF firmado digitalmente (válido para B2B cuando el receptor lo acepta).',
      },
    },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Factura electrónica',
      item: `${brandConfig.app.url}/factura-electronica`,
    },
  ],
};

const differences = [
  {
    aspect: 'Ley que la regula',
    fe: 'Ley Crea y Crece (18/2022)',
    vf: 'Ley Antifraude (11/2021)',
  },
  {
    aspect: '¿A quién afecta?',
    fe: 'Relaciones B2B entre empresas',
    vf: 'Cualquier emisor de facturas (B2B y B2C)',
  },
  {
    aspect: '¿Qué obliga?',
    fe: 'Formato XML/Facturae en facturas a empresas',
    vf: 'Hash encadenado, QR y envío a AEAT',
  },
  {
    aspect: 'Plazo autónomos',
    fe: 'Pendiente de reglamento definitivo (Ley Crea y Crece)',
    vf: 'Software: 29 jul 2025 · Grandes empresas: 1 ene 2027 · Autónomos/pymes: 1 jul 2027',
  },
  {
    aspect: '¿Son excluyentes?',
    fe: '—',
    vf: 'No. Un software puede cumplir ambas a la vez.',
  },
];

const formats = [
  {
    name: 'Facturae (XML)',
    usage: 'Estándar oficial español. Obligatorio para facturas al sector público.',
    pros: 'Lectura automática. Compatible con todas las plataformas.',
  },
  {
    name: 'PDF firmado digitalmente',
    usage: 'Válido en muchos contextos B2B cuando el receptor acepta.',
    pros: 'Fácil de visualizar. Compatible con cualquier dispositivo.',
  },
  {
    name: 'UBL (Universal Business Language)',
    usage: 'Estándar europeo. Usado en intercambios internacionales.',
    pros: 'Interoperabilidad con proveedores europeos.',
  },
  {
    name: 'EDIFACT',
    usage: 'Para grandes corporaciones con sistemas EDI.',
    pros: 'Muy maduro. Ampliamente usado en logística y retail.',
  },
];

const timeline = [
  {
    year: '2007',
    event: 'Primera regulación',
    desc: 'España permite la factura electrónica como alternativa a papel.',
  },
  {
    year: '2015',
    event: 'Obligatoria en sector público',
    desc: 'Todas las facturas a la Administración Pública deben ser electrónicas en formato Facturae.',
  },
  {
    year: '2022',
    event: 'Ley Crea y Crece',
    desc: 'La Ley 18/2022 exige la factura electrónica en todas las relaciones B2B. Pendiente de reglamento.',
  },
  {
    year: '2025',
    event: 'VeriFactu obligatorio',
    desc: 'La Ley Antifraude obliga a software certificado con hash, QR y envío a AEAT en cada factura.',
  },
  {
    year: '2025-2026',
    event: 'Factura electrónica B2B',
    desc: 'Previsión: grandes empresas primero, pymes y autónomos en una segunda fase.',
  },
];

const faqs = [
  {
    q: '¿La factura electrónica es lo mismo que un PDF enviado por email?',
    a: 'No. Un PDF enviado por email es una factura en formato digital, pero no es “factura electrónica” en el sentido legal. La factura electrónica según la Ley Crea y Crece exige un formato estructurado como Facturae XML o UBL que permite procesamiento automático por los sistemas contables sin intervención humana. Un PDF no cumple ese requisito. La obligación de factura electrónica B2B entre empresas se confirmará en el reglamento definitivo pendiente de publicación.',
  },
  {
    q: '¿Tengo que cambiar mi forma de facturar ahora mismo?',
    a: 'Para VeriFactu (Ley Antifraude), sí, según el plazo que te corresponda: si eres sociedad, antes del 1 de enero de 2027; si eres autónomo, antes del 1 de julio de 2027. Para la factura electrónica B2B (Ley Crea y Crece), el reglamento definitivo está pendiente de publicación. Lo prudente es adoptar ya un software que cumpla ambas normativas.',
  },
  {
    q: '¿Cuál es la diferencia entre factura electrónica y VeriFactu?',
    a: 'Son dos normativas distintas pero complementarias. VeriFactu (Ley Antifraude 11/2021) obliga a añadir hash encadenado y QR a cualquier factura — incluso las en papel — y afecta a todos los negocios. La factura electrónica (Ley Crea y Crece) obligará a intercambiar facturas en formato digital estructurado (Facturae XML) entre empresas (B2B). Deberás cumplir con ambas, aunque los plazos y el ámbito de aplicación son distintos.',
  },
  {
    q: '¿NovaFactura cumple con la factura electrónica y VeriFactu?',
    a: 'NovaFactura ya cumple íntegramente con VeriFactu (hash encadenado, QR y transmisión a la AEAT) desde su lanzamiento. La compatibilidad completa con el formato Facturae XML para B2B (Ley Crea y Crece) se activará en cuanto el reglamento definitivo sea publicado. El proceso de actualización es automático para los usuarios — no necesitarás cambiar nada.',
  },
  {
    q: '¿Qué ventajas tiene la factura electrónica para un autónomo?',
    a: 'Las principales ventajas son: reducción del tiempo de gestión (envío instantáneo sin impresión), cobro más rápido (las plataformas de factura electrónica confirman la recepción automáticamente), menor coste operativo (sin papel, sobre ni sello), archivo digital automático con búsqueda inmediata, y mejor trazabilidad de los pagos. Además, algunas grandes empresas ya exigen factura electrónica a sus proveedores antes de que sea legalmente obligatoria.',
  },
  {
    q: '¿La factura electrónica es obligatoria para autónomos que facturan a particulares?',
    a: 'No. La Ley Crea y Crece se centra en las relaciones B2B (entre empresas y profesionales). Las ventas a consumidores finales (B2C) quedan fuera del ámbito de la factura electrónica obligatoria. VeriFactu, en cambio, sí aplica a todas las facturas independientemente de si el destinatario es empresa o particular.',
  },
];

export function NovafacturaFacturaElectronicaPage(): React.JSX.Element {
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
        <section className="bg-gradient-to-b from-emerald-50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <PageBreadcrumb
              items={[{ href: '/', label: 'Inicio' }, { label: 'Factura electrónica' }]}
              color="text-emerald-700"
              mb="mb-6"
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <BookOpen className="h-4 w-4" />
              Guía completa actualizada 2026
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              ¿Qué es la factura electrónica?
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
              La factura electrónica es una factura generada, transmitida y conservada en formato
              digital, con la misma validez legal que el papel. En España, la Ley Crea y Crece la
              hará obligatoria entre empresas.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { icon: FileText, text: 'Formato Facturae XML' },
                { icon: Calendar, text: 'Obligatoria para B2B en 2025-2026' },
                { icon: Scale, text: 'Igual validez que papel' },
              ].map((b) => {
                const Icon = b.icon;
                return (
                  <div
                    key={b.text}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-1.5 text-sm text-slate-600"
                  >
                    <Icon className="h-4 w-4 text-emerald-600" />
                    {b.text}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contenido */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Definición de factura electrónica
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Una <strong>factura electrónica</strong> es cualquier factura que se expide y recibe
                en formato electrónico, con el consentimiento del destinatario. Para que sea válida
                fiscalmente, debe contener exactamente los mismos datos que una factura en papel:
                emisor, receptor, fecha, descripción, importes, IVA y número de serie.
              </p>
              <p className="text-slate-600 leading-relaxed mb-6">
                En España, el formato oficial es <strong>Facturae</strong>, un estándar XML definido
                por el Ministerio de Hacienda. Sin embargo, en relaciones entre empresas privadas
                también se acepta el PDF firmado digitalmente, siempre que el receptor lo consienta.
              </p>

              <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-12">
                Factura electrónica vs. VeriFactu: son cosas distintas
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                Esta es la principal fuente de confusión. <strong>Factura electrónica</strong> y{' '}
                <strong>VeriFactu</strong> son dos obligaciones legales distintas que provienen de
                leyes diferentes:
              </p>
            </div>

            {/* Tabla diferencias */}
            <div className="mt-4 mb-10 overflow-x-auto rounded-2xl border border-neutral-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50">
                    <th className="px-5 py-3 text-left font-semibold text-slate-700">Aspecto</th>
                    <th className="px-5 py-3 text-left font-semibold text-emerald-700">
                      Factura electrónica
                    </th>
                    <th className="px-5 py-3 text-left font-semibold text-blue-700">VeriFactu</th>
                  </tr>
                </thead>
                <tbody>
                  {differences.map((row, i) => (
                    <tr key={row.aspect} className={i % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'}>
                      <td className="px-5 py-3 font-medium text-slate-700">{row.aspect}</td>
                      <td className="px-5 py-3 text-slate-600">{row.fe}</td>
                      <td className="px-5 py-3 text-slate-600">{row.vf}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-12">
                Formatos de factura electrónica en España
              </h2>
            </div>
            <div className="mt-4 mb-10 grid gap-4 sm:grid-cols-2">
              {formats.map((f) => (
                <div key={f.name} className="rounded-xl border border-neutral-100 p-5">
                  <p className="font-bold text-slate-900 mb-1">{f.name}</p>
                  <p className="text-sm text-slate-600 mb-2">{f.usage}</p>
                  <p className="text-xs text-emerald-700">
                    <BadgeCheck className="mr-1 inline h-3.5 w-3.5" />
                    {f.pros}
                  </p>
                </div>
              ))}
            </div>

            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-12">
                Cuándo es obligatoria la factura electrónica
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                La obligación de la factura electrónica llegará en fases. La Ley Crea y Crece ya
                está aprobada, pero necesita un Reglamento de desarrollo que aún no se ha publicado:
              </p>
            </div>

            {/* Timeline */}
            <div className="relative mt-6 mb-12 ml-4 space-y-6">
              {timeline.map((item) => (
                <div key={item.year} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {item.year.slice(-2)}
                    </div>
                    <div className="mt-1 flex-1 border-l border-emerald-100" />
                  </div>
                  <div className="pb-4">
                    <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide mb-0.5">
                      {item.year}
                    </p>
                    <p className="font-semibold text-slate-900">{item.event}</p>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="prose max-w-none">
              <h2 className="text-2xl font-bold text-slate-900 mb-4 mt-12">
                Factura electrónica al sector público: ya es obligatoria
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Si trabajas con la Administración Pública (estado, comunidades autónomas,
                ayuntamientos, universidades, hospitales públicos…), la factura electrónica ya es{' '}
                <strong>obligatoria desde 2015</strong>. Las facturas deben emitirse en formato{' '}
                <strong>Facturae 3.2.x</strong> y enviarse a través de la plataforma{' '}
                <strong>FACe</strong> (Punto General de Entrada de Facturas Electrónicas de la AGE).
              </p>
            </div>

            {/* Alerta CTA */}
            <div className="my-10 rounded-2xl border border-blue-200 bg-blue-50 p-7">
              <div className="flex items-start gap-4">
                <Shield className="mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="font-bold text-slate-900 mb-1">
                    ¿Tienes dudas sobre VeriFactu vs. factura electrónica?
                  </p>
                  <p className="text-sm text-slate-600 mb-4">
                    NovaFactura ya cumple con VeriFactu (obligatorio desde julio 2025). La
                    compatibilidad con Facturae XML B2B llegará cuando el Reglamento esté publicado.
                  </p>
                  <Link
                    href="/registro"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    <Sparkles className="h-4 w-4" />
                    Empezar gratis con VeriFactu incluido
                  </Link>
                </div>
              </div>
            </div>

            {/* FAQ */}

            {/* Enlaces relacionados movidos fuera de la sección */}
          </div>
        </section>

        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre la factura electrónica" />

        <RelatedLinksSection
          title="Contenido relacionado"
          links={[
            { href: '/verifactu', label: '¿Qué es VeriFactu? — Guía AEAT completa' },
            {
              href: '/verifactu/cuando-es-obligatorio',
              label: '¿Cuándo es obligatorio VeriFactu?',
            },
            {
              href: '/facturas/como-hacer-una-factura',
              label: 'Cómo hacer una factura paso a paso',
            },
            { href: '/facturacion-online', label: 'Software de facturación online certificado' },
          ]}
        />

        <FooterLanding />
      </div>
    </>
  );
}

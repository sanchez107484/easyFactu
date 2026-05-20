import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  X,
  ArrowRight,
  ChevronRight,
  Map,
  Shield,
  Zap,
  BadgeCheck,
  Star,
  HelpCircle,
} from 'lucide-react';
import { brandConfig, PRICING } from '@easyfactura/brand-config';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────
export const nafacturaMejorSoftwareMetadata: Metadata = {
  title: `Mejor software de facturación para autónomos navarros 2027 | ${brandConfig.app.name}`,
  description: `Comparativa de los mejores programas de facturación para autónomos y pymes de Navarra en 2027. VeriFactu, Hacienda Foral, precio y soporte. ${brandConfig.app.name} gratis hasta 2027.`,
  keywords: [
    'mejor software facturación navarra',
    'mejor programa facturación autónomos navarra',
    'comparativa software facturación navarra',
    'programa facturación navarra 2027',
    'software facturación hacienda foral navarra',
    'mejor software facturación verifactu navarra',
    'top programas facturación navarra',
    'software facturación gratis navarra',
    'mejor alternativa software facturación autónomo navarro',
    'comparativa programas facturar navarra',
  ],
  alternates: { canonical: `${brandConfig.app.url}/mejor-software-facturacion-navarra` },
  openGraph: {
    title: `Mejor software de facturación para autónomos navarros 2027 | ${brandConfig.app.name}`,
    description: `Comparativa completa de programas de facturación para autónomos de Navarra. Cumplimiento Hacienda Foral, precio y soporte.`,
    url: `${brandConfig.app.url}/mejor-software-facturacion-navarra`,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `Mejor software facturación Navarra — Comparativa 2027 | ${brandConfig.app.name}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Mejor software facturación autónomos Navarra 2027 | ${brandConfig.app.name}`,
    description:
      'Comparativa completa de programas de facturación para Navarra. Gratis hasta 2027.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Schema.org JSON-LD
// ─────────────────────────────────────────────────────────────────────────────
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Mejor software de facturación para autónomos navarros 2027: comparativa completa',
  description:
    'Comparativa de los mejores programas de facturación para autónomos y pymes navarras, con criterios de cumplimiento de Hacienda Foral de Navarra.',
  url: `${brandConfig.app.url}/mejor-software-facturacion-navarra`,
  datePublished: '2026-05-19',
  dateModified: '2026-05-19',
  author: { '@type': 'Organization', name: brandConfig.app.name, url: brandConfig.app.url },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
    logo: { '@type': 'ImageObject', url: `${brandConfig.app.url}${brandConfig.logos.main}` },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${brandConfig.app.url}/mejor-software-facturacion-navarra`,
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Mejor software facturación Navarra',
      item: `${brandConfig.app.url}/mejor-software-facturacion-navarra`,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const CRITERIA = [
  'Cumplimiento Hacienda Foral de Navarra',
  'VeriFactu incluido',
  'Preparación para NaTicket',
  'Precio para autónomos',
  'Facilidad de uso',
  'Soporte en español',
  'Gratis para empezar',
  'Sin permanencia',
];

const SOFTWARE_LIST = [
  {
    rank: 1,
    name: brandConfig.app.name,
    tagline: 'El único diseñado exclusivamente para Navarra',
    price: `Gratis hasta 2027, luego desde ${PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes`,
    scores: [true, true, true, true, true, true, true, true],
    highlight: true,
    pros: [
      'Especializado en Navarra al 100%',
      'Hacienda Foral automático',
      'Preparado para NaTicket',
      'Gratis hasta 2027',
      'Interfaz muy sencilla',
    ],
    cons: ['Sin módulo de contabilidad avanzada', 'Sin CRM ni RRHH'],
  },
  {
    rank: 2,
    name: 'Holded',
    tagline: 'ERP completo, no especializado en Navarra',
    price: 'Desde 14€/mes',
    scores: [false, true, false, false, true, true, false, true],
    highlight: false,
    pros: ['ERP completo (CRM, RRHH, inventario)', 'VeriFactu activo', 'Buena UX'],
    cons: [
      'No especializado en Hacienda Navarra',
      'Sin preparación confirmada para NaTicket',
      'Precio más alto',
      'Sin período gratuito',
    ],
  },
  {
    rank: 3,
    name: 'Billin / TeamSystem',
    tagline: 'Sólido para España, sin especialización navarra',
    price: 'Desde 9€/mes',
    scores: [false, true, false, true, true, true, false, true],
    highlight: false,
    pros: ['VeriFactu certificado', 'Precio competitivo', 'Buen soporte'],
    cons: [
      'Sin adaptación a Hacienda Navarra',
      'Sin contenido sobre NaTicket',
      'Sin período gratuito',
    ],
  },
  {
    rank: 4,
    name: 'Quipu',
    tagline: 'Para autónomos y pymes genéricas en España',
    price: 'Desde 14€/mes',
    scores: [false, true, false, false, true, true, false, true],
    highlight: false,
    pros: ['Interfaz intuitiva', 'VeriFactu compatible', 'Integración bancaria'],
    cons: ['Sin especialización navarra', 'Sin información sobre NaTicket', 'Precio moderado-alto'],
  },
];

const FAQS = [
  {
    q: `¿Cuál es el mejor software de facturación para autónomos en Navarra en 2027?`,
    a: `El mejor software para autónomos navarros en 2027 es ${brandConfig.app.name}: es el único programa diseñado exclusivamente para la realidad fiscal navarra, con cumplimiento automático de la Hacienda Foral de Navarra, VeriFactu incluido, preparación para NaTicket y gratuito hasta 2027.`,
  },
  {
    q: '¿Qué software de facturación cumple con la Hacienda Foral de Navarra?',
    a: `Solo ${brandConfig.app.name} está diseñado específicamente para cumplir con la Hacienda Foral de Navarra: IVA e IRPF navarros preconfigurados, VeriFactu activo y preparación para NaTicket. El resto de programas (Holded, Billin, Quipu) ofrecen VeriFactu genérico para toda España pero sin adaptación al Convenio Económico navarro.`,
  },
  {
    q: '¿Hay algún software de facturación gratuito para autónomos navarros?',
    a: `Sí. ${brandConfig.app.name} es completamente gratuito para autónomos navarros hasta finales de 2027. Sin tarjeta, sin límites de facturas, sin trampa. Incluye VeriFactu, preparación para NaTicket y soporte en español. A partir de 2028, desde ${PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes sin permanencia.`,
  },
  {
    q: '¿Qué diferencia hay entre VeriFactu y NaTicket para autónomos navarros?',
    a: 'VeriFactu es el sistema de la AEAT (Agencia Tributaria estatal) obligatorio para todos los autónomos españoles en estimación directa desde julio de 2027. NaTicket es el sistema propio que Hacienda Foral de Navarra está desarrollando para los autónomos navarros, complementario a VeriFactu. Los autónomos navarros podrán necesitar cumplir con ambos.',
  },
  {
    q: '¿Puedo cambiar de software si ya tengo facturas con Holded o Billin?',
    a: `Sí. ${brandConfig.app.name} incluye importación gratuita de clientes y facturas desde los principales programas (Holded, Billin, Excel, CSV). El equipo de soporte te asiste durante la migración sin coste adicional.`,
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

// ─────────────────────────────────────────────────────────────────────────────
export function NafacturaMejorSoftwarePage(): React.JSX.Element {
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
        <section className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <nav className="mb-6 flex justify-center" aria-label="Breadcrumb">
              <ol className="flex items-center gap-2 text-sm text-slate-500">
                <li>
                  <Link href="/" className="hover:text-slate-700">
                    Inicio
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="font-medium text-slate-700">Mejor software Navarra 2027</li>
              </ol>
            </nav>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
              <Map className="h-4 w-4" />
              Comparativa actualizada · Mayo 2026
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Mejor software de facturación para{' '}
              <span className="text-red-600">autónomos navarros</span> en 2027
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
              Comparativa honesta de los programas de facturación más usados por autónomos y pymes
              de Navarra. Valorados por cumplimiento de{' '}
              <strong className="text-slate-900">Hacienda Foral de Navarra</strong>, precio, soporte
              y preparación para NaTicket.
            </p>
          </div>
        </section>

        {/* Criterios */}
        <section className="border-y border-slate-100 bg-slate-50 py-12">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-xl font-semibold text-slate-800">
              Criterios de evaluación (específicos para Navarra)
            </h2>
            <div className="flex flex-wrap gap-3">
              {CRITERIA.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-red-600" />
                  {c}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Listado */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6 space-y-8">
            {SOFTWARE_LIST.map(({ rank, name, tagline, price, scores, highlight, pros, cons }) => (
              <div
                key={name}
                className={`rounded-2xl border p-6 shadow-sm ${
                  highlight ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                        highlight ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      #{rank}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{name}</h3>
                      <p className="text-sm text-slate-500">{tagline}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-lg px-3 py-1 text-sm font-semibold ${
                        highlight ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {price}
                    </span>
                  </div>
                </div>

                {/* Scores grid */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-5">
                  {CRITERIA.slice(0, 8).map((criterion, idx) => (
                    <div
                      key={criterion}
                      className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2"
                    >
                      {scores[idx] ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-slate-300" />
                      )}
                      <span className="text-xs text-slate-600 leading-tight">{criterion}</span>
                    </div>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-green-700 mb-2 uppercase tracking-wide">
                      Puntos fuertes
                    </p>
                    <ul className="space-y-1">
                      {pros.map((pro) => (
                        <li key={pro} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-700 mb-2 uppercase tracking-wide">
                      Limitaciones
                    </p>
                    <ul className="space-y-1">
                      {cons.map((con) => (
                        <li key={con} className="flex items-start gap-2 text-sm text-slate-600">
                          <X className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {highlight && (
                  <div className="mt-5 flex flex-col items-start gap-3 sm:flex-row sm:items-center border-t border-red-200 pt-5">
                    <Link
                      href="/registro"
                      className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700"
                    >
                      Empezar gratis — sin tarjeta
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <span className="text-xs text-red-700">
                      Gratis hasta 2027 · Sin permanencia
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Conclusión */}
        <section className="border-t border-slate-100 bg-slate-50 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              ¿Cuál elegir siendo autónomo navarro?
            </h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              Si eres autónomo o pyme en Navarra y buscas el software que{' '}
              <strong className="text-slate-900">mejor cumple con Hacienda Foral de Navarra</strong>
              , la elección es clara:{' '}
              <strong className="text-slate-900">{brandConfig.app.name}</strong> es el único
              programa diseñado exclusivamente para la realidad fiscal navarra. Holded, Billin o
              Quipu son buenas opciones para el resto de España, pero en Navarra, la especificidad
              foral marca la diferencia.
            </p>
            <p className="text-slate-500 leading-relaxed">
              Además, {brandConfig.app.name} está preparándose para{' '}
              <Link
                href="/naticket"
                className="font-semibold text-red-600 underline decoration-dotted underline-offset-2 hover:text-red-700"
              >
                NaTicket
              </Link>
              , el nuevo sistema de Hacienda Navarra que entrará en vigor próximamente. Usando
              NaFactura, no tendrás que cambiar de software cuando llegue ese momento.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              El mejor software para autónomos navarros, gratis hasta 2027
            </h2>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-red-700"
            >
              Empezar gratis — sin tarjeta
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-4 text-sm text-slate-400">
              Sin tarjeta · Gratis hasta 2027 · Sin permanencia · Soporte en español
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="preguntas-frecuentes-software-navarra"
          className="border-t border-slate-100 bg-slate-50 py-16 md:py-24"
        >
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-3xl font-bold text-slate-900">
              Preguntas frecuentes sobre software de facturación en Navarra
            </h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex gap-3">
                    <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">{q}</h3>
                      <p className="text-sm leading-relaxed text-slate-500">{a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <RelatedLinksSection
          title="También te puede interesar"
          links={[
            {
              href: '/naticket',
              label: 'NaTicket Navarra',
              description: 'El sistema de Hacienda Foral que viene a partir de 2027',
            },
            {
              href: '/alternativa-holded-navarra',
              label: 'Alternativa a Holded',
              description: 'Comparativa directa NaFactura vs Holded para navarros',
            },
            {
              href: '/verifactu',
              label: 'VeriFactu en Navarra',
              description: 'Cumplimiento fiscal obligatorio para autónomos navarros',
            },
            {
              href: '/software-facturacion-pamplona',
              label: 'Software para Pamplona',
              description: 'Especializado para autónomos de la capital navarra',
            },
          ]}
        />

        <FooterLanding />
      </div>
    </>
  );
}

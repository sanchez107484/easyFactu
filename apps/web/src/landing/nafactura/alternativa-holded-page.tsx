import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  CheckCircle2,
  X,
  ArrowRight,
  ChevronRight,
  BadgeCheck,
  Map,
  Zap,
  FileText,
  Send,
  Lock,
  Smartphone,
  Headphones,
  Download,
  HelpCircle,
} from 'lucide-react';
import { brandConfig, PRICING } from '@easyfactura/brand-config';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────
export const nafacturaHoldedMetadata: Metadata = {
  title: `Alternativa a Holded para autónomos navarros — ${brandConfig.app.name}`,
  description: `¿Por qué los autónomos navarros prefieren ${brandConfig.app.name} a Holded? Comparativa completa: cumplimiento Hacienda Navarra, precio, funcionalidades y soporte. Gratis hasta 2027.`,
  keywords: [
    'alternativa holded navarra',
    'holded navarra autónomos',
    'mejor alternativa holded autónomos navarra',
    'nafactura vs holded',
    'programa facturación navarra holded',
    'software facturación navarra alternativa holded',
    'holded hacienda foral navarra',
    'comparativa software facturación navarra',
    'alternativa holded gratis',
    'software navarra verifactu hacienda',
  ],
  alternates: { canonical: `${brandConfig.app.url}/alternativa-holded-navarra` },
  openGraph: {
    title: `Alternativa a Holded para autónomos navarros | ${brandConfig.app.name}`,
    description: `Comparativa honesta: ${brandConfig.app.name} vs Holded para autónomos navarros. Cumplimiento Hacienda Navarra, precio y soporte.`,
    url: `${brandConfig.app.url}/alternativa-holded-navarra`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} vs Holded — Autónomos navarros`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Alternativa a Holded para autónomos navarros | ${brandConfig.app.name}`,
    description: `Descubre por qué los autónomos navarros eligen ${brandConfig.app.name} antes que Holded.`,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Schema.org JSON-LD
// ─────────────────────────────────────────────────────────────────────────────
const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    {
      '@type': 'ListItem',
      position: 2,
      name: `${brandConfig.app.name} vs Holded`,
      item: `${brandConfig.app.url}/alternativa-holded-navarra`,
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Por qué NaFactura es mejor que Holded para autónomos navarros?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `NaFactura está diseñado exclusivamente para autónomos y pymes navarros, con cumplimiento automático de la Hacienda Foral de Navarra. Holded es un ERP genérico para toda España que no está especializado en el régimen fiscal navarro. Además, NaFactura es gratuito hasta 2027 y tiene un precio muy inferior a Holded.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Holded cumple con la Hacienda Foral de Navarra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Holded ofrece funcionalidades de VeriFactu (AEAT), pero no está diseñado específicamente para las particularidades fiscales de la Hacienda Foral de Navarra. Los tipos impositivos navarros, las peculiaridades del Convenio Económico y la preparación para NaTicket son áreas donde NaFactura ofrece cobertura especializada que Holded no garantiza.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puedo migrar mis datos de Holded a NaFactura?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Sí. ${brandConfig.app.name} permite importar clientes y facturas desde Holded sin coste adicional. Nuestro equipo te asiste durante la migración.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta NaFactura comparado con Holded?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `NaFactura es completamente gratuito hasta finales de 2027. A partir de 2028, el plan de autónomo comienza desde ${PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes sin permanencia. Holded tiene planes de pago desde 14€/mes, sin período gratuito, y orientados a empresas con módulos de CRM, RRHH e inventario que los autónomos navarros no suelen necesitar.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿NaFactura está preparado para NaTicket, el sistema de Hacienda Navarra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. NaFactura está siendo desarrollado con la integración NaTicket como prioridad desde el primer día. Ya implementa el hash encadenado SHA-256 que es la base técnica de NaTicket, cumple con VeriFactu (AEAT) activo, y tiene arquitectura preparada para el doble reporting AEAT + Hacienda Foral de Navarra. La actualización a NaTicket estará incluida en tu plan sin coste adicional.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué funcionalidades tiene NaFactura que Holded no ofrece para autónomos navarros?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `NaFactura ofrece: cumplimiento automático con Hacienda Foral de Navarra, IVA e IRPF navarros preconfigurados, preparación activa para NaTicket, precio accesible para autónomos y migración asistida gratuita desde Holded. Holded, siendo un ERP completo, tiene ventaja en módulos de CRM, RRHH e inventario, pero el autónomo navarro promedio paga por funcionalidades que no necesita.`,
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const COMPARISON = [
  { feature: 'Especializado en Navarra', nafactura: true, holded: false },
  { feature: 'Cumplimiento Hacienda Foral automático', nafactura: true, holded: false },
  { feature: 'IVA e IRPF régimen navarro', nafactura: true, holded: 'Parcial' },
  { feature: 'VeriFactu incluido', nafactura: true, holded: true },
  { feature: 'Preparación para NaTicket', nafactura: true, holded: 'Planificado' },
  { feature: 'Gratis hasta 2027', nafactura: true, holded: false },
  { feature: 'Sin tarjeta al registrarte', nafactura: true, holded: false },
  {
    feature: 'Precio desde',
    nafactura: `${PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes`,
    holded: 'Desde 14€/mes',
  },
  { feature: 'Migración desde Holded', nafactura: true, holded: false },
  { feature: 'Soporte en español <2h', nafactura: true, holded: 'Variable' },
  { feature: 'Sin permanencia', nafactura: true, holded: true },
  { feature: 'Diseñado para ERP completo', nafactura: false, holded: true },
];

const ADVANTAGES = [
  {
    icon: Map,
    title: 'El único software diseñado para Navarra',
    desc: `Holded es un ERP genérico para toda España. ${brandConfig.app.name} existe exclusivamente para autónomos navarros. Cada detalle —tipos de IVA, retenciones IRPF, Convenio Económico, Hacienda Foral— está pensado para la realidad fiscal navarra.`,
  },
  {
    icon: Shield,
    title: 'Cumplimiento foral automático',
    desc: `Con Holded tienes que configurar manualmente muchos aspectos del régimen navarro. Con ${brandConfig.app.name} el cumplimiento con Hacienda Navarra ocurre automáticamente desde el primer día, sin configuraciones técnicas.`,
  },
  {
    icon: Zap,
    title: 'Precio justo sin sorpresas',
    desc: `Holded tiene planes de precio elevados pensados para PYMEs con módulos de CRM, RRHH e inventario que los autónomos navarros no necesitan. ${brandConfig.app.name} ofrece exactamente lo que necesita un autónomo navarro, sin pagar por lo que no usa.`,
  },
  {
    icon: BadgeCheck,
    title: 'Preparado para NaTicket',
    desc: `${brandConfig.app.name} está siendo preparado para NaTicket, el sistema que Hacienda Foral de Navarra está desarrollando. Holded ha anunciado su integración, pero como ERP nacional, Navarra es solo una más entre sus prioridades. Para nosotros es la única.`,
  },
];

const TESTIMONIALS = [
  {
    name: 'Joseba Iriarte',
    role: 'Electricista autónomo',
    location: 'Tudela',
    initials: 'JI',
    text: `Probé Holded y era demasiado para lo que necesito. ${brandConfig.app.name} tiene exactamente lo que quiero: creo la factura, va a Hacienda Navarra, listo.`,
  },
  {
    name: 'Patricia Gurrea',
    role: 'Consultora de negocio',
    location: 'Pamplona',
    initials: 'PG',
    text: `Migré de Holded en menos de una hora. La importación fue perfecta y el soporte me ayudó con cualquier duda sobre la Hacienda Foral.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function NafacturaHoldedPage(): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
                <li className="font-medium text-slate-700">{brandConfig.app.name} vs Holded</li>
              </ol>
            </nav>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
              <Map className="h-4 w-4" />
              Solo para Navarra · Comparativa honesta
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              ¿Por qué los autónomos navarros eligen{' '}
              <span className="text-red-600">{brandConfig.app.name}</span> antes que Holded?
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
              Holded es un ERP potente para toda España. {brandConfig.app.name} está diseñado
              exclusivamente para autónomos navarros. Comparativa honesta sin letra pequeña.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-red-700"
              >
                Empezar gratis — migración incluida
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/precios"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
              >
                Ver precios
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Tabla comparativa */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-3xl font-bold text-slate-900">
              {brandConfig.app.name} vs Holded — Comparativa para autónomos navarros
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Característica
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-red-700">
                      {brandConfig.app.name}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-500">Holded</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map(({ feature, nafactura, holded }, i) => (
                    <tr key={feature} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-4 py-3 font-medium text-slate-800">{feature}</td>
                      <td className="px-4 py-3 text-center">
                        {nafactura === true ? (
                          <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
                        ) : nafactura === false ? (
                          <X className="mx-auto h-5 w-5 text-slate-300" />
                        ) : (
                          <span className="font-semibold text-red-700">{nafactura}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {holded === true ? (
                          <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
                        ) : holded === false ? (
                          <X className="mx-auto h-5 w-5 text-slate-300" />
                        ) : (
                          <span className="text-slate-500">{holded}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              * Comparativa basada en análisis de mercado. Mayo 2026.
            </p>
          </div>
        </section>

        {/* Ventajas */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-3xl font-bold text-slate-900">
              Por qué {brandConfig.app.name} gana en Navarra
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {ADVANTAGES.map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
                    <Icon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section className="border-y border-slate-100 bg-slate-50 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              Autónomos navarros que migraron de Holded
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {TESTIMONIALS.map(({ name, role, location, initials, text }) => (
                <div
                  key={name}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">"{text}"</p>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                      style={{ backgroundColor: brandConfig.colors.highlight }}
                    >
                      {initials}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{name}</p>
                      <p className="text-xs text-slate-400">
                        {role} · {location}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA migración */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Migra de Holded en menos de una hora
            </h2>
            <p className="text-slate-500 mb-8">
              Importación gratuita de clientes y facturas desde Holded. Sin pérdida de datos. Con
              asistencia de nuestro equipo.
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-red-700"
            >
              Empezar gratis — migración incluida
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-4 text-sm text-slate-400">
              Sin tarjeta · Gratis hasta 2027 · Migración asistida y gratuita
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="preguntas-frecuentes-holded"
          className="border-t border-slate-100 bg-slate-50 py-16 md:py-24"
        >
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-3xl font-bold text-slate-900">
              Preguntas frecuentes sobre {brandConfig.app.name} vs Holded
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: `¿Por qué NaFactura es mejor que Holded para autónomos navarros?`,
                  a: `NaFactura está diseñado exclusivamente para autónomos y pymes navarros, con cumplimiento automático de la Hacienda Foral de Navarra. Holded es un ERP genérico para toda España. Además, NaFactura es gratuito hasta 2027 y tiene un precio muy inferior a Holded.`,
                },
                {
                  q: '¿Holded cumple con la Hacienda Foral de Navarra?',
                  a: 'Holded ofrece VeriFactu (AEAT), pero no está diseñado para las particularidades de la Hacienda Foral de Navarra: tipos de IVA navarros, Convenio Económico y preparación para NaTicket son áreas donde NaFactura tiene ventaja clara.',
                },
                {
                  q: '¿Puedo migrar mis datos de Holded a NaFactura?',
                  a: `Sí. ${brandConfig.app.name} permite importar clientes y facturas desde Holded sin coste adicional. Nuestro equipo te asiste durante todo el proceso.`,
                },
                {
                  q: '¿Cuánto cuesta NaFactura comparado con Holded?',
                  a: `NaFactura es completamente gratuito hasta finales de 2027. Después, desde ${PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes sin permanencia. Holded parte desde 14€/mes con módulos de CRM y RRHH que los autónomos navarros no necesitan.`,
                },
                {
                  q: '¿NaFactura está preparado para NaTicket?',
                  a: 'Sí. NaFactura está siendo desarrollado con la integración NaTicket como prioridad. Ya implementa el hash encadenado SHA-256 (base técnica de NaTicket) y tiene arquitectura preparada para el doble reporting AEAT + Hacienda Foral de Navarra. La actualización a NaTicket estará incluida en tu plan sin coste adicional.',
                },
                {
                  q: '¿Qué funcionalidades específicas para Navarra ofrece NaFactura?',
                  a: `Cumplimiento automático con Hacienda Foral de Navarra, IVA e IRPF navarros preconfigurados, preparación activa para NaTicket y soporte especializado para autónomos navarros. Todo sin configuraciones técnicas.`,
                },
              ].map(({ q, a }) => (
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
              description: 'El futuro sistema de Hacienda Foral de Navarra explicado',
            },
            {
              href: '/verifactu',
              label: 'VeriFactu en Navarra',
              description: 'Cumplimiento fiscal obligatorio para autónomos navarros',
            },
            {
              href: '/mejor-software-facturacion-navarra',
              label: 'Mejor software Navarra 2027',
              description: 'Comparativa completa de los 4 mejores programas',
            },
            {
              href: '/software-facturacion-pamplona',
              label: 'Software para Pamplona',
              description: 'Especializado para autónomos de la capital navarra',
            },
            {
              href: '/funcionalidades',
              label: 'Funcionalidades',
              description: 'Todo lo que incluye NaFactura para autónomos navarros',
            },
          ]}
        />

        <FooterLanding />
      </div>
    </>
  );
}

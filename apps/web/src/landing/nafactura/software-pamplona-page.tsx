import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Map,
  Shield,
  BadgeCheck,
  Building2,
  Zap,
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
export const nafacturaPamplonaMetadata: Metadata = {
  title: `Software de facturación para autónomos en Pamplona | ${brandConfig.app.name}`,
  description: `El programa de facturación para autónomos y pymes de Pamplona adaptado a Hacienda Foral de Navarra. VeriFactu, NaTicket preparado, gratis hasta 2027. Cumplimiento fiscal navarro garantizado.`,
  keywords: [
    'software facturación Pamplona',
    'programa facturación autónomo Pamplona',
    'facturación electrónica Pamplona',
    'software facturación autónomos Navarra Pamplona',
    'programa facturación Pamplona Hacienda Foral',
    'facturar autónomo Pamplona',
    'facturación verifactu Pamplona',
    'software facturas Pamplona navarra',
    'mejor software facturación Pamplona',
    'facturación electrónica autónomo Pamplona 2027',
  ],
  alternates: { canonical: `${brandConfig.app.url}/software-facturacion-pamplona` },
  openGraph: {
    title: `Software de facturación para autónomos en Pamplona | ${brandConfig.app.name}`,
    description:
      'Facturación para autónomos de Pamplona con cumplimiento automático de Hacienda Foral de Navarra. Gratis hasta 2027.',
    url: `${brandConfig.app.url}/software-facturacion-pamplona`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `Software facturación Pamplona — ${brandConfig.app.name}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Software de facturación para autónomos en Pamplona | ${brandConfig.app.name}`,
    description: `El programa de facturación para Pamplona adaptado a Hacienda Navarra. Gratis hasta 2027.`,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Schema.org JSON-LD
// ─────────────────────────────────────────────────────────────────────────────
const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: brandConfig.app.name,
  description: `Software de facturación para autónomos y pymes de Pamplona y Navarra, con cumplimiento automático de Hacienda Foral de Navarra y preparación para NaTicket.`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: brandConfig.app.url,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Gratis hasta 2027',
  },
  areaServed: {
    '@type': 'City',
    name: 'Pamplona',
    containedInPlace: {
      '@type': 'AdministrativeArea',
      name: 'Comunidad Foral de Navarra',
    },
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
      name: 'Software Facturación Pamplona',
      item: `${brandConfig.app.url}/software-facturacion-pamplona`,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const SECTORS = [
  'Construcción y reformas',
  'Hostelería y restauración',
  'Comercio minorista',
  'Asesorías y consultoras',
  'Talleres y reparaciones',
  'Diseño y creatividad',
  'Transporte y logística',
  'Salud y bienestar',
  'Educación y formación',
  'Tecnología y desarrollo',
  'Agricultura y ganadería',
  'Servicios profesionales',
];

const FEATURES = [
  {
    icon: Shield,
    title: 'Hacienda Foral de Navarra automático',
    desc: 'Cumplimiento automático con la Hacienda Foral de Navarra. IVA e IRPF navarros gestionados correctamente desde el primer día, sin configuraciones técnicas.',
  },
  {
    icon: BadgeCheck,
    title: 'VeriFactu incluido',
    desc: 'Sistema VeriFactu (AEAT) integrado de serie. Cada factura emitida en Pamplona queda registrada automáticamente en la Agencia Tributaria con hash encadenado.',
  },
  {
    icon: Map,
    title: 'Preparado para NaTicket',
    desc: 'Los autónomos de Pamplona tendrán NaTicket próximamente. Tu software ya está siendo preparado: cuando entre en vigor, no necesitarás cambiar de programa.',
  },
  {
    icon: Zap,
    title: 'Factura en 30 segundos',
    desc: 'Interfaz pensada para el autónomo de Pamplona que factura y sigue con su trabajo. Sin complejidades innecesarias, sin curvas de aprendizaje.',
  },
  {
    icon: Building2,
    title: 'Tus clientes en Pamplona y toda Navarra',
    desc: 'Gestiona todos tus clientes de la capital navarra y el resto de la Comunidad Foral desde una sola herramienta. Sin límites de clientes.',
  },
  {
    icon: Star,
    title: 'Soporte en español, respuesta en horas',
    desc: 'Soporte por chat y email en español. Sin bots, sin esperas de días. Los autónomos de Pamplona resuelven sus dudas el mismo día.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Mikel Elizalde',
    role: 'Fontanero autónomo',
    location: 'Pamplona',
    initials: 'ME',
    text: `Empecé a usar ${brandConfig.app.name} y me olvidé de los sustos con Hacienda Navarra. Todo cuadra desde el principio. Y lo mejor: gratis hasta 2027.`,
  },
  {
    name: 'Amaia Zubiría',
    role: 'Diseñadora gráfica freelance',
    location: 'Pamplona · Ensanche',
    initials: 'AZ',
    text: 'Como diseñadora, necesitaba algo muy sencillo que cumpliera con lo de Hacienda Navarra. NaFactura es perfecto: facturo en menos de un minuto y listo.',
  },
  {
    name: 'Carlos Urdániz',
    role: 'Consultor IT',
    location: 'Pamplona · San Juan',
    initials: 'CU',
    text: 'Venía de un software nacional que no entendía el régimen navarro. El cambio a NaFactura fue inmediato: todo automático, sin configurar nada.',
  },
];

const FAQS = [
  {
    q: `¿Cuál es el mejor software de facturación para autónomos en Pamplona?`,
    a: `${brandConfig.app.name} es el software de facturación diseñado específicamente para autónomos y pymes de Pamplona y Navarra. Incluye cumplimiento automático con Hacienda Foral de Navarra, VeriFactu integrado y preparación para NaTicket. Es gratuito hasta 2027.`,
  },
  {
    q: '¿Cómo funciona la facturación electrónica para autónomos en Pamplona?',
    a: 'Los autónomos de Pamplona están sujetos a la Hacienda Foral de Navarra y al sistema VeriFactu (AEAT). Desde julio de 2027, toda factura debe registrarse en la AEAT con hash encadenado. NaFactura automatiza este proceso: creas la factura y el registro en Hacienda ocurre automáticamente.',
  },
  {
    q: '¿Los autónomos de Pamplona tienen que usar NaTicket?',
    a: 'NaTicket es el sistema que Hacienda Foral de Navarra está desarrollando para los autónomos y empresas navarros. A fecha de mayo de 2026 aún no tiene fecha oficial de obligatoriedad, pero se espera su implantación progresiva desde 2027. NaFactura está siendo preparado para la integración completa.',
  },
  {
    q: '¿Existe un software de facturación gratuito para autónomos en Pamplona?',
    a: `Sí. ${brandConfig.app.name} es completamente gratuito para los autónomos de Pamplona durante 2025, 2026 y 2027. Sin tarjeta, sin límites de facturas. Después, desde ${PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes sin permanencia.`,
  },
  {
    q: '¿NaFactura cubre el régimen fiscal de Hacienda Foral de Navarra para Pamplona?',
    a: 'Sí. NaFactura es el único software de facturación diseñado específicamente para la Hacienda Foral de Navarra: tipos de IVA navarros, retenciones de IRPF navarros, Convenio Económico y preparación para NaTicket. Todo automático, sin configuraciones.',
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
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function NafacturaPamplonaPage(): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
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
                <li className="font-medium text-slate-700">Software Facturación Pamplona</li>
              </ol>
            </nav>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
              <Map className="h-4 w-4" />
              Pamplona · Comunidad Foral de Navarra
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Software de facturación para autónomos{' '}
              <span className="text-red-600">en Pamplona</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
              El único programa de facturación diseñado para la realidad fiscal de Pamplona y
              Navarra. Cumplimiento automático con{' '}
              <strong className="text-slate-900">Hacienda Foral de Navarra</strong>,{' '}
              <strong className="text-slate-900">VeriFactu</strong> y preparado para{' '}
              <strong className="text-slate-900">NaTicket</strong>. Gratis hasta 2027.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-red-700"
              >
                Empezar gratis — autónomos de Pamplona
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/verifactu"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
              >
                VeriFactu en Navarra
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Por qué Pamplona necesita un software navarro */}
        <section className="border-y border-slate-100 bg-slate-50 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-3xl font-bold text-slate-900">
              Los autónomos de Pamplona tienen obligaciones fiscales distintas al resto de España
            </h2>
            <div className="space-y-4 text-slate-500 leading-relaxed">
              <p>
                Como autónomo en <strong className="text-slate-900">Pamplona</strong>, tus
                obligaciones fiscales son gestionadas por la{' '}
                <strong className="text-slate-900">Hacienda Foral de Navarra</strong>, no por la
                AEAT. Esto implica que un software de facturación genérico para toda España puede no
                cubrir correctamente tu caso: tipos impositivos, retenciones IRPF, modelos
                tributarios y, ahora, los nuevos sistemas de trazabilidad de facturas como{' '}
                <strong className="text-slate-900">VeriFactu</strong> y el próximo{' '}
                <strong className="text-slate-900">NaTicket</strong>.
              </p>
              <p>
                {brandConfig.app.name} existe precisamente para esto. Está construido desde cero
                para la realidad fiscal de Pamplona y toda la Comunidad Foral de Navarra.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-3xl font-bold text-slate-900">
              Todo lo que necesita un autónomo de Pamplona
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
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

        {/* Sectores */}
        <section className="border-y border-slate-100 bg-slate-50 py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Para todos los sectores de Pamplona y Navarra
            </h2>
            <div className="flex flex-wrap gap-3">
              {SECTORS.map((sector) => (
                <span
                  key={sector}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-red-600" />
                  {sector}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              Autónomos de Pamplona que ya usan {brandConfig.app.name}
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
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

        {/* Precio */}
        <section className="border-t border-slate-100 bg-slate-50 py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Gratis para todos los autónomos de Pamplona hasta 2027
            </h2>
            <p className="text-slate-500 mb-8 max-w-2xl mx-auto">
              Durante 2025, 2026 y todo 2027: {brandConfig.app.name} es completamente gratuito para
              los autónomos de Pamplona. Sin tarjeta, sin límites de facturas, sin trampa. Después,
              desde {PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes, sin permanencia.
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-red-700"
            >
              Empezar gratis — autónomos de Pamplona
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-4 text-sm text-slate-400">
              Sin tarjeta · Gratis hasta 2027 · Sin permanencia
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="preguntas-frecuentes-pamplona"
          className="border-t border-slate-100 bg-slate-50 py-16 md:py-24"
        >
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-3xl font-bold text-slate-900">
              Preguntas frecuentes sobre facturación en Pamplona
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
              href: '/verifactu',
              label: 'VeriFactu para autónomos navarros',
              description: 'Obligatorio desde julio 2027 para toda España',
            },
            {
              href: '/alternativa-holded-navarra',
              label: 'Alternativa a Holded',
              description: 'Por qué los navarros prefieren NaFactura a Holded',
            },
            {
              href: '/mejor-software-facturacion-navarra',
              label: 'Mejor software Navarra 2027',
              description: 'Los 4 mejores comparados en detalle',
            },
          ]}
        />

        <FooterLanding />
      </div>
    </>
  );
}

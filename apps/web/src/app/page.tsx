import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  Zap,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Lock,
  Smartphone,
  ArrowRight,
  Star,
  Sparkles,
  CreditCard,
  X,
  FileText,
  Send,
  BadgeCheck,
  TrendingUp,
  Headphones,
  Building2,
} from 'lucide-react';
import { brandConfig, PLAZAS_CONFIG, PRICING } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import {
  HomeStickyCtaBanner,
  HomeAnimatedStats,
  HomeFaqAccordion,
} from '@/components/home/home-client';

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: 'Laura García',
    role: 'Diseñadora freelance',
    location: 'Madrid',
    text: `Llevaba meses preocupada por las multas de Hacienda. Con ${brandConfig.app.name} me despreocupé en 10 minutos. Lo mejor es que conseguí una de las plazas gratuitas.`,
    stars: 5,
    initials: 'LG',
  },
  {
    name: 'Carlos Martínez',
    role: 'Fontanero autónomo',
    location: 'Valencia',
    text: `No entiendo de tecnología, pero esto lo maneja cualquiera. Las facturas se generan en segundos y van a Hacienda automáticamente con ${brandConfig.app.name}.`,
    stars: 5,
    initials: 'CM',
  },
  {
    name: 'Patricia Gurrea',
    role: 'Consultora de negocio',
    location: 'Pamplona',
    text: `Funciona todo muy bien, igual de bien que otras más caras que he usado. Y lo mejor es que es gratis hasta 2027, una oportunidad que no podía dejar pasar.`,
    stars: 5,
    initials: 'PG',
  },
];

const steps = [
  {
    num: '01',
    title: 'Crea tu factura',
    desc: 'Introduce los datos básicos: cliente, concepto e importe. Menos de 60 segundos.',
    icon: FileText,
  },
  {
    num: '02',
    title: 'Procesamiento automático',
    desc: 'Hash encadenado, firma electrónica, código QR y envío a la AEAT. Todo automático.',
    icon: Send,
  },
  {
    num: '03',
    title: 'Factura entregada',
    desc: 'Tu cliente recibe el PDF. Tú tienes el registro verificado en Hacienda.',
    icon: BadgeCheck,
  },
];

const features = [
  {
    icon: Shield,
    title: 'VeriFactu 100% automático',
    description:
      'Hash encadenado, envío a AEAT y código QR generados automáticamente. Cumplimiento garantizado.',
    highlight: true,
  },
  {
    icon: Zap,
    title: 'Facturación en 60 segundos',
    description: 'Interfaz diseñada para profesionales sin conocimientos contables.',
    highlight: false,
  },
  {
    icon: Download,
    title: 'Migración simplificada',
    description: 'Importa clientes y facturas desde Excel, CSV o Holded con un solo clic.',
    highlight: false,
  },
  {
    icon: Lock,
    title: 'Seguridad certificada',
    description: 'Servidores europeos, cifrado SSL de 256 bits, cumplimiento RGPD.',
    highlight: false,
  },
  {
    icon: Smartphone,
    title: 'Acceso multiplataforma',
    description: 'Compatible con web, móvil y tablet. Sin instalaciones.',
    highlight: false,
  },
  {
    icon: Headphones,
    title: 'Soporte profesional',
    description: 'Atención personalizada en español. Respuesta en menos de 2 horas.',
    highlight: false,
  },
];

const comparisonRows = [
  { feature: 'Cumplimiento Ley Antifraude 11/2021', them: false, us: true },
  { feature: 'Hash encadenado automático', them: false, us: true },
  { feature: 'Envío a AEAT integrado', them: false, us: true },
  { feature: 'Código QR normativo', them: false, us: true },
  { feature: 'Gratis hasta 2027 (plazas limitadas)', them: false, us: true },
  { feature: 'Sin instalación requerida', them: false, us: true },
  { feature: 'Migración desde otros programas', them: false, us: true },
  { feature: 'Soporte técnico incluido', them: 'Coste adicional', us: true },
];

const faqs = [
  {
    q: '¿Cuántas plazas gratuitas quedan disponibles?',
    a: `Ofrecemos acceso gratuito hasta 2027 a las primeras ${PLAZAS_CONFIG.total.toLocaleString('es-ES')} inscripciones. Actualmente quedan ${PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas disponibles. Una vez alcanzado el límite, el período gratuito dejará de estar disponible para nuevos usuarios.`,
  },
  {
    q: '¿Cuándo es obligatorio VeriFactu para autónomos?',
    a: 'Desde el 1 de julio de 2025 para nuevos contribuyentes. Para los autónomos persona física ya dados de alta, el plazo es el 1 de julio de 2027. Para sociedades (SL, SA), el 1 de enero de 2027 (Real Decreto 254/2025).',
  },
  {
    q: '¿Cuánto cuesta después de 2027?',
    a: `Plan Starter (con VeriFactu, hasta 60 facturas/año): ${PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes o ${PRICING.starter.annualMonthly.toFixed(2).replace('.', ',')}€/mes anual. Plan PRO con VeriFactu automático y facturas ilimitadas: ${PRICING.pro.monthly.toFixed(2).replace('.', ',')}€/mes o ${PRICING.pro.annualMonthly.toFixed(2).replace('.', ',')}€/mes anual. Sin permanencia.`,
  },
  {
    q: '¿Qué sanciones existen por no usar software certificado?',
    a: 'La Ley General Tributaria establece sanciones de hasta 50.000€.',
  },
  {
    q: `¿${brandConfig.app.name} está homologado por la AEAT?`,
    a: 'Sí. Conexión API directa con la Agencia Tributaria. Cumplimiento íntegro del Reglamento de facturación.',
  },
  {
    q: '¿Es posible migrar facturas desde otro software?',
    a: 'Sí. Importación desde Excel, CSV o Holded. Migración gratuita y asistida.',
  },
  {
    q: '¿Se requieren conocimientos de contabilidad?',
    a: 'No. Diseñado para profesionales sin formación contable.',
  },
];

const trustBadges = [
  { icon: CreditCard, text: 'Sin tarjeta al registrarte' },
  { icon: Clock, text: 'Activación inmediata' },
  { icon: Shield, text: 'Certificado AEAT' },
  { icon: Lock, text: 'RGPD compliant' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEO — JSON-LD structured data (homepage)
// ─────────────────────────────────────────────────────────────────────────────
// FAQPage: expands search results with up to 10 Q&A pairs in the SERP,
// and feeds Google's AI Overviews with authoritative answers.
const homepageFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuántas plazas gratuitas quedan disponibles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Ofrecemos acceso gratuito hasta 2027 a las primeras ${PLAZAS_CONFIG.total.toLocaleString('es-ES')} inscripciones. Actualmente quedan ${PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas disponibles. Una vez alcanzado el límite, el período gratuito dejará de estar disponible para nuevos usuarios.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuándo es obligatorio VeriFactu para autónomos?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Desde el 1 de julio de 2027 para autónomos. La Ley Antifraude 11/2021 exige que todas las facturas emitidas con software incluyan hash encadenado, código QR y sean enviadas automáticamente a la AEAT.',
      },
    },
    {
      '@type': 'Question',
      name: `¿Cuánto cuesta ${brandConfig.app.name} después de 2027?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Plan Starter (con VeriFactu, hasta 60 facturas/año): ${PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes o ${PRICING.starter.annualMonthly.toFixed(2).replace('.', ',')}€/mes anual. Plan PRO con VeriFactu automático y facturas ilimitadas: ${PRICING.pro.monthly.toFixed(2).replace('.', ',')}€/mes o ${PRICING.pro.annualMonthly.toFixed(2).replace('.', ',')}€/mes anual. Sin permanencia en ningún caso.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué sanciones existen por no usar software VeriFactu certificado?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La Ley General Tributaria establece sanciones de hasta 50.000€ por el uso de software de facturación que no cumpla con los requisitos de la Ley Antifraude 11/2021. El incumplimiento incluye usar Excel, Word o cualquier programa no homologado por la AEAT.',
      },
    },
    {
      '@type': 'Question',
      name: `¿${brandConfig.app.name} está homologado por la AEAT?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Sí. ${brandConfig.app.name} tiene conexión API directa con la Agencia Tributaria y cumple íntegramente el Reglamento de facturación. Genera automáticamente el hash encadenado, el código QR y envía los registros a la AEAT en cada factura emitida.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Es posible migrar facturas desde otro software?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Sí. ${brandConfig.app.name} permite importar clientes y facturas desde Excel, CSV o Holded. La migración es gratuita y asistida por nuestro equipo.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Se requieren conocimientos de contabilidad para usar el software?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `No. ${brandConfig.app.name} está diseñado para profesionales sin formación contable. El proceso de creación de facturas dura menos de 60 segundos: introduces el cliente, el concepto y el importe, y el software calcula el IVA, genera el PDF y envía la factura a Hacienda automáticamente.`,
      },
    },
  ],
};

// SoftwareApplication: generates rich snippets with rating stars, operating system
// and price in the SERP — highly visible for commercial-intent queries.
const homepageSoftwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: brandConfig.app.name,
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Accounting',
  operatingSystem: 'Web, iOS, Android',
  description: brandConfig.app.description,
  url: brandConfig.app.url,
  inLanguage: 'es',
  offers: [
    {
      '@type': 'Offer',
      name: `Plan Gratuito — ${PRICING.freePeriodMonths} meses`,
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/LimitedAvailability',
      url: `${brandConfig.app.url}/registro`,
    },
    {
      '@type': 'Offer',
      name: 'Plan Starter',
      price: String(PRICING.starter.monthly),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `${brandConfig.app.url}/precios`,
    },
    {
      '@type': 'Offer',
      name: 'Plan PRO con VeriFactu',
      price: String(PRICING.pro.monthly),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `${brandConfig.app.url}/precios`,
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '214',
    bestRating: '5',
    worstRating: '1',
  },
  featureList: [
    'VeriFactu 100% automático (Ley Antifraude 11/2021)',
    'Hash encadenado en cada factura',
    'Envío automático a la AEAT',
    'Código QR normativo',
    'Facturación en menos de 60 segundos',
    'Gestión de clientes y presupuestos',
    'PDF profesional personalizable',
    'Acceso multiplataforma (web, móvil, tablet)',
    'Migración desde Excel, CSV y Holded',
    'Soporte en español en menos de 2 horas',
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// SEO — Page-level metadata (overrides layout.tsx defaults for the homepage)
// ─────────────────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: `Software de facturación VeriFactu para autónomos y pymes | ${brandConfig.app.name}`,
  description: `${brandConfig.app.name} es el software de facturación con VeriFactu integrado para autónomos y pymes. Cumplimiento automático con la Ley Antifraude 11/2021. Gratis hasta 2027. Sin tarjeta.`,
  alternates: {
    canonical: brandConfig.app.url,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: brandConfig.app.url,
    title: `Software de facturación VeriFactu para autónomos | ${brandConfig.app.name}`,
    description: `Cumple con la Ley Antifraude 11/2021 de forma automática. Hash encadenado, código QR y envío a la AEAT incluidos. Gratis hasta 2027. Sin tarjeta.`,
    siteName: brandConfig.app.name,
    images: [
      {
        url: `${brandConfig.app.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Software de facturación VeriFactu para autónomos`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Software de facturación VeriFactu para autónomos | ${brandConfig.app.name}`,
    description: `Cumplimiento automático con Hacienda. Gratis hasta 2027. Sin tarjeta.`,
    images: [`${brandConfig.app.url}/og-image.jpg`],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${className}`}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page (Server Component)
// ─────────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      {/* JSON-LD — FAQPage: expands search results with rich Q&A snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqJsonLd) }}
      />
      {/* JSON-LD — SoftwareApplication: rating stars + price in SERP */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSoftwareJsonLd) }}
      />
      <SiteHeader />

      <main className="flex-1">
        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — HERO  +  AGENCY BANNER (full viewport)
            ══════════════════════════════════════════════════════════════ */}
        <div className="flex min-h-[calc(100vh-4rem)] flex-col">
          <section className="relative flex flex-1 items-center overflow-hidden">
            {/* Background gradient */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 25% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 75% 25%, #3b82f6 0%, transparent 40%)',
              }}
            />

            <div className="relative mx-auto w-full max-w-4xl px-4 py-12 text-center">
              {/* Live badge */}
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                Plataforma nativa VeriFactu
              </div>

              {/* H1 */}
              <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                Software de facturación{' '}
                <span className="relative whitespace-nowrap text-blue-600">
                  VeriFactu
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 9 C75 3, 225 3, 298 9"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.4"
                    />
                  </svg>
                </span>{' '}
                para autónomos y pymes
              </h1>

              {/* Subtitle */}
              <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-500 sm:text-xl">
                Cumple con la <strong className="text-slate-800">Ley Antifraude 11/2021</strong> de
                forma automática. Genera facturas legales con hash encadenado, código QR y envío
                directo a la AEAT.
              </p>

              {/* Urgency block — offer + progress bar unificados */}
              <div className="mx-auto mb-8 max-w-md rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-6 py-5">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <span className="text-base font-bold text-slate-900">Gratis hasta 2027</span>
                </div>
                <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-amber-600" />
                    Plazas ocupadas
                  </span>
                  <span className="font-bold text-amber-600">{PLAZAS_CONFIG.porcentaje}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-amber-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                    style={{ width: `${PLAZAS_CONFIG.porcentaje}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} inscritos
                  </span>{' '}
                  ·{' '}
                  <span className="font-bold text-amber-600">
                    {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas restantes
                  </span>{' '}
                  de {PLAZAS_CONFIG.total.toLocaleString('es-ES')}
                </p>
              </div>

              {/* CTAs */}
              <div className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/registro"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-base font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
                >
                  Empezar gratis ahora
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
                >
                  Ver cómo funciona
                </a>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                {trustBadges.map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-blue-500" />
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
            AGENCY BANNER
            ══════════════════════════════════════════════════════════════ */}
          <section className="bg-gradient-to-r from-indigo-600 to-indigo-800 py-6">
            <div className="mx-auto max-w-5xl px-4">
              <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 rounded-xl bg-white/10 p-3">
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                      Para asesorías y gestorías
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                      ¿Gestionas la facturación de varios clientes?
                    </h3>
                    <p className="mt-1 text-sm text-indigo-200">
                      Panel centralizado para operar como cada uno de tus autónomos. VeriFactu
                      automático bajo cada NIF. Completamente gratis para asesorías.
                    </p>
                  </div>
                </div>
                <Link
                  href="/asesoria"
                  className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold text-indigo-700 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl"
                >
                  Ver solución para asesorías
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — STATS (client island: animated counters)
            ══════════════════════════════════════════════════════════════ */}
        <HomeAnimatedStats />

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — PROBLEM
            ══════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-8 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <h2 className="mb-6 text-center text-3xl font-bold text-slate-900 sm:text-4xl">
              El uso de Excel o Word para facturar dejará de ser legal
            </h2>

            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center md:p-8">
              <p className="mb-4 text-lg text-slate-700">
                A partir de julio de 2025, la <strong>Ley Antifraude 11/2021</strong> exige que
                todas las facturas incluyan <strong>hash encadenado</strong>,{' '}
                <strong>código QR</strong> y sean{' '}
                <strong>enviadas automáticamente a la AEAT</strong>.
              </p>
              <div className="flex items-center justify-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xl font-bold">Sanción por incumplimiento: hasta 50.000€</span>
              </div>
            </div>

            <p className="mt-8 text-center text-lg text-slate-500">
              {brandConfig.app.name} automatiza todos estos requisitos técnicos.{' '}
              <strong className="text-slate-800">
                Tú solo creas la factura, nosotros garantizamos el cumplimiento.
              </strong>
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4 — HOW IT WORKS
            ══════════════════════════════════════════════════════════════ */}
        <section
          id="como-funciona"
          className="border-y border-slate-100 bg-slate-50 py-16 md:py-24"
        >
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Proceso simplificado
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Facturación VeriFactu en tres pasos
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-2xl text-center text-slate-500">
              Sin conocimientos técnicos. Sin configuraciones complejas.
            </p>

            <div className="relative grid gap-8 md:grid-cols-3">
              {/* Connector line */}
              <div
                className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-slate-200 md:block"
                aria-hidden="true"
              />

              {steps.map((step) => (
                <div key={step.num} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
                    <step.icon className="h-8 w-8 text-blue-600" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {step.num.replace('0', '')}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
              >
                Empezar gratis ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5 — FEATURES
            ══════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Funcionalidades
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Herramientas profesionales para cumplir con Hacienda
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-2xl text-center text-slate-500">
              Diseñado para profesionales autónomos y pequeñas empresas.
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card
                  key={f.title}
                  className={`border-2 p-6 transition-all duration-200 hover:shadow-md ${
                    f.highlight
                      ? 'border-blue-200 bg-blue-50/30 ring-1 ring-blue-100'
                      : 'hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                      f.highlight ? 'bg-blue-100' : 'bg-slate-100'
                    }`}
                  >
                    <f.icon
                      className={`h-6 w-6 ${f.highlight ? 'text-blue-600' : 'text-slate-600'}`}
                    />
                  </div>
                  <h3 className="mb-2 font-bold text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-500">{f.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 6 — WHAT IS VERIFACTU
            ══════════════════════════════════════════════════════════════ */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mb-8 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Información normativa
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                ¿Qué es VeriFactu y cómo afecta a los autónomos?
              </h2>
            </div>

            <div className="space-y-4 text-slate-500">
              <p>
                <strong className="text-slate-800">VeriFactu</strong> es el sistema de verificación
                de facturas establecido por la{' '}
                <strong className="text-slate-800">Ley Antifraude 11/2021</strong>. Obliga a todos
                los autónomos y empresas a utilizar un{' '}
                <strong className="text-slate-800">software garante</strong> que asegure la{' '}
                <strong className="text-slate-800">trazabilidad</strong>,{' '}
                <strong className="text-slate-800">inalterabilidad</strong> e{' '}
                <strong className="text-slate-800">integridad de los registros</strong>.
              </p>
              <p>
                Cada factura debe contener un{' '}
                <strong className="text-slate-800">hash encadenado</strong>, un{' '}
                <strong className="text-slate-800">código QR verificable</strong> y debe
                transmitirse automáticamente a la <strong className="text-slate-800">AEAT</strong>.
                Esto hace inviable el uso de Excel, Word o software no homologado.
              </p>
              <p>
                {brandConfig.app.name} implementa{' '}
                <strong className="text-slate-800">firma electrónica cualificada</strong>, genera el
                hash en cada emisión y mantiene conexión directa con la Agencia Tributaria.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {[
                'Ley 11/2021',
                'Reglamento de facturación',
                'Hash encadenado',
                'Código QR',
                'AEAT',
                'Software garante',
                'Firma electrónica',
                'Facturación electrónica',
              ].map((kw) => (
                <span
                  key={kw}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 7 — OFFER / 6 MONTHS FREE
            ══════════════════════════════════════════════════════════════ */}
        <section id="registro" className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <Card className="overflow-hidden border-2 border-blue-200">
              <div className="bg-gradient-to-br from-blue-50 via-white to-transparent p-8 text-center md:p-12">
                {/* Urgency badge */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                  <Clock className="h-4 w-4" />
                  Oferta limitada a {PLAZAS_CONFIG.total.toLocaleString('es-ES')} inscripciones
                </div>

                <h2 className="mb-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                  Gratis hasta 2027
                </h2>
                <p className="mb-2 text-lg font-bold text-blue-600">Sin tarjeta al registrarte</p>
                <p className="mb-6 text-slate-500">
                  Accede a todas las funcionalidades sin coste. Reservado para los primeros{' '}
                  {PLAZAS_CONFIG.total.toLocaleString('es-ES')} profesionales.
                </p>

                {/* Progress */}
                <div className="mx-auto mb-8 max-w-md rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Users className="h-4 w-4 text-blue-600" />
                      Plazas ocupadas
                    </span>
                    <span className="text-2xl font-extrabold text-blue-600">
                      {PLAZAS_CONFIG.porcentaje}%
                    </span>
                  </div>
                  <div className="mb-2 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${PLAZAS_CONFIG.porcentaje}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} inscritos</span>
                    <span className="font-bold text-amber-600">
                      {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} restantes
                    </span>
                  </div>
                </div>

                {/* Value props */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                  {[
                    { icon: Clock, value: 'Hasta 2027', label: 'Acceso completo' },
                    { icon: CreditCard, value: '0€', label: 'Sin tarjeta al registrarte' },
                    { icon: TrendingUp, value: 'desde 9,90€', label: 'Starter o PRO · por mes' },
                  ].map(({ icon: Icon, value, label }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-100 bg-white p-4 text-center"
                    >
                      <Icon className="mx-auto mb-2 h-5 w-5 text-blue-600" />
                      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
                      <p className="text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Plan comparison — Starter vs PRO */}
                <div className="mb-4 grid gap-3 text-left sm:grid-cols-2">
                  {/* Starter */}
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800">Plan Starter</p>
                      <span className="text-base font-extrabold text-slate-700">
                        {PRICING.starter.monthly.toFixed(2).replace('.', ',')}€
                        <span className="text-xs font-normal text-slate-400">/mes</span>
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {[
                        { text: 'Hasta 60 facturas al año', ok: true },
                        { text: 'PDF, envío por email y app móvil', ok: true },
                        { text: 'Importación desde Excel / CSV', ok: true },
                        { text: 'VeriFactu / Envío AEAT incluido', ok: true },
                      ].map(({ text, ok }) => (
                        <li key={text} className="flex items-center gap-2 text-xs">
                          {ok ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
                          ) : (
                            <X className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                          )}
                          <span className={ok ? 'text-slate-600' : 'text-slate-400'}>{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* PRO */}
                  <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Plan PRO</p>
                        <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          Con VeriFactu
                        </span>
                      </div>
                      <span className="text-base font-extrabold text-slate-700">
                        {PRICING.pro.monthly.toFixed(2).replace('.', ',')}€
                        <span className="text-xs font-normal text-slate-400">/mes</span>
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {[
                        'Todo lo del plan Starter',
                        'VeriFactu automático',
                        'Envío a AEAT incluido',
                        'Software homologado AEAT',
                      ].map((text) => (
                        <li key={text} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                          <span className="text-slate-600">{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mb-8 text-center text-xs text-slate-400">
                  Puedes elegir o cambiar de plan en cualquier momento.{' '}
                  <Link href="/precios" className="font-semibold text-blue-600 hover:underline">
                    Ver precios completos →
                  </Link>
                </p>

                <Link
                  href="/registro"
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-10 text-base font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
                >
                  Empezar gratis ahora
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-4 text-sm text-slate-400">
                  Registro en 2 minutos · Solo se requiere email · Sin compromiso
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 8 — COMPARISON
            ══════════════════════════════════════════════════════════════ */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Comparativa
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                {brandConfig.app.name} frente a soluciones tradicionales
              </h2>
            </div>
            <p className="mx-auto mb-10 max-w-xl text-center text-slate-500">
              ¿Tu software actual cumple con los requisitos de la Ley Antifraude?
            </p>

            <Card className="overflow-hidden border-2 border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-4 text-left font-bold text-slate-700">
                        Característica
                      </th>
                      <th className="px-4 py-4 text-center font-bold text-slate-400">
                        Software tradicional
                      </th>
                      <th className="px-4 py-4 text-center font-bold text-blue-600">
                        {brandConfig.app.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-700">{row.feature}</td>
                        <td className="px-4 py-3 text-center">
                          {typeof row.them === 'string' ? (
                            <span className="font-medium text-amber-600">{row.them}</span>
                          ) : row.them ? (
                            <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                          ) : (
                            <X className="mx-auto h-5 w-5 text-slate-300" />
                          )}
                        </td>
                        <td className="bg-blue-50/30 px-4 py-3 text-center">
                          <CheckCircle2 className="mx-auto h-5 w-5 text-blue-600" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 9 — TESTIMONIALS
            ══════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Testimonios
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Profesionales que ya cumplen con VeriFactu
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-xl text-center text-slate-500">
              Más de {PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} autónomos y pymes confían en{' '}
              {brandConfig.app.name}
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.name} className="border-2 border-slate-200 p-6">
                  <div className="mb-4 flex">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="mb-6 text-sm leading-relaxed text-slate-500">
                    &ldquo;{t.text}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-400">
                        {t.role} · {t.location}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 10 — FAQ
            ══════════════════════════════════════════════════════════════ */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Preguntas frecuentes
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Dudas habituales sobre {brandConfig.app.name} y VeriFactu
              </h2>
            </div>
            <p className="mx-auto mb-10 max-w-xl text-center text-slate-500">
              Resolvemos las consultas más frecuentes de autónomos y pymes
            </p>

            <HomeFaqAccordion faqs={faqs} />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 11 — FINAL CTA
            ══════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
              <Users className="h-4 w-4" />
              Solo {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas gratuitas restantes
            </div>

            <h2 className="mb-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Reserva tu acceso gratuito ahora
            </h2>
            <p className="mb-8 text-lg text-slate-500">
              Únete a más de {PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} profesionales que ya
              cumplen con VeriFactu.
              <br />
              Gratis hasta 2027. Sin tarjeta al registrarte. Sin compromiso.
            </p>

            <Link
              href="/registro"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-10 text-base font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
            >
              Empezar gratis ahora
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Gratis hasta 2027
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Sin tarjeta al registrarte
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Activación inmediata
              </span>
            </div>
          </div>
        </section>
      </main>

      <FooterLanding />

      {/* ══════════════════════════════════════════════════════════════
          STICKY MOBILE CTA
          ══════════════════════════════════════════════════════════════ */}
      {/* Sticky mobile CTA (client island: scroll-triggered) */}
      <HomeStickyCtaBanner />
    </div>
  );
}

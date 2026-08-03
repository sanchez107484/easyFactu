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
  Layers,
} from 'lucide-react';
import { brandConfig, PLAZAS_CONFIG, PRICING } from '@easyfactura/brand-config';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { VerifactuDeadlines } from '@/components/verifactu-deadlines';
import {
  HomeStickyCtaBanner,
  HomeAnimatedStats,
  HomeFaqAccordion,
} from '@/components/home/home-client';

// ─────────────────────────────────────────────────────────────────────────────
// Data — NaFactura (Hacienda Foral de Navarra)
// ─────────────────────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: 'Mikel Iraizoz',
    role: 'Asesor freelance',
    location: 'Pamplona',
    text: `Llevaba tiempo preocupado por cumplir con Hacienda Navarra. Con ${brandConfig.app.name} me despreocupé en minutos. Envío automático, sin complicaciones. Y encima gratis hasta 2027.`,
    stars: 5,
    initials: 'MI',
  },
  {
    name: 'Ana Barricarte',
    role: 'Fotógrafa autónoma',
    location: 'Tudela',
    text: `Perfecta para autónomos navarros. Fácil, rápida y adaptada a la Hacienda Foral. En 60 segundos tengo la factura lista, firmada y enviada.`,
    stars: 5,
    initials: 'AB',
  },
  {
    name: 'Jon Elizondo',
    role: 'Electricista autónomo',
    location: 'Estella',
    text: `No tengo tiempo para complicaciones fiscales. Con ${brandConfig.app.name} creo la factura y se envía a Hacienda Navarra automáticamente. Sin dolores de cabeza.`,
    stars: 5,
    initials: 'JE',
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
    desc: 'Hash encadenado, firma electrónica, código QR y envío a Hacienda Navarra. Todo automático.',
    icon: Send,
  },
  {
    num: '03',
    title: 'Factura registrada',
    desc: 'Tu cliente recibe el PDF. Tú tienes el registro verificado en Hacienda Foral.',
    icon: BadgeCheck,
  },
];

const features = [
  {
    icon: Shield,
    title: 'Cumplimiento foral automático',
    description:
      'Hash encadenado, envío a Hacienda Navarra y código QR generados automáticamente. Cumplimiento garantizado.',
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
  { feature: 'Cumplimiento Hacienda Foral de Navarra', them: false, us: true },
  { feature: 'Hash encadenado automático', them: false, us: true },
  { feature: 'Envío a Hacienda Navarra integrado', them: false, us: true },
  { feature: 'Código QR normativo', them: false, us: true },
  { feature: 'Gratis hasta 2027 (plazas limitadas)', them: false, us: true },
  { feature: 'Sin instalación requerida', them: false, us: true },
  { feature: 'Migración desde otros programas', them: false, us: true },
  { feature: 'Soporte técnico incluido', them: 'Coste adicional', us: true },
];

// Machine-readable version of the comparison table — the visual cells use
// icons, so crawlers get this plus the sr-only text in each cell.
const comparisonTableJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Table',
  name: `Comparativa: ${brandConfig.app.name} frente a software tradicional`,
  about:
    'Comparativa de cumplimiento con Hacienda Foral de Navarra: hash encadenado, envío a Hacienda Navarra, código QR normativo, instalación, migración, soporte y precio.',
  description: `${brandConfig.app.name} incluye cumplimiento con Hacienda Foral de Navarra, hash encadenado automático, envío a Hacienda Navarra integrado y código QR normativo de serie, sin instalación y gratis hasta 2027. El software tradicional no está adaptado al régimen foral navarro y cobra el soporte técnico aparte.`,
};

const faqs = [
  {
    q: '¿Cuántas plazas gratuitas quedan disponibles?',
    a: `Ofrecemos acceso gratuito hasta 2027 a las primeras ${PLAZAS_CONFIG.total.toLocaleString('es-ES')} inscripciones. Actualmente quedan ${PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas disponibles. Una vez alcanzado el límite, el período gratuito dejará de estar disponible para nuevos usuarios.`,
  },
  {
    q: '¿Qué obligaciones fiscales tienen los autónomos en Navarra?',
    a: 'La Hacienda Foral de Navarra exige que el software de facturación garantice la trazabilidad e inalterabilidad de los registros. Esto implica el uso de hash encadenado, firma electrónica cualificada y comunicación directa con la administración foral en cada factura emitida.',
  },
  {
    q: `¿Cuánto cuesta ${brandConfig.app.name} después de 2027?`,
    a: `Plan Starter (hasta 60 facturas/año): ${PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes o ${PRICING.starter.annualMonthly.toFixed(2).replace('.', ',')}€/mes anual. Plan PRO con cumplimiento foral automático: ${PRICING.pro.monthly.toFixed(2).replace('.', ',')}€/mes o ${PRICING.pro.annualMonthly.toFixed(2).replace('.', ',')}€/mes anual. Sin permanencia.`,
  },
  {
    q: '¿Qué sanciones existen por no usar software certificado en Navarra?',
    a: 'Las infracciones en materia de facturación pueden conllevar sanciones de hasta 50.000€ según la normativa tributaria foral de Navarra.',
  },
  {
    q: `¿${brandConfig.app.name} está adaptado a la Hacienda Foral de Navarra?`,
    a: `Sí. ${brandConfig.app.name} está diseñado específicamente para autónomos y pymes navarros, con integración directa con la Hacienda Foral de Navarra.`,
  },
  {
    q: '¿Es posible migrar facturas desde otro software?',
    a: `Sí. ${brandConfig.app.name} permite importar clientes y facturas desde Excel, CSV o Holded. La migración es gratuita y asistida por nuestro equipo.`,
  },
  {
    q: '¿Se requieren conocimientos de contabilidad?',
    a: `No. ${brandConfig.app.name} está diseñado para profesionales sin formación contable. En menos de 60 segundos creas la factura y el software gestiona el cumplimiento fiscal automáticamente.`,
  },
  {
    q: '¿Qué es el software garante de facturación en Navarra?',
    a: 'El software garante es el programa de facturación que cumple con todos los requisitos técnicos exigidos por la Hacienda Foral de Navarra: hash encadenado en cada factura, firma electrónica cualificada, código QR normativo y envío automático a la administración foral. Sin software garante, las facturas emitidas pueden no ser válidas fiscalmente en Navarra, con sanciones de hasta 50.000€.',
  },
  {
    q: '¿Cuándo es obligatorio VeriFactu para los autónomos navarros?',
    a: `VeriFactu (el sistema de registro de facturas de la AEAT estatal) es obligatorio para todos los autónomos en estimación directa desde julio de 2027. Los autónomos navarros deben cumplir con VeriFactu y además prepararse para NaTicket (el sistema de Hacienda Foral de Navarra). ${brandConfig.app.name} gestiona ambos automáticamente, actualizándose sin coste adicional.`,
  },
  {
    q: '¿Qué es NaTicket y cuándo será obligatorio en Navarra?',
    a: `NaTicket es el sistema de facturación electrónica que está desarrollando la Hacienda Foral de Navarra para los autónomos y empresas navarros, equivalente a VeriFactu pero adaptado al régimen foral y al Convenio Económico. A mayo de 2026 está en desarrollo y se espera su implantación progresiva desde 2027. ${brandConfig.app.name} está preparado para la integración NaTicket desde el primer día, sin coste adicional para el usuario.`,
  },
];

const trustBadges = [
  { icon: CreditCard, text: 'Sin tarjeta al registrarte' },
  { icon: Clock, text: 'Activación inmediata' },
  { icon: Shield, text: 'Hacienda Navarra' },
  { icon: Lock, text: 'RGPD compliant' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEO — JSON-LD structured data
// ─────────────────────────────────────────────────────────────────────────────
const homepageFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuántas plazas gratuitas quedan disponibles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Ofrecemos acceso gratuito hasta 2027 a las primeras ${PLAZAS_CONFIG.total.toLocaleString('es-ES')} inscripciones. Actualmente quedan ${PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas disponibles.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué obligaciones fiscales tienen los autónomos en Navarra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La Hacienda Foral de Navarra exige que el software de facturación garantice la trazabilidad e inalterabilidad de los registros mediante hash encadenado, firma electrónica y comunicación directa con la administración foral.',
      },
    },
    {
      '@type': 'Question',
      name: `¿Cuánto cuesta ${brandConfig.app.name} después de 2027?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Plan Starter: ${PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes. Plan PRO con cumplimiento foral automático: ${PRICING.pro.monthly.toFixed(2).replace('.', ',')}€/mes. Sin permanencia.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué sanciones existen en Navarra por no usar software certificado?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Las infracciones en materia de facturación pueden conllevar sanciones de hasta 50.000€ según la normativa tributaria foral de Navarra.',
      },
    },
    {
      '@type': 'Question',
      name: `¿${brandConfig.app.name} está adaptado a la Hacienda Foral de Navarra?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Sí. ${brandConfig.app.name} está diseñado específicamente para autónomos y pymes navarros, con integración directa con la Hacienda Foral de Navarra.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Es posible migrar facturas desde otro software?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Sí. ${brandConfig.app.name} permite importar clientes y facturas desde Excel, CSV o Holded. La migración es gratuita y asistida.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Se requieren conocimientos de contabilidad para usar el software?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `No. ${brandConfig.app.name} está diseñado para profesionales sin formación contable.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué es el software garante de facturación en Navarra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El software garante es el programa de facturación que cumple con todos los requisitos técnicos exigidos por la Hacienda Foral de Navarra: hash encadenado en cada factura, firma electrónica cualificada, código QR normativo y envío automático a la administración foral. Sin software garante, las facturas pueden no ser válidas fiscalmente en Navarra.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuándo es obligatorio VeriFactu para autónomos navarros?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `VeriFactu es obligatorio para todos los autónomos en estimación directa desde julio de 2027. Los autónomos navarros también deben cumplir con VeriFactu además de prepararse para NaTicket (el sistema de Hacienda Foral de Navarra). ${brandConfig.app.name} gestiona ambos automáticamente.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué es NaTicket y cuándo será obligatorio en Navarra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `NaTicket es el sistema de registro de facturas que está desarrollando la Hacienda Foral de Navarra, equivalente a VeriFactu pero adaptado al régimen foral. A mayo de 2026 está en desarrollo y se espera su implantación progresiva desde 2027. ${brandConfig.app.name} está preparado para la integración desde el primer día, sin coste adicional.`,
      },
    },
  ],
};

const homepageOrganizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: brandConfig.app.name,
  url: brandConfig.app.url,
  description: `Software de facturación especializado para autónomos y pymes de la Comunidad Foral de Navarra. Cumplimiento automático con Hacienda Foral de Navarra, VeriFactu y preparación para NaTicket.`,
  areaServed: [
    { '@type': 'AdministrativeArea', name: 'Comunidad Foral de Navarra' },
    { '@type': 'City', name: 'Pamplona' },
    { '@type': 'City', name: 'Tudela' },
    { '@type': 'City', name: 'Estella' },
    { '@type': 'City', name: 'Barañáin' },
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    availableLanguage: 'Spanish',
    areaServed: 'ES-NC',
  },
  knowsAbout: [
    'Hacienda Foral de Navarra',
    'Software garante de facturación',
    'VeriFactu',
    'NaTicket',
    'Facturación electrónica',
    'Convenio Económico de Navarra',
  ],
};

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
      name: 'Plan PRO con cumplimiento foral',
      price: String(PRICING.pro.monthly),
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `${brandConfig.app.url}/precios`,
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '47',
    bestRating: '5',
    worstRating: '1',
  },
  review: [
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Mikel Iraizoz' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody:
        'Llevaba tiempo preocupado por cumplir con Hacienda Navarra. Con NaFactura me despreocupé en minutos. Envío automático, sin complicaciones. Y encima gratis hasta 2027.',
      datePublished: '2026-03-15',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Ana Barricarte' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody:
        'Perfecta para autónomos navarros. Fácil, rápida y adaptada a la Hacienda Foral. En 60 segundos tengo la factura lista, firmada y enviada.',
      datePublished: '2026-04-02',
    },
    {
      '@type': 'Review',
      author: { '@type': 'Person', name: 'Jon Elizondo' },
      reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' },
      reviewBody:
        'Con NaFactura creo la factura y se envía a Hacienda Navarra automáticamente. Sin configuraciones, sin dolores de cabeza.',
      datePublished: '2026-04-18',
    },
  ],
  featureList: [
    'Cumplimiento Hacienda Foral de Navarra automático',
    'Hash encadenado en cada factura',
    'Envío automático a Hacienda Navarra',
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
// SEO — Metadata
// ─────────────────────────────────────────────────────────────────────────────
export const nafacturaHomeMetadata: Metadata = {
  title: `Software garante de facturación para autónomos navarros | ${brandConfig.app.name}`,
  description: `${brandConfig.app.name}: software garante de facturación para autónomos y pymes navarros. Cumplimiento automático con Hacienda Foral de Navarra. VeriFactu incluido. Preparado para NaTicket. Gratis hasta 2027 sin tarjeta.`,
  keywords: [
    'software facturación navarra',
    'programa facturación autónomos navarra',
    'hacienda foral navarra facturación',
    'facturación electrónica navarra',
    'software garante navarra',
    'software garante hacienda foral navarra',
    'verifactu navarra autónomos',
    'naticket navarra',
    'naticket software',
    'qué es naticket',
    'software facturación pamplona',
    'facturar autónomo navarra',
    'programa facturación gratis navarra',
    'facturación hacienda navarra 2027',
    'factura electrónica autónomo navarra',
    'alternativa holded navarra',
    'convenio económico navarra facturación',
    'cuándo obligatorio verifactu navarra',
  ],
  alternates: {
    canonical: brandConfig.app.url,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: brandConfig.app.url,
    title: `Software de facturación para autónomos navarros | ${brandConfig.app.name}`,
    description: `Cumple con Hacienda Navarra de forma automática. Hash encadenado, código QR y envío a Hacienda Foral incluidos. Gratis hasta 2027. Sin tarjeta.`,
    siteName: brandConfig.app.name,
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Software de facturación para autónomos navarros`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Software de facturación para autónomos navarros | ${brandConfig.app.name}`,
    description: `Cumplimiento automático con Hacienda Navarra. Gratis hasta 2027. Sin tarjeta.`,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
  robots: { index: true, follow: true },
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
// Page Component
// ─────────────────────────────────────────────────────────────────────────────
export function NafacturaHomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageOrganizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSoftwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonTableJsonLd) }}
      />
      <SiteHeader />

      <main className="flex-1">
        {/* ══ SECTION 1 — HERO ══ */}
        <div className="flex min-h-[calc(100vh-4rem)] flex-col">
          <section className="flex flex-1 items-center bg-white">
            <div className="mx-auto w-full max-w-4xl px-4 py-12 text-center">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                Adaptado a Hacienda Navarra
              </div>
              <div className="mb-7 ml-2 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                <Layers className="h-4 w-4" />
                Preparado para NaTicket
              </div>

              <h1 data-speakable className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                Software de facturación para{' '}
                <span className="relative whitespace-nowrap text-red-600">
                  autónomos navarros
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    viewBox="0 0 300 12"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 9 C75 3, 225 3, 298 9"
                      stroke="#dc2626"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.4"
                    />
                  </svg>
                </span>
              </h1>

              <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-500 sm:text-xl">
                Cumple con las obligaciones fiscales de la{' '}
                <strong className="text-slate-800">Hacienda Foral de Navarra</strong> de forma
                automática. Hash encadenado, firma electrónica y envío directo a la Hacienda Foral.
              </p>

              <div
                className="mx-auto mb-8 max-w-md rounded-2xl px-6 py-5"
                style={{
                  backgroundColor: brandConfig.colors.highlight,
                  border: `1px solid ${brandConfig.colors.highlightBorder}`,
                }}
              >
                <div className="mb-4 flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-white" />
                  <span className="text-base font-bold text-white">Gratis hasta 2027</span>
                </div>
                <div
                  className="mb-1.5 flex items-center justify-between text-xs font-medium"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    Plazas ocupadas
                  </span>
                  <span className="font-bold text-white">{PLAZAS_CONFIG.porcentaje}%</span>
                </div>
                <div
                  className="h-2.5 overflow-hidden rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  <div
                    className="h-full rounded-full bg-white transition-all duration-1000"
                    style={{ width: `${PLAZAS_CONFIG.porcentaje}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  <span className="font-semibold text-white">
                    {PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} inscritos
                  </span>{' '}
                  ·{' '}
                  <span className="font-bold text-white">
                    {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas restantes
                  </span>{' '}
                  de {PLAZAS_CONFIG.total.toLocaleString('es-ES')}
                </p>
              </div>

              <div className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/registro"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-8 text-base font-bold text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-xl sm:w-auto"
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

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                {trustBadges.map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-red-500" />
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ══ AGENCY BANNER ══ */}
          <section className="py-6" style={{ backgroundColor: brandConfig.colors.highlight }}>
            <div className="mx-auto max-w-5xl px-4">
              <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 rounded-xl p-3"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Building2 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p
                      className="text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                      Para asesorías y gestorías navarras
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                      ¿Gestionas la facturación de varios clientes navarros?
                    </h3>
                    <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      Panel centralizado para operar como cada uno de tus autónomos. Cumplimiento
                      foral automático bajo cada NIF. Completamente gratis para asesorías.
                    </p>
                  </div>
                </div>
                <Link
                  href="/asesoria"
                  className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold shadow-lg transition-all hover:bg-slate-100 hover:shadow-xl"
                  style={{ color: brandConfig.colors.highlight }}
                >
                  Ver solución para asesorías
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* ══ SECTION 2 — STATS ══ */}
        <HomeAnimatedStats />

        {/* ══ SECTION 3 — PROBLEM ══ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-8 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <h2 className="mb-6 text-center text-3xl font-bold text-slate-900 sm:text-4xl">
              Las obligaciones fiscales de Hacienda Navarra requieren software certificado
            </h2>
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center md:p-8">
              <p className="mb-4 text-lg text-slate-700">
                La <strong>Hacienda Foral de Navarra</strong> exige que el software de facturación
                garantice la <strong>trazabilidad</strong> e{' '}
                <strong>inalterabilidad de los registros</strong> mediante{' '}
                <strong>hash encadenado</strong>, <strong>firma electrónica</strong> y{' '}
                <strong>comunicación directa con la administración foral</strong>.
              </p>
              <div className="flex items-center justify-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xl font-bold">Sanción por incumplimiento: hasta 50.000€</span>
              </div>
            </div>
            <div className="mt-6">
              <VerifactuDeadlines />
            </div>
            <p className="mt-8 text-center text-lg text-slate-500">
              {brandConfig.app.name} automatiza todos estos requisitos.{' '}
              <strong className="text-slate-800">
                Tú solo creas la factura, nosotros garantizamos el cumplimiento foral.
              </strong>
            </p>
          </div>
        </section>

        {/* ══ SECTION 4 — HOW IT WORKS ══ */}
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
                Factura conforme a Hacienda Navarra en tres pasos
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-2xl text-center text-slate-500">
              Sin conocimientos técnicos. Sin configuraciones complejas.
            </p>
            <div className="relative grid gap-8 md:grid-cols-3">
              <div
                className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-slate-200 md:block"
                aria-hidden="true"
              />
              {steps.map((step) => (
                <div key={step.num} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
                    <step.icon className="h-8 w-8 text-red-600" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
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
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 text-base font-bold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow-md"
              >
                Empezar gratis ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ══ SECTION 5 — FEATURES ══ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Funcionalidades
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Herramientas profesionales para cumplir con Hacienda Navarra
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-2xl text-center text-slate-500">
              Diseñado para autónomos y pymes navarros.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card
                  key={f.title}
                  className={`border-2 p-6 transition-all duration-200 hover:shadow-md ${
                    f.highlight
                      ? 'border-red-200 bg-red-50/30 ring-1 ring-red-100'
                      : 'hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                      f.highlight ? 'bg-red-100' : 'bg-slate-100'
                    }`}
                  >
                    <f.icon
                      className={`h-6 w-6 ${f.highlight ? 'text-red-600' : 'text-slate-600'}`}
                    />
                  </div>
                  <h3 className="mb-2 font-bold text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-500">{f.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SECTION 6 — HACIENDA NAVARRA CONTEXT ══ */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mb-8 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Información normativa
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                ¿Qué obligaciones fiscales tienen los autónomos navarros?
              </h2>
            </div>
            <div className="space-y-4 text-slate-500">
              <p>
                La <strong className="text-slate-800">Hacienda Foral de Navarra</strong> dispone de
                su propio régimen fiscal, independiente de la AEAT estatal. Los autónomos y pymes
                navarros tributan ante la <strong className="text-slate-800">Hacienda Foral</strong>{' '}
                y deben cumplir con la normativa específica de facturación del territorio foral.
              </p>
              <p>
                Esta normativa exige el uso de{' '}
                <strong className="text-slate-800">software garante</strong> que asegure la{' '}
                <strong className="text-slate-800">trazabilidad</strong>,{' '}
                <strong className="text-slate-800">inalterabilidad</strong> e{' '}
                <strong className="text-slate-800">integridad de los registros</strong> mediante
                hash encadenado, firma electrónica cualificada y comunicación directa con la
                Hacienda Foral en cada factura emitida.
              </p>
              <p>
                {brandConfig.app.name} ha sido diseñado específicamente para cubrir estos
                requisitos, con{' '}
                <strong className="text-slate-800">integración directa con Hacienda Navarra</strong>{' '}
                y generación automática de todos los elementos exigidos por la normativa foral.
              </p>
            </div>
            <div className="mt-10 space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">
                  ¿Qué es el software garante de facturación en Navarra?
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  El <strong className="text-slate-700">software garante</strong> es el programa de
                  facturación que cumple con todos los requisitos técnicos y legales exigidos por la
                  Hacienda Foral de Navarra: garantiza la{' '}
                  <strong className="text-slate-700">trazabilidad</strong>,{' '}
                  <strong className="text-slate-700">inalterabilidad</strong> e{' '}
                  <strong className="text-slate-700">integridad</strong> de cada registro mediante
                  hash encadenado, firma electrónica y envío automático a la administración foral.
                  {brandConfig.app.name} es el único software garante diseñado exclusivamente para
                  autónomos y pymes navarros.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">
                  VeriFactu y NaTicket: las dos obligaciones de los autónomos navarros en 2027
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  Los autónomos navarros en estimación directa se enfrentan a dos obligaciones
                  fiscales en 2027: <strong className="text-slate-700">VeriFactu</strong> (el
                  sistema de la AEAT estatal, obligatorio desde julio 2027) y{' '}
                  <strong className="text-slate-700">NaTicket</strong> (el sistema propio de
                  Hacienda Foral de Navarra, en desarrollo). {brandConfig.app.name} ya está
                  preparado para ambos, actualizándose automáticamente cuando NaTicket sea
                  obligatorio, sin coste adicional.
                </p>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">
                  ¿Qué autónomos navarros necesitan software de facturación certificado?
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  Todos los autónomos navarros en{' '}
                  <strong className="text-slate-700">estimación directa</strong> (normal o
                  simplificada) que emitan facturas. Esto incluye profesionales de Pamplona, Tudela,
                  Estella, Barañáin y cualquier municipio de la Comunidad Foral. El{' '}
                  <strong className="text-slate-700">Convenio Económico de Navarra</strong>{' '}
                  establece un régimen tributario independiente de la AEAT estatal, con requisitos
                  específicos de facturación que los programas genéricos nacionales no cubren
                  correctamente.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/naticket"
                  className="text-sm font-semibold text-red-600 hover:underline"
                >
                  Guía NaTicket →
                </Link>
                <Link
                  href="/verifactu"
                  className="text-sm font-semibold text-red-600 hover:underline"
                >
                  VeriFactu para Navarra →
                </Link>
                <Link
                  href="/mejor-software-facturacion-navarra"
                  className="text-sm font-semibold text-red-600 hover:underline"
                >
                  Comparativa software Navarra →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SECTION 7 — OFFER ══ */}
        <section id="registro" className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <Card className="overflow-hidden border-2 border-red-200">
              <div className="bg-gradient-to-br from-red-50 via-white to-transparent p-8 text-center md:p-12">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                  <Clock className="h-4 w-4" />
                  Oferta limitada a {PLAZAS_CONFIG.total.toLocaleString('es-ES')} inscripciones
                </div>
                <h2 className="mb-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                  Gratis hasta 2027
                </h2>
                <p className="mb-2 text-lg font-bold text-red-600">Sin tarjeta al registrarte</p>
                <p className="mb-6 text-slate-500">
                  Accede a todas las funcionalidades sin coste. Reservado para los primeros{' '}
                  {PLAZAS_CONFIG.total.toLocaleString('es-ES')} profesionales navarros.
                </p>
                <div className="mx-auto mb-8 max-w-md rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Users className="h-4 w-4 text-red-600" />
                      Plazas ocupadas
                    </span>
                    <span className="text-2xl font-extrabold text-red-600">
                      {PLAZAS_CONFIG.porcentaje}%
                    </span>
                  </div>
                  <div className="mb-2 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
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
                      <Icon className="mx-auto mb-2 h-5 w-5 text-red-600" />
                      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
                      <p className="text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mb-4 grid gap-3 text-left sm:grid-cols-2">
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
                        { text: 'Cumplimiento foral incluido', ok: true },
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
                  <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Plan PRO</p>
                        <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          Hacienda Navarra
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
                        'Cumplimiento foral automático',
                        'Envío a Hacienda Navarra',
                        'Software certificado foral',
                      ].map((text) => (
                        <li key={text} className="flex items-center gap-2 text-xs">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-red-600" />
                          <span className="text-slate-600">{text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mb-8 text-center text-xs text-slate-400">
                  Puedes elegir o cambiar de plan en cualquier momento.{' '}
                  <Link href="/precios" className="font-semibold text-red-600 hover:underline">
                    Ver precios completos →
                  </Link>
                </p>
                <Link
                  href="/registro"
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-10 text-base font-bold text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-xl sm:w-auto"
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

        {/* ══ SECTION 8 — COMPARISON ══ */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Comparativa
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                ¿Tu programa de facturación cumple con la Hacienda Foral de Navarra?
              </h2>
            </div>
            <p className="mx-auto mb-10 max-w-xl text-center text-slate-500">
              La mayoría de programas de facturación no están adaptados al régimen foral navarro ni
              al Convenio Económico. Comprueba si el tuyo cubre realmente los requisitos de Hacienda
              Foral.
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
                      <th className="px-4 py-4 text-center font-bold text-red-600">
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
                            <>
                              <CheckCircle2
                                aria-hidden="true"
                                className="mx-auto h-5 w-5 text-green-500"
                              />
                              <span className="sr-only">Sí</span>
                            </>
                          ) : (
                            <>
                              <X aria-hidden="true" className="mx-auto h-5 w-5 text-slate-300" />
                              <span className="sr-only">No</span>
                            </>
                          )}
                        </td>
                        <td className="bg-red-50/30 px-4 py-3 text-center">
                          <CheckCircle2
                            aria-hidden="true"
                            className="mx-auto h-5 w-5 text-red-600"
                          />
                          <span className="sr-only">Sí</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
              En síntesis: el software tradicional no está adaptado a la Hacienda Foral de Navarra
              — sin hash encadenado, sin envío integrado a Hacienda Navarra y sin código QR
              normativo. {brandConfig.app.name} lo incluye todo de serie, sin instalación, con
              migración y soporte técnico sin coste adicional, y gratis hasta 2027.
            </p>
          </div>
        </section>

        {/* ══ SECTION 9 — TESTIMONIALS ══ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Testimonios
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Autónomos navarros que ya cumplen con Hacienda Foral
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-xl text-center text-slate-500">
              Profesionales de Navarra confían en {brandConfig.app.name}
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
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

        {/* ══ SECTION 10 — FAQ ══ */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Preguntas frecuentes
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Dudas habituales sobre {brandConfig.app.name} y Hacienda Navarra
              </h2>
            </div>
            <p className="mx-auto mb-10 max-w-xl text-center text-slate-500">
              Resolvemos las consultas más frecuentes de autónomos y pymes navarros
            </p>
            <HomeFaqAccordion faqs={faqs} />
          </div>
        </section>

        {/* ══ SECTION 11 — FINAL CTA ══ */}
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
              Únete a los primeros profesionales navarros que ya cumplen con Hacienda Foral.
              <br />
              Gratis hasta 2027. Sin tarjeta al registrarte. Sin compromiso.
            </p>
            <Link
              href="/registro"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-10 text-base font-bold text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-xl sm:w-auto"
            >
              Empezar gratis ahora
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-red-600" />
                Gratis hasta 2027
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-red-600" />
                Sin tarjeta al registrarte
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-red-600" />
                Activación inmediata
              </span>
            </div>
          </div>
        </section>
      </main>

      <RelatedLinksSection
        title="Guías para autónomos navarros"
        links={[
          {
            href: '/naticket',
            label: 'NaTicket Navarra',
            description: 'El futuro sistema de Hacienda Foral de Navarra, explicado',
          },
          {
            href: '/verifactu',
            label: 'VeriFactu en Navarra',
            description: 'Cumplimiento fiscal obligatorio para autónomos navarros desde 2027',
          },
          {
            href: '/alternativa-holded-navarra',
            label: 'Alternativa a Holded',
            description: 'Por qué los autónomos navarros prefieren NaFactura a Holded',
          },
          {
            href: '/mejor-software-facturacion-navarra',
            label: 'Mejor software Navarra 2027',
            description: 'Comparativa de los 4 mejores programas para autónomos navarros',
          },
          {
            href: '/software-facturacion-pamplona',
            label: 'Software para Pamplona',
            description: 'Especializado para autónomos de la capital de Navarra',
          },
          {
            href: '/funcionalidades',
            label: 'Todas las funcionalidades',
            description: 'Facturación, clientes, presupuestos, PDF y dashboard para navarros',
          },
        ]}
      />

      <FooterLanding />
      <HomeStickyCtaBanner />
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  Zap,
  Download,
  CheckCircle2,
  Clock,
  Users,
  Lock,
  Smartphone,
  ArrowRight,
  Sparkles,
  CreditCard,
  FileText,
  Send,
  BadgeCheck,
  TrendingUp,
  Headphones,
  LayoutDashboard,
  Package,
  Receipt,
  UserCircle,
  Palette,
  Building2,
  QrCode,
  FilePen,
  ClipboardList,
  BarChart3,
  RefreshCcw,
  Globe,
} from 'lucide-react';
import { brandConfig, PRICING, PLAZAS_CONFIG } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';

export const nafacturaFuncionalidadesMetadata: Metadata = {
  title: `Funcionalidades — Software de facturación para autónomos navarros | ${brandConfig.app.name}`,
  description: `Descubre todas las funcionalidades de ${brandConfig.app.name}: facturación conforme a Hacienda Navarra, gestión de clientes, presupuestos, dashboard, PDF y más. Software de facturación para autónomos navarros.`,
  keywords: [
    'funcionalidades software facturación Navarra',
    'características programa facturación autónomos Navarra',
    'software facturación Hacienda Navarra',
    'programa facturación Pamplona',
    'software facturación electrónica Navarra',
    'gestión facturas clientes Navarra online',
    'generar factura pdf online autónomo navarro',
    'software presupuestos facturas autónomos Navarra',
    'programa facturación cumplimiento Hacienda Foral',
    'software facturación sin tarjeta Navarra',
    'gestión clientes facturas presupuestos pyme Navarra',
    'dashboard facturación autónomo navarro',
  ],
  alternates: { canonical: `${brandConfig.app.url}/funcionalidades` },
  openGraph: {
    title: `Funcionalidades de ${brandConfig.app.name} — Software de facturación para Navarra`,
    description: `Todas las herramientas para facturar en Navarra: cumplimiento Hacienda Foral, gestión de clientes, presupuestos, PDF y dashboard. Gratis para autónomos navarros.`,
    url: `${brandConfig.app.url}/funcionalidades`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Software de facturación para autónomos navarros`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Funcionalidades de ${brandConfig.app.name} — Facturación para Navarra`,
    description: `Descubre todo lo que incluye ${brandConfig.app.name} para autónomos navarros. Gratis hasta 2027.`,
    images: [`${brandConfig.app.url}/og-image.jpg`],
  },
};

const softwareAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: brandConfig.app.name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  description: brandConfig.app.description,
  url: brandConfig.app.url,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: `Gratis hasta 2027 para las primeras ${PRICING.freePeriodSlots.toLocaleString('es-ES')} inscripciones.`,
    availability: 'https://schema.org/LimitedAvailability',
  },
  featureList: [
    'Facturación conforme a Hacienda Foral de Navarra',
    'Cumplimiento normativa fiscal navarra',
    'Gestión de clientes y directorio',
    'Creación y gestión de presupuestos',
    'Catálogo de productos y servicios',
    'Generación de PDF profesional',
    'Plantilla de factura personalizable',
    'Dashboard con KPIs e informes',
    'Acceso multiplataforma (web, móvil, tablet)',
    'Migración desde Excel, CSV y otros programas',
    'Soporte en español en menos de 2 horas',
    'Cumplimiento RGPD y servidores europeos',
  ],
  publisher: { '@type': 'Organization', name: brandConfig.app.name, url: brandConfig.app.url },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Funcionalidades',
      item: `${brandConfig.app.url}/funcionalidades`,
    },
  ],
};

const mainFeatures = [
  {
    icon: Shield,
    title: 'Cumplimiento Hacienda Navarra automático',
    description:
      'Tu facturación cumple automáticamente con la normativa de Hacienda Foral de Navarra. Sin configuraciones técnicas, sin preocupaciones fiscales.',
    highlight: true,
    badge: 'Hacienda Navarra',
  },
  {
    icon: Zap,
    title: 'Facturación en 60 segundos',
    description:
      'Interfaz diseñada para profesionales navarros sin conocimientos contables. Sin menús complejos ni configuraciones técnicas.',
    highlight: false,
  },
  {
    icon: UserCircle,
    title: 'Gestión de clientes',
    description:
      'Directorio completo de clientes con NIF/CIF, datos de contacto, historial de facturas e importes acumulados.',
    highlight: false,
  },
  {
    icon: ClipboardList,
    title: 'Presupuestos profesionales',
    description:
      'Crea presupuestos, envíalos por email y conviértelos en factura con un solo clic cuando el cliente acepte.',
    highlight: false,
  },
  {
    icon: Package,
    title: 'Catálogo de productos',
    description:
      'Define tu catálogo de productos y servicios con precio, tipo de IVA navarro y descripción. Reutilízalos en cada factura.',
    highlight: false,
  },
  {
    icon: BarChart3,
    title: 'Dashboard e informes',
    description:
      'Vista rápida de ingresos, facturas pendientes, cobradas y vencidas. KPIs actualizados en tiempo real.',
    highlight: false,
  },
  {
    icon: FileText,
    title: 'PDF profesional',
    description:
      'Genera PDFs con tu logo, datos de empresa y cumplimiento Hacienda Navarra. Apariencia profesional desde el primer día.',
    highlight: false,
  },
  {
    icon: Palette,
    title: 'Plantilla personalizable',
    description:
      'Adapta la plantilla de factura a tu imagen corporativa: logo, colores, número de cuenta y más.',
    highlight: false,
  },
  {
    icon: Download,
    title: 'Migración sin esfuerzo',
    description:
      'Importa clientes y facturas desde Excel, CSV u otros programas. Migración gratuita y asistida.',
    highlight: false,
  },
  {
    icon: Lock,
    title: 'Seguridad certificada',
    description:
      'Servidores en la Unión Europea, cifrado SSL de 256 bits y cumplimiento pleno del RGPD.',
    highlight: false,
  },
  {
    icon: Smartphone,
    title: 'Acceso multiplataforma',
    description:
      'Usa el software desde cualquier dispositivo: ordenador, tablet o móvil. Sin instalaciones.',
    highlight: false,
  },
  {
    icon: Headphones,
    title: 'Soporte profesional',
    description:
      'Atención personalizada en español. Respuesta garantizada en menos de 2 horas hábiles.',
    highlight: false,
  },
];

const detailedSections = [
  {
    id: 'cumplimiento',
    label: 'Cumplimiento legal Navarra',
    title: 'Facturación adaptada a Hacienda Foral de Navarra',
    description:
      'Navarra tiene su propio régimen fiscal gestionado por Hacienda Foral. Nuestro software está adaptado a la normativa navarra para que tu facturación sea siempre correcta.',
    items: [
      { icon: QrCode, text: 'Facturas correctas bajo la normativa foral navarra' },
      { icon: Shield, text: 'Tipos de IVA y retenciones conformes a Hacienda Navarra' },
      { icon: Send, text: 'Gestión de declaraciones conforme al régimen foral' },
      { icon: FilePen, text: 'Firma y sellado de facturas profesional' },
      { icon: BadgeCheck, text: 'Software adaptado a la normativa de Hacienda Navarra' },
      { icon: RefreshCcw, text: 'Registro inmutable de todos los registros fiscales' },
    ],
    bg: 'bg-red-50',
    accent: 'text-red-600',
    border: 'border-red-200',
  },
  {
    id: 'facturacion',
    label: 'Facturación',
    title: 'Crea facturas legales en menos de un minuto',
    description:
      'Selecciona el cliente, añade los conceptos y pulsa enviar. El software se encarga del resto: cálculo de IVA e IRPF según normativa navarra, numeración automática y PDF.',
    items: [
      { icon: Zap, text: 'Proceso de creación guiado en 3 pasos simples' },
      { icon: Receipt, text: 'Cálculo automático de IVA, IRPF y totales (régimen navarro)' },
      { icon: FileText, text: 'Numeración secuencial automática por series' },
      { icon: CreditCard, text: 'Registro de pagos y cobros parciales' },
      { icon: RefreshCcw, text: 'Facturas recurrentes y plantillas guardadas' },
      { icon: Send, text: 'Envío por email directamente desde la plataforma' },
    ],
    bg: 'bg-slate-50',
    accent: 'text-slate-700',
    border: 'border-slate-200',
  },
  {
    id: 'clientes',
    label: 'Clientes y presupuestos',
    title: 'Gestiona clientes navarros y convierte presupuestos en facturas',
    description:
      'Mantén un directorio organizado de clientes navarros con toda su información fiscal. Crea presupuestos profesionales y transfórmalos en facturas cuando el cliente confirme.',
    items: [
      { icon: UserCircle, text: 'Directorio de clientes navarros con datos fiscales completos' },
      { icon: TrendingUp, text: 'Historial de facturación y saldo pendiente por cliente' },
      { icon: ClipboardList, text: 'Presupuestos con fecha de expiración configurable' },
      { icon: ArrowRight, text: 'Conversión de presupuesto a factura con un clic' },
      { icon: Globe, text: 'Soporte para clientes en Navarra y resto de España' },
      { icon: Building2, text: 'Gestión de autónomos, empresas y particulares navarros' },
    ],
    bg: 'bg-slate-50',
    accent: 'text-slate-700',
    border: 'border-slate-200',
  },
  {
    id: 'dashboard',
    label: 'Dashboard y análisis',
    title: 'Tu negocio navarro de un vistazo con el dashboard inteligente',
    description:
      'Visualiza tus ingresos, facturas pendientes de cobro y métricas clave. Toma decisiones informadas con datos actualizados en tiempo real.',
    items: [
      { icon: BarChart3, text: 'KPIs de facturación: ingresos, pendiente, cobrado' },
      { icon: TrendingUp, text: 'Evolución mensual de ingresos en gráficas claras' },
      { icon: Receipt, text: 'Alertas de facturas vencidas y presupuestos expirados' },
      { icon: Users, text: 'Ranking de clientes por volumen de facturación' },
      { icon: Clock, text: 'Actividad reciente y acciones rápidas' },
      { icon: LayoutDashboard, text: 'Vista unificada de todo tu negocio navarro' },
    ],
    bg: 'bg-red-50',
    accent: 'text-red-600',
    border: 'border-red-200',
  },
];

const comparisonRows = [
  { feature: 'Adaptado a Hacienda Foral de Navarra', competitors: false, us: true },
  { feature: 'IVA y retenciones según normativa navarra', competitors: false, us: true },
  { feature: 'Soporte especializado en régimen foral', competitors: false, us: true },
  {
    feature: `${PRICING.freePeriodMonths} meses completamente gratuitos`,
    competitors: false,
    us: true,
  },
  { feature: 'Sin tarjeta al registrarte', competitors: false, us: true },
  { feature: 'Migración desde otros programas', competitors: 'Coste adicional', us: true },
  { feature: 'Soporte técnico incluido', competitors: 'Coste adicional', us: true },
  { feature: 'Plantilla de factura personalizable', competitors: true, us: true },
  { feature: 'App móvil y tablet', competitors: true, us: true },
];

const faqs = [
  {
    q: '¿El software está adaptado a Hacienda Foral de Navarra?',
    a: 'Sí. Navarra tiene un régimen fiscal propio gestionado por Hacienda Foral. Nuestro software está completamente adaptado a la normativa foral navarra, incluyendo los tipos de IVA y las retenciones específicas de Navarra.',
  },
  {
    q: '¿Necesito conocimientos de contabilidad para usar el software?',
    a: 'No. La plataforma está diseñada para autónomos navarros sin formación contable. Tú introduces los datos básicos y el software calcula el IVA, el IRPF según normativa navarra, genera el PDF y gestiona toda la documentación automáticamente.',
  },
  {
    q: '¿Qué incluye el acceso gratuito hasta 2027?',
    a: `Acceso completo a todas las funcionalidades: facturación conforme a Hacienda Navarra, gestión de clientes, presupuestos, catálogo de productos, dashboard, PDF personalizable y soporte técnico. Sin restricciones.`,
  },
  {
    q: '¿Puedo migrar mis facturas desde otro programa?',
    a: 'Sí. Puedes importar clientes y facturas desde Excel, CSV u otros programas. La migración es gratuita y nuestro equipo te asiste.',
  },
  {
    q: '¿Qué pasa con mis datos si cancelo?',
    a: 'Tus datos son tuyos. Puedes exportar todas tus facturas y clientes en cualquier momento en formato PDF, Excel o CSV.',
  },
  {
    q: '¿El software cumple con el RGPD?',
    a: 'Sí. Los servidores están ubicados en la Unión Europea, los datos se cifran con SSL de 256 bits y cumplimos íntegramente el RGPD.',
  },
  {
    q: '¿Puedo personalizar la plantilla de mis facturas?',
    a: 'Sí. Puedes añadir tu logo, personalizar los colores y añadir tus datos bancarios para que tus facturas reflejen tu imagen profesional.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export function NafacturaFuncionalidadesPage(): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white text-slate-900">
        <SiteHeader />

        <main className="flex-1">
          {/* Hero */}
          <section className="bg-white py-20 md:py-28">
            <div className="mx-auto max-w-4xl px-4 text-center">
              <nav className="mb-6 flex justify-center" aria-label="Breadcrumb">
                <ol className="flex items-center gap-2 text-sm text-slate-500">
                  <li>
                    <Link href="/" className="hover:text-slate-700">
                      Inicio
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li className="font-medium text-slate-700">Funcionalidades</li>
                </ol>
              </nav>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
                <BadgeCheck className="h-4 w-4 text-red-600" />
                Adaptado a Hacienda Foral de Navarra
              </div>
              <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                Todo lo que necesitas para{' '}
                <span className="relative whitespace-nowrap text-red-600">
                  facturar en Navarra
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
              <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-500 sm:text-xl">
                {brandConfig.app.name} reúne en un solo lugar todas las herramientas que un autónomo
                navarro necesita: facturación{' '}
                <strong className="text-slate-800">conforme a Hacienda Navarra</strong>, gestión de
                clientes, presupuestos, catálogo de productos, dashboard y mucho más.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/registro"
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-xl"
                >
                  <Sparkles className="h-4 w-4" />
                  Pruébalo gratis hasta 2027
                </Link>
                <Link
                  href="/precios"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  Ver precios
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-500">
                {[
                  { icon: CreditCard, text: 'Sin tarjeta al registrarte' },
                  { icon: Clock, text: 'Activación inmediata' },
                  { icon: Shield, text: 'Hacienda Navarra' },
                  { icon: Lock, text: 'RGPD compliant' },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-red-500" />
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Feature grid */}
          <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-12 text-center">
                <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  Funcionalidades completas
                </span>
                <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                  Todas las herramientas en una sola plataforma
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-slate-500">
                  Sin integraciones externas, sin costes adicionales y sin sorpresas.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {mainFeatures.map((f) => (
                  <div
                    key={f.title}
                    className={`rounded-xl border-2 bg-white p-6 transition-all duration-200 hover:shadow-md ${f.highlight ? 'border-red-200 ring-1 ring-red-100' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    {f.badge && (
                      <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                        <Shield className="h-3 w-3" />
                        {f.badge}
                      </span>
                    )}
                    <div
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${f.highlight ? 'bg-red-100' : 'bg-slate-100'}`}
                    >
                      <f.icon
                        className={`h-6 w-6 ${f.highlight ? 'text-red-600' : 'text-slate-600'}`}
                      />
                    </div>
                    <h3 className="mb-2 font-bold text-slate-900">{f.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Detailed sections */}
          {detailedSections.map((section, idx) => (
            <section
              key={section.id}
              id={section.id}
              className={`py-16 md:py-24 ${idx % 2 !== 0 ? 'bg-white' : 'border-y border-slate-100 bg-slate-50'}`}
            >
              <div className="mx-auto max-w-5xl px-4">
                <div className="mb-12 text-center">
                  <span
                    className={`mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${section.bg} ${section.border} ${section.accent}`}
                  >
                    {section.label}
                  </span>
                  <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                    {section.title}
                  </h2>
                  <p className="mx-auto mt-4 max-w-2xl text-slate-500">{section.description}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map(({ icon: Icon, text }) => (
                    <div
                      key={text}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                        <Icon className="h-4 w-4 text-slate-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}

          {/* Comparison */}
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-4xl px-4">
              <div className="mb-12 text-center">
                <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  Comparativa
                </span>
                <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                  ¿Qué te ofrece {brandConfig.app.name} que otros no?
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-slate-500">
                  La mayoría de los programas de facturación no están adaptados a la normativa foral
                  de Navarra. Nosotros sí.
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border-2 border-slate-200">
                <div className="grid grid-cols-3 bg-slate-900 px-6 py-4 text-sm font-bold text-white">
                  <span>Funcionalidad</span>
                  <span className="text-center text-slate-400">Otros programas</span>
                  <span className="text-center text-red-400">{brandConfig.app.name}</span>
                </div>
                {comparisonRows.map((row, i) => (
                  <div
                    key={row.feature}
                    className={`grid grid-cols-3 items-center px-6 py-4 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}
                  >
                    <span className="font-medium text-slate-800">{row.feature}</span>
                    <span className="flex justify-center">
                      {row.competitors === true ? (
                        <CheckCircle2 className="h-5 w-5 text-slate-400" />
                      ) : row.competitors === false ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-500">
                          ✕
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {row.competitors}
                        </span>
                      )}
                    </span>
                    <span className="flex justify-center">
                      <CheckCircle2 className="h-5 w-5 text-red-600" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="border-t border-slate-100 bg-slate-50 py-16 md:py-24">
            <div className="mx-auto max-w-3xl px-4">
              <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                  Preguntas frecuentes
                </h2>
                <p className="mt-4 text-slate-500">
                  Resuelve tus dudas sobre las funcionalidades y el cumplimiento con Hacienda
                  Navarra.
                </p>
              </div>
              <div className="space-y-3">
                {faqs.map(({ q, a }) => (
                  <details
                    key={q}
                    className="group rounded-xl border-2 border-slate-200 bg-white open:border-red-200"
                  >
                    <summary className="flex cursor-pointer select-none list-none items-center justify-between px-5 py-4 text-base font-semibold text-slate-900 hover:text-red-600">
                      <span>{q}</span>
                      <span className="ml-4 shrink-0 transition-transform duration-200 group-open:rotate-45">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M10 4v12M4 10h12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </summary>
                    <div className="px-5 pb-4 text-sm leading-relaxed text-slate-500">{a}</div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-2xl px-4 text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                <Users className="h-4 w-4" />
                {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas gratuitas disponibles
              </div>
              <h2 className="mb-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Empieza a facturar correctamente en Navarra hoy
              </h2>
              <p className="mb-8 text-lg text-slate-500">
                {PRICING.freePeriodMonths} meses con acceso completo a todas las funcionalidades,
                sin tarjeta y sin compromisos.
              </p>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-10 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-xl"
              >
                <Sparkles className="h-5 w-5" />
                Registrarme ahora — gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-sm text-slate-400">
                Sin tarjeta · Activación inmediata · Cancela cuando quieras
              </p>
            </div>
          </section>
        </main>

        <FooterLanding />
      </div>
    </>
  );
}

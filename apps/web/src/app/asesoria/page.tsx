import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { brandConfig } from '@easyfactura/brand-config';
import {
  Users,
  ArrowRight,
  CheckCircle2,
  Building2,
  LayoutDashboard,
  FileText,
  Sparkles,
  Shield,
  Clock,
  TrendingUp,
  UserCheck,
  Repeat,
  Gift,
  ChevronRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: `Software VeriFactu para asesorías y gestorías | ${brandConfig.app.name}`,
  description:
    'Gestiona la facturación VeriFactu de todos tus clientes desde un único panel. Completamente gratis para asesorías y gestorías. Panel centralizado, VeriFactu automático bajo cada NIF.',
  keywords: [
    'software facturación asesorías',
    'programa facturación gestorías',
    'verifactu asesorías',
    'software gestoría verifactu gratis',
    'gestión facturas múltiples clientes',
    'panel centralizado facturación asesoría',
    'facturación electrónica gestorías',
    'software contable asesorías',
    'programa facturación despacho profesional',
    'verifactu gestoría gratis',
  ],
  alternates: {
    canonical: `${brandConfig.app.url}/asesoria`,
  },
  openGraph: {
    title: `Software VeriFactu para asesorías y gestorías | ${brandConfig.app.name}`,
    description:
      'Gestiona la facturación VeriFactu de todos tus clientes desde un único panel. Completamente gratis para asesorías.',
    url: `${brandConfig.app.url}/asesoria`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} para asesorías — Software VeriFactu gratis`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Software VeriFactu para asesorías | ${brandConfig.app.name}`,
    description:
      'Panel centralizado para gestionar la facturación VeriFactu de todos tus clientes. Gratis para siempre.',
    images: [`${brandConfig.app.url}/og-image.jpg`],
  },
};

// ── JSON-LD structured data ───────────────────────────────────────────────────

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `${brandConfig.app.name} para Asesorías`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: `${brandConfig.app.url}/asesoria`,
  description:
    'Software de facturación VeriFactu gratuito para asesorías y gestorías. Panel centralizado para gestionar la facturación de múltiples clientes bajo sus propios NIFs.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Completamente gratuito para asesorías y gestorías',
  },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
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
      name: 'Para asesorías',
      item: `${brandConfig.app.url}/asesoria`,
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Necesito que mis clientes creen también una cuenta?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No es necesario. Puedes dar de alta a tus clientes directamente tú mismo con sus datos fiscales. Si quieren acceder a su propio dashboard en el futuro, pueden hacerlo en cualquier momento.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Las facturas que emito quedan registradas bajo el NIF de cada cliente?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Sí. Aunque las emites desde tu panel, cada factura pertenece al tenant fiscal del cliente con su NIF, su serie y su cadena VeriFactu. Hacienda las ve como emitidas por el cliente.`,
      },
    },
    {
      '@type': 'Question',
      name: `¿Qué pasa si un cliente ya tiene cuenta en ${brandConfig.app.name}?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Puedes invitarle por email y vincularte a su cuenta existente. No se pierde ningún dato previo.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Mis clientes pueden ver que yo accedo a su cuenta?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cada acción queda registrada internamente. Cuando actúas en nombre de un cliente, todas las facturas que creas quedan marcadas con tu usuario para auditoría.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta el software para asesorías?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${brandConfig.app.name} es completamente gratuito para asesorías y gestorías. Sin límite de clientes, sin coste mensual, sin letra pequeña.`,
      },
    },
  ],
};

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Panel central de clientes',
    description:
      'Ve todos tus clientes en una sola pantalla. Accede al dashboard de cada uno con un solo clic, sin cerrar sesión.',
  },
  {
    icon: FileText,
    title: 'Factura en nombre de tus clientes',
    description:
      'Emite facturas directamente sobre el tenant fiscal de cada cliente. Todo queda registrado bajo su NIF y su cadena VeriFactu.',
  },
  {
    icon: UserCheck,
    title: 'Directorio de clientes compartido',
    description:
      'Crea una empresa una sola vez en tu directorio y reutilízala para todos tus autónomos. Sin duplicados, sin trabajo repetido.',
  },
  {
    icon: Shield,
    title: 'VeriFactu automático para cada cliente',
    description:
      'Cada factura que emitas cumple con la Ley Antifraude 2026 bajo el NIF del cliente correspondiente. Sin configuración extra.',
  },
  {
    icon: Repeat,
    title: 'Cambio de contexto en un clic',
    description:
      'Pasa del dashboard de un cliente al siguiente en segundos. Un banner permanente te recuerda siempre en qué empresa estás operando.',
  },
  {
    icon: TrendingUp,
    title: 'Vista agregada de tu cartera',
    description:
      'Consulta el estado global: facturas pendientes, alertas fiscales y actividad reciente de toda tu cartera desde una sola pantalla.',
  },
];

const FOR_WHO = [
  'Asesorías fiscales y contables',
  'Gestorías que gestionan autónomos y PYMEs',
  'Despachos de abogados con clientes empresariales',
  'Contables freelance con múltiples clientes',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Crea tu cuenta de asesoría',
    description:
      'Regístrate en menos de 2 minutos con los datos de tu gestoría. Sin tarjeta, sin pagos.',
  },
  {
    step: '02',
    title: 'Añade a tus clientes',
    description:
      'Da de alta a cada autónomo o empresa directamente, o invítales por email para que completen sus datos.',
  },
  {
    step: '03',
    title: 'Opera en su nombre',
    description:
      'Accede al dashboard de cada cliente, crea facturas, gestiona cobros y consulta informes como si fueras ellos.',
  },
];

export default function AgencyLandingPage() {
  return (
    <>
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <SiteHeader />

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/30 dark:to-gray-950 py-24 md:py-32">
          <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e7ff_1px,transparent_1px),linear-gradient(to_bottom,#e0e7ff_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 dark:opacity-10" />
          </div>

          <div className="mx-auto max-w-5xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Gift className="h-4 w-4" />
              Completamente gratis para asesorías y gestorías
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Gestiona la facturación
              <br />
              <span className="text-indigo-600 dark:text-indigo-400">de todos tus clientes</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Un único panel para operar como si fueras cada uno de tus autónomos y empresas.
              VeriFactu automático bajo cada NIF. Sin complicaciones, sin coste.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Crear cuenta de asesoría
                <ArrowRight className="h-5 w-5" />
              </Link>
              <span className="text-sm text-gray-500">Sin tarjeta · Gratis para siempre</span>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
              {FOR_WHO.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                En marcha en 3 pasos
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Sin migraciones, sin formación, sin trabajo previo.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {HOW_IT_WORKS.map((step, index) => (
                <div key={step.step} className="relative">
                  {index < HOW_IT_WORKS.length - 1 && (
                    <div className="absolute right-0 top-6 hidden h-0.5 w-1/2 translate-x-full bg-indigo-100 dark:bg-indigo-900 md:block" />
                  )}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-4 text-4xl font-black text-indigo-100 dark:text-indigo-900">
                      {step.step}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features grid ─────────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Todo lo que necesitas para gestionar tu cartera
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
                      <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Free plan callout ─────────────────────────────────────────────── */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <div className="rounded-3xl bg-indigo-600 p-12 text-center text-white shadow-2xl dark:bg-indigo-700">
              <div className="mb-4 flex justify-center">
                <Sparkles className="h-10 w-10 text-indigo-200" />
              </div>
              <h2 className="mb-4 text-3xl font-bold">Gratis para asesorías. Para siempre.</h2>
              <p className="mb-8 text-lg text-indigo-100">
                Nosotros te damos la herramienta gratis. A cambio, tus clientes descubren{' '}
                {brandConfig.app.name} a través de ti. Todo el mundo gana.
              </p>
              <div className="mb-8 flex flex-col items-center gap-3 text-indigo-100">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-indigo-300" />
                  Clientes ilimitados en tu cartera
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-indigo-300" />
                  Todas las funcionalidades incluidas
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-indigo-300" />
                  Soporte prioritario
                </span>
              </div>
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 shadow-lg transition-all hover:bg-indigo-50"
              >
                Empezar gratis ahora
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Preguntas frecuentes
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: '¿Necesito que mis clientes creen también una cuenta?',
                  a: 'No es necesario. Puedes dar de alta a tus clientes directamente tú mismo con sus datos fiscales. Si quieren acceder a su propio dashboard en el futuro, pueden hacerlo en cualquier momento.',
                },
                {
                  q: '¿Las facturas que emito quedan registradas bajo el NIF de cada cliente?',
                  a: 'Sí. Aunque tú las emites desde tu panel, cada factura pertenece al tenant fiscal del cliente — con su NIF, su serie y su cadena VeriFactu. Hacienda las ve como emitidas por el cliente.',
                },
                {
                  q: '¿Qué pasa si un cliente ya tiene cuenta en ' + brandConfig.app.name + '?',
                  a: 'Puedes invitarle por email y vincularte a su cuenta existente. No se pierde ningún dato previo.',
                },
                {
                  q: '¿Mis clientes pueden ver que yo accedo a su cuenta?',
                  a: 'Cada acción queda registrada internamente. Cuando actúas en nombre de un cliente, todas las facturas que creas quedan marcadas con tu usuario para auditoría.',
                },
                {
                  q: '¿Cuánto cuesta el software para asesorías?',
                  a: `${brandConfig.app.name} es completamente gratuito para asesorías y gestorías. Sin límite de clientes, sin coste mensual, sin letra pequeña.`,
                },
              ].map(({ q, a }) => (
                <div
                  key={q}
                  className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
                >
                  <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{q}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FooterLanding />
      </div>
    </>
  );
}

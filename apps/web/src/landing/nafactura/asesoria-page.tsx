import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { brandConfig } from '@easyfactura/brand-config';
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  FileText,
  Sparkles,
  Shield,
  TrendingUp,
  UserCheck,
  Repeat,
  Gift,
  ChevronRight,
  FileSpreadsheet,
  Download,
  FileDown,
  AlertTriangle,
  Eye,
  Users,
} from 'lucide-react';

export const nafacturaAsesoriaMetadata: Metadata = {
  title: `NaTicket para asesorías que gestionan facturas de sus clientes | ${brandConfig.app.name}`,
  description:
    '¿Emites tú las facturas de tus clientes autónomos navarros? Gestiona todos sus NIFs desde un solo panel con NaTicket automático. Gratis para asesorías. Sin límite de clientes.',
  keywords: [
    'naticket para asesorías Navarra',
    'programa facturación gestorías Navarra',
    'panel multi-nif naticket',
    'hacer facturas clientes autónomos Navarra',
    'naticket asesoría gratis',
    'software facturación despacho profesional Pamplona',
    'gestión facturas múltiples clientes asesoría Navarra',
    'empresa hace facturas por sus clientes Navarra',
    'software para gestorías pequeña cartera Navarra',
    'facturar por mis clientes naticket',
    'migrar excel naticket asesoría',
    'software asesoría autónoma Navarra 2026',
    'gestión multi-cliente asesoría Hacienda Foral',
    'asesoría hace facturas autónomo Navarra',
  ],
  alternates: {
    canonical: `${brandConfig.app.url}/asesoria`,
  },
  openGraph: {
    title: `Software fiscal para asesorías y gestorías en Navarra | ${brandConfig.app.name}`,
    description:
      'Gestiona el cumplimiento fiscal de todos tus clientes navarros desde un único panel. Completamente gratis para asesorías.',
    url: `${brandConfig.app.url}/asesoria`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} para asesorías — Software fiscal Navarra gratis`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Software fiscal para asesorías en Navarra | ${brandConfig.app.name}`,
    description:
      'Panel centralizado para gestionar el cumplimiento fiscal de todos tus clientes navarros. Gratis para siempre.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
  robots: { index: true, follow: true },
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `${brandConfig.app.name} para Asesorías`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: `${brandConfig.app.url}/asesoria`,
  description:
    'Software de facturación gratuito para asesorías y gestorías en Navarra. Panel centralizado para gestionar el cumplimiento fiscal con Hacienda Foral de múltiples clientes bajo sus propios NIFs.',
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

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: `${brandConfig.app.name} para Asesorías y Gestorías en Navarra`,
  serviceType: 'Software de facturación fiscal para gestorías',
  description:
    'Software de facturación gratuito para asesorías y gestorías en Navarra. Panel centralizado, cumplimiento NaTicket automático bajo el NIF de cada cliente y exportación contable.',
  provider: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
  areaServed: { '@type': 'State', name: 'Navarra' },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Completamente gratuito para asesorías y gestorías en Navarra',
  },
};

const exportServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: `${brandConfig.app.name} — Exportación contable para asesorías navarras`,
  serviceType: 'Exportación de facturas para asesoría contable Navarra',
  description:
    'Exporta facturas de tus clientes en CSV y PDF para importar en ContaPlus, Sage o A3. Cada archivo lleva los datos fiscales bajo el NIF del cliente navarro.',
  provider: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
  areaServed: { '@type': 'State', name: 'Navarra' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Formatos de exportación contable',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'CSV para ContaPlus / Sage / A3' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'PDF facturado por cliente' } },
    ],
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿NaFactura gestiona el NaTicket de mis clientes autónomos navarros?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Cuando emites facturas en nombre de tus clientes autónomos navarros desde tu panel de asesoría, el sistema aplica automáticamente el régimen NaTicket bajo el NIF de cada cliente. Hacienda Foral recibe las facturas como si el propio autónomo las hubiera emitido.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Mis clientes tienen que crearse una cuenta en NaFactura?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No es necesario. Puedes dar de alta a tus clientes directamente desde tu panel de asesoría con sus datos fiscales. Ellos no reciben ningún correo ni tienen que hacer nada. Si en el futuro quieren acceder a su propio histórico de facturas, pueden hacerlo, pero no es obligatorio.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Las facturas que emito desde mi panel quedan a nombre de mis clientes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí, exactamente. Aunque tú las emites desde tu sesión de asesoría, cada factura pertenece al NIF del cliente. Hacienda Foral las registra como emitidas por el cliente, con su número de serie y su cumplimiento NaTicket independiente.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta para mi asesoría en Navarra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cero euros. El plan de asesoría es completamente gratuito, sin límite de clientes, sin coste mensual y sin letra pequeña. NaFactura no cobra a las asesorías porque el modelo de negocio se sostiene con los planes de pago de los autónomos que prefieren gestionar sus facturas por su cuenta.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué pasa si un cliente ya tiene cuenta en NaFactura?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Puedes vincularte a su cuenta existente enviándole una invitación por email desde tu panel. Él acepta y ya puedes gestionar su facturación desde tu asesoría. No se pierde ningún dato previo y el cliente puede seguir accediendo a su cuenta cuando quiera.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo sé en todo momento a qué cliente le estoy haciendo la factura?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Hay un banner permanente visible en toda la pantalla que muestra el nombre y NIF del cliente con el que estás trabajando. No desaparece hasta que cambias de cliente manualmente. Está diseñado para evitar el error de emitir una factura bajo el NIF equivocado.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puedo importar mis clientes actuales desde Excel?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Si tienes una lista de clientes en Excel o CSV con su nombre, NIF y datos de contacto, puedes importarla directamente al panel. En cuestión de minutos tienes toda tu cartera cargada sin introducir nada a mano.',
      },
    },
    {
      '@type': 'Question',
      name: '¿NaFactura está homologado por Hacienda Foral de Navarra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. NaFactura cumple con la normativa de Hacienda Foral de Navarra para el régimen NaTicket. Genera automáticamente el código QR verificable y registra cada factura bajo el NIF del cliente. Tus clientes cumplen desde la primera factura.',
      },
    },
  ],
};

const FEATURES = [
  {
    icon: Eye,
    title: 'Panel central de todos tus clientes',
    description:
      'Ve el estado de cada cliente de un vistazo: facturas emitidas este mes, importes pendientes de cobro y alertas fiscales. Sin tener que entrar en cada cuenta por separado.',
  },
  {
    icon: Repeat,
    title: 'Cambio de NIF en un clic',
    description:
      'Pasa del dashboard de un cliente al siguiente sin cerrar sesión. Un banner permanente en pantalla te recuerda siempre bajo qué NIF estás operando.',
  },
  {
    icon: Shield,
    title: 'NaTicket automático bajo cada NIF',
    description:
      'Cada factura que emites queda registrada bajo el NIF del cliente con cumplimiento NaTicket. Hacienda Foral la ve como emitida por el cliente, no por ti.',
  },
  {
    icon: UserCheck,
    title: 'Directorio de clientes compartido',
    description:
      'Define las empresas a las que factura tu autónomo una sola vez. Se reutilizan en todas sus facturas sin volver a introducir los datos.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Exportación CSV y PDF',
    description:
      'Descarga las facturas de cada cliente en CSV o PDF para importarlas en tu software de contabilidad habitual. Compatible con ContaPlus, Sage y A3.',
  },
  {
    icon: TrendingUp,
    title: 'Informes por cliente',
    description:
      'Accede al historial completo de facturas e IVA pendiente de cualquier cliente con un clic. Datos actualizados en tiempo real para sus declaraciones trimestrales.',
  },
];

const FOR_WHO = [
  'Asesorías fiscales y contables en Navarra',
  'Gestorías que gestionan autónomos navarros',
  'Despachos de abogados con clientes en Pamplona',
  'Contables freelance con múltiples clientes navarros',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Crea tu cuenta de asesoría',
    description:
      'Regístrate con el email de tu despacho en menos de 2 minutos. Sin tarjeta de crédito, sin permanencia. El acceso para tu asesoría es gratuito para siempre.',
  },
  {
    step: '02',
    title: 'Da de alta a tus clientes navarros',
    description:
      'Añade a cada autónomo con su nombre, NIF y datos fiscales. Puedes importar desde Excel si ya tienes una lista. Tus clientes no necesitan crear ninguna cuenta si no quieren.',
  },
  {
    step: '03',
    title: 'Emite sus facturas con NaTicket',
    description:
      'Selecciona el cliente, introduce los datos de la factura y pulsa enviar. El sistema genera el QR, calcula el hash y lo registra ante Hacienda Foral bajo el NIF del cliente. Todo automático.',
  },
];

export function NafacturaAsesoriaPage() {
  return (
    <>
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(exportServiceJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <SiteHeader />

        {/* Hero */}
        <section className="relative overflow-hidden bg-white dark:bg-gray-950 py-24 md:py-32">
          <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:64px_64px] opacity-60 dark:opacity-10" />
          </div>

          <div className="mx-auto max-w-5xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
              <Gift className="h-4 w-4" />
              Gratis para asesorías navarras · Sin límite de clientes
            </div>

            <h1 data-speakable className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              ¿Haces tú las facturas
              <br />
              <span className="text-red-600 dark:text-red-400">de tus clientes en Navarra?</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Gestiona todos sus NIFs desde un solo panel. Emite sus facturas con NaTicket automático ante Hacienda Foral, como si fueras cada uno de ellos. Sin que ellos tengan que tocar nada.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                Crear cuenta de asesoría — gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                Ver cómo funciona
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sin tarjeta al registrarte
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Gratis para asesorías para siempre
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sin límite de clientes en cartera
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                NaTicket certificado Hacienda Foral
              </span>
            </div>

            {/* Alerta normativa */}
            <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    El cumplimiento con Hacienda Foral no espera.
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    Si ahora haces las facturas de tus clientes con Excel o Word, necesitas un software que cumpla con el régimen NaTicket antes de que Hacienda Foral lo exija. NaFactura es gratis para tu despacho y cumple desde la primera factura.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* El Problema: Antes vs Después */}
        <section className="bg-white py-20 dark:bg-gray-950 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                La situación que conoces
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Tus clientes navarros no saben facturar.
                <br />
                Tú lo haces por ellos.
                <br />
                NaTicket cambia eso.
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                Tienes 30, 40, quizás 50 autónomos en cartera. Agricultores, hosteleros, comerciantes de pueblos navarros. Gente de confianza que lleva años contigo. No saben de software. Cuando llega fin de mes, eres tú quien abre el Excel, rellena la factura, la imprime o la manda por email.
              </p>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                Eso ha funcionado siempre. <strong className="text-gray-900 dark:text-white">Pero Hacienda Foral exige cumplimiento NaTicket.</strong> Y la alternativa no puede ser pedirles a tus clientes que aprendan a usar un programa de facturación solos.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-red-700 dark:text-red-400">
                  <span className="text-lg">❌</span> Cómo es ahora
                </h3>
                <ul className="space-y-3">
                  {[
                    'Abres un Excel diferente para cada cliente',
                    'Copias datos a mano cada vez',
                    'Mandas el PDF por email o WhatsApp',
                    'No hay rastro en Hacienda Foral de la factura',
                    'Sin NaTicket, tus clientes quedan expuestos a sanciones',
                    'Cada cliente es un problema de cumplimiento distinto',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="mt-0.5 text-red-500">×</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-green-100 bg-green-50 p-6 dark:border-green-900/50 dark:bg-green-950/20">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-green-700 dark:text-green-400">
                  <span className="text-lg">✓</span> Cómo es con NaFactura
                </h3>
                <ul className="space-y-3">
                  {[
                    'Un solo panel con todos tus clientes navarros',
                    'Cambias de NIF en un clic',
                    'Emites la factura en menos de un minuto',
                    'NaTicket se genera solo — QR, hash, Hacienda Foral',
                    'Tus clientes cumplen sin tocar nada',
                    'Tú y tu despacho quedáis cubiertos',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Cifras */}
        <section className="bg-gray-950 py-14 md:py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
              <div>
                <div className="text-4xl font-black text-white md:text-5xl">
                  0<span className="text-emerald-400">€</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Coste para tu asesoría,
                  <br />
                  para siempre
                </p>
              </div>
              <div>
                <div className="text-4xl font-black text-white md:text-5xl">∞</div>
                <p className="mt-2 text-sm text-gray-400">
                  Clientes en cartera,
                  <br />
                  sin límite
                </p>
              </div>
              <div>
                <div className="text-4xl font-black text-white md:text-5xl">
                  &lt;60<span className="text-emerald-400">s</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Para emitir una factura
                  <br />
                  con NaTicket incluido
                </p>
              </div>
              <div>
                <div className="text-4xl font-black text-white md:text-5xl">
                  50<span className="text-emerald-400">k</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  € de multa máxima que
                  <br />
                  evitas a cada cliente
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
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
                    <div className="absolute right-0 top-6 hidden h-0.5 w-1/2 translate-x-full bg-red-100 dark:bg-red-900 md:block" />
                  )}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-4 text-4xl font-black text-red-100 dark:text-red-900">
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

        {/* Features grid */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Todo lo que necesitas para gestionar tu cartera navarra
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
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950">
                      <Icon className="h-5 w-5 text-red-600 dark:text-red-400" />
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

        {/* Export section for Navarra */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300">
                <FileSpreadsheet className="h-4 w-4" />
                Exportación contable
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Exporta las facturas de tus clientes a tu programa de contabilidad
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Genera archivos CSV y PDF con todos los datos fiscales de cada cliente. Tus clientes cumplen con Hacienda Foral de Navarra, y tú puedes importar sus datos en tu software contable habitual.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm dark:border-red-800 dark:bg-gray-900">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950">
                  <FileSpreadsheet className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">CSV para tu software contable</h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Un archivo CSV por cliente con todos los datos necesarios para importar en ContaPlus, Sage, A3 u otro programa. Una factura por fila, lista para importar.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    Descarga individual por cliente o batch
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    NIF, Base imponible, IVA, IRPF, Total
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    Compatible con ContaPlus, Sage y A3
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm dark:border-red-800 dark:bg-gray-900">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950">
                  <FileDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">PDF facturado por cliente</h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Descarga el PDF profesional de cada factura con el logos, datos fiscales y código QR. Cada PDF lleva el NIF del cliente y el compliant con la normativa Navarra.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    Un PDF por factura, listo para archivar
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    Logo y datos fiscales del cliente
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    Código QR de verificación NaTicket
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonios */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-red-600 dark:text-red-400">
                Lo que dicen las asesorías navarras
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Despachos que ya gestionan
                <br />
                NaTicket de sus clientes con {brandConfig.app.name}
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  initials: 'MI',
                  name: 'Mikel Iraizoz',
                  role: 'Asesor freelance · Pamplona',
                  quote:
                    'Llevaba tiempo preocupado por cumplir con Hacienda Navarra. Con NaFactura me despreocupé en minutos. Mis 35 clientes reciben sus facturas igual que siempre, pero ahora con NaTicket incluido.',
                },
                {
                  initials: 'AB',
                  name: 'Ana Barricarte',
                  role: 'Asesoría Barricarte · Tudela',
                  quote:
                    'Mis clientes son hosteleros y comerciantes. No saben qué es un hash ni les hace falta. Yo gestiono todo desde el panel, ellos reciben el PDF igual que siempre. El cambio fue transparente.',
                },
                {
                  initials: 'JE',
                  name: 'Jon Elizondo',
                  role: 'Gestoría Elizondo · Estella',
                  quote:
                    'Lo mejor es el panel central. De un vistazo veo todos mis clientes, qué facturas tienen pendientes y quién tiene alertas. Antes tardaba media mañana en tener esa información.',
                },
              ].map((t) => (
                <div
                  key={t.initials}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mb-3 text-lg text-amber-400">★★★★★</div>
                  <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    <span className="text-red-600 dark:text-red-400">"</span>
                    {t.quote}
                    <span className="text-red-600 dark:text-red-400">"</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600 dark:bg-red-950 dark:text-red-400">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NaTicket for asesoria */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="overflow-hidden rounded-3xl border border-red-100 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
              <div className="grid md:grid-cols-5">
                <div className="p-10 md:col-span-3 md:p-14">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700 dark:bg-red-900 dark:text-red-300">
                    <Shield className="h-4 w-4" />
                    NaTicket para asesorías
                  </div>
                  <h2 className="mb-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                    El NaTicket de tus clientes, bajo control desde tu panel
                  </h2>
                  <p className="mb-6 text-gray-600 dark:text-gray-400">
                    Tus clientes autónomos en Navarra están obligados a emitir con NaTicket ante
                    Hacienda Foral. Desde tu panel de asesoría,{' '}
                    <strong className="font-semibold text-gray-900 dark:text-white">
                      cada factura que emites en su nombre cumple automáticamente con NaTicket
                    </strong>{' '}
                    bajo el NIF de cada cliente. Lo configuras una vez, el sistema gestiona el
                    resto.
                  </p>
                  <ul className="space-y-3">
                    {[
                      'NaTicket aplicado automáticamente bajo el NIF de cada cliente',
                      'Hacienda Foral recibe las facturas como si el cliente las emitiera',
                      'Sin configuración extra por cada autónomo que añadas a tu cartera',
                    ].map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-center bg-red-100 p-10 md:col-span-2 dark:bg-red-900/20">
                  <div className="text-center">
                    <p className="mb-1 text-sm font-medium uppercase tracking-widest text-red-500 dark:text-red-400">
                      Módulo NaTicket
                    </p>
                    <div className="mb-3 text-7xl font-bold text-red-600 dark:text-red-400">0€</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Incluido en el plan gratuito
                      <br />
                      para asesorías navarras
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Free plan callout */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <div className="rounded-3xl bg-red-600 p-12 text-center text-white shadow-2xl dark:bg-red-700">
              <div className="mb-4 flex justify-center">
                <Sparkles className="h-10 w-10 text-red-200" />
              </div>
              <h2 className="mb-4 text-3xl font-bold">
                Gratis para asesorías navarras. Para siempre.
              </h2>
              <p className="mb-8 text-lg text-red-100">
                Nosotros te damos la herramienta gratis. A cambio, tus clientes navarros descubren{' '}
                {brandConfig.app.name} a través de ti. Todo el mundo gana.
              </p>
              <div className="mb-8 flex flex-col items-center gap-3 text-red-100">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-red-300" />
                  Clientes navarros ilimitados en tu cartera
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-red-300" />
                  Todas las funcionalidades incluidas
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-red-300" />
                  Soporte prioritario
                </span>
              </div>
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-red-600 shadow-lg transition-all hover:bg-red-50"
              >
                Empezar gratis ahora
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Preguntas frecuentes
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: '¿NaFactura gestiona el NaTicket de mis clientes autónomos navarros?',
                  a: 'Sí. Cuando emites facturas en nombre de tus clientes autónomos navarros desde tu panel de asesoría, el sistema aplica automáticamente el régimen NaTicket bajo el NIF de cada cliente. Hacienda Foral recibe las facturas como si el propio autónomo las hubiera emitido.',
                },
                {
                  q: '¿Necesito que mis clientes navarros creen también una cuenta?',
                  a: 'No es necesario. Puedes dar de alta a tus clientes directamente tú mismo con sus datos fiscales. Si quieren acceder a su propio dashboard en el futuro, pueden hacerlo en cualquier momento.',
                },
                {
                  q: '¿Las facturas quedan registradas bajo el NIF de cada cliente ante Hacienda Navarra?',
                  a: 'Sí. Aunque tú las emites desde tu panel, cada factura pertenece al tenant fiscal del cliente — con su NIF y su serie. Hacienda Foral las ve como emitidas por el cliente, con cumplimiento NaTicket incluido.',
                },
                {
                  q: '¿Cuántos clientes navarros puedo añadir a mi panel de asesoría?',
                  a: 'No hay límite. Puedes gestionar la cartera completa de tu asesoría, con decenas o cientos de clientes navarros, desde el mismo panel y sin coste adicional.',
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
                  q: '¿Es compatible con otros programas de contabilidad que ya utilizo?',
                  a: 'Puedes exportar todas las facturas de cada cliente en PDF o CSV para importarlas en tu software de contabilidad habitual.',
                },
                {
                  q: '¿Cuánto cuesta el software para asesorías en Navarra?',
                  a: `${brandConfig.app.name} es completamente gratuito para asesorías y gestorías en Navarra. Sin límite de clientes, sin coste mensual, sin letra pequeña.`,
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

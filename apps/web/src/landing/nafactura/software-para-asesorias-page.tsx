import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { brandConfig } from '@easyfactura/brand-config';
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  Repeat,
  Download,
  FileSpreadsheet,
  FileDown,
  ChevronRight,
  Sparkles,
  Gift,
  Building2,
  Database,
  ClipboardCheck,
  BarChart3,
  Layers,
  Zap,
} from 'lucide-react';

export const nafacturaSoftwareParaAsesoriasMetadata: Metadata = {
  title: `Software para asesorías en Navarra que hacen facturas por sus clientes | ${brandConfig.app.name}`,
  description:
    '¿Tu asesoría hace las facturas de tus clientes navarros? Un solo panel para todos sus NIFs con NaTicket automático. Exporta a CSV y PDF. Gratis para asesorías.',
  keywords: [
    'software para asesorías Navarra',
    'programa asesorías facturación Navarra',
    'gestión multi-cliente asesorías Navarra',
    'software gestoría NaTicket',
    'facturación múltiples clientes asesoría Navarra',
    'panel asesoría software Navarra',
    'software para gestorías Pamplona',
    'herramienta asesorías contables Navarra',
    'programa gestión cartera clientes asesoría Navarra',
    'asesoría hace facturas por sus clientes Navarra',
    'empresa hace facturas autónomo asesoría Navarra',
    'programa hacer facturas clientes autónomos Navarra',
    'software facturación despacho profesional Pamplona',
    'migrar excel naticket asesoría',
  ],
  alternates: {
    canonical: `${brandConfig.app.url}/software-para-asesorias`,
  },
  openGraph: {
    title: `Software para asesorías en Navarra que hacen facturas por sus clientes | ${brandConfig.app.name}`,
    description:
      '¿Tu asesoría hace las facturas de tus clientes navarros? Un solo panel para todos sus NIFs con NaTicket automático. Gratis.',
    url: `${brandConfig.app.url}/software-para-asesorias`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Software para asesorías en Navarra`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Software para asesorías en Navarra | ${brandConfig.app.name}`,
    description:
      'Gestiona todos tus clientes desde un solo panel. NaTicket automático, exportación CSV/PDF. Gratis para asesorías navarras.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
  robots: { index: true, follow: true },
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `${brandConfig.app.name} — Software para Asesorías en Navarra`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: `${brandConfig.app.url}/software-para-asesorias`,
  description:
    'Software de facturación multi-cliente para asesorías y gestorías en Navarra. Panel centralizado para gestionar la facturación con NaTicket de todos tus clientes navarros bajo sus propios NIFs.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Completamente gratuito para asesorías y gestorías en Navarra',
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
      name: 'Software para asesorías',
      item: `${brandConfig.app.url}/software-para-asesorias`,
    },
  ],
};

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: `${brandConfig.app.name} — Gestión multi-cliente para asesorías Navarra`,
  serviceType: 'Software de facturación multi-cliente para gestorías Navarra',
  description:
    'Panel centralizado para gestionar la facturación con NaTicket de todos los clientes de una asesoría o gestoría navarra. Cada factura queda registrada bajo el NIF del cliente ante la Hacienda Foral de Navarra.',
  provider: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
  areaServed: { '@type': 'State', name: 'Navarra' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Servicios para asesorías navarras',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Panel multi-cliente Navarra' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'NaTicket automático' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Exportación CSV/PDF' } },
    ],
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Gratuito para asesorías y gestorías en Navarra',
  },
};

const exportServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: `${brandConfig.app.name} — Exportación contable para asesorías Navarra`,
  serviceType: 'Exportación de facturas en CSV y PDF para asesorías contables Navarra',
  description:
    'Exporta las facturas de todos tus clientes navarros en CSV y PDF. Cada archivo incluye los datos fiscales bajo el NIF del cliente correspondiente para importación en ContaPlus, Sage o A3.',
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
      name: '¿Puedo gestionar las facturas de todos mis clientes navarros desde un solo panel?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. El panel de asesoría te permite acceder al dashboard de cada cliente con un solo clic. Emites facturas en nombre de cada uno, y todas quedan registradas bajo su NIF ante la Hacienda Foral de Navarra. Sin límite de clientes.',
      },
    },
    {
      '@type': 'Question',
      name: '¿El NaTicket se aplica automáticamente para cada cliente?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Cuando emites una factura desde tu panel en nombre de un autónomo navarro, el sistema aplica automáticamente el cumplimiento NaTicket bajo el NIF de ese cliente. No necesitas configuración adicional por cada cliente que añadas.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo exporto las facturas de mis clientes a mi programa de contabilidad?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Desde el panel de cada cliente puedes descargar un archivo CSV con todos los datos fiscales (NIF, base imponible, IVA, IRPF, total) o un PDF profesional por factura. El CSV es compatible con ContaPlus, Sage y A3.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Mis clientes necesitan crear una cuenta en NaFactura?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No es necesario. Puedes dar de alta a tus clientes directamente tú mismo con sus datos fiscales. Si el cliente ya tiene cuenta, puedes invitarle por email y vincularte a su tenant existente.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué pasa con el cumplimiento fiscal ante la Hacienda Foral de Navarra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Cada factura que emites en nombre de un cliente queda registrada bajo su NIF ante la Hacienda Foral. El sistema genera hash encadenado, firma electrónica y código QR normativo automáticamente. Hacienda Navarra recibe las facturas como si el cliente las hubiera emitido directamente.',
      },
    },
    {
      '@type': 'Question',
      name: '¿NaFactura es realmente gratis para asesorías navarras?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `${brandConfig.app.name} es completamente gratuito para asesorías y gestorías en Navarra. Sin límite de clientes, sin coste mensual, sin letra pequeña. El modelo de negocio se sustenta en que tus clientes navarros descubren la plataforma a través de ti.`,
      },
    },
  ],
};

const DIFFERENTIATORS = [
  {
    icon: LayoutDashboard,
    title: 'Panel multi-cliente navarro',
    description: 'Gestiona la facturación de todos tus clientes desde un único panel. Cambio de contexto en un clic.',
  },
  {
    icon: Shield,
    title: 'NaTicket automático',
    description: 'Cada factura cumple con la normativa de Hacienda Foral de Navarra bajo el NIF del cliente correspondiente.',
  },
  {
    icon: Download,
    title: 'Exportación CSV/PDF',
    description: 'Descarga las facturas de cada cliente en CSV para ContaPlus, Sage y A3, o en PDF profesional.',
  },
  {
    icon: Gift,
    title: 'Gratis para asesorías navarras',
    description: 'Sin límite de clientes, sin coste mensual, sin letra pequeña. Completamente gratuito para gestorías.',
  },
];

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Panel centralizado clientes Navarra',
    description:
      'Accede al dashboard de cada cliente con un solo clic. Sin cerrar sesión, sin complicaciones. Todo tu portfolio navarro en una sola pantalla.',
  },
  {
    icon: Repeat,
    title: 'Cambio de contexto en 1 clic',
    description:
      'Pasa de la facturación de un cliente a la del siguiente en segundos. Un banner permanente te indica siempre en qué empresa estás operando.',
  },
  {
    icon: Users,
    title: 'Directorio compartido',
    description:
      'Crea una empresa o autónomo una sola vez y reutilízalo en todos tus clientes. Sin duplicados, sin trabajo repetido entre carteras.',
  },
  {
    icon: Shield,
    title: 'NaTicket automático Hacienda Navarra',
    description:
      'El sistema aplica automáticamente el cumplimiento NaTicket bajo el NIF de cada cliente. Cada factura cumple con la Hacienda Foral sin configuración extra.',
  },
  {
    icon: ClipboardCheck,
    title: 'Log de auditoría completo',
    description:
      'Cada acción queda registrada con tu usuario. Cuando operas en nombre de un cliente, el sistema lleva un registro de auditoría para cada factura emitida.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Exportación CSV/PDF contable',
    description:
      'Descarga las facturas de cada cliente en CSV listo para ContaPlus, Sage o A3. Cada archivo lleva los datos fiscales bajo el NIF del cliente navarro.',
  },
];

const USE_CASES = [
  {
    icon: Building2,
    title: 'Asesorías fiscales en Pamplona',
    description:
      'Gestiona la facturación de decenas de autónomos y pequeñas empresas desde tu panel. Cada cliente con su NIF, su serie y su cumplimiento NaTicket automático.',
  },
  {
    icon: Database,
    title: 'Gestorías con cartera larga',
    description:
      'Si gestionas más de 20 clientes navarros, el panel multi-cliente te permite operar sin cambiar de sesión. Todo bajo control, todo centralizado.',
  },
  {
    icon: BarChart3,
    title: 'Despachos contables multi-sector',
    description:
      'De hosteleros a informáticos, de Tudela a Estella. El directorio compartido te permite crear una vez y asignar a tantos clientes como necesites.',
  },
  {
    icon: Layers,
    title: 'Consultorías con clientes Hacienda Navarra',
    description:
      'Si tus clientes tributan ante la Hacienda Foral de Navarra, necesitas un software que entienda el Convenio Económico. NaFactura lo hace automáticamente.',
  },
];

const COMPARISON_ROWS = [
  { feature: 'Panel multi-cliente para gestionar varios clientes', them: false, us: true },
  { feature: 'NaTicket automático bajo el NIF de cada cliente', them: false, us: true },
  { feature: 'Cumplimiento con Hacienda Foral de Navarra', them: false, us: true },
  { feature: 'Exportación CSV para ContaPlus / Sage / A3', them: false, us: true },
  { feature: 'Log de auditoría por cada acción en nombre del cliente', them: false, us: true },
  { feature: 'Directorio compartido sin duplicados', them: false, us: true },
  { feature: 'Gratis para asesorías y gestorías navarras', them: false, us: true },
  { feature: 'Cambio de contexto entre clientes en 1 clic', them: false, us: true },
  { feature: 'Soporte técnico especializado en Navarra', them: 'Variable', us: true },
];

// Machine-readable version of the comparison table — the visual cells use
// icons, so crawlers get this plus the sr-only text in each cell.
const comparisonTableJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Table',
  name: `Comparativa: ${brandConfig.app.name} frente a software tradicional para asesorías navarras`,
  about:
    'Comparativa de software de facturación para asesorías en Navarra: panel multi-cliente, NaTicket por NIF de cliente, cumplimiento con Hacienda Foral, exportación CSV, log de auditoría, directorio compartido, precio y soporte.',
  description: `${brandConfig.app.name} ofrece panel multi-cliente, NaTicket automático bajo el NIF de cada cliente, cumplimiento con Hacienda Foral de Navarra, exportación CSV para ContaPlus/Sage/A3, log de auditoría por acción, directorio compartido y cambio de contexto en un clic — gratis para asesorías y gestorías navarras. El software tradicional no incluye estas funciones.`,
};

const FAQS = [
  {
    q: '¿Puedo gestionar las facturas de todos mis clientes navarros desde un solo panel?',
    a: 'Sí. El panel de asesoría te permite acceder al dashboard de cada cliente con un solo clic. Emites facturas en nombre de cada uno, y todas quedan registradas bajo su NIF ante la Hacienda Foral de Navarra. Sin límite de clientes.',
  },
  {
    q: '¿El NaTicket se aplica automáticamente para cada cliente?',
    a: 'Sí. Cuando emites una factura desde tu panel en nombre de un autónomo navarro, el sistema aplica automáticamente el cumplimiento NaTicket bajo el NIF de ese cliente. No necesitas configuración adicional por cada cliente que añadas.',
  },
  {
    q: '¿Cómo exporto las facturas de mis clientes a mi programa de contabilidad?',
    a: 'Desde el panel de cada cliente puedes descargar un archivo CSV con todos los datos fiscales (NIF, base imponible, IVA, IRPF, total) o un PDF profesional por factura. El CSV es compatible con ContaPlus, Sage y A3.',
  },
  {
    q: '¿Mis clientes necesitan crear una cuenta en NaFactura?',
    a: 'No es necesario. Puedes dar de alta a tus clientes directamente tú mismo con sus datos fiscales. Si el cliente ya tiene cuenta, puedes invitarle por email y vincularte a su tenant existente sin perder ningún dato.',
  },
  {
    q: '¿Qué pasa con el cumplimiento fiscal ante la Hacienda Foral de Navarra?',
    a: 'Cada factura que emites en nombre de un cliente queda registrada bajo su NIF ante la Hacienda Foral. El sistema genera hash encadenado, firma electrónica y código QR normativo automáticamente. Hacienda Navarra recibe las facturas como si el cliente las hubiera emitido directamente.',
  },
  {
    q: '¿NaFactura es realmente gratis para asesorías navarras?',
    a: `${brandConfig.app.name} es completamente gratuito para asesorías y gestorías en Navarra. Sin límite de clientes, sin coste mensual, sin letra pequeña. El modelo de negocio se sustenta en que tus clientes navarros descubren la plataforma a través de ti. Todo el mundo gana.`,
  },
];

export function NafacturaSoftwareParaAsesoriasPage() {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(exportServiceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonTableJsonLd) }}
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
              Completamente gratis para asesorías y gestorías navarras
            </div>

            <h1 data-speakable className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Software para asesorías en Navarra:
              <br />
              <span className="text-red-600 dark:text-red-400">
                gestiona todos tus clientes desde un solo panel
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Panel centralizado para gestionar la facturación con NaTicket de todos tus clientes
              navarros. Cada factura queda registrada bajo el NIF del cliente ante la Hacienda Foral
              de Navarra. Sin complicaciones, sin coste.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-red-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
              >
                Crear cuenta de asesoría
                <ArrowRight className="h-5 w-5" />
              </Link>
              <span className="text-sm text-gray-500">Sin tarjeta · Gratis para siempre</span>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
              {[
                'Panel multi-cliente para gestorías navarras',
                'NaTicket automático para cada cliente',
                'Exportación CSV/PDF para ContaPlus, Sage y A3',
              ].map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Key differentiators */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Diseñado para las necesidades específicas de las asesorías navarras
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {DIFFERENTIATORS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm dark:border-red-800 dark:bg-gray-900"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 mx-auto dark:bg-red-950">
                      <Icon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Todo lo que necesitas para gestionar tu cartera de clientes navarros
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
                    <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* NaTicket callout */}
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
                    El NaTicket de cada cliente, gestionado desde tu panel de asesoría
                  </h2>
                  <p className="mb-6 text-gray-600 dark:text-gray-400">
                    Tus clientes autónomos en Navarra están obligados a emitir con NaTicket ante la
                    Hacienda Foral. Desde tu panel de asesoría, cada factura que emites en su nombre{' '}
                    <strong className="font-semibold text-gray-900 dark:text-white">
                      cumple automáticamente con NaTicket
                    </strong>{' '}
                    bajo el NIF de cada cliente. Lo configuras una vez, el sistema gestiona el resto
                    para toda tu cartera.
                  </p>
                  <ul className="space-y-3">
                    {[
                      'NaTicket aplicado automáticamente bajo el NIF de cada cliente de tu cartera',
                      'Hacienda Foral recibe las facturas como si el cliente las hubiera emitido',
                      'Sin configuración adicional por cada autónomo que añadas a tu panel',
                      'Hash encadenado y firma electrónica para cada factura emitida',
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

        {/* Export section */}
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
                Genera archivos CSV y PDF con todos los datos fiscales de cada cliente navarro. Cada
                archivo lleva el NIF del cliente correspondiente para que puedas importarlo
                correctamente en tu software contable.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-red-100 bg-white p-6 shadow-sm dark:border-red-800 dark:bg-gray-900">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950">
                  <FileSpreadsheet className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                  CSV para tu software contable
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Un archivo CSV por cliente con todos los datos necesarios para importar en
                  ContaPlus, Sage, A3 u otro programa. Una factura por fila, lista para importar
                  directamente.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    Descarga individual por cliente o batch completo
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    NIF, Base imponible, IVA, IRPF, Total por factura
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
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                  PDF facturado por cliente
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Descarga el PDF profesional de cada factura con el logo, datos fiscales y código
                  QR. Cada PDF lleva el NIF del cliente y el sello de cumplimiento con la normativa
                  Navarra.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    Un PDF por factura, listo para archivar
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    Logo y datos fiscales del cliente navarro
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

        {/* Use cases */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                ¿Para quién es este software de gestión multi-cliente?
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {USE_CASES.map((uc) => {
                const Icon = uc.icon;
                return (
                  <div
                    key={uc.title}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-950">
                      <Icon className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{uc.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{uc.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                ¿Por qué elegir NaFactura frente a otros programas para asesorías?
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                La mayoría de programas de facturación no están adaptados a las necesidades específicas
                de las asesorías navarras con clientes sujetos a la Hacienda Foral y NaTicket.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:bg-gray-900 dark:border-gray-800">
                      <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300">
                        Característica
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-gray-400">
                        Software tradicional
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-red-600">
                        {brandConfig.app.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_ROWS.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b border-gray-100 dark:border-gray-800 ${
                          i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-900/50'
                        }`}
                      >
                        <td className="px-6 py-4 font-medium text-gray-700 dark:text-gray-300">
                          {row.feature}
                        </td>
                        <td className="px-6 py-4 text-center">
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
                              <span aria-hidden="true" className="text-gray-300">
                                —
                              </span>
                              <span className="sr-only">No</span>
                            </>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <CheckCircle2
                            aria-hidden="true"
                            className="mx-auto h-5 w-5 text-red-500"
                          />
                          <span className="sr-only">Sí</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              En resumen: el software tradicional no ofrece panel multi-cliente, NaTicket bajo el
              NIF de cada cliente, directorio compartido ni log de auditoría — funciones que{' '}
              {brandConfig.app.name} incluye de serie para asesorías, junto con la exportación CSV
              para ContaPlus, Sage y A3. Y es gratis para asesorías y gestorías navarras, sin
              límite de clientes.
            </p>
          </div>
        </section>

        {/* Free CTA */}
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
                  Panel multi-cliente con cambio de contexto en 1 clic
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-red-300" />
                  NaTicket automático para todos tus clientes
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-red-300" />
                  Exportación CSV/PDF para ContaPlus, Sage y A3
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
              Preguntas frecuentes sobre el software para asesorías en Navarra
            </h2>
            <div className="space-y-6">
              {FAQS.map(({ q, a }) => (
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
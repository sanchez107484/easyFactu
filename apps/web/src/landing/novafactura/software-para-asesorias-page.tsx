import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import FaqSection from '@/components/FaqSection';
import { brandConfig } from '@easyfactura/brand-config';
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  FileText,
  Shield,
  TrendingUp,
  UserCheck,
  Repeat,
  Gift,
  ChevronRight,
  FileSpreadsheet,
  Download,
  ArrowDownToLine,
  Users,
  Zap,
  Clock,
  Star,
  Building2,
  Database,
  ClipboardCheck,
  FileOutput,
  BarChart3,
  Lock,
  Globe,
} from 'lucide-react';

const faqs = [
  {
    q: '¿Qué diferencia hay entre el panel de asesoría y una cuenta normal de autónomo?',
    a: 'El panel de asesoría te permite operar simultáneamente sobre múltiples tenants (los NIF de tus clientes) desde una sola sesión. Tú sigues siendo tú, pero accedes al entorno fiscal de cada cliente como operador autorizado. Cada factura se emite bajo el NIF del cliente, no bajo el tuyo. Es exactamente igual que si el cliente estuviera sentado delante del programa, pero tú lo manejas todo.',
  },
  {
    q: '¿Puedo usar NovaFactura si ya gestiono a mis clientes con otro software?',
    a: 'Sí. Puedes importar la base de clientes desde Excel o CSV con sus datos fiscales (NIF, razón social, dirección, tipos de IVA). Los datos de facturación histórica también se pueden importar. El cambio es gradual: empiezas emitiendo facturas nuevas con VeriFactu y mantienes el histórico accesible. No es necesario migrar todo de golpe.',
  },
  {
    q: '¿El software es realmente gratis para asesorías sin límite de clientes?',
    a: `Sí. ${brandConfig.app.name} es gratuito para asesorías y gestorías para siempre. No hay límite en el número de clientes que gestionas, ni en el número de facturas emitidas.`,
  },
  {
    q: '¿Cómo funciona la exportación contable para Sage, A3CON, Cegid o Diamacon?',
    a: 'Desde el panel de cada cliente puedes descargar un archivo Excel (.xlsx) estructurado con todas las facturas del periodo que necesites (mensual, trimestral o anual). El archivo tiene las columnas mapeadas según el formato que acepta cada programa: Sage, Cegid y Diamacon usan estructuras similares; para A3CON de Wolters Kluwer incluimos una guía paso a paso con el mapeo exacto de columnas. Solo tienes que importar el archivo en tu programa de contabilidad habitual.',
  },
  {
    q: '¿Cada cliente tiene su propia serie de facturación y su cadena VeriFactu?',
    a: 'Sí. Cada cliente es un tenant independiente con su propio NIF, su propia serie correlativa y su propia cadena VeriFactu. Esto significa que si gestionas 20 autónomos, cada uno tiene su numeración independiente, su hash encadenado separado y sus registros separados ante la AEAT. Nada se mezcla entre clientes.',
  },
  {
    q: '¿Necesito que mis clientes tengan certificado digital para usar VeriFactu?',
    a: `No. ${brandConfig.app.name} incluye el certificado digital del software garante para cumplir con VeriFactu. El certificado del cliente solo sería necesario si quisiera firmar electrónicamente en nombre propio. En la práctica, como asesoría operas con tu propio certificado de empresa o con el certificado del software garante para la emisión de las facturas.`,
  },
];

export const novafacturaSoftwareParaAsesoriasMetadata: Metadata = {
  title: `Programa de Facturación para Asesorías Gratis | Multi-cliente + VeriFactu | ${brandConfig.app.name}`,
  description: `Panel único para facturar por todos tus clientes: VeriFactu por NIF, exportación a Sage, A3CON, Cegid y Diamacon. Gratis y sin límite de clientes.`,
  keywords: [
    'software para asesorías',
    'programa asesorías facturación',
    'gestión multi-cliente asesorías',
    'software gestoría verifactu',
    'facturación múltiples clientes asesoría',
    'panel asesoría software',
    'software para gestorías',
    'herramienta asesorías contables',
    'programa gestión cartera clientes asesoría',
    'asesoría hace facturas por sus clientes',
    'empresa hace facturas autónomo asesoría',
    'programa hacer facturas clientes autónomos',
    'software facturación despacho profesional',
    'migrar excel verifactu asesoría',
  ],
  alternates: { canonical: `${brandConfig.app.url}/software-para-asesorias` },
  openGraph: {
    title: `Programa de Facturación para Asesorías Gratis | Multi-cliente + VeriFactu | ${brandConfig.app.name}`,
    description: `Panel único para facturar por todos tus clientes: VeriFactu por NIF, exportación a Sage, A3CON, Cegid y Diamacon. Gratis y sin límite de clientes.`,
    url: `${brandConfig.app.url}/software-para-asesorias`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Software para asesorías con VeriFactu`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Software para asesorías que hacen facturas a sus clientes | ${brandConfig.app.name}`,
    description: `Un solo panel para gestionar la facturación VeriFactu de todos tus clientes. Gratis para asesorías.`,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `${brandConfig.app.name} — Software para Asesorías`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: `${brandConfig.app.url}/software-para-asesorias`,
  description:
    'Software de facturación VeriFactu para asesorías y gestorías. Panel centralizado para gestionar la facturación de múltiples clientes bajo sus propios NIFs. Exportación a Sage, A3CON, Cegid y Diamacon.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Completamente gratuito para asesorías y gestorías hasta 2027',
  },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
};

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: `${brandConfig.app.name} — Servicio de Gestión de Facturación para Asesorías`,
  serviceType: 'Software de facturación VeriFactu multi-cliente para asesorías',
  description:
    'Panel centralizado para gestionar la facturación VeriFactu de múltiples clientes. Cada factura se emite bajo el NIF del cliente correspondiente. Incluye exportación contable a Sage, A3CON, Cegid y Diamacon.',
  provider: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
  areaServed: { '@type': 'Country', name: 'España' },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Gratuito para asesorías y gestorías hasta 2027',
  },
};

const exportServiceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: `${brandConfig.app.name} — Exportación contable para asesorías`,
  serviceType: 'Exportación de facturas para programas de contabilidad',
  description:
    'Exporta facturas a Sage, a3asesor (Wolters Kluwer), Cegid y Diamacon. Archivos Excel formateados con el mapeo exacto de columnas para cada programa. Una descarga por cliente, sin configuración cada vez.',
  provider: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
  areaServed: { '@type': 'Country', name: 'España' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Formatos de exportación contable',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Sage Contabilidad' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'a3asesor | Wolters Kluwer' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Cegid' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Diamacon (Comeralia)' } },
    ],
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

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

// Machine-readable version of the comparison table — the visual cells use
// icons, so crawlers get this plus the sr-only text in each cell.
const comparisonTableJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Table',
  name: `Comparativa de software para asesorías: ${brandConfig.app.name} vs. Holded vs. Quipu`,
  about:
    'Comparativa de funcionalidades de software de facturación para asesorías: panel multi-cliente, VeriFactu por NIF de cliente, directorio de empresas compartido, cambio de contexto, log de auditoría, exportación contable (Sage, A3CON, Cegid, Diamacon) y precio.',
  description: `${brandConfig.app.name} incluye panel multi-cliente, VeriFactu bajo el NIF de cada cliente, directorio de empresas compartido, cambio de contexto en un clic, log de auditoría por cliente y exportación a Sage, A3CON, Cegid y Diamacon. Es gratuito para asesorías hasta 2027. Holded exporta a Sage pero no a A3CON, Cegid ni Diamacon, y parte de 40€/mes. Quipu no ofrece esas exportaciones ni directorio compartido, y parte de 25€/mes.`,
};

const KEY_DIFFERENTIATORS = [
  {
    icon: LayoutDashboard,
    title: 'Panel multi-cliente',
    description:
      'Todos tus clientes en una sola pantalla. Accede a cada uno con un clic, sin cerrar sesión ni cambiar de cuenta.',
  },
  {
    icon: Shield,
    title: 'VeriFactu por NIF',
    description:
      'Cada factura se emite bajo el NIF del cliente. La cadena VeriFactu, el hash y el envío a la AEAT son independientes por tenant.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Exportación a Sage, A3CON, Cegid y Diamacon',
    description:
      'Descarga archivos Excel formateados con el mapeo exacto de columnas para cada programa contable. Sin trabajo manual de reacondicionamiento.',
  },
  {
    icon: Gift,
    title: 'Gratis para asesorías',
    description:
      'Sin límite de clientes, sin coste por cliente adicional, sin funcionalidades restringidas. Gratis hasta 2027.',
  },
];

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Panel centralizado de clientes',
    description:
      'Accede al dashboard de cada cliente sin salir de tu sesión. Un banner permanente te indica en qué empresa estás operando en cada momento. Cambia de contexto en menos de un segundo.',
  },
  {
    icon: Repeat,
    title: 'Cambio de contexto en 1 clic',
    description:
      'Pasa de facturar para el cliente A a operar en el entorno del cliente B con un solo clic. Sin necesidad de cerrar sesión, sin cookies, sin múltiples cuentas. Todo fluye desde tu panel de asesoría.',
  },
  {
    icon: Database,
    title: 'Directorio compartido de clientes y proveedores',
    description:
      'Crea una empresa o proveedor una sola vez y reutilízala en todos tus clientes. Si el proveedor "Suministros López SL" trabaja con 8 de tus clientes, lo das de alta una sola vez y lo asignas a cada uno.',
  },
  {
    icon: Zap,
    title: 'VeriFactu automático para cada cliente',
    description:
      'Cada factura cumple la Ley Antifraude 11/2021 bajo el NIF correspondiente. Hash encadenado SHA-256, código QR verificable y envío a la AEAT en tiempo real. Configurado desde el primer momento, sin intervención tuya.',
  },
  {
    icon: ClipboardCheck,
    title: 'Log de auditoría completo',
    description:
      'Cada acción que realizas queda registrada con tu usuario, fecha y hora. El cliente puede consultar quién ha creado o modificado cada documento. Trazabilidad total sobre quién ha hecho qué y cuándo.',
  },
  {
    icon: FileOutput,
    title: 'Exportación contable directa',
    description:
      'Genera archivos Excel para Sage, A3CON, Cegid y Diamacon desde el panel. Selecciona el periodo, descarga el archivo y impórtalo en tu programa de contabilidad. El mapeo de columnas está optimizado para cada formato.',
  },
];

const A3CON_MAPPING = [
  {
    column: 'Fecha de factura',
    a3con: 'FECHA',
    description: 'Fecha de emisión en formato DD/MM/AAAA',
  },
  {
    column: 'Número de factura',
    a3con: 'SERIE-NUMERO',
    description: 'Serie + número con formato serie-numero (ej: A-2025-001)',
  },
  {
    column: 'NIF del cliente',
    a3con: 'NIF',
    description: 'NIF o CIF del cliente sin espacios ni guiones',
  },
  {
    column: 'Nombre/Razón social',
    a3con: 'NOMBRE',
    description: 'Nombre completo o razón social del cliente',
  },
  {
    column: 'Base imponible',
    a3con: 'BASE',
    description: 'Importe base sin IVA. Varias líneas si hay diferentes tipos',
  },
  {
    column: 'Tipo de IVA',
    a3con: 'IVA%',
    description: 'Porcentaje de IVA aplicado (4%, 10%, 21%)',
  },
  { column: 'Cuota de IVA', a3con: 'IVA_IMPORTE', description: 'Importe de la cuota de IVA' },
  {
    column: 'Retención IRPF',
    a3con: 'IRPF%',
    description: 'Porcentaje de retención IRPF si aplica (7%, 15%)',
  },
  {
    column: 'Total factura',
    a3con: 'TOTAL',
    description: 'Importe total incluyendo IVA menos IRPF',
  },
];

const USE_CASES = [
  {
    icon: Users,
    title: 'La asesoría que quiere un panel único para todos sus clientes',
    description:
      'Tienes 15 autónomos en cartera y necesitas facturar para cada uno sin perder tiempo. Con el panel multi-cliente accedes a todos desde una sola sesión. Cada factura sale con el NIF correcto, la serie correcta y el VeriFactu correcto.',
    points: [
      'Un solo login para todos tus clientes',
      'VeriFactu independiente por NIF de cliente',
      'Vista agregada de toda tu cartera',
    ],
  },
  {
    icon: BarChart3,
    title: 'La gestoría que necesita exportar a su programa de contabilidad',
    description:
      'Trabajas con Sage, A3CON, Cegid o Diamacon y necesitas los datos de facturación de tus clientes en el formato correcto. Descargas el Excel con las columnas ya mapeadas y lo importas directamente. Sin reacondicionar datos, sin copiar y pegar.',
    points: [
      'Archivos Excel listos para importar',
      'Mapeo de columnas optimizado por programa',
      'Filtra por periodo: mes, trimestre o año',
    ],
  },
  {
    icon: Shield,
    title: 'La asesoría que quiere llegar preparada a VeriFactu',
    description:
      'Tus clientes son autónomos que tienen que cumplir VeriFactu antes de julio de 2027. Necesitas una herramienta que garantice el cumplimiento sin que tengas que configurar nada. Cada cliente tiene su cadena VeriFactu desde el primer día.',
    points: [
      'Hash encadenado automático desde la primera factura',
      'Envío a la AEAT en tiempo real',
      'Código QR verificable en cada factura',
    ],
  },
  {
    icon: Lock,
    title: 'El despacho que necesita trazabilidad frente a sus clientes',
    description:
      'Cuando operas en nombre de un cliente, necesitas que quede constancia de quién ha hecho cada acción. El log de auditoría registra tu usuario, la acción y la fecha/hora. El cliente puede consultarlo en cualquier momento.',
    points: [
      'Log de auditoría por cada acción',
      'Trazabilidad completa cliente-asesor',
      'El cliente puede consultar el historial',
    ],
  },
];

const COMPARISON = [
  { label: 'Panel multi-cliente centralizado', nova: true, holded: true, quipu: false },
  { label: 'VeriFactu bajo NIF de cada cliente', nova: true, holded: true, quipu: false },
  { label: 'Directorio de empresas compartido', nova: true, holded: false, quipu: false },
  { label: 'Cambio de contexto en 1 clic', nova: true, holded: false, quipu: false },
  { label: 'Log de auditoría por cliente', nova: true, holded: false, quipu: false },
  { label: 'Exportación a Sage', nova: true, holded: true, quipu: false },
  { label: 'Exportación a A3CON (Wolters Kluwer)', nova: true, holded: false, quipu: false },
  { label: 'Exportación a Cegid', nova: true, holded: false, quipu: false },
  { label: 'Exportación a Diamacon', nova: true, holded: false, quipu: false },
  {
    label: 'Gratis para la asesoría',
    nova: 'Gratis hasta 2027',
    holded: 'Desde 40€/mes',
    quipu: 'Desde 25€/mes',
  },
  {
    label: 'Sin límite de clientes en cartera',
    nova: true,
    holded: 'Según plan',
    quipu: 'Según plan',
  },
];

export function NovafacturaSoftwareParaAsesoriasPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
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
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/30 dark:to-gray-950 py-24 md:py-32">
          <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e7ff_1px,transparent_1px),linear-gradient(to_bottom,#e0e7ff_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 dark:opacity-10" />
          </div>

          <div className="mx-auto max-w-5xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Building2 className="h-4 w-4" />
              Software para asesorías que hacen facturas por sus clientes
            </div>

            <h1
              data-speakable
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl"
            >
              Un solo panel para todos tus clientes.
              <br />
              <span className="text-indigo-600 dark:text-indigo-400">
                VeriFactu, exportación contable y cero complicaciones
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Si haces las facturas de tus autónomos, NovaFactura te da un panel centralizado con
              VeriFactu automático bajo cada NIF, exportación a Sage, A3CON, Cegid y Diamacon, y
              cero coste para tu asesoría.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Crear cuenta de asesoría — gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/asesoria"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                Ver plan para asesorías
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sin límite de clientes
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                VeriFactu por NIF
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Exportación Sage / A3 / Cegid
              </span>
            </div>
          </div>
        </section>

        {/* Key Differentiators */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Diseñado para el día a día de una asesoría
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Cada funcionalidad responde a un problema real de gestionar múltiples clientes.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {KEY_DIFFERENTIATORS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-6 text-center dark:border-indigo-900/50 dark:from-indigo-950/20 dark:to-gray-950"
                  >
                    <div className="mb-4 flex justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900">
                        <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
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
                Todo lo que necesitas para gestionar tu cartera de clientes
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Cada herramienta integrada en el panel de asesoría responde a una necesidad real.
              </p>
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

        {/* Export section */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <FileSpreadsheet className="h-4 w-4" />
                Exportación contable
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Exporta a Sage, A3CON, Cegid y Diamacon
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Descarga las facturas de cada cliente en el formato que necesita tu programa de
                contabilidad. Archivos listos para importar — sin reacondicionar datos.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-800 dark:bg-gray-900">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                  Sage, Cegid y Diamacon
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Archivos Excel (.xlsx) con estructura compatible. Descarga desde el panel del
                  cliente, selecciona el periodo y importa directamente en tu programa.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Una factura por fila, sin duplicados
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    NIF, Base, IVA, IRPF, Total — todo incluido
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Compatible con cualquier versión de Sage
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm dark:border-orange-800 dark:bg-gray-900">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950">
                  <ArrowDownToLine className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                  a3asesor | Wolters Kluwer
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Guía paso a paso con el mapeo exacto de columnas para A3CON. La plantilla se
                  guarda y se reutiliza en importaciones futuras.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    Mapeo de columnas incluido en la descarga
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    Plantilla reusable — configúrala una vez
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    Soporte para múltiples tipos de IVA
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
              <h4 className="mb-4 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                Mapeo de columnas para A3CON (a3asesor | Wolters Kluwer)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">
                        Campo NovaFactura
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">
                        Columna A3CON
                      </th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">
                        Descripción
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {A3CON_MAPPING.map((row) => (
                      <tr
                        key={row.column}
                        className="border-b border-gray-50 last:border-0 dark:border-gray-800"
                      >
                        <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.column}</td>
                        <td className="px-3 py-2 font-mono font-semibold text-orange-600 dark:text-orange-400">
                          {row.a3con}
                        </td>
                        <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                          {row.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-2 font-medium">
                <Download className="h-4 w-4 text-gray-400" />
                Compatible con:
              </span>
              {[
                'Sage Contabilidad',
                'Cegid',
                'Diamacon (Comeralia)',
                'a3asesor | Wolters Kluwer',
              ].map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                ¿Para quién es este software?
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Cada caso de uso responde a un perfil real de asesoría o gestoría.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {USE_CASES.map((useCase) => {
                const Icon = useCase.icon;
                return (
                  <div
                    key={useCase.title}
                    className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
                      <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                      {useCase.title}
                    </h3>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                      {useCase.description}
                    </p>
                    <ul className="space-y-2">
                      {useCase.points.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {brandConfig.app.name} vs. otras soluciones para asesorías
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Comparativa honesta basada en funcionalidades reales. Sin asteriscos.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <th className="px-4 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">
                      Característica
                    </th>
                    <th className="bg-indigo-50 px-4 py-4 text-center font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {brandConfig.app.name}
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-gray-500 dark:text-gray-400">
                      Holded
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-gray-500 dark:text-gray-400">
                      Quipu
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-50 last:border-0 dark:border-gray-800 ${
                        i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                        {row.label}
                      </td>
                      {(
                        [
                          { col: 'nova', val: row.nova, isNova: true },
                          { col: 'holded', val: row.holded, isNova: false },
                          { col: 'quipu', val: row.quipu, isNova: false },
                        ] as const
                      ).map(({ col, val, isNova }) => (
                        <td
                          key={col}
                          className={`px-4 py-3 text-center ${
                            isNova ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                          }`}
                        >
                          {typeof val === 'boolean' ? (
                            val ? (
                              <>
                                <CheckCircle2
                                  aria-hidden="true"
                                  className={`mx-auto h-4 w-4 ${
                                    isNova ? 'text-indigo-600' : 'text-gray-400'
                                  }`}
                                />
                                <span className="sr-only">Sí</span>
                              </>
                            ) : (
                              <>
                                <span
                                  aria-hidden="true"
                                  className="text-gray-300 dark:text-gray-600"
                                >
                                  —
                                </span>
                                <span className="sr-only">No</span>
                              </>
                            )
                          ) : (
                            <span
                              className={`text-xs font-semibold ${
                                isNova
                                  ? 'text-indigo-700 dark:text-indigo-300'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {val}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400">
              En resumen: {brandConfig.app.name} es la única de las tres que incluye directorio de
              empresas compartido, cambio de contexto en un clic y log de auditoría por cliente.
              También es la única que exporta a A3CON (Wolters Kluwer), Cegid y Diamacon, además de
              Sage. Y mientras Holded parte de 40€/mes y Quipu de 25€/mes, {brandConfig.app.name} es
              gratuito para asesorías hasta 2027, sin límite de clientes.
            </p>
            <p className="mt-4 text-center text-xs text-gray-400">
              * Datos basados en análisis de mercado a mayo de 2026. Los competidores pueden
              actualizar precios y funcionalidades en cualquier momento.
            </p>
          </div>
        </section>

        {/* Free CTA */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <div className="rounded-3xl bg-indigo-600 p-12 text-center text-white shadow-2xl dark:bg-indigo-700">
              <div className="mb-4 flex justify-center">
                <Gift className="h-10 w-10 text-indigo-200" />
              </div>
              <h2 className="mb-4 text-3xl font-bold">Gratis para asesorías. Para siempre.</h2>
              <p className="mb-8 text-lg text-indigo-100">
                Sin límite de clientes, sin coste por cliente adicional, sin funcionalidades
                restringidas. Durante el periodo de lanzamiento hasta 2027.
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
                  Exportación a Sage, A3CON, Cegid y Diamacon
                </span>
              </div>
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 shadow-lg transition-all hover:bg-indigo-50"
              >
                Crear cuenta de asesoría gratis
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection
          faqs={faqs}
          title="Preguntas frecuentes sobre el software para asesorías"
          subtitle="Resolvemos las dudas más comunes sobre la gestión multi-cliente"
        />

        <FooterLanding />
      </div>
    </>
  );
}

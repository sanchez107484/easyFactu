import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import FaqSection from '@/components/FaqSection';
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
  ArrowDownToLine,
  AlertTriangle,
  Eye,
  ClipboardCheck,
  Users,
} from 'lucide-react';

const faqs = [
  {
    q: '¿Mis clientes tienen que crearse una cuenta en NovaFactura?',
    a: 'No es necesario. Puedes dar de alto a tus clientes directamente desde tu panel de asesoría con sus datos fiscales. Ellos no reciben ningún correo ni tienen que hacer nada. Si en el futuro quieren acceder a su propio histórico de facturas, pueden hacerlo, pero no es obligatorio.',
  },
  {
    q: '¿Las facturas que emito desde mi panel quedan a nombre de mis clientes?',
    a: 'Sí, exactamente. Aunque tú las emites desde tu sesión de asesoría, cada factura pertenece al NIF del cliente. La AEAT las registra como emitidas por el cliente, con su número de serie y su cadena VeriFactu independiente. Tu despacho aparece solo en el registro interno de auditoría.',
  },
  {
    q: '¿Cuánto cuesta para mi asesoría?',
    a: 'Cero euros. El plan de asesoría es completamente gratuito, sin límite de clientes, sin coste mensual y sin letra pequeña. NovaFactura no cobra a las asesorías porque el modelo de negocio se sostiene con los planes de pago de los autónomos que prefieren gestionar sus facturas por su cuenta.',
  },
  {
    q: '¿Qué pasa si un cliente ya tiene cuenta en NovaFactura?',
    a: 'Puedes vincularte a su cuenta existente enviándole una invitación por email desde tu panel. Él acepta y ya puedes gestionar su facturación desde tu asesoría. No se pierde ningún dato previo y el cliente puede seguir accediendo a su cuenta cuando quiera.',
  },
  {
    q: '¿Cómo sé en todo momento a qué cliente le estoy haciendo la factura?',
    a: 'Hay un banner permanente visible en toda la pantalla que muestra el nombre y NIF del cliente con el que estás trabajando. No desaparece hasta que cambias de cliente manualmente. Está diseñado para evitar el error de emitir una factura bajo el NIF equivocado.',
  },
  {
    q: '¿Puedo importar mis clientes actuales desde Excel?',
    a: 'Sí. Si tienes una lista de clientes en Excel o CSV con su nombre, NIF y datos de contacto, puedes importarla directamente al panel. En cuestión de minutos tienes toda tu cartera cargada sin introducir nada a mano.',
  },
  {
    q: '¿NovaFactura está certificado por la AEAT?',
    a: 'NovaFactura cumple íntegramente el Real Decreto 254/2025. Como productor del sistema, emitimos la declaración responsable correspondiente, generando automáticamente el hash SHA-256, el código QR verificable y transmitiendo cada factura al registro de la AEAT en tiempo real.',
  },
  {
    q: '¿Hay un límite de facturas que puedo emitir al mes?',
    a: 'No para la asesoría. El plan de asesoría no tiene límite de facturas ni de clientes.',
  },
];

export const novafacturaAsesoriaMetadata: Metadata = {
  title: `VeriFactu para asesorías y gestorías | ${brandConfig.app.name}`,
  description:
    'Cumple con VeriFactu en tu asesoría sin que tus clientes tengan que aprender a facturar. Panel centralizado, gratuito y preparado para el RD 254/2025.',
  keywords: [
    'verifactu para asesorías',
    'verifactu asesoría',
    'verifactu gestorías',
    'cumplimiento verifactu asesoría',
    'software garante verifactu',
    'rd 254/2025 asesorías',
    'declaración responsable software facturación',
  ],
  alternates: {
    canonical: `${brandConfig.app.url}/asesoria`,
  },
  openGraph: {
    title: `VeriFactu para asesorías y gestorías | ${brandConfig.app.name}`,
    description:
      'Cumple con VeriFactu en tu asesoría sin que tus clientes tengan que aprender a facturar. Panel centralizado y gratuito.',
    url: `${brandConfig.app.url}/asesoria`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} para asesorías — Software VeriFactu gratis`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `VeriFactu para asesorías y gestorías | ${brandConfig.app.name}`,
    description:
      'Cumple con VeriFactu en tu asesoría sin que tus clientes tengan que aprender a facturar. Panel centralizado y gratuito.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
  robots: { index: true, follow: true },
};

// --- SCHEMAS ---
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
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
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
      'Pasa del dashboard de un cliente al siguiente sin cerrar sesión. Un banner permanente en pantalla te recuerda siempre bajo qué NIF estás operando, para no cometer errores.',
  },
  {
    icon: Shield,
    title: 'VeriFactu automático bajo cada NIF',
    description:
      'Cada factura que emites queda registrada bajo el NIF del cliente, con su hash encadenado y su código QR verificable. Hacienda la ve como emitida por el cliente, no por ti.',
  },
  {
    icon: UserCheck,
    title: 'Directorio de clientes compartido',
    description:
      'Define las empresas a las que factura tu autónomo una sola vez en su directorio. Se reutilizan en todas sus facturas sin volver a introducir los datos. Sin duplicados.',
  },
  {
    icon: FileSpreadsheet,
    title: 'Envío automático a la AEAT',
    description:
      'Cada factura se transmite en tiempo real al registro de la Agencia Tributaria. Sin configurar nada, sin trámites adicionales. El cumplimiento con VeriFactu es automático desde la primera factura.',
  },
  {
    icon: TrendingUp,
    title: 'Informes por cliente',
    description:
      'Accede al historial completo de facturas, ingresos acumulados y IVA pendiente de cualquier cliente con un clic. Datos actualizados en tiempo real, listos para preparar sus declaraciones trimestrales.',
  },
  {
    icon: ClipboardCheck,
    title: 'Auditoría de acciones',
    description:
      'Cada factura que emites en nombre de un cliente queda marcada con tu usuario de asesoría. Registro completo de quién emitió qué y cuándo, para cualquier revisión o inspección.',
  },
  {
    icon: LayoutDashboard,
    title: 'Acceso desde cualquier dispositivo',
    description:
      'Funciona desde el ordenador de la asesoría, desde una tablet o desde el móvil. Sin instalaciones, sin actualizaciones manuales. Siempre con la última versión y el cumplimiento al día.',
  },
];

const USE_CASES = [
  {
    icon: Users,
    title: 'Asesoría pequeña o mediana',
    description:
      'Despacho con 20-60 clientes autónomos. Haces tú las facturas porque ellos no tienen tiempo ni habilidad para hacerlo solos. Buscas una solución que no cambie demasiado tu flujo actual.',
    points: [
      'Panel central con todos tus clientes de un vistazo',
      'Cambio de NIF en un clic sin cerrar sesión',
      'VeriFactu configurado automáticamente bajo cada NIF',
    ],
    badge: 'Perfil principal',
  },
  {
    icon: LayoutDashboard,
    title: 'Gestor administrativo',
    description:
      'Gestionas autónomos de sectores tradicionales: agricultura, hostelería, transporte, construcción. Tus clientes llevan décadas contigo y confían en ti para que lo resuelvas sin complicarles la vida.',
    points: [
      'Importa tu lista de clientes desde Excel en minutos',
      'Cada cliente ve su factura igual que siempre',
      'Tú cumples con VeriFactu sin que ellos se enteren',
    ],
  },
  {
    icon: ClipboardCheck,
    title: 'Contable freelance',
    description:
      'Llevas la contabilidad y la facturación de varios autónomos o pequeñas empresas de forma independiente. Necesitas un panel que te permita cambiar de cliente rápido sin confundir NIFs.',
    points: [
      'Banner permanente que te recuerda bajo qué NIF operas',
      'Log de auditoría con cada acción que realizas',
      'Gratis para siempre — sin coste que te reste margen',
    ],
  },
];

const TESTIMONIALS = [
  {
    initials: 'MR',
    name: 'Manuel Ruiz',
    role: 'Gestor administrativo · Badajoz',
    quote:
      'Llevo 20 años haciendo las facturas de mis agricultores. Con VeriFactu me entró el pánico. Probé NovaFactura y en una tarde tenía a mis 38 clientes dados de alta. Ahora es igual que antes pero legal.',
  },
  {
    initials: 'CP',
    name: 'Carmen Prieto',
    role: 'Asesoría Prieto · Cuenca',
    quote:
      'Mis clientes son fontaneros y electricistas. No saben qué es un hash ni les hace falta. Yo gestiono todo desde el panel, ellos reciben el PDF igual que siempre. El cambio fue transparente para ellos.',
  },
  {
    initials: 'JL',
    name: 'José Luis Moreno',
    role: 'Asesoría Moreno & Asociados · Albacete',
    quote:
      'Lo mejor es el panel central. De un vistazo veo todos mis clientes, qué facturas tienen pendientes de cobro y quién tiene alertas. Antes tardaba media mañana en tener esa información.',
  },
];

const ASESOR_COMPARISON: {
  label: string;
  novafactura: string | boolean;
  holded: string | boolean;
  quipu: string | boolean;
}[] = [
  {
    label: 'Precio para la asesoría',
    novafactura: 'Gratis para siempre',
    holded: '40-90€/mes',
    quipu: '25€+/mes',
  },
  { label: 'Panel multi-cliente centralizado', novafactura: true, holded: true, quipu: false },
  { label: 'VeriFactu bajo NIF de cada cliente', novafactura: true, holded: true, quipu: false },
  { label: 'Directorio de clientes compartido', novafactura: true, holded: false, quipu: false },
  { label: 'Cambio de contexto en un clic', novafactura: true, holded: false, quipu: false },
  {
    label: 'Sin límite de clientes en cartera',
    novafactura: true,
    holded: 'Según plan',
    quipu: 'Según plan',
  },
  { label: 'Log de auditoría por cliente', novafactura: true, holded: false, quipu: false },
];

export function NovafacturaAsesoriaPage() {
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

      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <SiteHeader />

        {/* Hero - INTENCIÓN: VERIFACTU */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/30 dark:to-gray-950 py-24 md:py-32">
          <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e7ff_1px,transparent_1px),linear-gradient(to_bottom,#e0e7ff_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 dark:opacity-10" />
          </div>

          <div className="mx-auto max-w-5xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Gift className="h-4 w-4" />
              Gratis para asesorías · Sin límite de clientes
            </div>

            <h1
              data-speakable
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl"
            >
              Cumple con VeriFactu en tu asesoría
              <br />
              <span className="text-indigo-600 dark:text-indigo-400">
                sin que tus clientes toquen nada
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Gestiona la facturación de tus clientes, genera el QR y hash SHA-256 y transmite a la
              AEAT automáticamente. Todo desde un panel gratuito para tu despacho.
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
                href="/asesoria-facturas-clientes"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                ¿Haces las facturas? Conoce el panel multi-NIF
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sin tarjeta al registrarte
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Declaración responsable RD 254/2025
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sin límite de clientes en cartera
              </span>
            </div>

            {/* Alerta normativa MODIFICADA */}
            <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    La normativa de facturación cambia en julio de 2027.
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    Desde esa fecha, los sistemas informáticos de facturación deben cumplir el RD
                    254/2025. Si tu asesoría hace las facturas de sus clientes, necesitas un sistema
                    que cumpla por ti y evite errores manuales. NovaFactura está preparado para esa
                    fecha.
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
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                La situación que conoces
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                VeriFactu llega y tus clientes dependen de ti
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                Tienes 30, 40 o 50 autónomos en cartera. Agricultores, fontaneros, electricistas.
                Gente que lleva años contigo y que no sabe de software fiscal. Cuando llega la
                obligación de VeriFactu, eres tú quien tiene que garantizar que sus facturas están
                bien.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-red-700 dark:text-red-400">
                  <span className="text-lg">❌</span> Sin software preparado
                </h3>
                <ul className="space-y-3">
                  {[
                    'Facturas en Excel o Word sin trazabilidad',
                    'No hay registro en Hacienda automático',
                    'Riesgo de duplicar o alterar facturas sin querer',
                    'Tus clientes no saben cumplir la normativa solos',
                    'Mucho trabajo administrativo para tu despacho',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <span className="mt-0.5 text-red-500">×</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-green-100 bg-green-50 p-6 dark:border-green-900/50 dark:bg-green-950/20">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-green-700 dark:text-green-400">
                  <span className="text-lg">✓</span> Con NovaFactura
                </h3>
                <ul className="space-y-3">
                  {[
                    'VeriFactu se genera solo: QR, hash, AEAT',
                    'Trazabilidad total e inalterabilidad',
                    'Un solo panel con todos tus clientes',
                    'Tus clientes cumplen sin tocar nada',
                    'Tu despacho queda cubierto ante inspecciones',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid */}
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

        {/* Export section (Sin tabla A3CON, la tabla extensa solo en /asesoria-facturas-clientes) */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <FileSpreadsheet className="h-4 w-4" />
                Integración contable
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Exporta las facturas directamente a tu programa de contabilidad
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Genera archivos perfectamente formateados para Sage, A3CON, Cegid y Diamacon. Tú
                sigues trabajando con tus herramientas de siempre — nosotros generamos los datos en
                el formato que necesitas.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-600 dark:text-gray-400">
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
          </div>
        </section>

        {/* Free plan callout */}
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

        {/* Testimonios */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Lo que dicen las asesorías
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Despachos que ya gestionan
                <br />
                VeriFactu de sus clientes con {brandConfig.app.name}
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.initials}
                  className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mb-3 text-lg text-amber-400">★★★★★</div>
                  <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    <span className="text-indigo-600 dark:text-indigo-400">"</span>
                    {t.quote}
                    <span className="text-indigo-600 dark:text-indigo-400">"</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-sm font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
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

        {/* Casos de uso */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                ¿Es para ti?
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Para cualquier despacho que
                <br />
                gestione facturas de terceros
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {USE_CASES.map((useCase) => {
                const Icon = useCase.icon;
                return (
                  <div
                    key={useCase.title}
                    className={`rounded-2xl border p-8 shadow-sm dark:bg-gray-900 ${useCase.badge ? 'border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/20' : 'border-gray-100 bg-white dark:border-gray-800'}`}
                  >
                    {useCase.badge && (
                      <span className="mb-3 inline-block rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                        {useCase.badge}
                      </span>
                    )}
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

        {/* Comparativa */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {brandConfig.app.name} vs. otras soluciones para asesorías
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Comparativa honesta. Sin asteriscos.
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
                  {ASESOR_COMPARISON.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-50 last:border-0 dark:border-gray-800 ${i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                        {row.label}
                      </td>
                      {(
                        [
                          { col: 'novafactura', val: row.novafactura, isNova: true },
                          { col: 'holded', val: row.holded, isNova: false },
                          { col: 'quipu', val: row.quipu, isNova: false },
                        ] as const
                      ).map(({ col, val, isNova }) => (
                        <td
                          key={col}
                          className={`px-4 py-3 text-center ${isNova ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''}`}
                        >
                          {typeof val === 'boolean' ? (
                            val ? (
                              <>
                                <CheckCircle2
                                  aria-hidden="true"
                                  className={`mx-auto h-4 w-4 ${isNova ? 'text-indigo-600' : 'text-gray-400'}`}
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
                              className={`text-xs font-semibold ${isNova ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}
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
          </div>
        </section>

        <FaqSection faqs={faqs} title="Lo que nos preguntan las asesorías sobre VeriFactu" />
        <FooterLanding />
      </div>
    </>
  );
}

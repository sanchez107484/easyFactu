import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import FaqSection from '@/components/FaqSection';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import { brandConfig } from '@easyfactura/brand-config';
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  FileText,
  Users,
  ShieldCheck,
  Gift,
  ChevronRight,
  Clock,
  UserPlus,
  Upload,
  ScanLine,
  CalendarClock,
  TableProperties,
} from 'lucide-react';
import { softwareApplicationJsonLd } from '@/lib/structured-data';

const PAGE_URL = `${brandConfig.app.url}/software-para-asesorias`;

const faqs = [
  {
    q: '¿Puedo hacer las facturas de mis clientes desde una sola cuenta?',
    a: `Sí. ${brandConfig.app.name} permite a una asesoría gestionar diferentes clientes desde un único panel. Cada cliente mantiene su propio NIF, datos fiscales y configuración de facturación.`,
  },
  {
    q: '¿Mis clientes necesitan tener una cuenta?',
    a: `No necesariamente. La asesoría puede gestionar la facturación de sus clientes desde el panel de asesoría. El cliente puede utilizar ${brandConfig.app.name} directamente cuando lo necesite.`,
  },
  {
    q: '¿Cuántos clientes puedo gestionar?',
    a: `El panel de asesoría está pensado para gestionar una cartera de clientes sin tener que crear una cuenta independiente para cada uno. No hay límite de clientes en cartera.`,
  },
  {
    q: '¿Cada cliente mantiene su propia numeración de facturas?',
    a: 'Sí. La facturación de cada cliente se mantiene separada y las facturas se generan bajo los datos fiscales y la configuración correspondiente a ese cliente.',
  },
  {
    q: '¿Puedo importar mis clientes actuales desde Excel?',
    a: 'Sí. Si tienes una lista de clientes en Excel o CSV con su nombre, NIF y datos de contacto, puedes importarla directamente al panel. En cuestión de minutos tienes toda tu cartera cargada sin introducir nada a mano.',
  },
  {
    q: '¿Puedo exportar las facturas para mi programa contable?',
    a: `${brandConfig.app.name} permite exportar la información de facturación en formatos compatibles con Sage, A3CON, Cegid y Diamacon. Consulta los formatos disponibles según tu programa.`,
  },
  {
    q: '¿Cuánto cuesta para una asesoría?',
    a: `El panel de asesoría es gratuito. El objetivo es que puedas utilizar ${brandConfig.app.name} para gestionar la facturación de tus clientes y ofrecerles una solución de facturación sin coste para tu despacho.`,
  },
  {
    q: '¿Qué diferencia hay entre esto y un ERP para asesorías?',
    a: `${brandConfig.app.name} no es un ERP ni pretende serlo. Es una herramienta de facturación centrada en emitir facturas, cumplir con VeriFactu y exportar a tu contable. La gestión contable completa sigue en tu programa de siempre.`,
  },
  {
    q: '¿Está preparado para la obligación de VeriFactu en 2028?',
    a: `${brandConfig.app.name} está adaptado a los requisitos del Reglamento de VeriFactu (Real Decreto 1007/2023). Genera hash SHA-256 encadenado, código QR verificable y transmite cada factura al registro de la AEAT. Cuando sea obligatorio, tu asesoría ya estará lista.`,
  },
];

export const novafacturaSoftwareParaAsesoriasMetadata: Metadata = {
  title: 'Software de facturación para asesorías y gestorías gratis',
  description:
    'Software de facturación gratis para asesorías y gestorías. Panel multi-cliente, facturas bajo el NIF de cada cliente, alta en lote y digitalización. Preparado para VeriFactu 2028.',
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: 'Software de facturación para asesorías y gestorías gratis',
    description:
      'Panel multi-cliente, facturación bajo el NIF de cada cliente, alta en lote y preparado para VeriFactu 2028. Gratis para asesorías.',
    url: PAGE_URL,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Software de facturación para asesorías`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Software de facturación para asesorías y gestorías gratis',
    description:
      'Panel multi-cliente, facturación bajo el NIF de cada cliente, alta en lote y preparado para VeriFactu 2028. Gratis para asesorías.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

// --- SCHEMAS ---
const softwareJsonLd = softwareApplicationJsonLd({
  path: '/software-para-asesorias',
  description:
    'Software de facturación gratuito para asesorías y gestorías. Panel multi-cliente, facturas bajo el NIF de cada cliente, importación en lote y cumplimiento VeriFactu.',
  featureList: [
    'Panel multi-cliente centralizado',
    'Facturación bajo el NIF de cada cliente',
    'Alta de clientes en lote desde Excel',
    'Digitalización de facturas de clientes',
    'Exportación a Sage, A3CON, Cegid y Diamacon',
    'VeriFactu automático (hash, QR, AEAT)',
    'Gratis para asesorías',
  ],
});

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    { '@type': 'ListItem', position: 2, name: 'Software para asesorías', item: PAGE_URL },
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

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Cómo gestionar la facturación de tu cartera con NovaFactura',
  description:
    'Pasos para centralizar la facturación de múltiples clientes desde un único panel de asesoría.',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Importa tu cartera de clientes',
      text: 'Sube tu lista de clientes desde Excel o CSV con nombre, NIF y datos de contacto. En minutos tienes toda tu cartera en el panel.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Entra en el entorno del cliente',
      text: 'Selecciona el cliente desde tu panel y empieza a trabajar sin cerrar sesión. Sus datos fiscales y configuración se cargan automáticamente.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Emite sus facturas bajo su NIF',
      text: 'Crea las facturas utilizando los datos fiscales de ese cliente. Cada factura queda registrada bajo su NIF con hash VeriFactu encadenado.',
    },
  ],
};

const BENEFITS = [
  {
    icon: LayoutDashboard,
    title: 'Panel multi-cliente',
    description:
      'Accede a todos tus clientes desde una única cuenta. Sin entrar y salir de diferentes usuarios. Un panel con el estado de cada cartera de un vistazo.',
  },
  {
    icon: FileText,
    title: 'Factura bajo el NIF de cada cliente',
    description:
      'Selecciona el cliente y trabaja con sus propios datos fiscales y configuración de facturación. La AEAT ve cada factura como emitida por el cliente, no por ti.',
  },
  {
    icon: UserPlus,
    title: 'Alta de clientes en lote',
    description:
      'Importa toda tu cartera desde un Excel o CSV con nombre, NIF y datos de contacto. En minutos tienes 50 o 100 clientes cargados sin introducir nada a mano.',
  },
  {
    icon: ScanLine,
    title: 'Digitalización de facturas de clientes',
    description:
      'Tus clientes pueden subir sus facturas de proveedores al sistema para que las revises. Adiós a los emails con adjuntos perdidos y las carpetas de PDFs sueltos.',
  },
  {
    icon: Gift,
    title: 'Gratis para tu asesoría',
    description:
      'Cero euros. Sin límite de clientes, sin coste mensual y sin letra pequeña. El panel de asesoría es completamente gratuito.',
  },
  {
    icon: CalendarClock,
    title: 'Preparado para VeriFactu 2028',
    description:
      'Hash SHA-256 encadenado, código QR verificable y transmisión automática a la AEAT. Cuando sea obligatorio, tu asesoría ya estará lista.',
  },
];

const COMPARISON_DATA: {
  label: string;
  novafactura: string | boolean;
  a3asesor: string | boolean;
  billin: string | boolean;
}[] = [
  {
    label: 'Precio para la asesoría',
    novafactura: 'Gratis para siempre',
    a3asesor: 'Desde 49 €/mes',
    billin: 'Desde 19 €/mes',
  },
  { label: 'Panel multi-cliente centralizado', novafactura: true, a3asesor: true, billin: true },
  { label: 'Facturación bajo el NIF de cada cliente', novafactura: true, a3asesor: true, billin: false },
  { label: 'Alta de clientes en lote (Excel/CSV)', novafactura: true, a3asesor: true, billin: false },
  { label: 'VeriFactu automático (hash + QR + AEAT)', novafactura: true, a3asesor: false, billin: false },
  { label: 'Digitalización de facturas de clientes', novafactura: true, a3asesor: false, billin: false },
  {
    label: 'Exportación a Sage, A3CON, Cegid, Diamacon',
    novafactura: true,
    a3asesor: 'Solo A3CON',
    billin: false,
  },
  { label: 'Sin límite de clientes en cartera', novafactura: true, a3asesor: 'Según plan', billin: 'Según plan' },
  { label: 'Log de auditoría por cliente', novafactura: true, a3asesor: true, billin: false },
  { label: 'Gratis para el autónomo cliente final', novafactura: true, a3asesor: false, billin: false },
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <SiteHeader />

        {/* HERO — INTENCIÓN: SOFTWARE DE FACTURACIÓN PARA ASESORÍAS */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white py-20 dark:from-indigo-950/30 dark:via-gray-950 dark:to-gray-950 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                <Users className="h-4 w-4" />
                Software de facturación para asesorías y gestorías
              </div>

              <h1
                data-speakable
                className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl"
              >
                Software de facturación para asesorías{' '}
                <span className="text-indigo-600 dark:text-indigo-400">
                  y gestorías gratis
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                Panel multi-cliente, facturas bajo el NIF de cada cliente, alta en lote desde Excel y
                preparado para VeriFactu 2028. Todo desde una única cuenta. Gratis para tu
                despacho.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/registro/asesoria"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-700"
                >
                  Crear cuenta de asesoría gratis
                  <ArrowRight className="h-5 w-5" />
                </Link>
                {/* Botón de video demo comentado temporalmente hasta tener video disponible
                <Link
                  href="#video-demo"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  <Play className="h-5 w-5" />
                  Ver vídeo demo (2 min)
                </Link>
                */}
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Gratis para asesorías
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Sin límite de clientes
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Preparado para 2028
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* VIDEO DEMO — Sección comentada temporalmente hasta tener video disponible
        <section id="video-demo" className="bg-gray-50 py-16 dark:bg-gray-900/50 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Vídeo demo
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Mira cómo funciona en 2 minutos
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Desde el alta de clientes en lote hasta la emisión de facturas bajo el NIF
                correspondiente. Sin cortes, sin montaje.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-xl dark:border-gray-700">
              <div className="aspect-video w-full">
                <iframe
                  className="h-full w-full"
                  src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
                  title="Demo NovaFactura para asesorías — 2 minutos"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-gray-400">
              Duración: 2 minutos. Sin audio necesario — subtítulos disponibles.
            </p>
          </div>
        </section>
        */}

        {/* PROBLEMA */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-12">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
                <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Deja de perder tiempo entrando y saliendo de cuentas
              </h2>
              <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
                Si gestionas la facturación de 20, 50 o 100 clientes, trabajar con una cuenta
                independiente para cada uno acaba convirtiéndose en una tarea más.
              </p>
              <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
                Con {brandConfig.app.name} tienes un{' '}
                <strong className="text-gray-900 dark:text-white">único panel de asesoría</strong>{' '}
                desde el que puedes seleccionar el cliente con el que quieres trabajar y gestionar
                su facturación bajo su NIF.
              </p>
            </div>
          </div>
        </section>

        {/* BENEFITS GRID — 6 tarjetas con las funciones clave */}
        <section className="bg-gray-50 py-16 dark:bg-gray-900/50 md:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Todo lo que necesitas para gestionar tu cartera
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Seis funciones pensadas para el trabajo real de una asesoría. Sin funciones de ERP
                que no vas a usar.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div
                    key={benefit.title}
                    className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
                      <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{benefit.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                      {benefit.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PANEL MULTI-CLIENTE — Detalle */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950">
                  <LayoutDashboard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Un panel para toda tu cartera
                </h2>
                <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
                  Ve el estado de cada cliente de un vistazo: facturas emitidas, importes
                  pendientes de cobro y alertas fiscales. Sin tener que entrar en cada cuenta por
                  separado.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Un único acceso para tu asesoría',
                    'Clientes separados dentro del panel',
                    'Cambio de cliente sin cerrar sesión',
                    'Banner permanente con el NIF activo',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-sm dark:border-indigo-900 dark:bg-gray-900">
                <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  PANEL DE ASESORÍA
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    { name: 'Autónomo García', nif: '12345678A', active: true },
                    { name: 'Restaurante López SL', nif: 'B12345678', active: false },
                    { name: 'María Fernández', nif: '45678912B', active: false },
                    { name: 'Construcciones Norte SL', nif: 'B87654321', active: false },
                  ].map((client) => (
                    <div
                      key={client.nif}
                      className={`flex items-center justify-between rounded-xl border p-4 ${client.active ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40' : 'border-gray-100 dark:border-gray-800'}`}
                    >
                      <div>
                        <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                          {client.name}
                        </span>
                        <span className="block text-xs text-gray-400">{client.nif}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-center text-xs text-gray-400">
                  Un panel para toda tu cartera.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FACTURA BAJO EL NIF — Detalle */}
        <section className="bg-gray-50 py-16 dark:bg-gray-900/50 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div className="order-2 md:order-1">
                <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    FACTURA EMITIDA
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                      <span className="text-xs text-gray-500">Emisor</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        Autónomo García — 12345678A
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                      <span className="text-xs text-gray-500">Serie-Número</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        A-2026-0042
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                      <span className="text-xs text-gray-500">Base imponible</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        1.200,00 €
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2 dark:border-gray-800">
                      <span className="text-xs text-gray-500">IVA (21 %)</span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        252,00 €
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs font-semibold text-gray-500">Total</span>
                      <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                        1.452,00 €
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg bg-green-50 p-3 dark:bg-green-950/30">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400">
                      ✓ Registrada bajo el NIF del cliente en la AEAT
                    </p>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950">
                  <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Cada factura, bajo el NIF correcto
                </h2>
                <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
                  Cuando cambias de cliente, trabajas con su entorno de facturación. Sus datos
                  fiscales, NIF y configuración permanecen separados de los demás clientes de tu
                  cartera.
                </p>
                <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
                  La AEAT registra cada factura como emitida por el cliente, con su número de serie
                  y su cadena VeriFactu independiente. Tu despacho aparece solo en el registro
                  interno de auditoría.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ALTA DE CLIENTES EN LOTE */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950">
                  <Upload className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Importa tu cartera en minutos
                </h2>
                <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
                  Si tienes una lista de clientes en Excel o CSV con su nombre, NIF y datos de
                  contacto, puedes importarla directamente al panel. No necesitas introducir nada a
                  mano.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Sube un Excel o CSV con la plantilla guiada',
                    'Validación automática de NIFs antes de importar',
                    'Cada cliente se crea con su entorno de facturación',
                    'Puedes añadir más clientes en cualquier momento',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  IMPORTACIÓN DESDE EXCEL
                </div>
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800">
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">
                          Nombre
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">
                          NIF
                        </th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600 dark:text-gray-400">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {[
                        ['Autónomo García', '12345678A', 'garcia@email.com'],
                        ['Restaurante López SL', 'B12345678', 'lopez@email.com'],
                        ['María Fernández', '45678912B', 'fernandez@email.com'],
                        ['Construcciones Norte SL', 'B87654321', 'norte@email.com'],
                      ].map(([nombre, nif, email]) => (
                        <tr key={nif}>
                          <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{nombre}</td>
                          <td className="px-3 py-2 font-mono text-indigo-600 dark:text-indigo-400">
                            {nif}
                          </td>
                          <td className="px-3 py-2 text-gray-500">{email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-950/30">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">
                    4 clientes importados correctamente
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DIGITALIZACIÓN DE FACTURAS DE CLIENTES */}
        <section className="bg-gray-50 py-16 dark:bg-gray-900/50 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div className="order-2 md:order-2">
                <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="mb-4 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    FACTURAS DE PROVEEDORES DEL CLIENTE
                  </div>
                  <div className="space-y-3">
                    {[
                      { provider: 'Iberdrola', amount: '142,35 €', date: '15/10/2026', status: 'Revisada' },
                      { provider: 'Vodafone', amount: '89,00 €', date: '12/10/2026', status: 'Pendiente' },
                      { provider: 'Repsol', amount: '267,80 €', date: '10/10/2026', status: 'Revisada' },
                    ].map((invoice) => (
                      <div
                        key={invoice.date + invoice.provider}
                        className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-gray-800"
                      >
                        <div>
                          <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                            {invoice.provider}
                          </span>
                          <span className="block text-xs text-gray-400">{invoice.date}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {invoice.amount}
                          </span>
                          <span
                            className={`text-xs ${invoice.status === 'Revisada' ? 'text-green-600' : 'text-amber-600'}`}
                          >
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-1">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950">
                  <ScanLine className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Digitalización de facturas de tus clientes
                </h2>
                <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
                  Tus clientes pueden subir sus facturas de proveedores al sistema para que las
                  revises desde tu panel. Adiós a los emails con adjuntos perdidos y las carpetas
                  de PDFs sueltos en el escritorio.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Cada cliente sube sus propias facturas de proveedores',
                    'Las ves organizadas en tu panel de asesoría',
                    'Puedes marcarlas como revisadas o pendientes',
                    'Disponibles para la exportación contable',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PRECIO GRATIS */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-6">
            <div className="rounded-3xl bg-indigo-600 p-12 text-center text-white shadow-2xl dark:bg-indigo-700">
              <div className="mb-4 flex justify-center">
                <Gift className="h-10 w-10 text-indigo-200" />
              </div>
              <div className="mb-2 text-6xl font-black">0 €</div>
              <h2 className="mb-4 text-3xl font-bold">Gratis para asesorías. Para siempre.</h2>
              <p className="mb-8 text-lg text-indigo-100">
                Nosotros te damos la herramienta gratis. A cambio, tus clientes descubren{' '}
                {brandConfig.app.name} a través de ti. Sin cuota mensual, sin límite de clientes y
                sin letra pequeña.
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
                  Exportación contable incluida
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-indigo-300" />
                  VeriFactu automático sin coste extra
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

        {/* PREPARADO PARA 2028 */}
        <section className="bg-gray-50 py-16 dark:bg-gray-900/50 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950">
                  <CalendarClock className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Preparado para VeriFactu 2028
                </h2>
                <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
                  Hacienda ha anunciado octubre de 2028 (pendiente de BOE) como fecha límite para
                  que los sistemas informáticos de facturación cumplan el Reglamento VeriFactu. Con{' '}
                  {brandConfig.app.name}, tu asesoría ya está lista.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Hash SHA-256 encadenado por cada cliente',
                    'Código QR verificable en cada factura',
                    'Transmisión automática al registro de la AEAT',
                    'Cadena inalterable de registros de facturación',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  ¿Qué significa VeriFactu para tu asesoría?
                </p>
                <p className="mt-3 text-sm leading-relaxed text-amber-700 dark:text-amber-400">
                  Si tu despacho hace las facturas de sus clientes, eres responsable de que cada
                  factura cumpla la normativa. Con{' '}
                  {brandConfig.app.name}, el cumplimiento es automático: cada
                  factura se genera con hash encadenado, QR verificable y se transmite a la AEAT en
                  tiempo real.
                </p>
                <Link
                  href="/verifactu"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-amber-800 hover:text-amber-900 dark:text-amber-300"
                >
                  Conoce todos los requisitos de VeriFactu
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* COMPARATIVA — a3asesor y Billin con datos fechados */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {brandConfig.app.name} vs. a3asesor y Billin
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Comparativa honesta con datos de sus webs oficiales.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <div className="overflow-x-auto">
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
                        a3asesor
                      </th>
                      <th className="px-4 py-4 text-center font-semibold text-gray-500 dark:text-gray-400">
                        Billin
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_DATA.map((row, i) => (
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
                            { col: 'a3asesor', val: row.a3asesor, isNova: false },
                            { col: 'billin', val: row.billin, isNova: false },
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
            <div className="mt-4 space-y-1 text-xs text-gray-400">
              <p>
                Fuentes:{' '}
                <a
                  href="https://www.wolterskluwer.es/es/soluciones/a3asesor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-600"
                >
                  wolterskluwer.es/a3asesor
                </a>
                {' · '}
                <a
                  href="https://www.billin.net/precios"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-600"
                >
                  billin.net/precios
                </a>
                {' · '}Consultado octubre 2026. Precios orientativos sin IVA.
              </p>
            </div>
          </div>
        </section>

        {/* NO ES UN ERP — Posicionamiento claro */}
        <section className="bg-gray-50 py-12 dark:bg-gray-900/50 md:py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
              <TableProperties className="h-4 w-4" />
              Aclaración importante
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              No es un ERP para asesorías. Es lo que necesitas.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-gray-600 dark:text-gray-400">
              {brandConfig.app.name} no pretende reemplazar tu programa contable. Es una
              herramienta de facturación: emite facturas, cumple con VeriFactu y exporta los datos
              a Sage, A3CON, Cegid o Diamacon. La contabilidad completa sigue en tu programa de
              siempre.
            </p>
            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-gray-600 dark:text-gray-400">
              Si buscas un ERP completo con contabilidad, nóminas, fiscalidad avanzada y gestión de
              expedientes, {brandConfig.app.name} no es para ti. Si lo que necesitas es facturar
              para tus clientes de forma rápida, centralizada y legal, sí.
            </p>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Empieza a gestionar tu cartera hoy
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-600 dark:text-gray-400">
              Crea tu cuenta de asesoría, importa tus clientes y emite la primera factura en menos
              de 10 minutos. Sin tarjeta.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white shadow-lg transition hover:bg-indigo-700"
              >
                Crear cuenta de asesoría gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/asesoria"
                className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-800"
              >
                ¿Cómo afecta VeriFactu a mi asesoría?
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <FaqSection
          faqs={faqs}
          title="Preguntas frecuentes"
          subtitle="Todo lo que necesitas saber sobre el software de facturación para asesorías."
        />

        <RelatedLinksSection
          title="Páginas relacionadas"
          links={[
            {
              href: '/asesoria',
              label: 'VeriFactu para asesorías y gestorías',
              description: 'Cómo cumple tu despacho con la obligación de VeriFactu.',
            },
            {
              href: '/asesoria-facturas-clientes',
              label: '¿Haces las facturas de tus clientes?',
              description: 'El panel multi-NIF explicado paso a paso.',
            },
            {
              href: '/verifactu',
              label: 'Qué es VeriFactu y cómo funciona',
              description: 'Guía completa sobre la obligación de facturación verificable.',
            },
            {
              href: '/precios',
              label: 'Precios de NovaFactura',
              description: 'Planes para autónomos y empresas. Asesoría siempre gratis.',
            },
          ]}
        />

        <FooterLanding />
      </div>
    </>
  );
}

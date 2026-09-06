import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';
import { brandConfig } from '@easyfactura/brand-config';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Users,
  ShieldCheck,
  MousePointerClick,
  UserPlus,
  Eye,
  Download,
  ArrowDownToLine,
  FileSpreadsheet,
} from 'lucide-react';

const faqs = [
  {
    q: '¿Puede una asesoría hacer las facturas de sus clientes?',
    a: 'Sí. Puedes añadir a tus clientes desde el panel de asesoría y comenzar a gestionar su facturación directamente.',
  },
  {
    q: '¿Qué programa puedo utilizar para hacer las facturas de mis clientes?',
    a: 'NovaFactura permite a las asesorías gestionar la facturación de diferentes clientes desde un único panel, con cada cliente separado por su correspondiente entorno y NIF.',
  },
  {
    q: '¿Puedo emitir facturas de diferentes clientes desde una misma cuenta?',
    a: 'Sí. El panel de asesoría permite cambiar entre clientes sin tener que cerrar sesión ni utilizar una cuenta diferente para cada cliente.',
  },
  {
    q: '¿Mis clientes necesitan crear una cuenta?',
    a: 'No para que puedas comenzar a gestionar su facturación desde el panel de asesoría. Puedes añadirlos y empezar a trabajar con ellos directamente.',
  },
  {
    q: '¿Cada cliente mantiene su propio NIF y facturación?',
    a: 'Sí. Cada cliente dispone de su propio entorno de facturación y sus datos fiscales se mantienen separados de los demás clientes.',
  },
  {
    q: '¿Cuánto cuesta para la asesoría?',
    a: 'El panel de asesoría es gratuito. No pagas una cuota mensual por gestionar tus clientes desde NovaFactura.',
  },
  {
    q: '¿Puedo seguir gestionando al cliente si él empieza a hacer sus propias facturas?',
    a: 'Sí. El cliente puede utilizar su propia cuenta y continuar vinculado a tu asesoría para que puedas consultar y gestionar su información de facturación.',
  },
  {
    q: '¿Está preparado para VeriFactu?',
    a: 'NovaFactura está diseñado para cumplir los requisitos aplicables a los sistemas informáticos de facturación y permite gestionar la facturación de cada cliente desde su correspondiente entorno.',
  },
];

export const novafacturaAsesoriaFacturasMetadata: Metadata = {
  title: `Software para hacer facturas de clientes | Asesorías | NovaFactura`,
  description:
    '¿Haces las facturas de tus clientes? Gestiona todos sus NIF desde un único panel y emite sus facturas en nombre de cada uno con NovaFactura. Gratis para asesorías.',
  alternates: {
    canonical: `${brandConfig.app.url}/asesoria-facturas-clientes`,
  },
  openGraph: {
    title: `Software para hacer facturas de clientes | Asesorías | ${brandConfig.app.name}`,
    description:
      'Gestiona las facturas de todos tus clientes desde un único panel. Gratis para asesorías.',
    url: `${brandConfig.app.url}/asesoria-facturas-clientes`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Facturación de clientes para asesorías`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Software para hacer facturas de clientes | Asesorías | ${brandConfig.app.name}`,
    description:
      'Haz las facturas de todos tus clientes desde un único panel. Gratis para asesorías.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

// --- SCHEMAS ---
const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `${brandConfig.app.name} — Facturación de clientes para asesorías`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: `${brandConfig.app.url}/asesoria-facturas-clientes`,
  description:
    'Software para asesorías que hacen las facturas de sus clientes desde un único panel.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Panel gratuito para asesorías',
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
      name: 'Asesoría que hace facturas de sus clientes',
      item: `${brandConfig.app.url}/asesoria-facturas-clientes`,
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

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Cómo hacer las facturas de tus clientes desde NovaFactura',
  description:
    'Pasos para emitir facturas en nombre de tus clientes desde un panel centralizado de asesoría.',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Añade al cliente',
      text: 'Introduce sus datos fiscales o importa la información de tu cartera desde Excel.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Selecciona su entorno',
      text: 'Elige el cliente para el que quieres trabajar desde tu panel de asesoría con un clic.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Haz la factura',
      text: 'Crea la factura utilizando los datos fiscales y la configuración de ese cliente automáticamente.',
    },
  ],
};

export function NovafacturaAsesoriaFacturasPage() {
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

        {/* HERO - INTENCIÓN: FACTURAR POR CLIENTES */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white py-24 dark:from-indigo-950/30 dark:to-gray-950 md:py-32">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
              <FileText className="h-4 w-4" />
              Para asesorías que hacen las facturas de sus clientes
            </div>

            <h1
              data-speakable
              className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl"
            >
              ¿Haces las facturas
              <br />
              <span className="text-indigo-600 dark:text-indigo-400">de tus clientes?</span>
              <br />
              <span className="text-indigo-600 dark:text-indigo-400">
                Hazlas todas desde un solo panel
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-400">
              Software de facturación para asesorías que emiten facturas en nombre de sus clientes.
              Gestiona múltiples NIF desde un único panel y trabaja con VeriFactu sin que tus
              clientes tengan que aprender a utilizar otro programa.
            </p>

            <div className="mt-10">
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-semibold text-white shadow-lg hover:bg-indigo-700"
              >
                Crear cuenta de asesoría — gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Gratis para asesorías
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sin límite de clientes
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sin cambiar de cuenta entre clientes
              </span>
            </div>
          </div>
        </section>

        {/* PROBLEMA */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                Si haces las facturas de tus clientes
              </p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Tu problema no es hacer una factura.
                <br />
                Es hacerlas para 20, 30 o 50 clientes sin equivocarte de NIF.
              </h2>
              <p className="mt-5 text-lg leading-8 text-gray-600 dark:text-gray-400">
                Cuando una asesoría gestiona la facturación de muchos autónomos, entrar y salir de
                diferentes cuentas o mantener archivos separados acaba complicando un trabajo que
                debería ser sencillo.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-7 dark:border-red-900/40 dark:bg-red-950/20">
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400">
                  Sin un panel central
                </h3>
                <ul className="mt-5 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  {[
                    'Una cuenta o archivo diferente por cliente.',
                    'Cambios constantes de contexto.',
                    'Datos fiscales que hay que revisar cada vez.',
                    'Más posibilidades de cometer errores.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-red-500">×</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-green-100 bg-green-50 p-7 dark:border-green-900/40 dark:bg-green-950/20">
                <h3 className="text-lg font-bold text-green-700 dark:text-green-400">
                  Con NovaFactura
                </h3>
                <ul className="mt-5 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  {[
                    'Todos tus clientes en un único panel.',
                    'Cambio de cliente desde la misma sesión.',
                    'Cada entorno mantiene sus datos fiscales.',
                    'Facturación centralizada para toda tu cartera.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                Así funciona
              </p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                Cómo emitir facturas en nombre de tus clientes
              </h2>
              <p className="mt-5 text-lg text-gray-600 dark:text-gray-400">
                Tres pasos para empezar a gestionar la facturación de tu cartera desde un único
                lugar.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                {
                  number: '01',
                  icon: UserPlus,
                  title: 'Añade al cliente',
                  text: 'Introduce sus datos fiscales o importa la información de tu cartera.',
                },
                {
                  number: '02',
                  icon: MousePointerClick,
                  title: 'Selecciona su entorno',
                  text: 'Elige el cliente para el que quieres trabajar desde tu panel de asesoría.',
                },
                {
                  number: '03',
                  icon: FileText,
                  title: 'Haz la factura',
                  text: 'Crea la factura utilizando los datos y configuración de ese cliente.',
                },
              ].map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.number}
                    className="rounded-2xl border border-gray-200 bg-white p-7 dark:border-gray-800 dark:bg-gray-950"
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="h-7 w-7 text-indigo-600" />
                      <span className="text-sm font-black text-gray-300">{step.number}</span>
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="mt-3 leading-7 text-gray-600 dark:text-gray-400">{step.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* EXPORTACIÓN CONTABLE */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                <FileSpreadsheet className="h-4 w-4" />
                Integración contable
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Exporta a Sage, A3CON, Cegid y Diamacon
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Descarga las facturas de cada cliente en el formato que necesita tu programa de
                contabilidad. Archivos listos para importar — sin reacondicionar datos.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm dark:border-emerald-800 dark:bg-gray-900">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  Sage, Cegid y Diamacon
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Archivos Excel (.xlsx) con estructura compatible. Descarga desde el panel del
                  cliente, selecciona el periodo e importa directamente en tu programa.
                </p>
                <ul className="space-y-2">
                  {[
                    'Una factura por fila, sin duplicados',
                    'NIF, Base, IVA, IRPF, Total — todo incluido',
                    'Compatible con cualquier versión de Sage',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm dark:border-orange-800 dark:bg-gray-900">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950">
                  <ArrowDownToLine className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  a3asesor | Wolters Kluwer
                </h3>
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Guía paso a paso con el mapeo exacto de columnas para A3CON. La plantilla se
                  guarda y se reutiliza en importaciones futuras.
                </p>
                <ul className="space-y-2">
                  {[
                    'Mapeo de columnas incluido en la descarga',
                    'Plantilla reusable — configúrala una vez',
                    'Soporte para múltiples tipos de IVA',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-white">
                Mapeo de columnas para A3CON (a3asesor | Wolters Kluwer)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                      <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        Campo NovaFactura
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        Columna A3CON
                      </th>
                      <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        Descripción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        Fecha de factura
                      </td>
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                        FECHA
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Fecha de emisión en formato DD/MM/AAAA
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        Número de factura
                      </td>
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                        SERIE-NUMERO
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Serie + número (ej: A-2025-001)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        NIF del cliente
                      </td>
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                        NIF
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        NIF o CIF sin espacios ni guiones
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        Nombre/Razón social
                      </td>
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                        NOMBRE
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Nombre completo o razón social
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        Base imponible
                      </td>
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                        BASE
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Importe base sin IVA. Varias líneas si hay diferentes tipos
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        Tipo de IVA
                      </td>
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                        IVA%
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Porcentaje de IVA aplicado (4%, 10%, 21%)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        Cuota de IVA
                      </td>
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                        IVA_IMPORTE
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Importe de la cuota de IVA
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        Retención IRPF
                      </td>
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                        IRPF%
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Porcentaje de retención si aplica (7%, 15%)
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        Total factura
                      </td>
                      <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                        TOTAL
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        Importe total incluyendo IVA menos IRPF
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-gray-100 bg-gray-50 p-6 dark:border-gray-800 dark:bg-gray-900/50">
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

        {/* VERIFACTU CON ENLACE INTERNO */}
        <section className="py-20 md:py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-indigo-600" />
            <h2 className="mt-5 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Facturación preparada para VeriFactu
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-400">
              Gestiona la facturación de tus clientes desde un sistema diseñado para los requisitos
              aplicables a los sistemas informáticos de facturación.
            </p>
            <Link
              href="/asesoria"
              className="mt-7 inline-flex items-center gap-2 font-semibold text-indigo-600"
            >
              Conoce todos los requisitos de VeriFactU para asesorías
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* GRATIS */}
        <section className="bg-gray-950 py-20 text-white md:py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="text-6xl font-black">
              0<span className="text-emerald-400">€</span>
            </div>
            <h2 className="mt-5 text-3xl font-bold sm:text-4xl">
              Tu asesoría no paga por gestionar sus clientes
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-gray-400">
              Empieza con tu cartera actual y añade clientes a medida que los necesites. El acceso
              al panel de asesoría es gratuito.
            </p>
            <Link
              href="/registro/asesoria"
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 font-semibold text-gray-900 hover:bg-gray-100"
            >
              Crear cuenta de asesoría — gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre hacer facturas de clientes" />
        <FooterLanding />
      </div>
    </>
  );
}

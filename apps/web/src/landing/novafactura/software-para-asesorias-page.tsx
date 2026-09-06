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
  Users,
  ShieldCheck,
  Gift,
  ChevronRight,
  Clock,
  UserPlus,
} from 'lucide-react';

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
    a: `El panel de asesoría está pensado para gestionar una cartera de clientes sin tener que crear una cuenta independiente para cada uno.`,
  },
  {
    q: '¿Cada cliente mantiene su propia numeración de facturas?',
    a: 'Sí. La facturación de cada cliente se mantiene separada y las facturas se generan bajo los datos fiscales y la configuración correspondiente a ese cliente.',
  },
  {
    q: '¿Puedo exportar las facturas para mi programa contable?',
    a: `${brandConfig.app.name} permite exportar la información de facturación para trabajar posteriormente con herramientas contables compatibles. Consulta los formatos disponibles según tu programa.`,
  },
  {
    q: '¿Cuánto cuesta para una asesoría?',
    a: `El panel de asesoría es gratuito. El objetivo es que puedas utilizar ${brandConfig.app.name} para gestionar la facturación de tus clientes y ofrecerles una solución de facturación sin coste para tu despacho.`,
  },
];

export const novafacturaSoftwareParaAsesoriasMetadata: Metadata = {
  title: `Software para Asesorías y Gestorías | ${brandConfig.app.name}`,
  description:
    'Software de facturación para asesorías y gestorías. Gestiona la facturación de múltiples clientes, cumple con VeriFactu y exporta a tu contable. Gratis para despachos.',
  keywords: [
    'software para asesorías',
    'software para gestorías',
    'programa para asesorías',
    'programa de facturación para asesorías',
    'software facturación asesorías',
    'software multi cliente asesorías',
    'software para despachos profesionales',
  ],
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: `Software para Asesorías y Gestorías | ${brandConfig.app.name}`,
    description:
      'Gestiona la facturación de todos tus clientes desde un único panel. Multi-NIF, facturación centralizada y panel gratuito para asesorías.',
    url: PAGE_URL,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Software para asesorías`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Software para Asesorías y Gestorías | ${brandConfig.app.name}`,
    description:
      'Gestiona las facturas de todos tus clientes desde un único panel. Gratis para asesorías.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

// --- SCHEMAS ---
const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `${brandConfig.app.name} — Software para asesorías`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: PAGE_URL,
  description:
    'Software de facturación para asesorías y gestorías que gestionan la facturación de sus clientes desde un único panel.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Panel de asesoría gratuito',
  },
  publisher: { '@type': 'Organization', name: brandConfig.app.name, url: brandConfig.app.url },
};

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
      name: 'Añade a tu cliente',
      text: 'Crea o incorpora el cliente con sus datos fiscales en tu panel.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Entra en su entorno',
      text: 'Selecciona el cliente desde tu panel y empieza a trabajar sin cerrar sesión.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Haz sus facturas',
      text: 'Emite las facturas utilizando los datos y configuración de ese cliente bajo su NIF.',
    },
  ],
};

const BENEFITS = [
  {
    icon: LayoutDashboard,
    title: 'Un solo panel',
    description:
      'Accede a todos tus clientes desde una única cuenta. Sin entrar y salir de diferentes usuarios.',
  },
  {
    icon: Users,
    title: 'Múltiples clientes',
    description:
      'Gestiona la facturación de distintos autónomos y empresas manteniendo cada cliente separado.',
  },
  {
    icon: FileText,
    title: 'Facturas bajo el NIF correcto',
    description:
      'Selecciona el cliente y trabaja con sus propios datos fiscales y configuración de facturación.',
  },
  {
    icon: Gift,
    title: 'Gratis para tu asesoría',
    description: 'Utiliza el panel de asesoría sin pagar por gestionar tu cartera de clientes.',
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

        {/* HERO - INTENCIÓN: CATEGORÍA SOFTWARE ASESORÍAS */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-white py-20 dark:from-indigo-950/30 dark:via-gray-950 dark:to-gray-950 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
                <Users className="h-4 w-4" />
                Para asesorías y gestorías
              </div>

              <h1
                data-speakable
                className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl"
              >
                El software para asesorías que
                <span className="text-indigo-600 dark:text-indigo-400">
                  {' '}
                  centraliza toda tu cartera{' '}
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                Gestiona la facturación, el cumplimiento VeriFactu y el directorio de todos tus
                clientes desde una única cuenta. Gratis para tu despacho.
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/registro/asesoria"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-700"
                >
                  Crear cuenta de asesoría gratis
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/asesoria-facturas-clientes"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                >
                  ¿Haces las facturas? Conoce el panel multi-NIF
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Gratis para asesorías
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Múltiples clientes
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Un único acceso
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM */}
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
                Con NovaFactura tienes un{' '}
                <strong className="text-gray-900 dark:text-white">único panel de asesoría</strong>{' '}
                desde el que puedes seleccionar el cliente con el que quieres trabajar y gestionar
                su facturación.
              </p>
            </div>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="bg-gray-50 py-16 dark:bg-gray-900/50 md:py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Pensado para el trabajo real de una asesoría
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Menos gestión entre cuentas. Más tiempo para tu cartera de clientes.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

        {/* ACCOUNT MODEL */}
        <section className="bg-gray-50 py-16 dark:bg-gray-900/50 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950">
                  <ShieldCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  Cada cliente, perfectamente separado
                </h2>
                <p className="mt-4 leading-relaxed text-gray-600 dark:text-gray-400">
                  Cuando cambias de cliente, trabajas con su entorno de facturación. Sus datos
                  fiscales, NIF y configuración permanecen separados de los demás clientes de tu
                  cartera.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    'Un único acceso para tu asesoría',
                    'Clientes separados dentro del panel',
                    'Facturación bajo los datos del cliente',
                    'Mayor control sobre quién ha realizado cada operación',
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
                    'Autónomo García — 12345678A',
                    'Restaurante López SL — B12345678',
                    'María Fernández — 45678912B',
                    'Construcciones Norte SL — B87654321',
                  ].map((client, index) => (
                    <div
                      key={client}
                      className={`flex items-center justify-between rounded-xl border p-4 ${index === 0 ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/40' : 'border-gray-100 dark:border-gray-800'}`}
                    >
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {client}
                      </span>
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

        {/* SECOND CTA - Enlazando internamente a VERIFACTU */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Empieza a gestionar tu cartera con el software para asesorías de NovaFactura
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-600 dark:text-gray-400">
              Cumple con VeriFactu, facturas en nombre de tus clientes y exportas a tu contable.
              Todo desde un mismo sitio.
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
          subtitle="Todo lo que necesitas saber si tu asesoría hace las facturas de sus clientes."
        />
        <FooterLanding />
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';
import { brandConfig } from '@easyfactura/brand-config';
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Repeat,
  Gift,
  AlertTriangle,
  Eye,
  Users,
  FileSpreadsheet,
} from 'lucide-react';

const faqs = [
  {
    q: '¿Puede mi asesoría hacer las facturas de mis clientes sin que ellos tengan cuenta?',
    a: 'Sí. Puedes dar de alta a tus clientes directamente desde tu panel de asesoría con sus datos fiscales. Ellos no necesitan crear ninguna cuenta ni recibir ningún correo. Tú gestionas todo, ellos reciben el PDF de su factura igual que siempre.',
  },
  {
    q: '¿Las facturas quedan a nombre de mi cliente o de mi asesoría?',
    a: 'Siempre a nombre del cliente. Aunque tú las emites desde tu sesión de asesoría, cada factura pertenece al NIF del cliente con su propia serie correlativa y su cadena VeriFactu. Hacienda la ve como emitida por el cliente, no por tu despacho.',
  },
  {
    q: '¿Qué pasa si ahora hago las facturas con Excel?',
    a: 'Desde julio de 2027, emitir facturas con Excel será ilegal para autónomos. Si tú haces las facturas de tus clientes, necesitas un software garante VeriFactu antes de esa fecha. NovaFactura es gratis para tu asesoría y cumple desde la primera factura.',
  },
  {
    q: '¿Cuánto cuesta para mi asesoría?',
    a: 'Cero euros. El plan de asesoría es completamente gratuito, sin límite de clientes, sin coste mensual y sin letra pequeña.',
  },
  {
    q: '¿Cómo sé a qué cliente le estoy haciendo la factura?',
    a: 'Hay un banner permanente visible en toda la pantalla que muestra el nombre y NIF del cliente con el que estás trabajando. No desaparece hasta que cambias de cliente manualmente.',
  },
  {
    q: '¿Puedo importar mis clientes desde Excel?',
    a: 'Sí. Si tienes una lista de clientes en Excel o CSV con su nombre, NIF y datos de contacto, puedes importarla directamente al panel en cuestión de minutos.',
  },
];

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `${brandConfig.app.name} — Asesoría que hace facturas por sus clientes`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: `${brandConfig.app.url}/asesoria-facturas-clientes`,
  description:
    'Software de facturación VeriFactu para asesorías que emiten facturas en nombre de sus clientes autónomos. Panel multi-NIF, VeriFactu automático, gratis para asesorías.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Completamente gratuito para asesorías y gestorías',
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
      name: 'Asesoría que hace facturas a sus clientes',
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

export const novafacturaAsesoriaFacturasMetadata: Metadata = {
  title: `Asesoría que hace facturas a sus clientes autónomos | ${brandConfig.app.name}`,
  description:
    '¿Tu asesoría hace las facturas de tus clientes? Gestiona todos sus NIFs desde un solo panel con VeriFactu automático. Gratis para asesorías. Sin que tus clientes toquen nada.',
  keywords: [
    'asesoría hace facturas por sus clientes',
    'empresa hace facturas autónomo asesoría',
    'programa hacer facturas clientes autónomos',
    'gestión facturas múltiples clientes asesoría',
    'asesoría emite facturas VeriFactu clientes',
    'software asesoría facturación por terceros',
    'hacer facturas clientes desde asesoría',
    'panel multi-nif asesoría autónomos',
  ],
  alternates: {
    canonical: `${brandConfig.app.url}/asesoria-facturas-clientes`,
  },
  openGraph: {
    title: `Asesoría que hace facturas a sus clientes autónomos | ${brandConfig.app.name}`,
    description:
      '¿Tu asesoría hace las facturas de tus clientes? Gestiona todos sus NIFs desde un solo panel con VeriFactu automático. Gratis.',
    url: `${brandConfig.app.url}/asesoria-facturas-clientes`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Asesoría que hace facturas a sus clientes`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Asesoría que hace facturas a sus clientes | ${brandConfig.app.name}`,
    description:
      'Gestiona todos los NIFs de tus clientes desde un solo panel con VeriFactu automático. Gratis.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
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

      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <SiteHeader />

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/30 dark:to-gray-950 py-24 md:py-32">
          <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e7ff_1px,transparent_1px),linear-gradient(to_bottom,#e0e7ff_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 dark:opacity-10" />
          </div>

          <div className="mx-auto max-w-5xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Gift className="h-4 w-4" />
              Para asesorías que hacen las facturas por sus clientes
            </div>

            <h1 data-speakable className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              ¿Emites tú las facturas
              <br />
              <span className="text-indigo-600 dark:text-indigo-400">de tus autónomos?</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Con un solo panel gestionas todos sus NIFs, todas las facturas van a la AEAT automáticamente con VeriFactu, y tú no cambias cómo trabajas.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Crear cuenta de asesoría — gratis
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
                Gratis para asesorías para siempre
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Sin límite de clientes en cartera
              </span>
            </div>

            {/* Alerta */}
            <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    Si ahora haces las facturas con Excel, necesitas un software garante antes de julio 2027.
                  </p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
                    Las sanciones por incumplimiento VeriFactu llegan a 50.000 € por ejercicio. NovaFactura es gratis para tu asesoría y cumple desde la primera factura.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* El Problema */}
        <section className="bg-white py-20 dark:bg-gray-950 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Tu situación diaria
              </p>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Un problema de VeriFactu
                <br />
                multiplicado por cada cliente
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
                Una asesoría de pueblo con 40 autónomos a los que hace las facturas tiene un problema de VeriFactu multiplicado por 40. No es un problema de cumplimiento puntual, es un problema operativo serio.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
                <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-red-700 dark:text-red-400">
                  <span className="text-lg">❌</span> Cómo es ahora
                </h3>
                <ul className="space-y-3">
                  {[
                    'Un Excel diferente para cada uno de tus 40 clientes',
                    'Copias datos a mano cada fin de mes',
                    '40 problemas de VeriFactu sin resolver',
                    'En 2027 esto será ilegal y sancionable',
                    'Tus clientes quedan expuestos a multas de hasta 50.000€',
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
                  <span className="text-lg">✓</span> Cómo es con NovaFactura
                </h3>
                <ul className="space-y-3">
                  {[
                    'Un solo panel con los 40 clientes',
                    'Cambia de NIF en un clic, sin cerrar sesión',
                    'Cada factura va a la AEAT automáticamente',
                    'VeriFactu se genera solo — QR, hash, envío',
                    'Tus 40 clientes cumplen sin tocar nada',
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
                  Coste para tu asesoría
                </p>
              </div>
              <div>
                <div className="text-4xl font-black text-white md:text-5xl">∞</div>
                <p className="mt-2 text-sm text-gray-400">
                  Clientes sin límite
                </p>
              </div>
              <div>
                <div className="text-4xl font-black text-white md:text-5xl">
                  &lt;60<span className="text-emerald-400">s</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  Por factura con VeriFactu
                </p>
              </div>
              <div>
                <div className="text-4xl font-black text-white md:text-5xl">
                  50<span className="text-emerald-400">k</span>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  € multa que evitas
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Funcionalidades clave */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Todo lo que necesitas para no cambiar cómo trabajas
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Eye,
                  title: 'Panel central de todos tus clientes',
                  description: 'Ve el estado de cada cliente de un vistazo sin entrar en cada cuenta por separado.',
                },
                {
                  icon: Repeat,
                  title: 'Cambio de NIF en un clic',
                  description: 'Pasa de un cliente al siguiente sin cerrar sesión. Un banner te recuerda siempre bajo qué NIF operas.',
                },
                {
                  icon: Shield,
                  title: 'VeriFactu automático bajo cada NIF',
                  description: 'Cada factura queda registrada bajo el NIF del cliente con hash encadenado y QR verificable.',
                },
                {
                  icon: Users,
                  title: 'Directorio de clientes compartido',
                  description: 'Define las empresas una sola vez y reutilízalas en todas las facturas sin volver a introducir datos.',
                },
                {
                  icon: FileSpreadsheet,
                  title: 'Envío automático a la AEAT',
                  description: 'Cada factura se transmite en tiempo real al registro de la Agencia Tributaria. Sin configurar nada.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Auditoría de acciones',
                  description: 'Cada factura queda marcada con tu usuario de asesoría. Registro completo para cualquier revisión.',
                },
              ].map((feature) => {
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

        {/* CTA Final */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <div className="rounded-3xl bg-indigo-600 p-12 text-center text-white shadow-2xl dark:bg-indigo-700">
              <h2 className="mb-4 text-3xl font-bold">
                Tus clientes merecen seguir sin preocuparse.
                <br />
                Ese es tu trabajo.
              </h2>
              <p className="mb-8 text-lg text-indigo-100">
                Dales la tranquilidad de cumplir con Hacienda. Sin pedirles que aprendan nada. Gratis para tu despacho.
              </p>
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 shadow-lg transition-all hover:bg-indigo-50"
              >
                Crear cuenta de asesoría — gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-indigo-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Sin tarjeta
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Gratis para siempre
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Clientes ilimitados
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Lo que nos preguntan las asesorías" />

        <FooterLanding />
      </div>
    </>
  );
}

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
  FileText,
  Leaf,
  AlertCircle,
  Info,
  ChevronRight,
} from 'lucide-react';

const faqs = [
  {
    q: '¿Los agricultores autónomos tienen que usar VeriFactu?',
    a: 'No. Los autónomos acogidos al Régimen Especial Agrario (REAGYP) están exentos de la obligación de VeriFactu según la Ley Antifraude 11/2021. Sin embargo, sí están obligados a emitir facturas legales y a conservarlas durante al menos 4 años ante posibles requerimientos de Hacienda.',
  },
  {
    q: '¿Qué IVA aplica un autónomo agricultor en sus facturas?',
    a: 'Depende del tipo de actividad. Las ventas de productos agrícolas sin transformar tributan generalmente al 4% o al 10% de IVA. Los servicios agropecuarios pueden tributar al 10% o al 21%. Algunas actividades pueden estar exentas de IVA. NovaFactura gestiona todos estos tipos automáticamente según la actividad configurada.',
  },
  {
    q: '¿Qué es el REAGYP?',
    a: 'El REAGYP (Régimen Especial de la Agricultura, Ganadería y Pesca) es un régimen fiscal especial para autónomos del sector primario. Contempla tipos de IVA reducidos y exenciones específicas, y exime a sus acogidos de algunas obligaciones como VeriFactu. Está regulado por la Ley del IVA (artículos 124-134) y la Ley Antifraude 11/2021.',
  },
  {
    q: '¿Necesito programa de facturación si estoy en REAGYP?',
    a: 'No es obligatorio por ley, pero sí muy recomendable. Hacienda puede solicitar en cualquier momento el libro de registro de facturas emitidas. Un programa de facturación garantiza que cada factura tiene todos los campos requeridos (NIF, fecha, numeración correlativa, IVA correcto) y que el registro está siempre ordenado y disponible.',
  },
  {
    q: '¿Puedo facturar a cooperativas y a particulares con el mismo software?',
    a: 'Sí. NovaFactura te permite configurar tipos de IVA distintos por cliente o por línea de factura. Puedes emitir facturas a cooperativas, a distribuidores y a particulares con los tipos correctos en cada caso, todo desde el mismo panel.',
  },
  {
    q: '¿Funciona para ganaderos y pescadores también?',
    a: 'Sí. El REAGYP incluye a ganaderos, pescadores, mariscadores y otros trabajadores del sector primario. NovaFactura funciona para cualquier actividad de este régimen, con los tipos de IVA correctos configurados para cada una.',
  },
  {
    q: '¿Puedo usar NovaFactura aunque no tenga que hacer VeriFactu?',
    a: `Sí, perfectamente. NovaFactura funciona en modo estándar para autónomos del REAGYP: emite facturas legales, gestiona los tipos de IVA del sector agrario y mantiene el libro de registro ordenado. VeriFactu está disponible si en el futuro cambias de régimen o si alguna de tus actividades lo requiere.`,
  },
  {
    q: '¿Cuánto cuesta NovaFactura para autónomos agrícolas?',
    a: `Es gratuito hasta 2027 para todos los inscritos en el periodo de lanzamiento. No necesitas tarjeta de crédito para registrarte. A partir de 2027, el Plan Starter tiene un precio de ${brandConfig.app.name === 'NovaFactura' ? '9,90€' : '9,90€'}/mes con VeriFactu incluido (aunque no lo necesites ahora, lo tendrás disponible si cambia tu situación fiscal).`,
  },
];

const TAX_TYPES = [
  {
    rate: '4%',
    label: 'Superreducido agrario',
    examples: ['Cereales y leguminosas', 'Hortalizas y tubérculos', 'Frutas y verduras frescas'],
    color: 'bg-green-50 border-green-200 text-green-700',
    badge: 'bg-green-100 text-green-800',
  },
  {
    rate: '10%',
    label: 'Reducido agropecuario',
    examples: [
      'Carnes y productos cárnicos',
      'Leche y derivados lácteos',
      'Servicios agropecuarios',
    ],
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    badge: 'bg-blue-100 text-blue-800',
  },
  {
    rate: '21%',
    label: 'General',
    examples: [
      'Maquinaria agrícola (alquiler)',
      'Servicios de consultoría',
      'Algunos subproductos',
    ],
    color: 'bg-slate-50 border-slate-200 text-slate-700',
    badge: 'bg-slate-100 text-slate-600',
  },
  {
    rate: 'Exento',
    label: 'Sin IVA',
    examples: [
      'Algunos arrendamientos rústicos',
      'Actividades ganaderas específicas',
      'Cesión de terrenos',
    ],
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    badge: 'bg-amber-100 text-amber-800',
  },
];

const FEATURES = [
  {
    icon: FileText,
    title: 'Facturas legales sin VeriFactu',
    description:
      'Emite facturas completamente legales con numeración correlativa, NIF, fechas y tipos de IVA del REAGYP. Todo lo que necesitas si Hacienda te pide el registro.',
  },
  {
    icon: Leaf,
    title: 'Tipos de IVA agrario configurados',
    description:
      'El 4%, 10%, 21% y exento están disponibles. Configura el tipo por defecto para cada cliente o ajústalo línea a línea en cada factura.',
  },
  {
    icon: Shield,
    title: 'Registro siempre disponible',
    description:
      'Libro de facturas emitidas y recibidas ordenado y exportable en cualquier momento. Listo para cualquier inspección o requerimiento de Hacienda.',
  },
  {
    icon: CheckCircle2,
    title: 'VeriFactu disponible si lo necesitas',
    description:
      'Si cambias de régimen fiscal o parte de tu actividad requiere VeriFactu, lo activas en un clic. No tendrás que cambiar de software.',
  },
];

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Facturación para autónomos agrícolas',
      item: `${brandConfig.app.url}/facturacion-autonomo-agricola`,
    },
  ],
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `${brandConfig.app.name} para Autónomos Agrícolas`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: `${brandConfig.app.url}/facturacion-autonomo-agricola`,
  description:
    'Programa de facturación para autónomos del sector agrario: agricultores, ganaderos y pescadores. Gestiona los tipos de IVA del REAGYP y mantén tu registro de facturas siempre en orden.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Gratuito hasta 2027',
  },
  publisher: { '@type': 'Organization', name: brandConfig.app.name, url: brandConfig.app.url },
};

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Facturación para autónomos del REAGYP',
  serviceType: 'Software de facturación para autónomos agrícolas y ganaderos',
  description:
    'Programa de facturación para autónomos del Régimen Especial Agrario (REAGYP). Gestiona los tipos de IVA especiales del sector agrario, emite facturas legales y mantén el libro de registro listo para Hacienda.',
  provider: { '@type': 'Organization', name: brandConfig.app.name, url: brandConfig.app.url },
  areaServed: { '@type': 'Country', name: 'España' },
  audience: {
    '@type': 'Audience',
    audienceType: 'Autónomos del sector agrario, agricultores, ganaderos y pescadores',
  },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Gratuito hasta 2027',
  },
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

export const novafacturaReagypMetadata: Metadata = {
  title: `Facturación para autónomos agrícolas y ganaderos | ${brandConfig.app.name}`,
  description:
    'Programa de facturación para autónomos del sector agrario (REAGYP): agricultores, ganaderos y pescadores. Gestiona los tipos de IVA del régimen agrario. Gratis hasta 2027.',
  keywords: [
    'facturación autónomo agrícola',
    'programa facturación agricultor',
    'software facturas ganadero',
    'facturar como autónomo agricultor',
    'iva autónomo agricultor',
    'facturación reagyp',
    'autónomo campo facturación',
    'verifactu agricultor exento',
    'facturación sector primario',
    'programa facturas autónomo campo gratis',
  ],
  alternates: { canonical: `${brandConfig.app.url}/facturacion-autonomo-agricola` },
  openGraph: {
    title: `Facturación para autónomos agrícolas y ganaderos | ${brandConfig.app.name}`,
    description:
      'Programa de facturación para autónomos del REAGYP. IVA agrario gestionado, facturas legales y registro siempre listo para Hacienda. Gratis hasta 2027.',
    url: `${brandConfig.app.url}/facturacion-autonomo-agricola`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Facturación para autónomos agrícolas`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Facturación para autónomos agrícolas | ${brandConfig.app.name}`,
    description:
      'Gestiona el IVA agrario y emite facturas legales aunque estés exento de VeriFactu. Gratis hasta 2027.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

export function NovafacturaReagypPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <SiteHeader />

        {/* BREADCRUMB */}
        <nav
          aria-label="Breadcrumb"
          className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="mx-auto max-w-6xl px-6 py-3">
            <ol className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <li>
                <Link href="/" className="hover:text-gray-900 dark:hover:text-white">
                  Inicio
                </Link>
              </li>
              <ChevronRight className="h-3 w-3" />
              <li className="font-medium text-gray-900 dark:text-white">
                Facturación para autónomos agrícolas
              </li>
            </ol>
          </div>
        </nav>

        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-blue-50 py-20 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 md:py-28">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(34,197,94,0.07) 0%, transparent 70%)',
            }}
          />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
              <Leaf className="h-4 w-4" />
              Para agricultores, ganaderos y pescadores autónomos
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Facturación para{' '}
              <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                autónomos del campo
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Si eres agricultor, ganadero o pescador autónomo, no necesitas VeriFactu — pero sí
              necesitas emitir facturas legales con el IVA correcto y mantener tu registro en orden.{' '}
              {brandConfig.app.name} lo hace por ti.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-7 py-3.5 text-base font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 hover:shadow-xl dark:shadow-none"
              >
                Empieza gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/precios"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-base font-semibold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                Ver precios
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Gratis hasta 2027 · Sin tarjeta · Sin permanencia
            </p>
          </div>
        </section>

        {/* EXENCIÓN VERIFACTU — Featured Snippet bait + AI Overviews */}
        <section className="border-y border-amber-100 bg-amber-50 py-14 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="mx-auto max-w-3xl px-6">
            <div className="flex gap-4">
              <div className="mt-0.5 shrink-0">
                <Info className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h2 className="mb-3 text-xl font-bold text-amber-900 dark:text-amber-200">
                  ¿Tienen que usar VeriFactu los agricultores autónomos?
                </h2>
                <p className="text-amber-800 dark:text-amber-300">
                  <strong>No.</strong> Los autónomos acogidos al Régimen Especial Agrario (REAGYP)
                  están <strong>exentos de la obligación de VeriFactu</strong> según la Ley
                  Antifraude 11/2021. Sin embargo, la exención de VeriFactu no exime de emitir
                  facturas legales: Hacienda puede solicitar el libro de facturas emitidas en
                  cualquier momento, y cada factura debe cumplir todos los requisitos formales (NIF,
                  fecha, numeración correlativa, base imponible, tipo de IVA).
                </p>
                <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
                  Fuente: Ley 11/2021 de medidas de prevención y lucha contra el fraude fiscal,
                  Disposición Adicional 7ª.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* IVA AGRARIO */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                Fiscalidad del sector primario
              </span>
            </div>
            <h2 className="mb-4 text-center text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              ¿Qué IVA aplica un autónomo agrícola?
            </h2>
            <p className="mx-auto mb-12 max-w-2xl text-center text-gray-500 dark:text-gray-400">
              El tipo de IVA depende del producto o servicio. {brandConfig.app.name} los gestiona
              todos automáticamente.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TAX_TYPES.map((tax) => (
                <div key={tax.rate} className={`rounded-2xl border-2 p-6 ${tax.color}`}>
                  <div
                    className={`mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${tax.badge}`}
                  >
                    IVA {tax.rate}
                  </div>
                  <p className="mb-3 text-sm font-semibold">{tax.label}</p>
                  <ul className="space-y-1.5">
                    {tax.examples.map((ex) => (
                      <li key={ex} className="flex items-start gap-1.5 text-xs">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
              <div className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  <strong>Importante:</strong> Los tipos de IVA del sector agrario son complejos y
                  dependen de cada actividad concreta. Consulta con tu asesor fiscal el tipo
                  correcto para tu caso. {brandConfig.app.name} aplica el tipo que tú configures y
                  permite ajustarlo por cliente o por línea de factura.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="border-y border-gray-100 bg-gray-50 py-20 dark:border-gray-800 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                Para el autónomo del sector primario
              </span>
            </div>
            <h2 className="mb-4 text-center text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Todo lo que necesitas para facturar bien
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-center text-gray-500 dark:text-gray-400">
              Sin complicaciones técnicas. Sin funciones que no necesitas.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 dark:bg-green-950">
                      <Icon className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SOCIAL PROOF / CONTEXTO */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Facturar bien no es complicado.{' '}
              <span className="text-green-600">
                Solo hay que hacerlo con la herramienta correcta.
              </span>
            </h2>
            <div className="space-y-4">
              {[
                {
                  title: 'Vendes a una cooperativa',
                  text: 'La cooperativa te exige factura. Con NovaFactura la emites en 30 segundos con el IVA correcto, el número correlativo y tu NIF. Queda guardada y disponible siempre.',
                },
                {
                  title: 'Hacienda te pide el libro de facturas',
                  text: 'Exportas todas tus facturas del año en PDF o Excel desde el panel. En menos de 5 minutos tienes todo lo que necesitan.',
                },
                {
                  title: 'En el futuro cambias de régimen',
                  text: 'Si dejas el REAGYP o parte de tu actividad requiere VeriFactu, lo activas sin cambiar de software ni perder ningún dato histórico.',
                },
              ].map((scenario) => (
                <div
                  key={scenario.title}
                  className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                  <div>
                    <p className="mb-1 font-semibold text-gray-900 dark:text-white">
                      {scenario.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{scenario.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA inline */}
            <div className="mt-12 rounded-3xl bg-gradient-to-br from-green-600 to-teal-600 p-10 text-center text-white shadow-xl">
              <h3 className="mb-3 text-2xl font-extrabold">Gratis hasta 2027. Sin tarjeta.</h3>
              <p className="mb-6 text-green-100">
                Únete a los autónomos que ya gestionan su facturación sin complicaciones.
              </p>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-bold text-green-700 transition-colors hover:bg-green-50"
              >
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre facturación agraria" />

        <FooterLanding />
      </div>
    </>
  );
}

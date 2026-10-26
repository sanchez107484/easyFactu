import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  Lock,
  RefreshCcw,
  Shield,
  Smartphone,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { brandConfig, PRICING, formatPrice } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';

// Target keyword: "programa de facturación para autónomos" (day-to-day intent).
// The Home owns "programa de facturación gratis" — keep "gratis" out of the
// title/H1 here so both pages don't compete for the same query.
const PAGE_PATH = '/facturacion-online';
const PAGE_URL = `${brandConfig.app.url}${PAGE_PATH}`;
const PAGE_TITLE = `Programa de facturación para autónomos online | ${brandConfig.app.name}`;
const PAGE_DESCRIPTION =
  'Programa de facturación para autónomos online: presupuestos que pasan a factura, facturas recurrentes, control de cobros y uso desde el móvil. Sin tarjeta.';

const faqs = [
  {
    q: '¿Qué hace un programa de facturación para autónomos en el día a día?',
    a: `Te quita el trabajo repetitivo: guarda tus clientes y productos, calcula el IVA y la retención de IRPF, numera las facturas de forma correlativa, envía el PDF por email y te dice qué facturas están pendientes de cobro. Con ${brandConfig.app.name} además conviertes presupuestos en facturas con un clic y programas las facturas que se repiten cada mes.`,
  },
  {
    q: '¿Puedo convertir un presupuesto en factura sin volver a escribirlo?',
    a: 'Sí. Cuando el cliente acepta el presupuesto, lo conviertes en factura (o en factura proforma) con un clic. Se copian el cliente, las líneas, los impuestos y los descuentos, y la factura recibe el siguiente número de su serie.',
  },
  {
    q: '¿Cómo funcionan las facturas recurrentes?',
    a: 'Creas una plantilla con el cliente, los conceptos y la frecuencia (mensual, trimestral, semestral o anual). El programa genera cada factura en su fecha y, si lo activas, la confirma automáticamente. Es ideal para cuotas de mantenimiento, igualas o alquileres.',
  },
  {
    q: '¿Cómo controlo qué clientes me deben dinero?',
    a: 'Cada factura tiene su estado de cobro: pendiente, cobrada parcialmente o cobrada. Registras los pagos (completos o parciales) con su fecha y método, y el panel te muestra el importe pendiente y las facturas vencidas para que sepas a quién reclamar.',
  },
  {
    q: '¿Hay app móvil?',
    a: `${brandConfig.app.name} funciona en el navegador del móvil y puedes añadirlo a la pantalla de inicio para abrirlo como una app, sin descargar nada de la tienda. Desde el móvil creas facturas, consultas cobros y envías el PDF al cliente al momento.`,
  },
  {
    q: '¿Me ayuda con el modelo 303 del IVA?',
    a: 'Sí. El programa genera un resumen trimestral con la base imponible y las cuotas de IVA repercutido para que tú o tu asesor preparéis el modelo 303 sin sumar factura por factura.',
  },
  {
    q: `¿Cuánto cuesta ${brandConfig.app.name}?`,
    a: `Es gratis hasta 2027 para las primeras altas. Después, el Plan Básico cuesta ${formatPrice(PRICING.starter.monthly)}€/mes (${formatPrice(PRICING.starter.annualMonthly)}€/mes en pago anual) y el Plan PRO ${formatPrice(PRICING.pro.monthly)}€/mes (${formatPrice(PRICING.pro.annualMonthly)}€/mes anual). Sin permanencia.`,
  },
  {
    q: `¿${brandConfig.app.name} está adaptado a VeriFactu?`,
    a: 'Sí, mediante declaración responsable del fabricante. Cada factura incluye el hash encadenado y el código QR, y el registro puede enviarse a la AEAT. Cuando VeriFactu sea obligatorio no tendrás que cambiar de programa.',
  },
];

export const novafacturaFacturacionOnlineMetadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
  robots: { index: true, follow: true },
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: brandConfig.app.name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  url: PAGE_URL,
  description:
    'Programa de facturación online para autónomos: presupuestos convertibles en factura, facturas recurrentes, control de cobros y uso desde el móvil.',
  featureList: [
    'Conversión de presupuesto a factura con un clic',
    'Facturas recurrentes mensuales, trimestrales, semestrales o anuales',
    'Control de cobros completos y parciales',
    'Aviso de facturas vencidas',
    'Uso desde el móvil sin instalación',
    'Cálculo automático de IVA e IRPF',
    'Adaptado a VeriFactu',
  ],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Gratis hasta 2027 para las primeras altas',
  },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
    logo: { '@type': 'ImageObject', url: `${brandConfig.app.url}${brandConfig.logos.main}` },
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

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Programa de facturación para autónomos',
      item: PAGE_URL,
    },
  ],
};

const dailyWorkSections = [
  {
    id: 'presupuestos',
    icon: ClipboardList,
    title: 'Presupuestos que pasan a factura con un clic',
    intro:
      'Envías el presupuesto, el cliente dice que sí y lo conviertes en factura sin volver a teclear ni una línea.',
    points: [
      'Presupuestos en PDF con tu logo, listos para enviar por email',
      'Estado de cada presupuesto: pendiente, aceptado o rechazado',
      'Conversión a factura o a factura proforma con un clic',
      'La factura toma el siguiente número de la serie automáticamente',
    ],
    guide: { href: '/facturas/proforma', label: 'Qué es una factura proforma y cuándo usarla' },
  },
  {
    id: 'recurrentes',
    icon: RefreshCcw,
    title: 'Facturas recurrentes que se emiten solas',
    intro:
      'Cuotas de mantenimiento, igualas, alquileres: configúralas una vez y olvídate de hacerlas cada mes.',
    points: [
      'Frecuencia mensual, trimestral, semestral o anual',
      'Generación automática en la fecha programada',
      'Confirmación automática opcional',
      'Pausa o modifica una recurrente cuando cambie el contrato',
    ],
    guide: { href: '/facturas/como-hacer-una-factura', label: 'Cómo hacer una factura correcta' },
  },
  {
    id: 'cobros',
    icon: Wallet,
    title: 'Control de cobros: quién te debe y desde cuándo',
    intro:
      'Deja de cruzar el extracto del banco con una hoja de Excel. Cada factura sabe si está cobrada.',
    points: [
      'Estado de cobro en cada factura: pendiente, parcial o cobrada',
      'Registro de pagos parciales con fecha y método de pago',
      'Facturas vencidas destacadas en el panel',
      'Importe total pendiente de cobro siempre visible',
    ],
    guide: { href: '/facturas/con-irpf', label: 'Factura con IRPF: retenciones del 7 % y 15 %' },
  },
  {
    id: 'movil',
    icon: Smartphone,
    title: 'App móvil: factura desde la obra o desde casa del cliente',
    intro:
      'Termina el trabajo, haz la factura en el móvil y envíala antes de irte. Sin descargar nada.',
    points: [
      'Funciona en el navegador de cualquier móvil o tablet',
      'Añádela a la pantalla de inicio y ábrela como una app',
      'Los mismos datos en el móvil y en el ordenador',
      'Envío del PDF al cliente por email al momento',
    ],
    guide: {
      href: '/facturas/simplificada',
      label: 'Factura simplificada: cuándo puedes emitirla',
    },
  },
];

const professions = [
  {
    title: 'Oficios y reformas',
    desc: 'Fontaneros, electricistas, pintores: presupuesto en obra y factura al terminar.',
  },
  {
    title: 'Consultores y freelances',
    desc: 'Diseño, desarrollo, marketing: igualas mensuales con facturas recurrentes.',
  },
  {
    title: 'Profesionales con IRPF',
    desc: 'Abogados, arquitectos, formadores: retención del 7 % o 15 % aplicada sola.',
  },
  {
    title: 'Agricultores en REAGYP',
    desc: 'Compensación del 12 % o 10,5 % calculada en cada factura.',
    href: '/facturacion-autonomo-agricola',
  },
];

const trustBadges = [
  { icon: CreditCard, text: 'Sin tarjeta al registrarte' },
  { icon: Clock, text: 'Activación inmediata' },
  { icon: Shield, text: 'Adaptado a VeriFactu' },
  { icon: Lock, text: 'RGPD compliant' },
];

function DailyWorkSection({
  section,
  isAlternate,
}: {
  section: (typeof dailyWorkSections)[number];
  isAlternate: boolean;
}) {
  const Icon = section.icon;
  return (
    <section
      id={section.id}
      className={`scroll-mt-20 py-16 md:py-20 ${isAlternate ? 'bg-slate-50' : 'bg-white'}`}
    >
      <div className="mx-auto grid max-w-5xl gap-10 px-6 md:grid-cols-2 md:items-center">
        <div>
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
            <Icon className="h-6 w-6 text-indigo-600" />
          </div>
          <h2 className="mb-4 text-2xl font-bold text-slate-900 sm:text-3xl">{section.title}</h2>
          <p className="text-slate-500">{section.intro}</p>
          <Link
            href={section.guide.href}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline"
          >
            {section.guide.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ul className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6">
          {section.points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function NovafacturaFacturacionOnlinePage(): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h1
              data-speakable
              className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
            >
              Programa de facturación para <span className="text-indigo-600">autónomos</span>,
              online y sin papeles
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
              Presupuestos que pasan a factura, facturas recurrentes que se emiten solas, control de
              quién te debe dinero y todo desde el móvil. Lo que haces cada semana, en la mitad de
              tiempo.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-700"
              >
                <Sparkles className="h-5 w-5" />
                Probarlo con mis facturas
              </Link>
              <Link
                href="/funcionalidades"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
              >
                Ver todas las funcionalidades
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {trustBadges.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Icon className="h-4 w-4 text-indigo-500" />
                  {text}
                </div>
              ))}
            </div>
            <nav aria-label="En esta página" className="mt-10 flex flex-wrap justify-center gap-2">
              {dailyWorkSections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="rounded-full border border-indigo-100 bg-white px-4 py-1.5 text-sm font-medium text-indigo-700 hover:border-indigo-300"
                >
                  {section.title.split(':')[0]}
                </a>
              ))}
            </nav>
          </div>
        </section>

        {dailyWorkSections.map((section, i) => (
          <DailyWorkSection key={section.id} section={section} isAlternate={i % 2 === 1} />
        ))}

        {/* Para quién */}
        <section className="bg-slate-50 py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-center text-3xl font-bold text-slate-900">
              Un programa de facturación para cada tipo de autónomo
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {professions.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-white p-5"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                    {item.href && (
                      <Link
                        href={item.href}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                      >
                        Facturación para agricultores <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm text-slate-500">
              ¿Llevas una asesoría?{' '}
              <Link
                href="/software-para-asesorias"
                className="font-medium text-indigo-600 hover:underline"
              >
                Software para asesorías y gestorías →
              </Link>
            </p>
          </div>
        </section>

        {/* Precio */}
        <section className="bg-indigo-50 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">
              Sin coste hasta 2027. Luego desde {formatPrice(PRICING.starter.monthly)}
              €/mes.
            </h2>
            <p className="mb-8 text-slate-600">
              Sin tarjeta al registrarte. Sin permanencia. VeriFactu incluido en todos los planes.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-700"
              >
                <Sparkles className="h-5 w-5" />
                Crear mi cuenta
              </Link>
              <Link href="/precios" className="text-sm font-medium text-indigo-700 hover:underline">
                Ver todos los planes →
              </Link>
            </div>
          </div>
        </section>

        <FaqSection
          faqs={faqs}
          title="Preguntas frecuentes sobre el programa de facturación para autónomos"
        />

        <RelatedLinksSection
          title="Guías de facturación para autónomos"
          links={[
            { href: '/facturas', label: 'Todos los tipos de facturas' },
            {
              href: '/facturas/como-hacer-una-factura',
              label: 'Cómo hacer una factura paso a paso',
            },
            { href: '/facturas/con-irpf', label: 'Factura con retención de IRPF' },
            { href: '/facturas/rectificativa', label: 'Cómo hacer una factura rectificativa' },
            { href: '/factura-electronica', label: 'Factura electrónica obligatoria' },
            { href: '/verifactu', label: 'VeriFactu — guía completa' },
          ]}
        />

        {/* CTA final */}
        <section className="border-t bg-slate-900 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Recupera las horas que pierdes facturando
            </h2>
            <p className="mb-8 text-slate-400">Gratis hasta 2027. Sin tarjeta. Sin compromisos.</p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-indigo-400"
            >
              <Sparkles className="h-5 w-5" />
              Crear mi cuenta
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <FooterLanding />
      </div>
    </>
  );
}

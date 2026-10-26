import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  Zap,
  Download,
  CheckCircle2,
  Clock,
  Users,
  Lock,
  Smartphone,
  ArrowRight,
  Star,
  CreditCard,
  FileText,
  Send,
  Calculator,
  TrendingUp,
  Wallet,
  ClipboardList,
  MonitorSmartphone,
} from 'lucide-react';
import { brandConfig, PRICING, formatPrice } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { HomeStickyCtaBanner } from '@/components/home/home-client';
import { ExcelComparison, excelComparisonTableJsonLd } from '@/components/home/excel-comparison';
import { AgencyCallout } from '@/components/home/agency-callout';
import { CustomerStoryLink } from '@/components/home/customer-story-link';
import FaqSection from '@/components/FaqSection';
import { VerifactuDeadlines } from '@/components/verifactu-deadlines';
import { FreeOfferEndedNotice } from '@/components/marketing/free-slots-meter';
import { VERIFACTU_ANNOUNCED_DEADLINE } from '@/lib/verifactu-deadlines';
import { formatCount, freeSlotsLabel, getSignupSlots } from '@/lib/signup-slots';
import { PlanFeatureList } from '@/components/marketing/plan-feature-list';
import { softwareApplicationJsonLd } from '@/lib/structured-data';
import {
  BASIC_PLAN_FEATURES,
  PLAN_DESCRIPTIONS,
  PLAN_NAMES,
  PRO_ONLY_FEATURES,
} from '@/lib/plan-features';

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: 'Carlos Martínez',
    role: 'Fontanero autónomo',
    location: 'Valencia',
    text: `No entiendo de tecnología, pero esto lo maneja cualquiera. Las facturas se generan en segundos y van a Hacienda automáticamente con ${brandConfig.app.name}.`,
    stars: 5,
    initials: 'CM',
  },
  {
    name: 'Patricia Gurrea',
    role: 'Consultora de negocio',
    location: 'Pamplona',
    text: `Funciona todo muy bien, igual de bien que otras más caras que he usado. Y lo mejor es que es gratis hasta 2027, una oportunidad que no podía dejar pasar.`,
    stars: 5,
    initials: 'PG',
  },
];

const steps = [
  {
    num: '01',
    title: 'Elige cliente y concepto',
    desc: 'Los datos del cliente y del producto se rellenan solos. Solo indicas cantidad y precio.',
    icon: FileText,
  },
  {
    num: '02',
    title: 'El programa calcula todo',
    desc: 'IVA, retención de IRPF, totales y número de factura correlativo, sin fórmulas.',
    icon: Calculator,
  },
  {
    num: '03',
    title: 'Envía y cobra',
    desc: 'Tu cliente recibe el PDF por email y tú ves en el panel si ya te ha pagado.',
    icon: Send,
  },
];

// Ordered by what a freelancer leaving Excel values most; VeriFactu closes the list.
const features = [
  {
    icon: Zap,
    title: 'Facturas en 60 segundos',
    description: 'Sin plantillas que copiar: eliges cliente y concepto y la factura está lista.',
  },
  {
    icon: Calculator,
    title: 'IVA e IRPF automáticos',
    description: 'Tipos de IVA del 21 %, 10 % y 4 % y retención del 7 % o 15 % aplicados solos.',
  },
  {
    icon: ClipboardList,
    title: 'Presupuestos y recurrentes',
    description: 'Convierte un presupuesto en factura con un clic y programa las cuotas mensuales.',
  },
  {
    icon: Wallet,
    title: 'Control de cobros',
    description: 'Facturas pendientes, cobradas y vencidas de un vistazo, con cobros parciales.',
  },
  {
    icon: Smartphone,
    title: 'Desde el móvil',
    description: 'Factura en la obra o en casa del cliente. Sin instalar nada.',
  },
  {
    icon: Download,
    title: 'Adiós a Excel en minutos',
    description: 'Importa clientes y facturas desde Excel, CSV o Holded con ayuda del equipo.',
  },
  {
    icon: Shield,
    title: 'Preparado para VeriFactu',
    description: 'Hash encadenado, QR y registro en la AEAT incluidos para cuando sea obligatorio.',
  },
];

const faqs = [
  {
    q: `¿${brandConfig.app.name} es un programa de facturación gratis de verdad?`,
    a: `Sí. Las primeras ${formatCount(PRICING.freePeriodSlots)} altas tienen acceso completo y gratuito hasta 2027: facturas ilimitadas, presupuestos, recurrentes, control de cobros y VeriFactu. No pedimos tarjeta al registrarte y no hay permanencia.`,
  },
  {
    q: '¿Cuánto tiempo me ahorra frente a Excel o Word?',
    a: `Con ${brandConfig.app.name} una factura queda lista en menos de un minuto: los datos del cliente y de los productos se rellenan solos, el IVA y el IRPF se calculan automáticamente y la numeración es correlativa sin que tengas que revisarla. Además, los presupuestos se convierten en factura con un clic y las facturas recurrentes se emiten solas.`,
  },
  {
    q: '¿Se necesitan conocimientos de contabilidad para usar el programa?',
    a: 'No. Está diseñado para profesionales sin formación contable ni fiscal. Introduces los datos básicos — cliente, concepto, cantidad — y el programa calcula el IVA, aplica la retención de IRPF si corresponde y genera el PDF listo para enviar. También ves un resumen del IVA para preparar el modelo 303 trimestral.',
  },
  {
    q: '¿Puedo emitir presupuestos y facturas proforma además de facturas?',
    a: `Sí. ${brandConfig.app.name} incluye presupuestos, facturas proforma y facturas recurrentes. Un presupuesto aceptado se convierte en factura con un solo clic, y las recurrentes se generan cada mes, trimestre o año según configures.`,
  },
  {
    q: '¿Es posible migrar facturas y clientes desde Excel u otro programa?',
    a: 'Sí. Importación desde Excel, CSV o directamente desde Holded. Subes tu base de clientes en un archivo y tus facturas históricas quedan disponibles en tu cuenta. La migración es gratuita y nuestro equipo te ayuda durante el proceso.',
  },
  {
    q: '¿Cuánto cuesta después de 2027?',
    a: `Los dos planes tienen facturas ilimitadas y VeriFactu: Plan Básico ${formatPrice(PRICING.starter.monthly)}€/mes o ${formatPrice(PRICING.starter.annualMonthly)}€/mes si pagas anual. Plan PRO ${formatPrice(PRICING.pro.monthly)}€/mes (añade gastos, proveedores, rentabilidad e informes) o ${formatPrice(PRICING.pro.annualMonthly)}€/mes anual. Sin permanencia.`,
  },
  {
    q: '¿Cuándo es obligatorio VeriFactu para autónomos?',
    a: `${VERIFACTU_ANNOUNCED_DEADLINE.summary}: el 5 de octubre de 2026 el Ministerio de Hacienda comunicó que aplazará las obligaciones pendientes del Reglamento VeriFactu hasta ${VERIFACTU_ANNOUNCED_DEADLINE.label}, para que coincidan con la factura electrónica obligatoria. Tienes tiempo para planificar el cambio sin prisas.`,
  },
  {
    q: `¿${brandConfig.app.name} está adaptado a VeriFactu?`,
    a: `Sí. ${brandConfig.app.name} está adaptado a VeriFactu (declaración responsable del fabricante). La AEAT no homologa ni certifica programas: cada fabricante declara que su software cumple el Reglamento. Genera automáticamente el hash encadenado SHA-256, el código QR verificable y puede enviar cada registro a la AEAT.`,
  },
];

const trustBadges = [
  { icon: CreditCard, text: 'Sin tarjeta al registrarte' },
  { icon: Clock, text: 'Activación inmediata' },
  { icon: MonitorSmartphone, text: 'Sin instalar nada' },
  { icon: Lock, text: 'RGPD compliant' },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEO — JSON-LD structured data
// ─────────────────────────────────────────────────────────────────────────────
const homepageFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const homepageSoftwareJsonLd = softwareApplicationJsonLd({
  path: '/',
  featureList: [
    'Programa de facturación gratis hasta 2027',
    'Facturación en menos de 60 segundos',
    'Cálculo automático de IVA e IRPF',
    'Numeración correlativa por series',
    'Presupuestos, proformas y facturas recurrentes',
    'Control de cobros y facturas vencidas',
    'Acceso multiplataforma (web, móvil, tablet)',
    'Migración desde Excel, CSV y Holded',
    'Soporte en español en menos de 2 horas',
    'Adaptado a VeriFactu: hash encadenado, QR y envío a la AEAT',
  ],
});

// ─────────────────────────────────────────────────────────────────────────────
// SEO — Metadata
// ─────────────────────────────────────────────────────────────────────────────
const HOME_TITLE = `Programa de facturación gratis para autónomos | ${brandConfig.app.name}`;
const HOME_DESCRIPTION =
  'Programa de facturación gratis para autónomos: facturas en 60 segundos con IVA e IRPF calculados, numeración automática y control de cobros. Sin tarjeta.';

export const novafacturaHomeMetadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: brandConfig.app.url,
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: brandConfig.app.url,
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    siteName: brandConfig.app.name,
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Programa de facturación gratis para autónomos`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
  robots: { index: true, follow: true },
};

// ─────────────────────────────────────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${className}`}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────────────────────────────────
export async function NovafacturaHomePage() {
  const slots = await getSignupSlots();
  const slotsLabel = freeSlotsLabel(slots);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageFaqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageSoftwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(excelComparisonTableJsonLd) }}
      />
      <SiteHeader />

      <main className="flex-1">
        {/* ══ SECTION 1 — HERO ══ */}
        <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 75% 25%, #3b82f6 0%, transparent 40%)',
            }}
          />
          <div className="relative mx-auto w-full max-w-4xl px-4 py-12 text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-semibold text-green-800 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Gratis hasta 2027 · sin tarjeta
            </div>

            <h1
              data-speakable
              className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
            >
              Programa de facturación gratis:{' '}
              <span className="text-blue-600">haz tus facturas en 60 segundos</span>
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-500 sm:text-xl">
              Deja la plantilla de Excel. El IVA, el IRPF y la numeración se calculan solos, envías
              el PDF por email y ves quién te ha pagado.{' '}
              <strong className="text-slate-800">Más rápido y sin errores.</strong>
            </p>

            <div className="mb-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-base font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
              >
                Crear mi cuenta gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#frente-a-excel"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              >
                Compararlo con Excel
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
              {trustBadges.map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-blue-500" />
                  {text}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SECTION 2 — HOW IT WORKS ══ */}
        <section
          id="como-funciona"
          className="border-y border-slate-100 bg-slate-50 py-16 md:py-24"
        >
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Cómo funciona
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Cómo hacer una factura en 60 segundos
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-2xl text-center text-slate-500">
              Sin conocimientos de contabilidad. Sin fórmulas. Sin instalar nada.
            </p>
            <div className="relative grid gap-8 md:grid-cols-3">
              <div
                className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-slate-200 md:block"
                aria-hidden="true"
              />
              {steps.map((step) => (
                <div key={step.num} className="relative flex flex-col items-center text-center">
                  <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
                    <step.icon className="h-8 w-8 text-blue-600" />
                    <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                      {step.num.replace('0', '')}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
              >
                Hacer mi primera factura gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ══ SECTION 3 — FEATURES ══ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Funcionalidades
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Todo lo que incluye el programa de facturación gratis
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-2xl text-center text-slate-500">
              Sin funciones bloqueadas ni límite de facturas durante el periodo gratuito.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card
                  key={f.title}
                  className="border-2 p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                    <f.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="mb-2 font-bold text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-500">{f.description}</p>
                </Card>
              ))}
            </div>
            <p className="mt-10 text-center text-sm text-slate-500">
              <Link href="/funcionalidades" className="font-semibold text-blue-600 hover:underline">
                Ver todas las funcionalidades una a una →
              </Link>
            </p>
          </div>
        </section>

        {/* ══ SECTION 4 — VS EXCEL ══ */}
        <ExcelComparison />

        {/* ══ SECTION 5 — OFFER ══ */}
        <section id="registro" className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <Card className="overflow-hidden border-2 border-blue-200">
              <div className="bg-gradient-to-br from-blue-50 via-white to-transparent p-8 text-center md:p-12">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                  <Clock className="h-4 w-4" />
                  Oferta limitada a {formatCount(PRICING.freePeriodSlots)} inscripciones
                </div>
                <h2 className="mb-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                  Gratis hasta 2027
                </h2>
                <p className="mb-2 text-lg font-bold text-blue-600">Sin tarjeta al registrarte</p>
                <p className="mb-6 text-slate-500">
                  Accede a todas las funcionalidades sin coste. Reservado para los primeros{' '}
                  {formatCount(PRICING.freePeriodSlots)} profesionales.
                </p>
                {slots?.isSoldOut && (
                  <div className="mx-auto mb-8 max-w-md">
                    <FreeOfferEndedNotice total={slots.total} />
                  </div>
                )}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                  {[
                    { icon: Clock, value: 'Hasta 2027', label: 'Acceso completo' },
                    { icon: CreditCard, value: '0€', label: 'Sin tarjeta al registrarte' },
                    {
                      icon: TrendingUp,
                      value: `desde ${formatPrice(PRICING.starter.annualMonthly)}€`,
                      label: `${PLAN_NAMES.basic} o ${PLAN_NAMES.pro} · por mes (pago anual)`,
                    },
                  ].map(({ icon: Icon, value, label }) => (
                    <div
                      key={label}
                      className="rounded-xl border border-slate-100 bg-white p-4 text-center"
                    >
                      <Icon className="mx-auto mb-2 h-5 w-5 text-blue-600" />
                      <div className="text-2xl font-extrabold text-slate-900">{value}</div>
                      <p className="text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mb-4 grid gap-3 text-left sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-800">Plan {PLAN_NAMES.basic}</p>
                      <span className="text-base font-extrabold text-slate-700">
                        {formatPrice(PRICING.starter.monthly)}€
                        <span className="text-xs font-normal text-slate-400">/mes</span>
                      </span>
                    </div>
                    <p className="mb-3 text-xs text-slate-500">{PLAN_DESCRIPTIONS.basic}</p>
                    <PlanFeatureList included={BASIC_PLAN_FEATURES} />
                  </div>
                  <div className="rounded-xl border-2 border-blue-200 bg-blue-50/50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Plan PRO</p>
                        <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          Todo incluido
                        </span>
                      </div>
                      <span className="text-base font-extrabold text-slate-700">
                        {formatPrice(PRICING.pro.monthly)}€
                        <span className="text-xs font-normal text-slate-400">/mes</span>
                      </span>
                    </div>
                    <p className="mb-3 text-xs text-slate-500">{PLAN_DESCRIPTIONS.pro}</p>
                    <PlanFeatureList
                      included={[`Todo lo del plan ${PLAN_NAMES.basic}`, ...PRO_ONLY_FEATURES]}
                    />
                  </div>
                </div>
                <p className="mb-8 text-center text-xs text-slate-400">
                  Puedes elegir o cambiar de plan en cualquier momento.{' '}
                  <Link href="/precios" className="font-semibold text-blue-600 hover:underline">
                    Ver precios completos →
                  </Link>
                </p>
                <Link
                  href="/registro"
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-10 text-base font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
                >
                  Empezar gratis ahora
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-4 text-sm text-slate-400">
                  Registro en 2 minutos · Solo se requiere email · Sin compromiso
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* ══ SECTION 6 — AGENCIES ══ */}
        <AgencyCallout />

        {/* ══ SECTION 7 — SOCIAL PROOF ══ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Testimonios
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Autónomos que ya han dejado Excel
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-xl text-center text-slate-500">
              {slots
                ? `${formatCount(slots.occupied)} autónomos y pymes ya facturan con ${brandConfig.app.name}`
                : `Autónomos y pymes de toda España ya facturan con ${brandConfig.app.name}`}
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.name} className="border-2 border-slate-200 p-6">
                  <div className="mb-4 flex">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <blockquote className="mb-6 text-sm leading-relaxed text-slate-500">
                    &ldquo;{t.text}&rdquo;
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {t.initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-400">
                        {t.role} · {t.location}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <CustomerStoryLink />
          </div>
        </section>

        {/* ══ SECTION 8 — VERIFACTU (future-proof, not the headline) ══ */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-8 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Preparado para el futuro
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                VeriFactu: preparado para cuando sea obligatorio
              </h2>
            </div>
            <div className="space-y-4 text-slate-500">
              <p>
                Con el <strong className="text-slate-800">Reglamento VeriFactu</strong>, cada
                factura llevará un <strong className="text-slate-800">hash encadenado</strong>, un{' '}
                <strong className="text-slate-800">código QR verificable</strong> y la opción de
                enviar el registro a la <strong className="text-slate-800">AEAT</strong>. Excel o
                Word no generan estos registros.{' '}
                <strong className="text-slate-800">{VERIFACTU_ANNOUNCED_DEADLINE.summary}.</strong>
              </p>
              <p>
                {brandConfig.app.name} ya lo hace en cada factura, sin coste extra: cuando llegue la
                obligación no tendrás que cambiar de programa.{' '}
                <Link href="/verifactu" className="font-semibold text-blue-600 hover:underline">
                  Guía completa de VeriFactu →
                </Link>
              </p>
            </div>
            <div className="mt-6">
              <VerifactuDeadlines />
            </div>
          </div>
        </section>

        {/* ══ SECTION 9 — FAQ ══ */}
        <FaqSection
          faqs={faqs}
          title="Preguntas frecuentes sobre el programa de facturación gratis"
          subtitle="Resolvemos las consultas más frecuentes de autónomos y pymes"
        />

        {/* ══ SECTION 10 — FINAL CTA ══ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-2xl px-4 text-center">
            {slotsLabel && (
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                <Users className="h-4 w-4" />
                {slotsLabel}
              </div>
            )}
            <h2 className="mb-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Haz tu primera factura gratis hoy
            </h2>
            <p className="mb-8 text-lg text-slate-500">
              {slots && !slots.isSoldOut && (
                <>
                  Únete a los {formatCount(slots.occupied)} profesionales que ya facturan con{' '}
                  {brandConfig.app.name}.
                  <br />
                </>
              )}
              Gratis hasta 2027. Sin tarjeta al registrarte. Sin compromiso.
            </p>
            <Link
              href="/registro"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-10 text-base font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
            >
              Crear mi cuenta gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Gratis hasta 2027
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Sin tarjeta al registrarte
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Activación inmediata
              </span>
            </div>
          </div>
        </section>
      </main>

      <FooterLanding />
      <HomeStickyCtaBanner slots={slots} />
    </div>
  );
}

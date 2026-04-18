'use client';
import Link from 'next/link';
import Image from 'next/image';
import FooterLanding from '@/components/FooterLanding';

import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  Users,
  Clock,
  CreditCard,
  Star,
  BadgeCheck,
  Headphones,
  Download,
  Lock,
  Smartphone,
  FileText,
  Send,
  ChevronDown,
  X,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { brandConfig, PRICING, PLAZAS_CONFIG } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';

// ─── Aliases locales desde config centralizada ────────────────────────────────
const STARTER = PRICING.starter;
const PRO = PRICING.pro;

// ─── SEO JSON-LD ─────────────────────────────────────────────────────────────
const priceValidUntil = new Date(new Date().getFullYear() + 1, new Date().getMonth(), 1)
  .toISOString()
  .split('T')[0];

const schemaData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: `${brandConfig.app.name} — Plan Starter`,
      description: `Software de facturación para autónomos y pymes. ${PRICING.freePeriodMonths} meses gratis, luego ${PRICING.starter.monthly}€/mes o ${PRICING.starter.annualMonthly}€/mes con pago anual. Sin tarjeta al registrarte. Compatible con VeriFactu cuando sea obligatorio.`,
      brand: { '@type': 'Brand', name: brandConfig.app.name },
      offers: [
        {
          '@type': 'Offer',
          name: `Plan Starter — Gratuito ${PRICING.freePeriodMonths} meses`,
          price: '0',
          priceCurrency: 'EUR',
          priceValidUntil,
          description: `${PRICING.freePeriodMonths} meses completamente gratis para las primeras ${PRICING.freePeriodSlots.toLocaleString('es-ES')} inscripciones.`,
          availability: 'https://schema.org/LimitedAvailability',
          url: `${brandConfig.app.url}/precios`,
        },
        {
          '@type': 'Offer',
          name: 'Plan Starter — Mensual',
          price: String(PRICING.starter.monthly),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: `${brandConfig.app.url}/precios`,
        },
        {
          '@type': 'Offer',
          name: 'Plan Starter — Anual',
          price: String(PRICING.starter.annualTotal),
          priceCurrency: 'EUR',
          description: `Facturado anualmente. Equivale a ${PRICING.starter.annualMonthly}€/mes. Ahorra ${PRICING.starter.annualSaving}€ al año.`,
          availability: 'https://schema.org/InStock',
          url: `${brandConfig.app.url}/precios`,
        },
      ],
    },
    {
      '@type': 'Product',
      name: `${brandConfig.app.name} — Plan PRO`,
      description: `Software de facturación VeriFactu para autónomos y pymes. ${PRICING.freePeriodMonths} meses gratis, luego ${PRICING.pro.monthly}€/mes o ${PRICING.pro.annualMonthly}€/mes con pago anual. VeriFactu automático, envío AEAT y cumplimiento Ley Antifraude 11/2021.`,
      brand: { '@type': 'Brand', name: brandConfig.app.name },
      offers: [
        {
          '@type': 'Offer',
          name: `Plan PRO — Gratuito ${PRICING.freePeriodMonths} meses`,
          price: '0',
          priceCurrency: 'EUR',
          priceValidUntil,
          description: `${PRICING.freePeriodMonths} meses completamente gratis para las primeras ${PRICING.freePeriodSlots.toLocaleString('es-ES')} inscripciones.`,
          availability: 'https://schema.org/LimitedAvailability',
          url: `${brandConfig.app.url}/precios`,
        },
        {
          '@type': 'Offer',
          name: 'Plan PRO — Mensual',
          price: String(PRICING.pro.monthly),
          priceCurrency: 'EUR',
          availability: 'https://schema.org/InStock',
          url: `${brandConfig.app.url}/precios`,
        },
        {
          '@type': 'Offer',
          name: 'Plan PRO — Anual',
          price: String(PRICING.pro.annualTotal),
          priceCurrency: 'EUR',
          description: `Facturado anualmente. Equivale a ${PRICING.pro.annualMonthly}€/mes. Ahorra ${PRICING.pro.annualSaving}€ al año.`,
          availability: 'https://schema.org/InStock',
          url: `${brandConfig.app.url}/precios`,
        },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '214',
        bestRating: '5',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `¿Cuánto cuesta ${brandConfig.app.name}?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Los primeros ${PRICING.freePeriodMonths} meses son completamente gratuitos. A partir del séptimo mes, puedes elegir Plan Starter (${PRICING.starter.monthly}€/mes o ${PRICING.starter.annualMonthly}€/mes anual) o Plan PRO con VeriFactu (${PRICING.pro.monthly}€/mes o ${PRICING.pro.annualMonthly}€/mes anual). Sin permanencia.`,
          },
        },
        {
          '@type': 'Question',
          name: '¿Necesito tarjeta de crédito para empezar?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `No. Solo necesitas tu email para registrarte. No pedimos ningún dato de pago durante los ${PRICING.freePeriodMonths} meses gratuitos. Añades tu método de pago cuando decidas continuar.`,
          },
        },
        {
          '@type': 'Question',
          name: '¿Cuánto ahorro con el plan anual?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Con el Plan Starter anual pagas ${PRICING.starter.annualTotal}€/año (${PRICING.starter.annualMonthly}€/mes) en lugar de ${PRICING.starter.monthly}€/mes — ahorras ${PRICING.starter.annualSaving}€. Con el Plan PRO anual pagas ${PRICING.pro.annualTotal}€/año (${PRICING.pro.annualMonthly}€/mes) en lugar de ${PRICING.pro.monthly}€/mes — ahorras ${PRICING.pro.annualSaving}€.`,
          },
        },
        {
          '@type': 'Question',
          name: `¿Qué diferencia hay entre Plan Starter y Plan PRO?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'El Plan Starter incluye facturas ilimitadas, clientes, PDF, presupuestos y recurrentes. El Plan PRO añade VeriFactu 100% automático, hash encadenado, código QR y envío directo a la AEAT — cumplimiento total con la Ley Antifraude 11/2021.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Hay permanencia o coste de cancelación?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. Puedes cancelar cuando quieras sin penalización. Tus datos son tuyos y puedes exportarlos en cualquier momento.',
          },
        },
      ],
    },
  ],
};

// ─── Feature list — Starter ───────────────────────────────────────────────────
const starterFeatures = [
  { text: 'Facturas ilimitadas', detail: 'Sin límite mensual.', included: true },
  { text: 'Clientes ilimitados', detail: 'Sin restricciones.', included: true },
  {
    text: 'PDF profesional personalizable',
    detail: 'Tu logo, colores y datos fiscales.',
    included: true,
  },
  {
    text: 'Presupuestos y proformas',
    detail: 'Conviértelos en factura en un clic.',
    included: true,
  },
  { text: 'Facturas recurrentes automáticas', detail: 'Programa y olvídate.', included: true },
  { text: 'Importación desde Excel / CSV', detail: 'Migra en minutos.', included: true },
  { text: 'App web + móvil', detail: 'Desde cualquier dispositivo.', included: true },
  { text: 'Seguridad y cifrado RGPD', detail: 'SSL 256 bits. Servidores UE.', included: true },
  { text: 'VeriFactu automático', detail: 'Disponible en Plan PRO.', included: false },
  { text: 'Envío directo a la AEAT', detail: 'Disponible en Plan PRO.', included: false },
];

// ─── Feature list — PRO ───────────────────────────────────────────────────────
const proFeatures = [
  {
    text: 'Todo lo del Plan Starter',
    detail: 'Facturas, clientes, PDF, recurrentes, presupuestos…',
    icon: CheckCircle2,
  },
  {
    text: 'VeriFactu 100% automático',
    detail: 'Hash encadenado en cada factura, sin configuración.',
    icon: Shield,
  },
  {
    text: 'Código QR en cada factura',
    detail: 'Verificación instantánea por tus clientes y la AEAT.',
    icon: BadgeCheck,
  },
  {
    text: 'Envío automático a la AEAT',
    detail: 'Cumplimiento garantizado con la Ley Antifraude 11/2021.',
    icon: Send,
  },
  {
    text: 'Homologado por la AEAT',
    detail: 'Conexión API directa con la Agencia Tributaria.',
    icon: BadgeCheck,
  },
  {
    text: 'Soporte prioritario en español',
    detail: 'Respuesta en menos de 2 horas.',
    icon: Headphones,
  },
];

// ─── Comparison ───────────────────────────────────────────────────────────────
const comparisonRows = [
  { label: 'Facturas ilimitadas', starter: true, pro: true, excel: true, otros: true },
  { label: 'Clientes ilimitados', starter: true, pro: true, excel: true, otros: true },
  { label: 'PDF profesional', starter: true, pro: true, excel: false, otros: true },
  { label: 'Presupuestos / proformas', starter: true, pro: true, excel: false, otros: '€€ extra' },
  { label: 'Facturas recurrentes', starter: true, pro: true, excel: false, otros: '€€ extra' },
  { label: 'VeriFactu automático', starter: false, pro: true, excel: false, otros: false },
  { label: 'Hash encadenado + QR', starter: false, pro: true, excel: false, otros: '€€ extra' },
  { label: 'Envío AEAT integrado', starter: false, pro: true, excel: false, otros: '€€ extra' },
  { label: '6 meses gratuitos', starter: true, pro: true, excel: false, otros: false },
  { label: 'Sin tarjeta al registrarte', starter: true, pro: true, excel: true, otros: false },
  { label: 'Soporte en español', starter: true, pro: true, excel: false, otros: '€€ extra' },
  { label: 'Sin permanencia', starter: true, pro: true, excel: true, otros: false },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: 'Laura García',
    role: 'Diseñadora freelance',
    location: 'Madrid',
    text: 'Conseguí una de las plazas gratuitas y llevo 4 meses sin preocuparme por Hacienda. Cuando acaben los 6 meses pagaré los 24,90€ del plan anual encantada, porque el ahorro en tiempo y nervios es brutal.',
    stars: 5,
    initials: 'LG',
    saving: 'Ahorra ~3h/semana',
  },
  {
    name: 'Carlos Martínez',
    role: 'Fontanero autónomo',
    location: 'Valencia',
    text: 'Probé otros programas a 30€/mes y este hace lo mismo o mejor. Con el período gratuito tuve tiempo de ver que realmente merece la pena. Me quedé con el plan anual.',
    stars: 5,
    initials: 'CM',
    saving: 'Ahorra +60€/año',
  },
  {
    name: 'Patricia Gurrea',
    role: 'Consultora de negocio',
    location: 'Pamplona',
    text: 'El precio de 24,90€ al mes (anual) me parece muy justo para todo lo que incluye. Y que los primeros 6 meses sean gratis me convenció para probarlo sin ningún riesgo.',
    stars: 5,
    initials: 'PG',
    saving: 'ROI positivo en 1 mes',
  },
];

// ─── FAQs ─────────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: `¿Cuánto cuesta ${brandConfig.app.name} después de los ${PRICING.freePeriodMonths} meses gratuitos?`,
    a: `Tienes dos planes: Plan Starter a ${PRICING.starter.monthly}€/mes (${PRICING.starter.annualMonthly}€/mes anual) para facturar sin VeriFactu, y Plan PRO a ${PRICING.pro.monthly}€/mes (${PRICING.pro.annualMonthly}€/mes anual) con VeriFactu automático y envío AEAT incluido. Sin permanencia en ningún caso.`,
  },
  {
    q: '¿Cuál es la diferencia entre Plan Starter y Plan PRO?',
    a: `El Plan Starter incluye todo lo necesario para facturar: facturas ilimitadas, clientes, PDF profesional, presupuestos y facturas recurrentes. El Plan PRO añade VeriFactu 100% automático — hash encadenado, código QR y envío directo a la AEAT en cada factura — para cumplir con la Ley Antifraude 11/2021 cuando sea obligatorio.`,
  },
  {
    q: `¿Qué incluyen exactamente los ${PRICING.freePeriodMonths} meses gratuitos?`,
    a: `Acceso completo al plan que elijas — incluyendo todas las funcionalidades del Plan PRO si decides empezar con él. Sin restricciones ni versión reducida durante los ${PRICING.freePeriodMonths} meses.`,
  },
  {
    q: '¿Puedo cambiar de Starter a PRO más adelante?',
    a: 'Sí. Puedes hacer upgrade en cualquier momento desde el panel de ajustes con un clic. Si cuando VeriFactu sea obligatorio para tu actividad quieres activarlo automáticamente, también puedes configurarlo para que se haga de forma automática.',
  },
  {
    q: '¿Necesito tarjeta de crédito para registrarme?',
    a: `No. Solo necesitas tu dirección de email. No pedimos ningún dato de pago durante los ${PRICING.freePeriodMonths} meses gratuitos. Añades tu método de pago cuando decidas continuar.`,
  },
  {
    q: '¿Cuánto ahorro eligiendo el plan anual?',
    a: `Con Plan Starter anual pagas ${PRICING.starter.annualTotal}€/año (${PRICING.starter.annualMonthly}€/mes) — ahorras ${PRICING.starter.annualSaving}€. Con Plan PRO anual pagas ${PRICING.pro.annualTotal}€/año (${PRICING.pro.annualMonthly}€/mes) — ahorras ${PRICING.pro.annualSaving}€. En ambos casos, más de 2 meses gratis respecto al mensual.`,
  },
  {
    q: '¿Puedo cancelar en cualquier momento?',
    a: 'Sí, absolutamente. Sin permanencia mínima, sin letra pequeña. Cancelas desde el panel en menos de un minuto y no te cobramos nada más.',
  },
  {
    q: '¿Puedo migrar mis facturas actuales?',
    a: `Sí. Importación gratuita desde Excel, CSV o Holded. El equipo de ${brandConfig.app.name} te ayuda en el proceso sin coste adicional.`,
  },
];

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`group rounded-2xl border-2 bg-white transition-all duration-200 ${
        open
          ? 'border-blue-200 shadow-md shadow-blue-50'
          : 'border-slate-100 hover:border-slate-200'
      }`}
    >
      <button
        className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            {index + 1}
          </span>
          <span className="text-base font-semibold text-slate-900 leading-snug">{q}</span>
        </span>
        <ChevronDown
          className={`mt-0.5 h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300 ${
            open ? 'rotate-180 text-blue-500' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="px-6 pb-5 text-sm leading-relaxed text-slate-500 pl-[3.75rem]">{a}</p>
      </div>
    </div>
  );
}

// ─── Counter hook ─────────────────────────────────────────────────────────────
function useCounter(target: number, duration = 1800, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);
  return value;
}

// ─── Billing Toggle ───────────────────────────────────────────────────────────
function BillingToggle({ annual, onChange }: { annual: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(false)}
        className={`text-sm font-semibold transition-colors ${
          !annual ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        Mensual
      </button>

      {/* Toggle pill */}
      <button
        onClick={() => onChange(!annual)}
        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
          annual ? 'bg-blue-600' : 'bg-slate-200'
        }`}
        role="switch"
        aria-checked={annual}
        aria-label="Cambiar a facturación anual"
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
            annual ? 'translate-x-7' : 'translate-x-0'
          }`}
        />
      </button>

      <button
        onClick={() => onChange(true)}
        className={`flex items-center gap-2 text-sm font-semibold transition-colors ${
          annual ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        Anual
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
          Hasta -17%
        </span>
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Precios() {
  const [annual, setAnnual] = useState(true); // default: annual (mejor precio visible)
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const hours = useCounter(156, 1800, statsVisible);
  const users = useCounter(PLAZAS_CONFIG.ocupadas, 1800, statsVisible);
  const months = useCounter(6, 1200, statsVisible);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          setStatsVisible(true);
        }
      },
      { threshold: 0.3 },
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* JSON-LD SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="flex min-h-screen flex-col bg-white text-slate-900">
        <SiteHeader />

        <main className="flex-1">
          {/* ══════════════════════════════════════════════════════════════
              HERO
              ══════════════════════════════════════════════════════════════ */}
          <section className="relative overflow-hidden pb-0 pt-16 md:pt-24">
            {/* Gradient bg */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 90% 70% at 50% -10%, rgba(59,130,246,0.10) 0%, transparent 65%)',
              }}
            />
            <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-blue-100 opacity-20 blur-3xl" />
            <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-indigo-100 opacity-20 blur-3xl" />

            <div className="relative mx-auto max-w-4xl px-4 text-center">
              {/* Urgency pill */}
              <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-2 text-sm font-semibold text-amber-800 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
                <Users className="h-4 w-4" />
                Solo quedan{' '}
                <strong>
                  {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas gratuitas
                </strong>{' '}
                de {PLAZAS_CONFIG.total.toLocaleString('es-ES')}
              </div>

              {/* H1 */}
              <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
                <span className="block text-slate-500 text-2xl font-semibold mb-2 sm:text-3xl">
                  Precio de NovaFactura
                </span>
                <span className="relative inline-block text-blue-600">
                  0€ durante 6 meses.
                  <svg
                    className="absolute -bottom-1 left-0 w-full"
                    viewBox="0 0 400 10"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 7 C100 2, 300 2, 398 7"
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                  </svg>
                </span>{' '}
                <span className="text-slate-900">Luego, desde 9,90€/mes.</span>
              </h1>

              <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-500 sm:text-xl leading-relaxed">
                Sin tarjeta al registrarte. Sin permanencia. Sin letra pequeña.{' '}
                <strong className="text-slate-800">Todo incluido desde el primer día.</strong>
              </p>

              {/* Main CTA */}
              <div className="mb-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/registro"
                  className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-blue-600 px-10 text-base font-bold text-white shadow-xl shadow-blue-200 transition-all duration-200 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-300 hover:-translate-y-0.5 sm:w-auto"
                >
                  <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
                  Empezar gratis — 6 meses
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/contacto"
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 text-base font-semibold text-slate-700 transition-all hover:border-blue-200 hover:text-blue-600 sm:w-auto"
                >
                  Tengo una pregunta
                </Link>
              </div>

              {/* Trust row */}
              <div className="mb-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-sm text-slate-500">
                {[
                  { icon: CreditCard, text: 'Sin tarjeta al registrarte' },
                  { icon: Clock, text: 'Activación en 2 minutos' },
                  { icon: Shield, text: 'Certificado AEAT' },
                  { icon: Lock, text: 'RGPD compliant' },
                  { icon: BadgeCheck, text: 'VeriFactu homologado' },
                ].map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-blue-500" />
                    {text}
                  </span>
                ))}
              </div>
            </div>

            {/* ─── BILLING TOGGLE + DUAL PLAN CARDS ────────────────────── */}
            <div className="mx-auto max-w-5xl px-4 pb-0">
              {/* Billing toggle — controls both cards */}
              <div className="mb-8">
                <BillingToggle annual={annual} onChange={setAnnual} />
              </div>

              <div className="grid gap-6 lg:grid-cols-2 items-start">
                {/* ── STARTER CARD ── */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-sm">
                  <div className="p-8">
                    {/* Header */}
                    <div className="mb-6">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        Para empezar
                      </span>
                      <h3 className="mt-3 text-2xl font-extrabold text-slate-900">Plan Starter</h3>
                      <p className="mt-1 text-sm text-slate-500 leading-snug">
                        Factura sin complicaciones. Sin VeriFactu — te avisamos cuando sea
                        obligatorio para ti.
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-5xl font-black text-slate-800 tabular-nums leading-none">
                          {annual
                            ? `${STARTER.annualMonthly.toFixed(2).replace('.', ',')}€`
                            : `${STARTER.monthly.toFixed(2).replace('.', ',')}€`}
                        </span>
                        <span className="text-base text-slate-400 font-medium">/ mes</span>
                      </div>
                      {annual ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-slate-500">
                            Facturado anualmente ·{' '}
                            <strong className="text-slate-700">
                              {STARTER.annualTotal.toFixed(2).replace('.', ',')}€/año
                            </strong>
                          </p>
                          <p className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Ahorras {STARTER.annualSaving}€ al año
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <button
                            onClick={() => setAnnual(true)}
                            className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 hover:bg-green-200 transition-colors"
                          >
                            <TrendingUp className="h-3 w-3" />
                            Paga anual y ahorra {STARTER.annualSaving}€
                          </button>
                        </div>
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      href="/registro?plan=starter"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-800 bg-white text-sm font-bold text-slate-800 transition-all hover:bg-slate-900 hover:text-white hover:border-slate-900 mb-3"
                    >
                      Empezar con Starter
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <p className="mb-6 text-center text-xs text-slate-400">
                      {PRICING.freePeriodMonths} meses gratis · Sin tarjeta al registrarte
                    </p>

                    {/* Features */}
                    <div className="border-t border-slate-100 pt-5 space-y-3">
                      {starterFeatures.map((f) => (
                        <div key={f.text} className="flex items-start gap-2.5">
                          {f.included ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                          ) : (
                            <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />
                          )}
                          <div>
                            <p
                              className={`text-sm font-medium leading-snug ${f.included ? 'text-slate-700' : 'text-slate-400'}`}
                            >
                              {f.text}
                            </p>
                            {f.detail && (
                              <p className="text-xs text-slate-400 leading-tight">{f.detail}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* VeriFactu note */}
                    <div className="mt-5 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        <strong>VeriFactu no incluido.</strong> Te avisaremos cuando sea obligatorio
                        para ti — con opción de activarlo de forma automática o manual.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── PRO CARD ── */}
                <div className="relative overflow-hidden rounded-3xl border-2 border-blue-300 bg-gradient-to-br from-white to-blue-50 shadow-2xl shadow-blue-100">
                  {/* Top accent */}
                  <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600" />

                  {/* Recommended badge */}
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-1.5 text-xs font-bold text-white shadow-md">
                    ⭐ Recomendado — Más popular
                  </div>

                  <div className="p-8 pt-12">
                    {/* Header */}
                    <div className="mb-6">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                        <Shield className="h-3.5 w-3.5" />
                        Con VeriFactu · Todo incluido
                      </span>
                      <h3 className="mt-3 text-2xl font-extrabold text-slate-900">Plan PRO</h3>
                      <p className="mt-1 text-sm text-slate-500 leading-snug">
                        VeriFactu automático, envío AEAT y tranquilidad fiscal total desde el primer
                        día.
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-5xl font-black text-blue-600 tabular-nums leading-none">
                          {annual
                            ? `${PRO.annualMonthly.toFixed(2).replace('.', ',')}€`
                            : `${PRO.monthly.toFixed(2).replace('.', ',')}€`}
                        </span>
                        <span className="text-base text-slate-400 font-medium">/ mes</span>
                      </div>
                      {annual ? (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-slate-500">
                            Facturado anualmente ·{' '}
                            <strong className="text-slate-700">
                              {PRO.annualTotal.toFixed(2).replace('.', ',')}€/año
                            </strong>
                          </p>
                          <p className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Ahorras {PRO.annualSaving}€ al año
                          </p>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <button
                            onClick={() => setAnnual(true)}
                            className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700 hover:bg-green-200 transition-colors"
                          >
                            <TrendingUp className="h-3 w-3" />
                            Paga anual y ahorra {PRO.annualSaving}€
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Progress bar (urgency) */}
                    <div className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-sm font-medium">
                        <span className="flex items-center gap-1.5 text-amber-800">
                          <Clock className="h-4 w-4" />
                          Plazas gratuitas ocupadas
                        </span>
                        <span className="font-bold text-amber-700">
                          {PLAZAS_CONFIG.porcentaje}%
                        </span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-amber-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                          style={{ width: `${PLAZAS_CONFIG.porcentaje}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex justify-between text-xs text-amber-700">
                        <span>{PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} inscritos</span>
                        <span className="font-bold">
                          {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas restantes
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      href="/registro?plan=pro"
                      className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 mb-3"
                    >
                      <Sparkles className="h-4 w-4 transition-transform group-hover:rotate-12" />
                      Empezar con PRO — Gratis
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                    <p className="mb-6 text-center text-xs text-slate-400">
                      {PRICING.freePeriodMonths} meses gratis · Sin tarjeta al registrarte
                    </p>

                    {/* Features */}
                    <div className="border-t border-blue-100 pt-5 space-y-3">
                      {proFeatures.map((f) => (
                        <div key={f.text} className="flex items-start gap-2.5">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium text-slate-800 leading-snug">
                              {f.text}
                            </p>
                            <p className="text-xs text-slate-400 leading-tight">{f.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-center text-xs text-slate-400">
                Ambos planes incluyen los {PRICING.freePeriodMonths} meses gratuitos iniciales. ·
                Sin tarjeta al registrarte.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              STATS
              ══════════════════════════════════════════════════════════════ */}
          <section ref={statsRef} className="border-y border-slate-100 bg-slate-50 py-12">
            <div className="mx-auto max-w-4xl px-4">
              <div className="grid gap-8 sm:grid-cols-3 text-center">
                <div>
                  <div className="text-5xl font-black text-blue-600 tabular-nums">{months}</div>
                  <p className="mt-1.5 font-semibold text-slate-700">meses completamente gratis</p>
                  <p className="text-sm text-slate-400">Para las primeras 5.000 inscripciones</p>
                </div>
                <div>
                  <div className="text-5xl font-black text-slate-900 tabular-nums">
                    {users.toLocaleString('es-ES')}+
                  </div>
                  <p className="mt-1.5 font-semibold text-slate-700">profesionales ya inscritos</p>
                  <p className="text-sm text-slate-400">Autónomos y pymes de toda España</p>
                </div>
                <div>
                  <div className="text-5xl font-black text-green-600 tabular-nums">{hours}h</div>
                  <p className="mt-1.5 font-semibold text-slate-700">
                    ahorradas al año por usuario
                  </p>
                  <p className="text-sm text-slate-400">Factura en 60 segundos, no en horas</p>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              PLAN COMPARISON — STARTER vs PRO
              ══════════════════════════════════════════════════════════════ */}
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-3xl px-4">
              <div className="mb-3 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Starter vs PRO
                </span>
              </div>
              <h2 className="mb-4 text-center text-3xl font-extrabold text-slate-900 sm:text-4xl">
                ¿Cuál plan es para ti?
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-center text-slate-500">
                Ambos incluyen facturación ilimitada. La diferencia clave es VeriFactu — obligatorio
                en el futuro, opcional hoy.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Starter summary */}
                <div className="rounded-2xl border-2 border-slate-200 bg-white p-6">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Starter
                  </p>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-800">
                      {annual
                        ? `${STARTER.annualMonthly.toFixed(2).replace('.', ',')}€`
                        : `${STARTER.monthly.toFixed(2).replace('.', ',')}€`}
                    </span>
                    <span className="text-xs text-slate-400">/mes</span>
                  </div>
                  <p className="mb-4 text-xs text-slate-500">
                    {annual
                      ? `Facturado anualmente · ${STARTER.annualTotal.toFixed(2).replace('.', ',')}€/año`
                      : 'Sin permanencia'}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" />
                      Facturas + clientes ilimitados
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" />
                      PDF profesional + presupuestos
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-slate-400" />
                      Recurrentes + importación CSV
                    </li>
                    <li className="flex items-center gap-2">
                      <X className="h-4 w-4 shrink-0 text-slate-300" />
                      <span className="text-slate-400">Sin VeriFactu (disponible en PRO)</span>
                    </li>
                  </ul>
                  <p className="mt-4 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-500 text-center">
                    Ideal si aún no necesitas VeriFactu
                  </p>
                </div>

                {/* PRO summary */}
                <div className="relative rounded-2xl border-2 border-blue-300 bg-blue-50 p-6">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-xs font-bold text-white shadow-sm">
                    ⭐ Recomendado
                  </div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-blue-500">
                    PRO
                  </p>
                  <div className="mb-1 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-blue-700">
                      {annual
                        ? `${PRO.annualMonthly.toFixed(2).replace('.', ',')}€`
                        : `${PRO.monthly.toFixed(2).replace('.', ',')}€`}
                    </span>
                    <span className="text-xs text-slate-400">/mes</span>
                  </div>
                  <p className="mb-4 text-xs text-slate-500">
                    {annual
                      ? `Facturado anualmente · ${PRO.annualTotal.toFixed(2).replace('.', ',')}€/año`
                      : 'Sin permanencia'}
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
                      Todo lo del plan Starter
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
                      VeriFactu 100% automático
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
                      Hash encadenado + código QR
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-500" />
                      <strong>Envío automático a la AEAT</strong>
                    </li>
                  </ul>
                  <p className="mt-4 rounded-lg bg-blue-100 p-2.5 text-xs text-blue-700 text-center font-semibold">
                    Cumplimiento total · Tranquilidad garantizada
                  </p>
                </div>
              </div>

              <p className="mt-6 text-center text-xs text-slate-400">
                Puedes cambiar de Starter a PRO en cualquier momento, con un clic desde Ajustes.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              THE MATH — VALUE SECTION
              ══════════════════════════════════════════════════════════════ */}
          <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
            <div className="mx-auto max-w-5xl px-4">
              <div className="mb-3 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  <TrendingUp className="h-3.5 w-3.5" />
                  El cálculo es sencillo
                </span>
              </div>
              <h2 className="mb-4 text-center text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Desde 24,90€/mes es lo que cuesta{' '}
                <span className="text-blue-600">no tener problemas con Hacienda</span>
              </h2>
              <p className="mx-auto mb-12 max-w-2xl text-center text-slate-500">
                Compara el precio de NovaFactura con el coste real de no cumplir con VeriFactu.
              </p>

              <div className="grid gap-6 sm:grid-cols-3">
                {[
                  {
                    icon: AlertTriangle,
                    color: 'red',
                    label: 'Multa por incumplimiento',
                    value: 'hasta 50.000€',
                    sub: 'Ley Antifraude 11/2021 · Ley General Tributaria',
                    negative: true,
                  },
                  {
                    icon: Clock,
                    color: 'amber',
                    label: 'Tiempo perdido en burocracia',
                    value: '~3h/semana',
                    sub: 'Con software no homologado o Excel',
                    negative: true,
                  },
                  {
                    icon: Zap,
                    color: 'blue',
                    label: 'NovaFactura al mes',
                    value: annual
                      ? `desde ${STARTER.annualMonthly.toFixed(2).replace('.', ',')}€`
                      : `desde ${STARTER.monthly.toFixed(2).replace('.', ',')}€`,
                    sub: 'Plan Starter · Todo incluido · Sin permanencia',
                    negative: false,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`relative overflow-hidden rounded-2xl border-2 p-6 text-center ${
                      item.negative
                        ? item.color === 'red'
                          ? 'border-red-100 bg-red-50'
                          : 'border-amber-100 bg-amber-50'
                        : 'border-blue-200 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-200'
                    }`}
                  >
                    <item.icon
                      className={`mx-auto mb-3 h-8 w-8 ${
                        item.negative
                          ? item.color === 'red'
                            ? 'text-red-400'
                            : 'text-amber-400'
                          : 'text-blue-200'
                      }`}
                    />
                    <p
                      className={`mb-1 text-xs font-semibold uppercase tracking-wide ${
                        item.negative
                          ? item.color === 'red'
                            ? 'text-red-400'
                            : 'text-amber-500'
                          : 'text-blue-200'
                      }`}
                    >
                      {item.label}
                    </p>
                    <div
                      className={`text-3xl font-black tabular-nums ${
                        item.negative
                          ? item.color === 'red'
                            ? 'text-red-600'
                            : 'text-amber-700'
                          : 'text-white'
                      }`}
                    >
                      {item.value}
                    </div>
                    <p
                      className={`mt-1.5 text-xs leading-snug ${
                        item.negative
                          ? item.color === 'red'
                            ? 'text-red-400'
                            : 'text-amber-500'
                          : 'text-blue-200'
                      }`}
                    >
                      {item.sub}
                    </p>
                    {!item.negative && (
                      <div className="mt-4">
                        <Link
                          href="/registro"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          Empezar gratis
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              COMPARISON TABLE
              ══════════════════════════════════════════════════════════════ */}
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-3xl px-4">
              <div className="mb-3 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  Comparativa
                </span>
              </div>
              <h2 className="mb-3 text-center text-3xl font-extrabold text-slate-900 sm:text-4xl">
                NovaFactura vs. las alternativas
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-center text-slate-500">
                ¿Tu software actual cumple con los nuevos requisitos legales?
              </p>

              <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-100 bg-slate-50">
                      <th className="px-4 py-4 text-left font-semibold text-slate-600">
                        Característica
                      </th>
                      <th className="px-3 py-4 text-center font-semibold text-slate-500">
                        Starter
                      </th>
                      <th className="bg-blue-50 px-3 py-4 text-center font-bold text-blue-700">
                        PRO
                      </th>
                      <th className="px-3 py-4 text-center font-semibold text-slate-400">
                        Excel / Word
                      </th>
                      <th className="px-3 py-4 text-center font-semibold text-slate-400">
                        Otros software
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b border-slate-50 last:border-0 ${
                          i % 2 === 0 ? '' : 'bg-slate-50/50'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-800 text-sm">
                          {row.label}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {row.starter ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-slate-500" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-slate-300" />
                          )}
                        </td>
                        <td className="bg-blue-50/50 px-3 py-3 text-center">
                          {row.pro ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-blue-600" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-slate-300" />
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {row.excel === false ? (
                            <X className="mx-auto h-4 w-4 text-slate-300" />
                          ) : (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                          )}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {typeof row.otros === 'string' ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                              {row.otros}
                            </span>
                          ) : row.otros ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-green-500" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-slate-300" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-center text-xs text-slate-400">
                * Datos comparativos basados en análisis de mercado a julio de 2025.
              </p>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              TESTIMONIALS
              ══════════════════════════════════════════════════════════════ */}
          <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
            <div className="mx-auto max-w-6xl px-4">
              <div className="mb-3 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  4,9/5 · 214 valoraciones
                </span>
              </div>
              <h2 className="mb-3 text-center text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Lo que dicen quienes ya lo usan
              </h2>
              <p className="mx-auto mb-12 max-w-xl text-center text-slate-500">
                Más de {PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} autónomos confían en
                NovaFactura
              </p>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((t) => (
                  <div
                    key={t.name}
                    className="group relative flex flex-col rounded-2xl border-2 border-slate-100 bg-white p-6 shadow-sm transition-all hover:border-blue-100 hover:shadow-lg"
                  >
                    <div className="absolute -top-3 right-4 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                      {t.saving}
                    </div>
                    <div className="mb-3 flex">
                      {Array.from({ length: t.stars }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <blockquote className="mb-5 flex-1 text-sm leading-relaxed text-slate-600 italic">
                      "{t.text}"
                    </blockquote>
                    <div className="flex items-center gap-3 border-t border-slate-50 pt-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                        {t.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                        <div className="text-xs text-slate-400">
                          {t.role} · {t.location}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              FAQ
              ══════════════════════════════════════════════════════════════ */}
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-3xl px-4">
              <div className="mb-3 text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  Preguntas frecuentes sobre precios
                </span>
              </div>
              <h2 className="mb-3 text-center text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Todo lo que necesitas saber
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-center text-slate-500">
                ¿Tienes más dudas?{' '}
                <Link
                  href="/contacto"
                  className="font-semibold text-blue-600 underline underline-offset-2 hover:no-underline"
                >
                  Escríbenos y te respondemos en menos de 2 horas.
                </Link>
              </p>

              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <FaqItem key={i} q={faq.q} a={faq.a} index={i} />
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════
              FINAL CTA
              ══════════════════════════════════════════════════════════════ */}
          <section className="relative overflow-hidden border-t border-slate-100 bg-slate-50 py-20 md:py-28">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(59,130,246,0.06) 0%, transparent 70%)',
              }}
            />
            <div className="pointer-events-none absolute -left-20 top-10 h-80 w-80 rounded-full bg-blue-100 opacity-20 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-indigo-100 opacity-20 blur-3xl" />

            <div className="relative mx-auto max-w-3xl px-4 text-center">
              {/* Urgency badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-5 py-2 text-sm font-semibold text-amber-800">
                <Users className="h-4 w-4" />
                Solo{' '}
                <strong>
                  {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas gratuitas
                </strong>{' '}
                restantes
              </div>

              <h2 className="mb-4 text-4xl font-extrabold text-slate-900 sm:text-5xl leading-tight">
                Empieza gratis hoy.
                <br />
                <span className="text-blue-600">Decide si quieres seguir en 6 meses.</span>
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-lg text-slate-500">
                0€ durante los primeros 6 meses. Luego, plan{' '}
                <strong className="text-slate-800">
                  Starter desde{' '}
                  {annual
                    ? `${STARTER.annualMonthly.toFixed(2).replace('.', ',')}€`
                    : `${STARTER.monthly.toFixed(2).replace('.', ',')}€`}
                  /mes
                </strong>{' '}
                o plan{' '}
                <strong className="text-slate-800">
                  PRO desde{' '}
                  {annual
                    ? `${PRO.annualMonthly.toFixed(2).replace('.', ',')}€`
                    : `${PRO.monthly.toFixed(2).replace('.', ',')}€`}
                  /mes
                </strong>
                . Sin compromisos, sin riesgos.
              </p>

              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/registro"
                  className="group flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-blue-600 px-10 text-base font-bold text-white shadow-xl shadow-blue-200 transition-all duration-200 hover:bg-blue-700 hover:shadow-2xl hover:-translate-y-0.5 sm:w-auto"
                >
                  <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
                  Reservar mi plaza — Gratis
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/contacto"
                  className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-8 text-base font-semibold text-slate-700 transition-all hover:border-blue-200 hover:text-blue-600 sm:w-auto"
                >
                  Hablar con el equipo
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />6 meses completamente gratis
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Sin tarjeta al registrarte
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Sin permanencia
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Activación inmediata
                </span>
              </div>

              {/* Mini pricing reminder — reflects toggle */}
              <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400 text-center">
                  Resumen de precios
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="text-xs text-slate-400 font-medium">
                      Meses 1–6 · Todos los planes
                    </p>
                  </div>
                  <span className="text-2xl font-black text-blue-600">0€</span>
                </div>
                <div className="my-3 border-t border-slate-100" />
                <div className="space-y-2">
                  {/* Starter */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-700">Starter</p>
                      <p className="text-xs text-slate-400">
                        {annual
                          ? `${STARTER.annualTotal}€/año · Sin VeriFactu`
                          : 'Sin VeriFactu · Sin permanencia'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-700">
                        {annual
                          ? `${STARTER.annualMonthly.toFixed(2).replace('.', ',')}€`
                          : `${STARTER.monthly.toFixed(2).replace('.', ',')}€`}
                      </span>
                      <span className="text-xs text-slate-400">/mes</span>
                    </div>
                  </div>
                  {/* PRO */}
                  <div className="flex items-center justify-between rounded-xl bg-blue-50 px-3 py-2">
                    <div className="text-left">
                      <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        PRO
                        <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">
                          Con VeriFactu
                        </span>
                      </p>
                      <p className="text-xs text-slate-400">
                        {annual ? `${PRO.annualTotal}€/año · Sin permanencia` : 'Sin permanencia'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black text-slate-800">
                        {annual
                          ? `${PRO.annualMonthly.toFixed(2).replace('.', ',')}€`
                          : `${PRO.monthly.toFixed(2).replace('.', ',')}€`}
                      </span>
                      <span className="text-xs text-slate-400">/mes</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-[10px] text-slate-400">
                  {annual ? 'Precios con facturación anual' : 'Precios con facturación mensual'}
                </p>
              </div>
            </div>
          </section>
        </main>

        <FooterLanding />
      </div>
    </>
  );
}

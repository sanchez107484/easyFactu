'use client';

import Link from 'next/link';
import {
  Shield,
  Zap,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Lock,
  Smartphone,
  ArrowRight,
  Star,
  Sparkles,
  CreditCard,
  X,
  FileText,
  Send,
  BadgeCheck,
  TrendingUp,
  Headphones,
} from 'lucide-react';
import { brandConfig, PLAZAS_CONFIG } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { useEffect, useState, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: 'Laura García',
    role: 'Diseñadora freelance',
    location: 'Madrid',
    text: `Llevaba meses preocupada por las multas de Hacienda. Con ${brandConfig.app.name} me despreocupé en 10 minutos. Lo mejor es que conseguí una de las plazas gratuitas.`,
    stars: 5,
    initials: 'LG',
  },
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
    text: `Funciona todo muy bien, igual de bien que otras más caras que he usado. Y lo mejor es que es gratis durante 6 meses, una oportunidad que no podía dejar pasar.`,
    stars: 5,
    initials: 'PG',
  },
];

const steps = [
  {
    num: '01',
    title: 'Crea tu factura',
    desc: 'Introduce los datos básicos: cliente, concepto e importe. Menos de 60 segundos.',
    icon: FileText,
  },
  {
    num: '02',
    title: 'Procesamiento automático',
    desc: 'Hash encadenado, firma electrónica, código QR y envío a la AEAT. Todo automático.',
    icon: Send,
  },
  {
    num: '03',
    title: 'Factura entregada',
    desc: 'Tu cliente recibe el PDF. Tú tienes el registro verificado en Hacienda.',
    icon: BadgeCheck,
  },
];

const features = [
  {
    icon: Shield,
    title: 'VeriFactu 100% automático',
    description:
      'Hash encadenado, envío a AEAT y código QR generados automáticamente. Cumplimiento garantizado.',
    highlight: true,
  },
  {
    icon: Zap,
    title: 'Facturación en 60 segundos',
    description: 'Interfaz diseñada para profesionales sin conocimientos contables.',
    highlight: false,
  },
  {
    icon: Download,
    title: 'Migración simplificada',
    description: 'Importa clientes y facturas desde Excel, CSV o Holded con un solo clic.',
    highlight: false,
  },
  {
    icon: Lock,
    title: 'Seguridad certificada',
    description: 'Servidores europeos, cifrado SSL de 256 bits, cumplimiento RGPD.',
    highlight: false,
  },
  {
    icon: Smartphone,
    title: 'Acceso multiplataforma',
    description: 'Compatible con web, móvil y tablet. Sin instalaciones.',
    highlight: false,
  },
  {
    icon: Headphones,
    title: 'Soporte profesional',
    description: 'Atención personalizada en español. Respuesta en menos de 2 horas.',
    highlight: false,
  },
];

const comparisonRows = [
  { feature: 'Cumplimiento Ley Antifraude 11/2021', them: false, us: true },
  { feature: 'Hash encadenado automático', them: false, us: true },
  { feature: 'Envío a AEAT integrado', them: false, us: true },
  { feature: 'Código QR normativo', them: false, us: true },
  { feature: '6 meses sin coste (plazas limitadas)', them: false, us: true },
  { feature: 'Sin instalación requerida', them: false, us: true },
  { feature: 'Migración desde otros programas', them: false, us: true },
  { feature: 'Soporte técnico incluido', them: 'Coste adicional', us: true },
];

const faqs = [
  {
    q: '¿Cuántas plazas gratuitas quedan disponibles?',
    a: `Ofrecemos 6 meses de acceso gratuito a las primeras ${PLAZAS_CONFIG.total.toLocaleString('es-ES')} inscripciones. Actualmente quedan ${PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas disponibles. Una vez alcanzado el límite, el período gratuito dejará de estar disponible para nuevos usuarios.`,
  },
  {
    q: '¿Cuándo es obligatorio VeriFactu para autónomos?',
    a: 'Desde el 1 de julio de 2025 para nuevos autónomos y desde el 1 de julio de 2026 para los existentes.',
  },
  {
    q: '¿Cuánto cuesta después de los 6 meses gratuitos?',
    a: 'El plan profesional tiene un coste de 9,90€/mes o 7,90€/mes si eliges el pago anual. Sin permanencia ni compromisos.',
  },
  {
    q: '¿Qué sanciones existen por no usar software certificado?',
    a: 'La Ley General Tributaria establece sanciones de hasta 50.000€.',
  },
  {
    q: `¿${brandConfig.app.name} está homologado por la AEAT?`,
    a: 'Sí. Conexión API directa con la Agencia Tributaria. Cumplimiento íntegro del Reglamento de facturación.',
  },
  {
    q: '¿Es posible migrar facturas desde otro software?',
    a: 'Sí. Importación desde Excel, CSV o Holded. Migración gratuita y asistida.',
  },
  {
    q: '¿Se requieren conocimientos de contabilidad?',
    a: 'No. Diseñado para profesionales sin formación contable.',
  },
];

const trustBadges = [
  { icon: CreditCard, text: 'Sin tarjeta al registrarte' },
  { icon: Clock, text: 'Activación inmediata' },
  { icon: Shield, text: 'Certificado AEAT' },
  { icon: Lock, text: 'RGPD compliant' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Small UI helpers
// ─────────────────────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white ${className}`}>{children}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Accordion
// ─────────────────────────────────────────────────────────────────────────────
function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`rounded-xl border-2 bg-white px-4 transition-colors ${open ? 'border-blue-200' : 'border-slate-200'}`}
    >
      <button
        className="flex w-full items-center justify-between py-4 text-left text-base font-semibold text-slate-900 transition-colors hover:text-blue-600"
        onClick={() => setOpen(!open)}
      >
        <span>{q}</span>
        <span
          className={`ml-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 4v12M4 10h12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-48 pb-4' : 'max-h-0'}`}
      >
        <p className="text-sm leading-relaxed text-slate-500">{a}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [counters, setCounters] = useState({ facturas: 0, usuarios: 0, ahorro: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const handleScroll = () => setShowStickyCTA(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const targets = { facturas: 10420, usuarios: PLAZAS_CONFIG.ocupadas, ahorro: 50000 };
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setCounters({
              facturas: Math.floor(ease * targets.facturas),
              usuarios: Math.floor(ease * targets.usuarios),
              ahorro: Math.floor(ease * targets.ahorro),
            });
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <SiteHeader />

      <main className="flex-1">
        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — HERO
            ══════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
          {/* Background gradient */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 25% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 75% 25%, #3b82f6 0%, transparent 40%)',
            }}
          />

          <div className="relative mx-auto max-w-4xl px-4 text-center">
            {/* Live badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Plataforma nativa VeriFactu
            </div>

            {/* H1 */}
            <h1 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl lg:text-7xl">
              Software de facturación{' '}
              <span className="relative whitespace-nowrap text-blue-600">
                VeriFactu
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 300 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 9 C75 3, 225 3, 298 9"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.4"
                  />
                </svg>
              </span>{' '}
              para autónomos y pymes
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-500 sm:text-xl">
              Cumple con la <strong className="text-slate-800">Ley Antifraude 11/2021</strong> de
              forma automática. Genera facturas legales con hash encadenado, código QR y envío
              directo a la AEAT.
            </p>

            {/* Offer box */}
            <div className="mb-8 inline-flex flex-col items-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-bold text-slate-900">
                  6 meses completamente gratuitos
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Users className="h-4 w-4 text-amber-600" />
                <span>
                  Limitado a{' '}
                  <strong className="text-slate-800">
                    {PLAZAS_CONFIG.total.toLocaleString('es-ES')} plazas
                  </strong>{' '}
                  ·{' '}
                  <span className="font-semibold text-amber-600">
                    {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} disponibles
                  </span>
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 text-base font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
              >
                Reservar mi plaza gratuita
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              >
                Ver cómo funciona
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-500">
              {trustBadges.map(({ icon: Icon, text }) => (
                <span key={text} className="flex items-center gap-1.5">
                  <Icon className="h-4 w-4 text-blue-500" />
                  {text}
                </span>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mx-auto mt-10 max-w-md">
              <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 font-semibold text-slate-700">
                    <Users className="h-4 w-4 text-amber-600" />
                    Plazas gratuitas ocupadas
                  </span>
                  <span className="font-bold text-amber-600">{PLAZAS_CONFIG.porcentaje}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-amber-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                    style={{ width: `${PLAZAS_CONFIG.porcentaje}%` }}
                  />
                </div>
                <p className="mt-2 text-center text-xs text-slate-500">
                  {PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} inscritos ·{' '}
                  <span className="font-bold text-amber-600">
                    {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas restantes
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — STATS
            ══════════════════════════════════════════════════════════════ */}
        <section ref={statsRef} className="border-y border-slate-100 bg-slate-50 py-12">
          <div className="mx-auto max-w-4xl px-4">
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                {
                  value: `${counters.facturas.toLocaleString('es-ES')}+`,
                  label: 'Facturas procesadas',
                },
                {
                  value: `${counters.usuarios.toLocaleString('es-ES')}+`,
                  label: 'Profesionales inscritos',
                },
                {
                  value: `${counters.ahorro.toLocaleString('es-ES')}€`,
                  label: 'En sanciones evitadas',
                },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-4xl font-extrabold tabular-nums text-slate-900">{value}</div>
                  <p className="mt-1 text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — PROBLEM
            ══════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-8 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <h2 className="mb-6 text-center text-3xl font-bold text-slate-900 sm:text-4xl">
              El uso de Excel o Word para facturar dejará de ser legal
            </h2>

            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-6 text-center md:p-8">
              <p className="mb-4 text-lg text-slate-700">
                A partir de julio de 2025, la <strong>Ley Antifraude 11/2021</strong> exige que
                todas las facturas incluyan <strong>hash encadenado</strong>,{' '}
                <strong>código QR</strong> y sean{' '}
                <strong>enviadas automáticamente a la AEAT</strong>.
              </p>
              <div className="flex items-center justify-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-xl font-bold">Sanción por incumplimiento: hasta 50.000€</span>
              </div>
            </div>

            <p className="mt-8 text-center text-lg text-slate-500">
              {brandConfig.app.name} automatiza todos estos requisitos técnicos.{' '}
              <strong className="text-slate-800">
                Tú solo creas la factura, nosotros garantizamos el cumplimiento.
              </strong>
            </p>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 4 — HOW IT WORKS
            ══════════════════════════════════════════════════════════════ */}
        <section
          id="como-funciona"
          className="border-y border-slate-100 bg-slate-50 py-16 md:py-24"
        >
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Proceso simplificado
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Facturación VeriFactu en tres pasos
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-2xl text-center text-slate-500">
              Sin conocimientos técnicos. Sin configuraciones complejas.
            </p>

            <div className="relative grid gap-8 md:grid-cols-3">
              {/* Connector line */}
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
                Reservar mi plaza gratuita
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 5 — FEATURES
            ══════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Funcionalidades
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Herramientas profesionales para cumplir con Hacienda
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-2xl text-center text-slate-500">
              Diseñado para profesionales autónomos y pequeñas empresas.
            </p>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <Card
                  key={f.title}
                  className={`border-2 p-6 transition-all duration-200 hover:shadow-md ${
                    f.highlight
                      ? 'border-blue-200 bg-blue-50/30 ring-1 ring-blue-100'
                      : 'hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                      f.highlight ? 'bg-blue-100' : 'bg-slate-100'
                    }`}
                  >
                    <f.icon
                      className={`h-6 w-6 ${f.highlight ? 'text-blue-600' : 'text-slate-600'}`}
                    />
                  </div>
                  <h3 className="mb-2 font-bold text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-500">{f.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 6 — WHAT IS VERIFACTU
            ══════════════════════════════════════════════════════════════ */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-4">
            <div className="mb-8 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Información normativa
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                ¿Qué es VeriFactu y cómo afecta a los autónomos?
              </h2>
            </div>

            <div className="space-y-4 text-slate-500">
              <p>
                <strong className="text-slate-800">VeriFactu</strong> es el sistema de verificación
                de facturas establecido por la{' '}
                <strong className="text-slate-800">Ley Antifraude 11/2021</strong>. Obliga a todos
                los autónomos y empresas a utilizar un{' '}
                <strong className="text-slate-800">software garante</strong> que asegure la{' '}
                <strong className="text-slate-800">trazabilidad</strong>,{' '}
                <strong className="text-slate-800">inalterabilidad</strong> e{' '}
                <strong className="text-slate-800">integridad de los registros</strong>.
              </p>
              <p>
                Cada factura debe contener un{' '}
                <strong className="text-slate-800">hash encadenado</strong>, un{' '}
                <strong className="text-slate-800">código QR verificable</strong> y debe
                transmitirse automáticamente a la <strong className="text-slate-800">AEAT</strong>.
                Esto hace inviable el uso de Excel, Word o software no homologado.
              </p>
              <p>
                {brandConfig.app.name} implementa{' '}
                <strong className="text-slate-800">firma electrónica cualificada</strong>, genera el
                hash en cada emisión y mantiene conexión directa con la Agencia Tributaria.
              </p>
            </div>

            <div className="mt-10 flex flex-wrap justify-center gap-2">
              {[
                'Ley 11/2021',
                'Reglamento de facturación',
                'Hash encadenado',
                'Código QR',
                'AEAT',
                'Software garante',
                'Firma electrónica',
                'Facturación electrónica',
              ].map((kw) => (
                <span
                  key={kw}
                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 7 — OFFER / 6 MONTHS FREE
            ══════════════════════════════════════════════════════════════ */}
        <section id="registro" className="py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <Card className="overflow-hidden border-2 border-blue-200">
              <div className="bg-gradient-to-br from-blue-50 via-white to-transparent p-8 text-center md:p-12">
                {/* Urgency badge */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                  <Clock className="h-4 w-4" />
                  Oferta limitada a {PLAZAS_CONFIG.total.toLocaleString('es-ES')} inscripciones
                </div>

                <h2 className="mb-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                  6 meses de acceso gratuito
                </h2>
                <p className="mb-2 text-lg font-bold text-blue-600">Sin tarjeta al registrarte</p>
                <p className="mb-6 text-slate-500">
                  Accede a todas las funcionalidades sin coste. Reservado para los primeros{' '}
                  {PLAZAS_CONFIG.total.toLocaleString('es-ES')} profesionales.
                </p>

                {/* Progress */}
                <div className="mx-auto mb-8 max-w-md rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <Users className="h-4 w-4 text-blue-600" />
                      Plazas ocupadas
                    </span>
                    <span className="text-2xl font-extrabold text-blue-600">
                      {PLAZAS_CONFIG.porcentaje}%
                    </span>
                  </div>
                  <div className="mb-2 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${PLAZAS_CONFIG.porcentaje}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>{PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} inscritos</span>
                    <span className="font-bold text-amber-600">
                      {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} restantes
                    </span>
                  </div>
                </div>

                {/* Value props */}
                <div className="mb-8 grid gap-4 sm:grid-cols-3">
                  {[
                    { icon: Clock, value: '6 meses', label: 'Acceso completo' },
                    { icon: CreditCard, value: '0€', label: 'Sin tarjeta al registrarte' },
                    { icon: TrendingUp, value: '9,90€/mes', label: 'Después, opcional' },
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

                {/* Checklist */}
                <ul className="mb-8 space-y-2 text-left sm:text-center">
                  {[
                    'Todas las funcionalidades incluidas',
                    'VeriFactu automático',
                    'Facturas ilimitadas',
                    'Soporte técnico incluido',
                    'Sin permanencia',
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center justify-start gap-2 sm:justify-center"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-600" />
                      <span className="text-sm text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/registro"
                  className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-10 text-base font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
                >
                  Reservar mi plaza gratuita
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-4 text-sm text-slate-400">
                  Registro en 2 minutos · Solo se requiere email · Sin compromiso
                </p>
              </div>
            </Card>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 8 — COMPARISON
            ══════════════════════════════════════════════════════════════ */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Comparativa
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                {brandConfig.app.name} frente a soluciones tradicionales
              </h2>
            </div>
            <p className="mx-auto mb-10 max-w-xl text-center text-slate-500">
              ¿Tu software actual cumple con los requisitos de la Ley Antifraude?
            </p>

            <Card className="overflow-hidden border-2 border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-4 text-left font-bold text-slate-700">
                        Característica
                      </th>
                      <th className="px-4 py-4 text-center font-bold text-slate-400">
                        Software tradicional
                      </th>
                      <th className="px-4 py-4 text-center font-bold text-blue-600">
                        {brandConfig.app.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRows.map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b border-slate-100 last:border-0 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}
                      >
                        <td className="px-4 py-3 font-medium text-slate-700">{row.feature}</td>
                        <td className="px-4 py-3 text-center">
                          {typeof row.them === 'string' ? (
                            <span className="font-medium text-amber-600">{row.them}</span>
                          ) : row.them ? (
                            <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                          ) : (
                            <X className="mx-auto h-5 w-5 text-slate-300" />
                          )}
                        </td>
                        <td className="bg-blue-50/30 px-4 py-3 text-center">
                          <CheckCircle2 className="mx-auto h-5 w-5 text-blue-600" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 9 — TESTIMONIALS
            ══════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                Testimonios
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Profesionales que ya cumplen con VeriFactu
              </h2>
            </div>
            <p className="mx-auto mb-12 max-w-xl text-center text-slate-500">
              Más de {PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} autónomos y pymes confían en{' '}
              {brandConfig.app.name}
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
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 10 — FAQ
            ══════════════════════════════════════════════════════════════ */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-4 text-center">
              <span className="mb-4 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Preguntas frecuentes
              </span>
              <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
                Dudas habituales sobre {brandConfig.app.name} y VeriFactu
              </h2>
            </div>
            <p className="mx-auto mb-10 max-w-xl text-center text-slate-500">
              Resolvemos las consultas más frecuentes de autónomos y pymes
            </p>

            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 11 — FINAL CTA
            ══════════════════════════════════════════════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
              <Users className="h-4 w-4" />
              Solo {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas gratuitas restantes
            </div>

            <h2 className="mb-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Reserva tu acceso gratuito ahora
            </h2>
            <p className="mb-8 text-lg text-slate-500">
              Únete a más de {PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} profesionales que ya
              cumplen con VeriFactu.
              <br />6 meses sin coste. Sin tarjeta al registrarte. Sin compromiso.
            </p>

            <Link
              href="/registro"
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-10 text-base font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
            >
              Reservar mi plaza
              <ArrowRight className="h-4 w-4" />
            </Link>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />6 meses gratis
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

      {/* ══════════════════════════════════════════════════════════════
          STICKY MOBILE CTA
          ══════════════════════════════════════════════════════════════ */}
      {showStickyCTA && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:hidden">
          <Link
            href="/registro"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-base font-bold text-white transition-all hover:bg-blue-700"
          >
            Reservar plaza gratuita
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-2 text-center text-xs text-slate-400">
            <span className="font-bold text-amber-600">
              {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas restantes
            </span>
            {' · '}6 meses gratis · Sin tarjeta al registrarte
          </p>
        </div>
      )}
    </div>
  );
}

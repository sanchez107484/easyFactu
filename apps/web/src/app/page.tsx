'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { brandConfig } from '@easyfactura/brand-config';
import { useAuthStore } from '@/store/auth-store';
import {
  Shield,
  Zap,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  FileCheck,
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

// ─────────────────────────────────────────────────────────────────────────────
// Configuración de plazas limitadas
// ─────────────────────────────────────────────────────────────────────────────
const PLAZAS_CONFIG = {
  total: 5000,
  ocupadas: 2562, // Actualiza esto o conéctalo a tu backend
  get disponibles() {
    return this.total - this.ocupadas;
  },
  get porcentaje() {
    return Math.round((this.ocupadas / this.total) * 100);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Schema.org JSON-LD optimizado para SEO
// ─────────────────────────────────────────────────────────────────────────────
const schemaData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: brandConfig.app.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        priceValidUntil: '2027-07-01',
        description: `6 meses gratis para las primeras ${PLAZAS_CONFIG.total} inscripciones. Sin tarjeta de crédito.`,
        availability: 'https://schema.org/LimitedAvailability',
        inventoryLevel: {
          '@type': 'QuantitativeValue',
          value: PLAZAS_CONFIG.disponibles,
          unitText: 'plazas disponibles',
        },
      },
      description:
        'Software de facturación VeriFactu para autónomos y pymes. Cumple con la Ley Antifraude 11/2021 de forma automática.',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '214',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Cuándo es obligatorio VeriFactu para autónomos?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'VeriFactu es obligatorio desde el 1 de julio de 2025 para nuevos autónomos y desde el 1 de julio de 2026 para los ya existentes.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Cuántas plazas gratuitas hay disponibles?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Ofrecemos 6 meses gratuitos a las primeras ${PLAZAS_CONFIG.total} inscripciones. Actualmente quedan ${PLAZAS_CONFIG.disponibles} plazas disponibles.`,
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué multas hay por no usar un software VeriFactu certificado?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Usar software no certificado puede acarrear sanciones de hasta 50.000€ según la Ley General Tributaria.',
          },
        },
        {
          '@type': 'Question',
          name: `¿Es ${brandConfig.app.name} compatible con la AEAT?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Sí, ${brandConfig.app.name} tiene conexión API directa con la Agencia Tributaria.`,
          },
        },
      ],
    },
    {
      '@type': 'Organization',
      name: brandConfig.app.legalEntity,
      url: brandConfig.app.url,
      logo: `${brandConfig.app.url}/logo.png`,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Datos de contenido
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
    text: `Funciona todo muy bien, igual de bien que otras más caras que he usado. Y lo mejor es que es gratis durante 6 meses, una oportunidad que no podía dejar pasar. `,
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
    a: 'El plan profesional tiene un coste de 9,90€/mes. Sin permanencia ni compromisos.',
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
  { icon: CreditCard, text: 'Sin tarjeta requerida' },
  { icon: Clock, text: 'Activación inmediata' },
  { icon: Shield, text: 'Certificado AEAT' },
  { icon: Lock, text: 'RGPD compliant' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Componente principal
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const [counters, setCounters] = useState({ facturas: 0, usuarios: 0, ahorro: 0 });
  const statsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    checkAuth();
    const handleScroll = () => setShowStickyCTA(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [checkAuth]);

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="flex min-h-screen flex-col bg-background text-foreground">
        {/* ═══════════════════════════════════════════════════════════════════
            BANNER SUPERIOR - PLAZAS LIMITADAS
            ═══════════════════════════════════════════════════════════════════ */}
        {bannerVisible && (
          <div className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-2.5 text-center text-sm font-medium text-white">
            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-300 sm:inline-flex">
                <Users className="h-3 w-3" />
                {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas
              </span>
              <span>
                <strong>6 meses gratis</strong> para las primeras{' '}
                {PLAZAS_CONFIG.total.toLocaleString('es-ES')} inscripciones.
                <Link
                  href="/registro"
                  className="ml-2 inline-flex items-center underline underline-offset-2 hover:no-underline"
                >
                  Reservar ahora
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </span>
            </div>
            <button
              onClick={() => setBannerVisible(false)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 opacity-70 transition-opacity hover:opacity-100"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            HEADER
            ═══════════════════════════════════════════════════════════════════ */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Image
                  src={brandConfig.logos.main}
                  alt={`${brandConfig.app.name} - Software de facturación VeriFactu`}
                  width={160}
                  height={40}
                  className="object-contain"
                  style={{ width: 'auto', height: '34px' }}
                  priority
                />
              </Link>
              <Badge
                variant="outline"
                className="hidden border-primary/30 bg-primary/5 text-primary sm:inline-flex"
              >
                <BadgeCheck className="mr-1 h-3 w-3" />
                Certificado VeriFactu
              </Badge>
            </div>

            <nav className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button>Acceder</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:inline-flex">
                    <Button variant="ghost" size="sm">
                      Iniciar sesión
                    </Button>
                  </Link>
                  <Link href="/registro">
                    <Button size="sm">
                      <Sparkles className="mr-1.5 h-4 w-4" />
                      Reservar plaza
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 1: HERO
              ═══════════════════════════════════════════════════════════════════ */}
          <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 25% 50%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 75% 25%, hsl(var(--primary)) 0%, transparent 40%)',
              }}
            />

            <div className="container relative px-4">
              <div className="mx-auto max-w-4xl text-center">
                {/* Badge de estado */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-2 text-sm font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  Plataforma nativa VeriFactu
                </div>

                {/* H1 */}
                <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  Software de facturación{' '}
                  <span className="relative whitespace-nowrap text-primary">
                    VeriFactu
                    <svg
                      className="absolute -bottom-2 left-0 w-full"
                      viewBox="0 0 300 12"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M2 9 C75 3, 225 3, 298 9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        className="text-primary/40"
                      />
                    </svg>
                  </span>{' '}
                  para autónomos y pymes
                </h1>

                {/* Subtítulo */}
                <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                  Cumple con la <strong className="text-foreground">Ley Antifraude 11/2021</strong>{' '}
                  de forma automática. Genera facturas legales con hash encadenado, código QR y
                  envío directo a la AEAT.
                </p>

                {/* Propuesta de valor con plazas */}
                <div className="mb-8 inline-flex flex-col items-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold">6 meses completamente gratuitos</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4 text-amber-600" />
                    <span>
                      Limitado a{' '}
                      <strong className="text-foreground">
                        {PLAZAS_CONFIG.total.toLocaleString('es-ES')} plazas
                      </strong>{' '}
                      ·{' '}
                      <span className="text-amber-600">
                        {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} disponibles
                      </span>
                    </span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  {!isAuthenticated ? (
                    <>
                      <Link href="/registro">
                        <Button
                          size="lg"
                          className="h-14 w-full px-8 text-base font-semibold sm:w-auto"
                        >
                          Reservar mi plaza gratuita
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href="/login">
                        <Button
                          size="lg"
                          variant="outline"
                          className="h-14 w-full px-8 text-base sm:w-auto"
                        >
                          Ya tengo cuenta
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <Link href="/dashboard">
                      <Button size="lg" className="h-14 px-8 text-base font-semibold">
                        Ir a mi panel
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Trust badges */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                  {trustBadges.map(({ icon: Icon, text }) => (
                    <span key={text} className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-primary/70" />
                      {text}
                    </span>
                  ))}
                </div>

                {/* Barra de plazas en Hero */}
                <div className="mx-auto mt-10 max-w-md">
                  <div className="rounded-xl border-2 border-amber-500/20 bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-950/30 dark:to-orange-950/30">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium">
                        <Users className="h-4 w-4 text-amber-600" />
                        Plazas gratuitas ocupadas
                      </span>
                      <span className="font-bold text-amber-600">{PLAZAS_CONFIG.porcentaje}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-amber-200 dark:bg-amber-900">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                        style={{ width: `${PLAZAS_CONFIG.porcentaje}%` }}
                      />
                    </div>
                    <p className="mt-2 text-center text-xs text-muted-foreground">
                      {PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} inscritos ·{' '}
                      <span className="font-semibold text-amber-600">
                        {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas restantes
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 2: MÉTRICAS
              ═══════════════════════════════════════════════════════════════════ */}
          <section ref={statsRef} className="border-y bg-muted/30 py-12">
            <div className="container px-4">
              <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-3">
                <div className="text-center">
                  <div className="text-4xl font-bold tabular-nums">
                    {counters.facturas.toLocaleString('es-ES')}+
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Facturas procesadas</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold tabular-nums">
                    {counters.usuarios.toLocaleString('es-ES')}+
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">Profesionales inscritos</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold tabular-nums">
                    {counters.ahorro.toLocaleString('es-ES')}€
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">En sanciones evitadas</p>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 3: EL PROBLEMA
              ═══════════════════════════════════════════════════════════════════ */}
          <section className="py-16 md:py-24">
            <div className="container px-4">
              <div className="mx-auto max-w-3xl">
                <div className="mb-8 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                  </div>
                </div>

                <h2 className="mb-6 text-center text-3xl font-bold sm:text-4xl">
                  El uso de Excel o Word para facturar dejará de ser legal
                </h2>

                <Card className="border-2 border-destructive/20 bg-destructive/5">
                  <CardContent className="p-6 text-center md:p-8">
                    <p className="mb-4 text-lg">
                      A partir de julio de 2025, la <strong>Ley Antifraude 11/2021</strong> exige
                      que todas las facturas incluyan <strong>hash encadenado</strong>,{' '}
                      <strong>código QR</strong> y sean{' '}
                      <strong>enviadas automáticamente a la AEAT</strong>.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="text-xl font-bold">
                        Sanción por incumplimiento: hasta 50.000€
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <p className="mt-8 text-center text-lg text-muted-foreground">
                  {brandConfig.app.name} automatiza todos estos requisitos técnicos.{' '}
                  <strong className="text-foreground">
                    Tú solo creas la factura, nosotros garantizamos el cumplimiento.
                  </strong>
                </p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 4: CÓMO FUNCIONA
              ═══════════════════════════════════════════════════════════════════ */}
          <section className="border-y bg-muted/30 py-16 md:py-24">
            <div className="container px-4">
              <div className="mx-auto max-w-5xl">
                <div className="mb-4 text-center">
                  <Badge variant="outline" className="mb-4">
                    Proceso simplificado
                  </Badge>
                  <h2 className="text-3xl font-bold sm:text-4xl">
                    Facturación VeriFactu en tres pasos
                  </h2>
                </div>
                <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
                  Sin conocimientos técnicos. Sin configuraciones complejas.
                </p>

                <div className="relative grid gap-8 md:grid-cols-3">
                  <div
                    className="absolute left-[16.67%] right-[16.67%] top-10 hidden h-px bg-border md:block"
                    aria-hidden="true"
                  />

                  {steps.map((step) => (
                    <div key={step.num} className="relative flex flex-col items-center text-center">
                      <div className="relative z-10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border-2 bg-background shadow-sm">
                        <step.icon className="h-8 w-8 text-primary" />
                        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {step.num.replace('0', '')}
                        </span>
                      </div>
                      <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-12 text-center">
                  <Link href="/registro">
                    <Button size="lg" className="px-8">
                      Reservar mi plaza gratuita
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 5: CARACTERÍSTICAS
              ═══════════════════════════════════════════════════════════════════ */}
          <section className="py-16 md:py-24">
            <div className="container px-4">
              <div className="mx-auto max-w-6xl">
                <div className="mb-4 text-center">
                  <Badge variant="outline" className="mb-4">
                    Funcionalidades
                  </Badge>
                  <h2 className="text-3xl font-bold sm:text-4xl">
                    Herramientas profesionales para cumplir con Hacienda
                  </h2>
                </div>
                <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
                  Diseñado para profesionales autónomos y pequeñas empresas.
                </p>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {features.map((f) => (
                    <Card
                      key={f.title}
                      className={`border-2 transition-all duration-200 hover:shadow-md ${
                        f.highlight
                          ? 'border-primary/30 bg-primary/[0.02] ring-1 ring-primary/10'
                          : 'hover:border-muted-foreground/20'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div
                          className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                            f.highlight ? 'bg-primary/10' : 'bg-muted'
                          }`}
                        >
                          <f.icon
                            className={`h-6 w-6 ${f.highlight ? 'text-primary' : 'text-foreground'}`}
                          />
                        </div>
                        <h3 className="mb-2 font-semibold">{f.title}</h3>
                        <p className="text-sm text-muted-foreground">{f.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 6: QUÉ ES VERIFACTU
              ═══════════════════════════════════════════════════════════════════ */}
          <section className="border-y bg-muted/30 py-16 md:py-24">
            <div className="container px-4">
              <div className="mx-auto max-w-4xl">
                <div className="mb-8 text-center">
                  <Badge variant="outline" className="mb-4">
                    Información normativa
                  </Badge>
                  <h2 className="text-3xl font-bold sm:text-4xl">
                    ¿Qué es VeriFactu y cómo afecta a los autónomos?
                  </h2>
                </div>

                <div className="prose prose-base mx-auto max-w-none text-muted-foreground dark:prose-invert prose-headings:text-foreground prose-strong:text-foreground">
                  <p>
                    <strong>VeriFactu</strong> es el sistema de verificación de facturas establecido
                    por la <strong>Ley Antifraude 11/2021</strong>. Obliga a todos los autónomos y
                    empresas a utilizar un <strong>software garante</strong> que asegure la{' '}
                    <strong>trazabilidad</strong>, <strong>inalterabilidad</strong> e{' '}
                    <strong>integridad de los registros</strong>.
                  </p>
                  <p>
                    Cada factura debe contener un <strong>hash encadenado</strong>, un{' '}
                    <strong>código QR verificable</strong> y debe transmitirse automáticamente a la{' '}
                    <strong>AEAT</strong>. Esto hace inviable el uso de Excel, Word o software no
                    homologado.
                  </p>
                  <p>
                    {brandConfig.app.name} implementa <strong>firma electrónica cualificada</strong>
                    , genera el hash en cada emisión y mantiene conexión directa con la Agencia
                    Tributaria.
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
                    <Badge key={kw} variant="secondary" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 7: OFERTA - 6 MESES GRATIS CON PLAZAS LIMITADAS
              ═══════════════════════════════════════════════════════════════════ */}
          <section className="py-16 md:py-24">
            <div className="container px-4">
              <div className="mx-auto max-w-3xl">
                <Card className="overflow-hidden border-2 border-primary/20">
                  <div className="bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent p-8 text-center md:p-12">
                    {/* Badge de urgencia */}
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                      <Clock className="h-4 w-4" />
                      Oferta limitada a {PLAZAS_CONFIG.total.toLocaleString('es-ES')} inscripciones
                    </div>

                    <h2 className="mb-2 text-3xl font-bold sm:text-4xl">
                      6 meses de acceso gratuito
                    </h2>
                    <p className="mb-2 text-lg font-medium text-primary">
                      Sin tarjeta de crédito requerida
                    </p>
                    <p className="mb-6 text-muted-foreground">
                      Accede a todas las funcionalidades sin coste. Reservado para los primeros{' '}
                      {PLAZAS_CONFIG.total.toLocaleString('es-ES')} profesionales.
                    </p>

                    {/* Barra de progreso de plazas */}
                    <div className="mx-auto mb-8 max-w-md rounded-xl border bg-background/80 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <Users className="h-4 w-4 text-primary" />
                          Plazas ocupadas
                        </span>
                        <span className="text-2xl font-bold text-primary">
                          {PLAZAS_CONFIG.porcentaje}%
                        </span>
                      </div>
                      <div className="mb-2 h-3 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                          style={{ width: `${PLAZAS_CONFIG.porcentaje}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} inscritos</span>
                        <span className="font-semibold text-amber-600">
                          {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} restantes
                        </span>
                      </div>
                    </div>

                    <div className="mb-8 grid gap-4 sm:grid-cols-3">
                      {[
                        { icon: Clock, value: '6 meses', label: 'Acceso completo' },
                        { icon: CreditCard, value: '0€', label: 'Sin tarjeta' },
                        { icon: TrendingUp, value: '9,90€/mes', label: 'Después, opcional' },
                      ].map(({ icon: Icon, value, label }) => (
                        <div
                          key={label}
                          className="rounded-xl border bg-background/60 p-4 text-center"
                        >
                          <Icon className="mx-auto mb-2 h-5 w-5 text-primary" />
                          <div className="text-2xl font-bold">{value}</div>
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>

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
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                          <span className="text-sm">{item}</span>
                        </li>
                      ))}
                    </ul>

                    {!isAuthenticated && (
                      <>
                        <Link href="/registro">
                          <Button
                            size="lg"
                            className="h-14 w-full px-10 text-base font-semibold sm:w-auto"
                          >
                            Reservar mi plaza gratuita
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                        <p className="mt-4 text-sm text-muted-foreground">
                          Registro en 2 minutos · Solo se requiere email · Sin compromiso
                        </p>
                      </>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 8: COMPARATIVA
              ═══════════════════════════════════════════════════════════════════ */}
          <section className="border-y bg-muted/30 py-16 md:py-24">
            <div className="container px-4">
              <div className="mx-auto max-w-3xl">
                <div className="mb-4 text-center">
                  <Badge variant="outline" className="mb-4">
                    Comparativa
                  </Badge>
                  <h2 className="text-3xl font-bold sm:text-4xl">
                    {brandConfig.app.name} frente a soluciones tradicionales
                  </h2>
                </div>
                <p className="mx-auto mb-10 max-w-xl text-center text-muted-foreground">
                  ¿Tu software actual cumple con los requisitos de la Ley Antifraude?
                </p>

                <Card className="overflow-hidden border-2">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-4 text-left font-semibold">Característica</th>
                          <th className="px-4 py-4 text-center font-semibold text-muted-foreground">
                            Software tradicional
                          </th>
                          <th className="px-4 py-4 text-center font-semibold text-primary">
                            {brandConfig.app.name}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonRows.map((row, i) => (
                          <tr
                            key={i}
                            className={`border-b last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                          >
                            <td className="px-4 py-3 font-medium">{row.feature}</td>
                            <td className="px-4 py-3 text-center">
                              {typeof row.them === 'string' ? (
                                <span className="text-amber-600">{row.them}</span>
                              ) : row.them ? (
                                <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
                              ) : (
                                <X className="mx-auto h-5 w-5 text-muted-foreground" />
                              )}
                            </td>
                            <td className="bg-primary/[0.02] px-4 py-3 text-center">
                              <CheckCircle2 className="mx-auto h-5 w-5 text-primary" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 9: TESTIMONIOS
              ═══════════════════════════════════════════════════════════════════ */}
          <section className="py-16 md:py-24">
            <div className="container px-4">
              <div className="mx-auto max-w-6xl">
                <div className="mb-4 text-center">
                  <Badge variant="outline" className="mb-4">
                    Testimonios
                  </Badge>
                  <h2 className="text-3xl font-bold sm:text-4xl">
                    Profesionales que ya cumplen con VeriFactu
                  </h2>
                </div>
                <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
                  Más de {PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} autónomos y pymes confían
                  en {brandConfig.app.name}
                </p>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {testimonials.map((t) => (
                    <Card key={t.name} className="border-2">
                      <CardContent className="p-6">
                        <div className="mb-4 flex">
                          {Array.from({ length: t.stars }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <blockquote className="mb-6 text-sm leading-relaxed text-muted-foreground">
                          &ldquo;{t.text}&rdquo;
                        </blockquote>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                            {t.initials}
                          </div>
                          <div>
                            <div className="text-sm font-semibold">{t.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {t.role} · {t.location}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 10: FAQ
              ═══════════════════════════════════════════════════════════════════ */}
          <section className="border-y bg-muted/30 py-16 md:py-24">
            <div className="container px-4">
              <div className="mx-auto max-w-3xl">
                <div className="mb-4 text-center">
                  <Badge variant="outline" className="mb-4">
                    Preguntas frecuentes
                  </Badge>
                  <h2 className="text-3xl font-bold sm:text-4xl">
                    Dudas habituales sobre {brandConfig.app.name} y VeriFactu
                  </h2>
                </div>
                <p className="mx-auto mb-10 max-w-xl text-center text-muted-foreground">
                  Resolvemos las consultas más frecuentes de autónomos y pymes
                </p>

                <Accordion type="single" collapsible className="w-full space-y-2">
                  {faqs.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="rounded-xl border-2 bg-background px-4 data-[state=open]:border-primary/20"
                    >
                      <AccordionTrigger className="py-4 text-left text-base font-semibold hover:no-underline">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════════════
              SECCIÓN 11: CTA FINAL
              ═══════════════════════════════════════════════════════════════════ */}
          <section className="py-16 md:py-24">
            <div className="container px-4">
              <div className="mx-auto max-w-2xl text-center">
                {/* Badge de plazas */}
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                  <Users className="h-4 w-4" />
                  Solo {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas gratuitas
                  restantes
                </div>

                <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                  Reserva tu acceso gratuito ahora
                </h2>
                <p className="mb-8 text-lg text-muted-foreground">
                  Únete a más de {PLAZAS_CONFIG.ocupadas.toLocaleString('es-ES')} profesionales que
                  ya cumplen con VeriFactu.
                  <br />6 meses sin coste. Sin tarjeta. Sin compromiso.
                </p>

                {!isAuthenticated && (
                  <>
                    <Link href="/registro">
                      <Button
                        size="lg"
                        className="h-14 w-full px-10 text-base font-semibold sm:w-auto"
                      >
                        Reservar mi plaza
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-primary" />6 meses gratis
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Sin tarjeta
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Activación inmediata
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </main>

        {/* ═══════════════════════════════════════════════════════════════════
            FOOTER
            ═══════════════════════════════════════════════════════════════════ */}
        <footer className="border-t bg-muted/20 py-12">
          <div className="container px-4">
            <div className="mx-auto max-w-6xl">
              <div className="mb-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
                <div className="flex items-center gap-3">
                  <Image
                    src={brandConfig.logos.main}
                    alt={brandConfig.app.name}
                    width={140}
                    height={36}
                    className="object-contain"
                    style={{ width: 'auto', height: '30px' }}
                  />
                  <Badge variant="outline" className="text-xs">
                    <BadgeCheck className="mr-1 h-3 w-3" />
                    VeriFactu
                  </Badge>
                </div>

                <nav className="flex flex-wrap justify-center gap-6 text-sm">
                  <Link
                    href="/funcionalidades"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Funcionalidades
                  </Link>
                  <Link href="/precios" className="text-muted-foreground hover:text-foreground">
                    Precios
                  </Link>
                  <Link href="/blog" className="text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                  <Link href="/contacto" className="text-muted-foreground hover:text-foreground">
                    Contacto
                  </Link>
                </nav>
              </div>

              <div className="flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
                <nav className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                  <Link href="/privacidad" className="hover:text-foreground">
                    Política de privacidad
                  </Link>
                  <Link href="/terminos" className="hover:text-foreground">
                    Términos de uso
                  </Link>
                  <Link href="/aviso-legal" className="hover:text-foreground">
                    Aviso legal
                  </Link>
                  <Link href="/cookies" className="hover:text-foreground">
                    Cookies
                  </Link>
                </nav>

                <p className="text-center text-xs text-muted-foreground">
                  © {new Date().getFullYear()} {brandConfig.app.legalEntity}. Todos los derechos
                  reservados.
                </p>
              </div>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Software de facturación certificado según la Ley Antifraude 11/2021 · Compatible con
                VeriFactu AEAT · Cumplimiento RGPD · Servidores en la Unión Europea
              </p>
            </div>
          </div>
        </footer>

        {/* ═══════════════════════════════════════════════════════════════════
            STICKY CTA MÓVIL
            ═══════════════════════════════════════════════════════════════════ */}
        {showStickyCTA && !isAuthenticated && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden">
            <Link href="/registro" className="block">
              <Button size="lg" className="h-12 w-full font-semibold">
                Reservar plaza gratuita
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              <span className="font-medium text-amber-600">
                {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas restantes
              </span>
              {' · '}6 meses gratis · Sin tarjeta
            </p>
          </div>
        )}
      </div>
    </>
  );
}

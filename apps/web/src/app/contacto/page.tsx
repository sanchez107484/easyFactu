import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Building2,
  Users,
  Shield,
  Star,
  HelpCircle,
  FileText,
  Headphones,
} from 'lucide-react';
import { brandConfig, PLAZAS_CONFIG } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { ContactoForm, ContactoFaqItems } from './contacto-client';

// -----------------------------------------------------------------------------
// SEO – Metadata
// -----------------------------------------------------------------------------
export const metadata: Metadata = {
  title: `Contacto – Soporte y atención al cliente | ${brandConfig.app.name}`,
  description: `¿Tienes dudas sobre VeriFactu, planes o migración desde otro software? Nuestro equipo responde en menos de 2 horas en español. Escríbenos ahora.`,
  alternates: {
    canonical: `${brandConfig.app.url}/contacto`,
  },
  openGraph: {
    title: `Contacto – ${brandConfig.app.name}`,
    description: `Soporte técnico, consultas sobre VeriFactu y migraciones. Respuesta en menos de 2 horas en español.`,
    url: `${brandConfig.app.url}/contacto`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `Contacto ${brandConfig.app.name} – Soporte VeriFactu`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Contacto – ${brandConfig.app.name}`,
    description: `Soporte en español. Respuesta en menos de 2 horas.`,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

// --- Channels -----------------------------------------------------------------
const channels = [
  {
    icon: Mail,
    title: 'Email de soporte',
    desc: brandConfig.app.supportEmail,
    action: `mailto:${brandConfig.app.supportEmail}`,
    href: `mailto:${brandConfig.app.supportEmail}`,
    badge: null,
    badgeColor: null,
    available: true,
  },
  {
    icon: Phone,
    title: 'Llamada de bienvenida',
    desc: 'Para migraciones complejas o consultas detalladas.',
    action: 'Solicitar llamada',
    href: '#formulario',
    badge: 'Asistencia personal',
    badgeColor: 'blue',
    available: true,
  },
];

const stats = [
  { value: '< 2h', label: 'Tiempo de respuesta medio', icon: Clock },
  { value: '4.9★', label: 'Valoración de soporte', icon: Star },
  { value: '98%', label: 'Incidencias resueltas en 24h', icon: CheckCircle2 },
  { value: 'ES', label: 'Soporte en español', icon: Headphones },
];

const faqs = [
  {
    q: '¿Cuánto tarda en responderse un ticket de soporte?',
    a: `Nuestro tiempo de respuesta medio es inferior a 2 horas en horario laboral (L-V 9:00-18:00). Puedes escribirnos a ${brandConfig.app.supportEmail} o usar el chat desde el panel.`,
  },
  {
    q: '¿Puedo solicitar una demo del software antes de registrarme?',
    a: 'Sí. Puedes solicitar una demo guiada en el formulario de contacto. También tienes acceso a una demo interactiva pública en nuestra web sin necesidad de registro.',
  },
  {
    q: '¿Ofrecéis ayuda para migrar desde Holded, Cegid u otros?',
    a: 'Sí. Ofrecemos migración gratuita y asistida para todos los planes. Nuestro equipo se encarga de importar tus clientes, facturas y datos históricos.',
  },
  {
    q: '¿Tenéis soporte telefónico?',
    a: `El soporte de ${brandConfig.app.name} es por chat y email, con tiempo de respuesta inferior a 2 horas en horario laboral. Para migraciones complejas o consultas comerciales, puedes solicitar una llamada desde el formulario de contacto.`,
  },
  {
    q: '¿Podéis ayudarme a entender si mi software actual cumple con VeriFactu?',
    a: 'Por supuesto. Selecciona "Dudas sobre VeriFactu" en el formulario y uno de nuestros especialistas te explicará qué requisitos debe cumplir tu software actual y cómo migrar.',
  },
];

// -----------------------------------------------------------------------------
// SEO – JSON-LD Structured Data
// -----------------------------------------------------------------------------
const contactPageJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: `Contacto – ${brandConfig.app.name}`,
  url: `${brandConfig.app.url}/contacto`,
  description:
    'Página de contacto y soporte de NovaFactura, software de facturación VeriFactu para autónomos y pymes.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Contacto',
        item: `${brandConfig.app.url}/contacto`,
      },
    ],
  },
  mainEntity: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
    contactPoint: {
      '@type': 'ContactPoint',
      email: brandConfig.app.supportEmail,
      contactType: 'customer support',
      hoursAvailable: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      availableLanguage: 'Spanish',
    },
  },
};

// -----------------------------------------------------------------------------
// Page Component (Server Component)
// -----------------------------------------------------------------------------
export default function ContactoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      {/* JSON-LD – ContactPage + BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactPageJsonLd) }}
      />
      <SiteHeader />

      <main className="flex-1">
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            HERO
            â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section className="relative overflow-hidden py-16 md:py-24">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 70%)',
            }}
          />
          <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-blue-100 opacity-20 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-indigo-100 opacity-20 blur-3xl" />

          <div className="relative mx-auto max-w-3xl px-4 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-800">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              Soporte activo · Respuesta {'<'} 2 horas
            </div>

            <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Estamos aquí{' '}
              <span className="relative text-blue-600">
                para ayudarte
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 300 10"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 7 C75 2, 225 2, 298 7"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    opacity="0.35"
                  />
                </svg>
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-xl text-lg text-slate-500">
              Soporte técnico, consultas sobre VeriFactu, migraciones o planes personalizados. Un
              equipo real te responde en español.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map(({ value, label, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center"
                >
                  <Icon className="mx-auto mb-1.5 h-5 w-5 text-blue-600" />
                  <div className="text-xl font-extrabold text-slate-900">{value}</div>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            CHANNELS
            â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section className="border-y border-slate-100 bg-slate-50 py-12">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-8 text-center text-xl font-bold text-slate-700">
              Elige cómo quieres contactarnos
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {channels.map((ch) => (
                <a
                  key={ch.title}
                  href={ch.href}
                  className="group flex flex-col rounded-2xl border-2 border-slate-200 bg-white p-5 transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 transition-colors group-hover:bg-blue-100">
                      <ch.icon className="h-5 w-5 text-blue-600" />
                    </div>
                    {ch.badge && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          ch.badgeColor === 'green'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {ch.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-1 font-semibold text-slate-900">{ch.title}</h3>
                  <p className="mb-3 text-sm text-slate-500">{ch.desc}</p>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                    {ch.action}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            MAIN CONTENT: FORM + SIDEBAR
            â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section id="formulario" className="py-16 md:py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
              {/* -- FORM (client island) ------------------------------ */}
              <ContactoForm />
              {/* -- SIDEBAR (server-rendered static) ------------------- */}
              <aside className="space-y-6">
                {/* Free spots CTA */}
                <div className="rounded-2xl border-2 border-blue-100 bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-200" />
                    <span className="text-sm font-bold text-blue-100">Oferta limitada</span>
                  </div>
                  <h3 className="mb-2 text-xl font-extrabold">Gratis hasta 2027</h3>
                  <p className="mb-4 text-sm text-blue-100">
                    Sin tarjeta al registrarte. Añádela cuando quieras continuar.
                  </p>
                  <div className="mb-4 rounded-xl bg-white/15 p-3">
                    <div className="mb-1.5 flex justify-between text-xs font-semibold text-blue-100">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> Plazas ocupadas
                      </span>
                      <span>51%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-blue-900/40">
                      <div className="h-full w-[51%] rounded-full bg-amber-400" />
                    </div>
                    <p className="mt-1.5 text-center text-xs text-blue-200">
                      <strong className="text-white">
                        {PLAZAS_CONFIG.disponibles.toLocaleString('es-ES')} plazas restantes
                      </strong>
                    </p>
                  </div>
                  <Link
                    href="/registro"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-blue-700 transition-all hover:bg-blue-50"
                  >
                    <Sparkles className="h-4 w-4" />
                    Reservar mi plaza
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Help links */}
                <div className="rounded-2xl border-2 border-slate-100 bg-white p-5">
                  <h3 className="mb-4 font-bold text-slate-900">Recursos de ayuda</h3>
                  <div className="space-y-2">
                    {[
                      { icon: FileText, label: 'Documentación y guías', href: '#' },
                      { icon: HelpCircle, label: 'Preguntas frecuentes', href: '#' },
                      { icon: Shield, label: 'Qué es VeriFactu', href: '#' },
                      { icon: Building2, label: 'Ver precios y plan', href: '/precios' },
                      { icon: Headphones, label: 'Estado del sistema', href: '#' },
                    ].map(({ icon: Icon, label, href }) => (
                      <Link
                        key={label}
                        href={href}
                        className="flex items-center gap-3 rounded-lg p-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-600"
                      >
                        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                        {label}
                        <ArrowRight className="ml-auto h-3.5 w-3.5 text-slate-300" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Office hours */}
                <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 p-5">
                  <h3 className="mb-3 font-bold text-slate-900">Horario de atención</h3>
                  <div className="space-y-2 text-sm">
                    {[
                      { day: 'Lunes – Viernes', hours: '9:00 – 18:00', active: true },
                      { day: 'Sábados', hours: '10:00 – 14:00', active: false },
                      { day: 'Domingos y festivos', hours: 'Cerrado', active: false },
                    ].map(({ day, hours, active }) => (
                      <div key={day} className="flex items-center justify-between">
                        <span className="text-slate-600">{day}</span>
                        <span
                          className={`font-semibold ${active ? 'text-green-700' : 'text-slate-400'}`}
                        >
                          {hours}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    Soporte activo ahora
                  </div>
                </div>

                {/* Trust */}
                <div className="rounded-2xl border-2 border-slate-100 bg-white p-5">
                  <h3 className="mb-3 font-bold text-slate-900">Por qué confiar en nosotros</h3>
                  <div className="space-y-2.5">
                    {[
                      { icon: Shield, text: 'Software certificado por la AEAT' },
                      { icon: Star, text: '4.9/5 en valoraciones de clientes' },
                      { icon: Users, text: '+2.500 autónomos y pymes activos' },
                      { icon: CheckCircle2, text: 'RGPD compliant · Servidores UE' },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2.5 text-sm text-slate-600">
                        <Icon className="h-4 w-4 shrink-0 text-blue-600" />
                        {text}
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            FAQ
            â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section className="border-y border-slate-100 bg-slate-50 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-3 text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                Preguntas frecuentes de soporte
              </span>
            </div>
            <h2 className="mb-3 text-center text-2xl font-extrabold text-slate-900 sm:text-3xl">
              Antes de escribirnos, comprueba esto
            </h2>
            <p className="mx-auto mb-10 max-w-lg text-center text-sm text-slate-500">
              Resolvemos las dudas más habituales sobre soporte, demos y migraciones.
            </p>
            <ContactoFaqItems faqs={faqs} />
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            CTA FINAL
            â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="mb-3 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              ¿Prefieres probarlo directamente?
            </h2>
            <p className="mx-auto mb-8 max-w-lg text-lg text-slate-500">
              Regístrate gratis y explora NovaFactura sin compromiso. Gratis hasta 2027 para los
              primeros 5.000.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/registro"
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-10 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700 hover:shadow-xl sm:w-auto"
              >
                <Sparkles className="h-5 w-5" />
                Registrarme gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/precios"
                className="flex h-13 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-blue-200 hover:text-blue-600 sm:w-auto"
              >
                Ver planes y precios
              </Link>
            </div>
          </div>
        </section>
      </main>

      <FooterLanding />
    </div>
  );
}

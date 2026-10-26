import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, Clock, Shield, Sparkles, Users } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';
import { PricingGuideLink } from '@/components/marketing/pricing-guide-link';
import { VerifactuDeadlines } from '@/components/verifactu-deadlines';
import {
  VERIFACTU_ANNOUNCED_DEADLINE,
  VERIFACTU_CALENDAR_UPDATED_AT,
} from '@/lib/verifactu-deadlines';

// HU-16: title answers the query with the date; the H1 keeps the HU-05 wording.
const PAGE_TITLE = `¿Cuándo es obligatorio VeriFactu? En ${VERIFACTU_ANNOUNCED_DEADLINE.label}`;
const PAGE_DESCRIPTION = `${VERIFACTU_ANNOUNCED_DEADLINE.summary} para autónomos y empresas. Calendario por perfil, fuente oficial y qué hacer ya para no llegar tarde.`;
const PAGE_URL = `${brandConfig.app.url}/verifactu/cuando-es-obligatorio`;

export const novafacturaVerifactuCuandoMetadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const faqs = [
  {
    q: '¿Cuándo es obligatorio VeriFactu?',
    a: `${VERIFACTU_ANNOUNCED_DEADLINE.summary}. El 5 de octubre de 2026 el Ministerio de Hacienda comunicó que aplazará las obligaciones pendientes del Reglamento VeriFactu (Real Decreto 1007/2023) hasta ${VERIFACTU_ANNOUNCED_DEADLINE.label}, para que coincidan con la factura electrónica obligatoria para empresas y autónomos que facturan hasta 8 millones de euros al año.`,
  },
  {
    q: '¿Ya es oficial el aplazamiento a octubre de 2028?',
    a: 'Todavía no. Es un anuncio del Ministerio de Hacienda que debe aprobarse y publicarse en el BOE. Mientras tanto, el texto vigente (Real Decreto-ley 15/2025) mantiene el 1 de enero de 2027 para sociedades y el 1 de julio de 2027 para el resto. Actualizaremos esta página en cuanto se publique la norma.',
  },
  {
    q: '¿Quién está obligado a usar VeriFactu?',
    a: 'Los autónomos y sociedades que emiten facturas con un programa informático y tributan en territorio común. Quedan fuera, entre otros, quienes llevan los libros de IVA a través del SII y los contribuyentes de los territorios forales, que tienen sus propios sistemas (TicketBAI en País Vasco y el sistema propio de Navarra).',
  },
  {
    q: '¿Qué hago mientras tanto?',
    a: `Nada urgente. Puedes seguir facturando como hasta ahora y planificar el cambio con calma. Si quieres adelantarte, ${brandConfig.app.name} ya está adaptado a VeriFactu (declaración responsable del fabricante), así que cuando llegue la obligación no tendrás que cambiar de programa.`,
  },
  {
    q: '¿Cómo sé si mi programa de facturación está adaptado a VeriFactu?',
    a: 'La AEAT no homologa ni certifica programas. Cada fabricante debe emitir una declaración responsable en la que afirma que su software cumple el Reglamento. Pide a tu proveedor esa declaración: el programa debe generar el hash encadenado, el código QR y los registros de facturación que exige la norma.',
  },
  {
    q: '¿Las facturas emitidas antes del plazo necesitan ser actualizadas?',
    a: 'No. VeriFactu aplica únicamente a las facturas emitidas a partir de la fecha en que te sea obligatorio. Las facturas anteriores son válidas tal como están.',
  },
  {
    q: '¿VeriFactu aplica si solo facturo a particulares (B2C)?',
    a: 'Sí. VeriFactu no distingue entre facturas a empresas y a particulares: cuando sea obligatorio, cualquier factura emitida con un programa informático deberá generar sus registros de facturación.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  author: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    logo: { '@type': 'ImageObject', url: `${brandConfig.app.url}${brandConfig.logos.main}` },
  },
  citation: VERIFACTU_ANNOUNCED_DEADLINE.source.url,
  datePublished: '2025-04-15',
  dateModified: VERIFACTU_CALENDAR_UPDATED_AT.iso,
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'VeriFactu',
      item: `${brandConfig.app.url}/verifactu`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: '¿Cuándo es obligatorio?',
      item: PAGE_URL,
    },
  ],
};

const profiles = [
  {
    icon: Users,
    title: 'Autónomos',
    subtitle: 'Persona física que factura con programa informático',
    obligation: `Anunciado: ${VERIFACTU_ANNOUNCED_DEADLINE.label}`,
    note: 'Hacienda prevé que coincida con la factura electrónica obligatoria. Pendiente de BOE.',
    color: 'blue',
  },
  {
    icon: Building2,
    title: 'Sociedades (SL, SA y demás)',
    subtitle: 'Con facturación anual de hasta 8 millones de euros',
    obligation: `Anunciado: ${VERIFACTU_ANNOUNCED_DEADLINE.label}`,
    note: 'Mismo calendario que los autónomos según la nota de Hacienda. Pendiente de BOE.',
    color: 'indigo',
  },
  {
    icon: Shield,
    title: 'Asesorías y gestorías',
    subtitle: 'Que facturen en nombre de clientes',
    obligation: 'Según el plazo de cada cliente',
    note: 'El programa que uses para facturar por tus clientes debe estar adaptado cuando les sea obligatorio.',
    color: 'indigo',
  },
  {
    icon: CheckCircle2,
    title: 'No les aplica VeriFactu',
    subtitle: 'SII y territorios forales',
    obligation: 'Tienen su propio sistema',
    note: 'Quienes llevan los libros por el SII y los contribuyentes de País Vasco y Navarra.',
    color: 'green',
  },
];

function SourceLink() {
  return (
    <a
      href={VERIFACTU_ANNOUNCED_DEADLINE.source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold underline underline-offset-2 hover:text-blue-900"
    >
      {VERIFACTU_ANNOUNCED_DEADLINE.source.name}
    </a>
  );
}

function CuandoHero() {
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <PageBreadcrumb
          items={[
            { href: '/', label: 'Inicio' },
            { href: '/verifactu', label: 'VeriFactu' },
            { label: '¿Cuándo es obligatorio?' },
          ]}
          color="text-blue-700"
        />
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          <Clock className="h-4 w-4" />
          Actualizado el{' '}
          <time dateTime={VERIFACTU_CALENDAR_UPDATED_AT.iso}>
            {VERIFACTU_CALENDAR_UPDATED_AT.label}
          </time>
        </div>
        <h1 data-speakable className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          ¿Cuándo es obligatorio VeriFactu? Aplazado a 2028
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-slate-600">
          <strong>{VERIFACTU_ANNOUNCED_DEADLINE.summary}.</strong> El Ministerio de Hacienda
          aplazará las obligaciones de VeriFactu para empresas y autónomos hasta{' '}
          <strong>{VERIFACTU_ANNOUNCED_DEADLINE.label}</strong>, para que coincidan con la factura
          electrónica obligatoria. Tienes tiempo para planificarlo sin prisas.
        </p>
        <p className="mt-4 max-w-2xl text-sm text-slate-500">
          Fuente: <SourceLink />. Hasta que se publique en el BOE, el texto vigente (Real
          Decreto-ley 15/2025) mantiene el 1 de enero de 2027 para sociedades y el 1 de julio de
          2027 para el resto.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/precios"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-blue-700"
          >
            Ver precios
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ProfileCard({ profile }: { profile: (typeof profiles)[number] }) {
  const Icon = profile.icon;
  const isExempt = profile.color === 'green';
  const accent = isExempt
    ? { box: 'bg-green-100', icon: 'text-green-600' }
    : profile.color === 'indigo'
      ? { box: 'bg-indigo-50', icon: 'text-indigo-600' }
      : { box: 'bg-blue-50', icon: 'text-blue-600' };

  return (
    <div
      className={`rounded-2xl border p-6 ${
        isExempt ? 'border-green-100 bg-green-50' : 'border-neutral-100 bg-white'
      }`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className={`rounded-lg p-2 ${accent.box}`}>
          <Icon className={`h-5 w-5 ${accent.icon}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{profile.title}</p>
          <p className="text-xs text-slate-500">{profile.subtitle}</p>
        </div>
      </div>
      <p className={`mb-2 text-sm font-semibold ${isExempt ? 'text-green-700' : 'text-blue-700'}`}>
        {profile.obligation}
      </p>
      <p className="text-xs text-slate-500">{profile.note}</p>
    </div>
  );
}

function CuandoCta() {
  return (
    <section className="border-t bg-blue-600 py-14 md:py-16">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="mb-3 text-3xl font-bold text-white">Prepárate con calma</h2>
        <p className="mb-8 text-blue-100">
          {brandConfig.app.name} ya está adaptado a VeriFactu (declaración responsable del
          fabricante). Compara los planes y elige el que encaja con tu volumen de facturas.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/precios"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-blue-700 shadow transition hover:bg-blue-50"
          >
            <Sparkles className="h-5 w-5" />
            Ver precios y planes
          </Link>
          <Link
            href="/verifactu"
            className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white"
          >
            ¿Qué es VeriFactu? <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function NovafacturaVerifactuCuandoPage(): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
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
        <CuandoHero />

        <section className="pb-14 md:pb-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Calendario de implantación VeriFactu
            </h2>
            <VerifactuDeadlines />
          </div>
        </section>

        <section className="bg-slate-50 py-14 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              ¿A quién afecta VeriFactu y cuándo?
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {profiles.map((profile) => (
                <ProfileCard key={profile.title} profile={profile} />
              ))}
            </div>
          </div>
        </section>

        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre fechas y plazos de VeriFactu" />
        <CuandoCta />

        <RelatedLinksSection
          title="Más sobre VeriFactu"
          links={[
            {
              href: '/blog/como-saber-si-tu-software-cumple-con-verifactu',
              label: '¿Qué debe cumplir un software VeriFactu?',
            },
            { href: '/verifactu', label: 'Qué es VeriFactu' },
            { href: '/precios', label: 'Precios de los planes Básico y PRO' },
          ]}
        />

        <PricingGuideLink />

        <FooterLanding />
      </div>
    </>
  );
}

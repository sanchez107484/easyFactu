import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CalendarClock, Scale } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';
import { PricingGuideLink } from '@/components/marketing/pricing-guide-link';
import {
  VERIFACTU_ANNOUNCED_DEADLINE,
  VERIFACTU_CALENDAR_UPDATED_AT,
} from '@/lib/verifactu-deadlines';

const PAGE_TITLE = `Sanciones VeriFactu: qué dice la ley y cuándo se aplican | ${brandConfig.app.name}`;
const PAGE_DESCRIPTION =
  'Qué sanciones prevé el artículo 201 bis de la Ley General Tributaria para los sistemas de facturación, a quién afectan y por qué todavía no se aplican: Hacienda ha anunciado octubre de 2028.';
const PAGE_URL = `${brandConfig.app.url}/verifactu/sanciones`;
const LGT_URL = 'https://www.boe.es/buscar/act.php?id=BOE-A-2003-23186';

export const novafacturaVerifactuSancionesMetadata: Metadata = {
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

const lawSummary = [
  {
    who: 'Quien factura (autónomos y empresas)',
    rule: 'Tener un sistema de facturación que no cumpla los requisitos del Reglamento o que se haya alterado para ocultar operaciones, cuando el uso de un sistema adaptado ya sea obligatorio.',
    sanction: 'Multa fija de 50.000 € por ejercicio.',
  },
  {
    who: 'Fabricantes y comercializadores de software',
    rule: 'Producir o vender programas que permitan llevar contabilidades paralelas, alterar registros o que no cumplan los requisitos técnicos.',
    sanction: 'Multa de 150.000 € por ejercicio y tipo de programa.',
  },
];

const faqs = [
  {
    q: '¿Se aplican ya las sanciones de VeriFactu?',
    a: `No para quienes facturan. ${VERIFACTU_ANNOUNCED_DEADLINE.summary}: hasta que no sea obligatorio usar un sistema adaptado, no se puede sancionar por no usarlo. Mientras no se publique el aplazamiento en el BOE, el texto vigente mantiene el 1 de enero de 2027 para sociedades y el 1 de julio de 2027 para el resto.`,
  },
  {
    q: '¿Qué dice exactamente la ley?',
    a: 'El artículo 201 bis de la Ley General Tributaria, introducido por la Ley 11/2021, sanciona con una multa fija de 50.000 € por ejercicio la tenencia de sistemas de facturación que no cumplan los requisitos o que hayan sido alterados, y con 150.000 € por ejercicio y tipo de programa a quien los fabrique o comercialice.',
  },
  {
    q: '¿Me afecta si ya uso un programa de facturación?',
    a: 'Solo cuando la obligación entre en vigor, y solo si ese programa no está adaptado. Pide a tu proveedor la declaración responsable de VeriFactu: es el documento en el que el fabricante afirma que su software cumple el Reglamento.',
  },
  {
    q: '¿Hay sanciones si facturo con Excel o Word?',
    a: 'Hoy no por usar Excel o Word. Cuando VeriFactu sea obligatorio, quien facture con un programa informático tendrá que usar uno adaptado, así que conviene planificar el cambio con tiempo.',
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
  headline: 'Sanciones VeriFactu: qué dice la ley y cuándo se aplican',
  description: PAGE_DESCRIPTION,
  author: { '@type': 'Organization', name: brandConfig.app.name, url: brandConfig.app.url },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    logo: { '@type': 'ImageObject', url: `${brandConfig.app.url}${brandConfig.logos.main}` },
  },
  citation: [LGT_URL, VERIFACTU_ANNOUNCED_DEADLINE.source.url],
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
    { '@type': 'ListItem', position: 3, name: 'Sanciones', item: PAGE_URL },
  ],
};

function SancionesHero() {
  return (
    <section className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <PageBreadcrumb
          items={[
            { href: '/', label: 'Inicio' },
            { href: '/verifactu', label: 'VeriFactu' },
            { label: 'Sanciones' },
          ]}
          color="text-blue-700"
        />
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
          <CalendarClock className="h-4 w-4" />
          Actualizado el{' '}
          <time dateTime={VERIFACTU_CALENDAR_UPDATED_AT.iso}>
            {VERIFACTU_CALENDAR_UPDATED_AT.label}
          </time>
        </div>
        <h1 data-speakable className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Sanciones de VeriFactu: qué dice la ley y cuándo se aplican
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-relaxed text-slate-600">
          Las sanciones solo se aplican cuando es obligatorio usar un sistema adaptado.{' '}
          <strong>{VERIFACTU_ANNOUNCED_DEADLINE.summary}</strong> (
          <a
            href={VERIFACTU_ANNOUNCED_DEADLINE.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2"
          >
            fuente
          </a>
          ), así que tienes tiempo para prepararte sin prisas.
        </p>
      </div>
    </section>
  );
}

function LawSummarySection() {
  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-8 text-2xl font-bold text-slate-900">
          Lo que establece el artículo 201 bis de la Ley General Tributaria
        </h2>
        <div className="space-y-4">
          {lawSummary.map((item) => (
            <div key={item.who} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-2 flex items-center gap-2">
                <Scale className="h-4 w-4 text-slate-500" />
                <p className="font-semibold text-slate-900">{item.who}</p>
              </div>
              <p className="text-slate-600">{item.rule}</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">{item.sanction}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Fuente:{' '}
          <a href={LGT_URL} target="_blank" rel="noopener noreferrer" className="underline">
            Ley 58/2003, General Tributaria (BOE), artículo 201 bis
          </a>
          . Resumen informativo; no sustituye al asesoramiento fiscal.
        </p>
      </div>
    </section>
  );
}

function SancionesCta() {
  return (
    <section className="mx-6 rounded-2xl border border-blue-100 bg-blue-50 py-10 md:mx-auto md:max-w-4xl md:px-10">
      <div className="flex flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between md:px-0">
        <div>
          <p className="mb-1 font-bold text-slate-900">
            {brandConfig.app.name} ya está adaptado a VeriFactu
          </p>
          <p className="text-sm text-slate-600">
            Declaración responsable del fabricante. Compara los planes y elige sin prisas.
          </p>
        </div>
        <Link
          href="/precios"
          className="inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
        >
          Ver precios
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export function NovafacturaVerifactuSancionesPage(): React.JSX.Element {
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
        <SancionesHero />
        <LawSummarySection />
        <SancionesCta />
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre las sanciones de VeriFactu" />
        <RelatedLinksSection
          title="Más sobre VeriFactu"
          links={[
            { href: '/verifactu', label: '¿Qué es VeriFactu?' },
            {
              href: '/verifactu/cuando-es-obligatorio',
              label: '¿Cuándo es obligatorio VeriFactu?',
            },
            {
              href: '/blog/como-saber-si-tu-software-cumple-con-verifactu',
              label: '¿Qué debe cumplir un software VeriFactu?',
            },
            { href: '/precios', label: 'Precios de los planes Básico y PRO' },
          ]}
        />
        <PricingGuideLink />
        <FooterLanding />
      </div>
    </>
  );
}

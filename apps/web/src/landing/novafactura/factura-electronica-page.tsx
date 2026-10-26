import type { Metadata } from 'next';
import { BookOpen, Calendar } from 'lucide-react';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { brandConfig } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';
import { PricingGuideLink } from '@/components/marketing/pricing-guide-link';
import { EInvoiceImpactQuiz } from '@/components/marketing/e-invoice-impact-quiz';
import {
  VERIFACTU_ANNOUNCED_DEADLINE,
  VERIFACTU_CALENDAR_UPDATED_AT,
} from '@/lib/verifactu-deadlines';
import {
  DifferencesTable,
  eInvoiceRelatedLinks,
  FormatsGrid,
  SubpageCards,
} from './factura-electronica-sections';

const PAGE_PATH = '/factura-electronica';
const PAGE_URL = `${brandConfig.app.url}${PAGE_PATH}`;
const PAGE_TITLE = 'Factura electrónica en España: qué es, ejemplos y fechas';
const PAGE_DESCRIPTION = `Qué es la factura electrónica, en qué se diferencia de un PDF y de VeriFactu, ejemplos y calendario: ${VERIFACTU_ANNOUNCED_DEADLINE.label} para empresas de menos de 8 M€. Test para saber si te afecta.`;

const DEFINITION =
  'La factura electrónica es una factura que se emite, se envía y se recibe en un formato estructurado, como Facturae (XML) o UBL, que los programas leen automáticamente. Tiene la misma validez que el papel. Un PDF enviado por email es una factura digital, pero no una factura electrónica según la Ley Crea y Crece.';

export const novafacturaFacturaElectronicaMetadata: Metadata = {
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

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  author: { '@type': 'Organization', name: brandConfig.app.name, url: brandConfig.app.url },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    logo: { '@type': 'ImageObject', url: `${brandConfig.app.url}${brandConfig.logos.main}` },
  },
  datePublished: '2025-01-15',
  dateModified: VERIFACTU_CALENDAR_UPDATED_AT.iso,
  mainEntityOfPage: { '@type': 'WebPage', '@id': PAGE_URL },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    { '@type': 'ListItem', position: 2, name: 'Factura electrónica', item: PAGE_URL },
  ],
};

const CALENDAR = [
  {
    when: 'Desde 2015',
    who: 'Facturas a la Administración pública',
    what: 'Obligatoria en formato Facturae, enviada por FACe o el punto de entrada de cada administración.',
  },
  {
    when: 'Primero',
    who: 'Empresas que facturan más de 8 M€',
    what: 'Serán las primeras obligadas, según el calendario del reglamento de factura electrónica.',
  },
  {
    when: `${VERIFACTU_ANNOUNCED_DEADLINE.label} (anunciado)`,
    who: 'Empresas y autónomos que facturan hasta 8 M€',
    what: 'Factura electrónica B2B obligatoria, en la misma fecha que VeriFactu. Pendiente de BOE.',
  },
];

const faqs = [
  { q: '¿Qué es la factura electrónica?', a: DEFINITION },
  {
    q: '¿Cuándo es obligatoria la factura electrónica?',
    a: `Para las facturas a la Administración, desde 2015. Entre empresas y autónomos que facturan hasta 8 millones de euros, Hacienda ha anunciado ${VERIFACTU_ANNOUNCED_DEADLINE.label}, la misma fecha que VeriFactu (pendiente de BOE). Las empresas que facturan más irán antes.`,
  },
  {
    q: '¿La factura electrónica es lo mismo que un PDF enviado por email?',
    a: 'No. Un PDF es una factura digital, pero no es factura electrónica en el sentido de la Ley Crea y Crece, que exige un formato estructurado como Facturae (XML) o UBL para que los programas la procesen sin intervención humana.',
  },
  {
    q: '¿Cuál es la diferencia entre factura electrónica y VeriFactu?',
    a: 'Son dos obligaciones distintas. VeriFactu (Ley Antifraude) exige que el programa de facturación genere registros con hash encadenado y un QR en cada factura, también en las de papel o PDF. La factura electrónica (Ley Crea y Crece) obliga a enviar las facturas entre empresas en formato estructurado. Tendrás que cumplir las dos.',
  },
  {
    q: '¿La factura electrónica es obligatoria si facturo a particulares?',
    a: 'No. La obligación se limita a las facturas entre empresas y profesionales (B2B). VeriFactu, en cambio, sí aplica a todas tus facturas, sean a empresas o a particulares.',
  },
  {
    q: `¿${brandConfig.app.name} cumple con la factura electrónica y VeriFactu?`,
    a: `${brandConfig.app.name} ya está adaptado a VeriFactu (hash encadenado, QR y envío a la AEAT). La emisión en formato estructurado para la factura electrónica B2B se activará cuando el reglamento sea definitivo, sin que tengas que cambiar de programa.`,
  },
];

export function NovafacturaFacturaElectronicaPage(): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />

        <section className="bg-gradient-to-b from-emerald-50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <PageBreadcrumb
              items={[{ href: '/', label: 'Inicio' }, { label: 'Factura electrónica' }]}
              color="text-emerald-700"
              mb="mb-6"
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <BookOpen className="h-4 w-4" />
              Actualizado el{' '}
              <time dateTime={VERIFACTU_CALENDAR_UPDATED_AT.iso}>
                {VERIFACTU_CALENDAR_UPDATED_AT.label}
              </time>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Factura electrónica en España: qué es, ejemplos y fechas
            </h1>
            <p data-speakable className="mt-6 max-w-2xl text-xl leading-relaxed text-slate-600">
              {DEFINITION}
            </p>
          </div>
        </section>

        <section id="calendario" className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Calendario de la factura electrónica
            </h2>
            <ol className="space-y-4">
              {CALENDAR.map((step) => (
                <li key={step.who} className="flex gap-4 rounded-xl border border-slate-100 p-5">
                  <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      {step.when}
                    </p>
                    <p className="font-semibold text-slate-900">{step.who}</p>
                    <p className="text-sm text-slate-600">{step.what}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-slate-500">
              Fuente:{' '}
              <a
                href={VERIFACTU_ANNOUNCED_DEADLINE.source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-slate-800"
              >
                {VERIFACTU_ANNOUNCED_DEADLINE.source.name}
              </a>{' '}
              y Ley 18/2022, de 28 de septiembre (Crea y Crece), artículo 12.
            </p>
          </div>
        </section>

        <section id="test" className="bg-slate-50 py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="mb-2 text-2xl font-bold text-slate-900">¿Te afecta y cuándo?</h2>
            <p className="mb-6 text-slate-600">Responde dos preguntas y te decimos tu fecha.</p>
            <EInvoiceImpactQuiz />
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">Ejemplos y formato Facturae</h2>
            <p className="mb-6 text-slate-600">
              Mira la misma factura en PDF y en XML, y qué es exactamente Facturae:
            </p>
            <SubpageCards />

            <h2 className="mb-4 mt-12 text-2xl font-bold text-slate-900">
              Factura electrónica vs. VeriFactu: son cosas distintas
            </h2>
            <DifferencesTable />

            <h2 className="mb-4 mt-12 text-2xl font-bold text-slate-900">
              Formatos de factura electrónica en España
            </h2>
            <FormatsGrid />
          </div>
        </section>

        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre la factura electrónica" />

        <RelatedLinksSection
          title="Más sobre factura electrónica"
          links={eInvoiceRelatedLinks(PAGE_PATH)}
        />

        <PricingGuideLink />
        <FooterLanding />
      </div>
    </>
  );
}

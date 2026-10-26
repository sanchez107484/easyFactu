import type { Metadata } from 'next';
import { CheckCircle2, ExternalLink, FileCode2 } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import SiteHeader from '@/components/site-header';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';
import CtaDarkSection from '@/components/CtaDarkSection';
import { PricingGuideLink } from '@/components/marketing/pricing-guide-link';
import { VERIFACTU_ANNOUNCED_DEADLINE } from '@/lib/verifactu-deadlines';
import { eInvoiceRelatedLinks } from './factura-electronica-sections';

const PAGE_PATH = '/factura-electronica/facturae';
const PAGE_URL = `${brandConfig.app.url}${PAGE_PATH}`;
const PAGE_TITLE = '¿Qué es Facturae? El formato de factura electrónica en España';
const PAGE_DESCRIPTION =
  'Facturae es el formato XML oficial de factura electrónica en España. Qué contiene, versión 3.2.2, firma electrónica, envío por FACe, códigos DIR3 y cómo generar una factura Facturae.';

const DEFINITION =
  'Facturae es el formato oficial de factura electrónica en España: un archivo XML con una estructura fija, definida por el Ministerio de Hacienda, que incluye los datos de la factura y una firma electrónica. Es obligatorio en las facturas a la Administración desde 2015 y uno de los formatos válidos para la factura electrónica entre empresas.';

export const novafacturaFacturaeMetadata: Metadata = {
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
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Factura electrónica',
      item: `${brandConfig.app.url}/factura-electronica`,
    },
    { '@type': 'ListItem', position: 3, name: 'Facturae', item: PAGE_URL },
  ],
};

const XML_PARTS = [
  {
    name: 'FileHeader',
    text: 'Versión del formato (3.2.2), modalidad y número de facturas del lote.',
  },
  { name: 'Parties', text: 'Emisor (SellerParty) y receptor (BuyerParty) con su NIF y dirección.' },
  { name: 'Invoices', text: 'Número, serie, fechas, líneas, impuestos (IVA, IRPF) y totales.' },
  { name: 'Signature', text: 'Firma electrónica XAdES que garantiza autoría e integridad.' },
];

const PUBLIC_SECTOR_REQUIREMENTS = [
  'Formato Facturae 3.2.x firmado electrónicamente (XAdES) con un certificado reconocido.',
  'Los tres códigos DIR3 del destinatario: oficina contable, órgano gestor y unidad tramitadora.',
  'Envío por FACe (Administración General del Estado y entidades adheridas) o por el punto de entrada de la comunidad autónoma o el ayuntamiento.',
  'Las administraciones pueden excluir de la obligación las facturas de hasta 5.000 € (Ley 25/2013, artículo 4).',
];

const faqs = [
  { q: '¿Qué es Facturae?', a: DEFINITION },
  {
    q: '¿Qué versión de Facturae se usa?',
    a: 'La versión vigente y más usada es la 3.2.2. La 3.2.1 sigue aceptada en muchos puntos de entrada. Comprueba siempre qué versión admite la administración o el cliente al que facturas.',
  },
  {
    q: '¿Es obligatorio Facturae para facturar a empresas?',
    a: `Todavía no. Con la Ley Crea y Crece, las facturas entre empresas y autónomos tendrán que ser electrónicas en un formato estructurado; Facturae será uno de los válidos junto a UBL, CII o EDIFACT. Para quienes facturan hasta 8 M€, Hacienda ha anunciado ${VERIFACTU_ANNOUNCED_DEADLINE.label}.`,
  },
  {
    q: '¿Cómo genero una factura en Facturae gratis?',
    a: 'El Ministerio de Hacienda ofrece una aplicación gratuita de escritorio en facturae.gob.es para crear y firmar facturas Facturae. También puedes usar un programa de facturación que exporte a Facturae.',
  },
  {
    q: '¿Qué son los códigos DIR3?',
    a: 'Son los códigos del Directorio Común de unidades de la Administración. Toda factura electrónica a la Administración debe indicar tres: la oficina contable, el órgano gestor y la unidad tramitadora. Te los facilita la administración que te encarga el trabajo.',
  },
];

export function NovafacturaFacturaePage(): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />

        <section className="bg-gradient-to-b from-emerald-50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <PageBreadcrumb
              items={[
                { href: '/', label: 'Inicio' },
                { href: '/factura-electronica', label: 'Factura electrónica' },
                { label: 'Facturae' },
              ]}
              color="text-emerald-700"
              mb="mb-6"
            />
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              ¿Qué es Facturae?
            </h1>
            <p data-speakable className="mt-6 max-w-2xl text-xl leading-relaxed text-slate-600">
              {DEFINITION}
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Qué contiene un archivo Facturae
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {XML_PARTS.map((part) => (
                <div key={part.name} className="rounded-xl border border-slate-100 p-5">
                  <p className="flex items-center gap-2 font-mono text-sm font-bold text-emerald-700">
                    <FileCode2 className="h-4 w-4" />
                    {part.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{part.text}</p>
                </div>
              ))}
            </div>

            <h2 className="mb-6 mt-12 text-2xl font-bold text-slate-900">
              Facturae en las facturas a la Administración
            </h2>
            <ul className="space-y-3">
              {PUBLIC_SECTOR_REQUIREMENTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                { href: 'https://www.facturae.gob.es/', label: 'Portal oficial Facturae' },
                { href: 'https://face.gob.es/', label: 'FACe — Punto General de Entrada' },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                >
                  {link.label}
                  <ExternalLink className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </section>

        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre Facturae" />

        <RelatedLinksSection
          title="Más sobre factura electrónica"
          links={eInvoiceRelatedLinks(PAGE_PATH)}
        />

        <CtaDarkSection
          title="Prepárate con tiempo para la factura electrónica"
          description={`${brandConfig.app.name} ya cumple VeriFactu y es gratis hasta 2027. Empieza hoy y llega a ${VERIFACTU_ANNOUNCED_DEADLINE.label} sin prisas.`}
          ctaText="Empieza ya gratis"
        />

        <PricingGuideLink />
        <FooterLanding />
      </div>
    </>
  );
}

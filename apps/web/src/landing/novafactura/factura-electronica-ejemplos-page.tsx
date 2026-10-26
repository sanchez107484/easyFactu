import type { Metadata } from 'next';
import { brandConfig } from '@easyfactura/brand-config';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import SiteHeader from '@/components/site-header';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';
import CtaDarkSection from '@/components/CtaDarkSection';
import { PricingGuideLink } from '@/components/marketing/pricing-guide-link';
import { eInvoiceRelatedLinks } from './factura-electronica-sections';

const PAGE_PATH = '/factura-electronica/ejemplos';
const PAGE_URL = `${brandConfig.app.url}${PAGE_PATH}`;
const PAGE_TITLE = 'Ejemplos de factura electrónica: PDF frente a XML Facturae';
const PAGE_DESCRIPTION =
  'Ejemplo de la misma factura en PDF y en XML Facturae, con IVA e IRPF, y ejemplo de factura electrónica a un ayuntamiento con códigos DIR3. Qué formato vale en cada caso.';

export const novafacturaFacturaElectronicaEjemplosMetadata: Metadata = {
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
    { '@type': 'ListItem', position: 3, name: 'Ejemplos', item: PAGE_URL },
  ],
};

const PDF_ROWS = [
  ['Factura', 'A-2026-0042 · 20/10/2026'],
  ['Emisor', 'Ana Ejemplo López · NIF 12345678Z'],
  ['Cliente', 'Ejemplo Servicios, S.L. · NIF B00000000'],
  ['Concepto', 'Consultoría de marketing (octubre)'],
  ['Base imponible', '1.000,00 €'],
  ['IVA 21 %', '210,00 €'],
  ['Retención IRPF 15 %', '−150,00 €'],
  ['Total', '1.060,00 €'],
];

// Simplified on purpose: real files carry full addresses, lines and the XAdES signature.
const FACTURAE_XML = `<fe:Facturae xmlns:fe="http://www.facturae.gob.es/formato/Versiones/Facturaev3_2_2.xml">
  <FileHeader>
    <SchemaVersion>3.2.2</SchemaVersion>
    <Modality>I</Modality>
    <InvoiceIssuerType>EM</InvoiceIssuerType>
  </FileHeader>
  <Parties>
    <SellerParty><TaxIdentification><TaxIdentificationNumber>12345678Z</TaxIdentificationNumber></TaxIdentification></SellerParty>
    <BuyerParty><TaxIdentification><TaxIdentificationNumber>B00000000</TaxIdentificationNumber></TaxIdentification></BuyerParty>
  </Parties>
  <Invoices>
    <Invoice>
      <InvoiceHeader>
        <InvoiceNumber>0042</InvoiceNumber>
        <InvoiceSeriesCode>A-2026</InvoiceSeriesCode>
        <InvoiceDocumentType>FC</InvoiceDocumentType>
      </InvoiceHeader>
      <InvoiceIssueData><IssueDate>2026-10-20</IssueDate></InvoiceIssueData>
      <TaxesOutputs>
        <Tax><TaxTypeCode>01</TaxTypeCode><TaxRate>21.00</TaxRate>
          <TaxableBase><TotalAmount>1000.00</TotalAmount></TaxableBase>
          <TaxAmount><TotalAmount>210.00</TotalAmount></TaxAmount></Tax>
      </TaxesOutputs>
      <TaxesWithheld>
        <Tax><TaxTypeCode>04</TaxTypeCode><TaxRate>15.00</TaxRate>
          <TaxAmount><TotalAmount>150.00</TotalAmount></TaxAmount></Tax>
      </TaxesWithheld>
      <InvoiceTotals>
        <TotalGrossAmountBeforeTaxes>1000.00</TotalGrossAmountBeforeTaxes>
        <TotalTaxOutputs>210.00</TotalTaxOutputs>
        <TotalTaxesWithheld>150.00</TotalTaxesWithheld>
        <InvoiceTotal>1060.00</InvoiceTotal>
      </InvoiceTotals>
    </Invoice>
  </Invoices>
  <ds:Signature><!-- firma XAdES --></ds:Signature>
</fe:Facturae>`;

const COMPARISON = [
  { aspect: 'Quién la lee', pdf: 'Una persona', xml: 'Un programa, sin teclear nada' },
  { aspect: 'Válida hoy entre empresas', pdf: 'Sí', xml: 'Sí' },
  { aspect: 'Válida para la Administración', pdf: 'No', xml: 'Sí, firmada y con códigos DIR3' },
  { aspect: 'Factura electrónica B2B obligatoria', pdf: 'No', xml: 'Sí (formato estructurado)' },
];

const faqs = [
  {
    q: '¿Un PDF es una factura electrónica?',
    a: 'Es una factura digital válida hoy, pero no una factura electrónica a efectos de la Ley Crea y Crece, que exige un formato estructurado como Facturae (XML) o UBL.',
  },
  {
    q: '¿Qué datos lleva una factura electrónica?',
    a: 'Los mismos que cualquier factura: número y serie, fecha, datos y NIF de emisor y receptor, descripción, base imponible, tipos y cuotas de IVA, retenciones y total. En Facturae van en etiquetas XML y con firma electrónica.',
  },
  {
    q: '¿Qué tiene de especial una factura electrónica a un ayuntamiento?',
    a: 'Debe ir en Facturae firmado e incluir los tres códigos DIR3 del ayuntamiento (oficina contable, órgano gestor y unidad tramitadora), y se presenta en FACe o en el punto de entrada que use ese ayuntamiento.',
  },
];

export function NovafacturaFacturaElectronicaEjemplosPage(): React.JSX.Element {
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
                { label: 'Ejemplos' },
              ]}
              color="text-emerald-700"
              mb="mb-6"
            />
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Ejemplos de factura electrónica: PDF frente a XML
            </h1>
            <p data-speakable className="mt-6 max-w-2xl text-xl leading-relaxed text-slate-600">
              La misma factura puede ser un PDF, pensado para leerlo una persona, o un XML Facturae,
              pensado para que lo procese un programa. Solo el segundo es factura electrónica en el
              sentido de la Ley Crea y Crece. Datos ficticios.
            </p>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="mx-auto grid max-w-5xl gap-6 px-6 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Ejemplo 1: la factura en PDF
              </h2>
              <dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 text-sm">
                {PDF_ROWS.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 px-5 py-2.5">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right font-medium text-slate-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h2 className="mb-4 text-xl font-bold text-slate-900">
                Ejemplo 2: la misma factura en XML Facturae
              </h2>
              <pre className="max-h-[420px] overflow-auto rounded-2xl bg-slate-900 p-5 text-xs leading-relaxed text-emerald-200">
                <code>{FACTURAE_XML}</code>
              </pre>
              <p className="mt-2 text-xs text-slate-500">
                Fragmento simplificado: un archivo real incluye direcciones, líneas de detalle y la
                firma XAdES completa.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-slate-50 py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              PDF o XML: cuándo vale cada uno
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th scope="col" className="px-5 py-3 text-left font-semibold">
                      Aspecto
                    </th>
                    <th scope="col" className="px-5 py-3 text-left font-semibold">
                      PDF
                    </th>
                    <th scope="col" className="px-5 py-3 text-left font-semibold">
                      XML Facturae
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMPARISON.map((row) => (
                    <tr key={row.aspect}>
                      <th scope="row" className="px-5 py-3 text-left font-medium text-slate-700">
                        {row.aspect}
                      </th>
                      <td className="px-5 py-3 text-slate-600">{row.pdf}</td>
                      <td className="px-5 py-3 text-slate-600">{row.xml}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <h2 className="mb-3 mt-12 text-2xl font-bold text-slate-900">
              Ejemplo 3: factura electrónica a un ayuntamiento
            </h2>
            <p className="text-slate-600">
              Igual que el ejemplo 2, pero el receptor es la Administración: además del NIF del
              ayuntamiento, el XML incluye sus tres códigos DIR3 (oficina contable, órgano gestor y
              unidad tramitadora, con formato tipo <code className="font-mono">L01000000</code>), va
              firmado con certificado y se presenta en FACe o en el punto de entrada del
              ayuntamiento.
            </p>
          </div>
        </section>

        <FaqSection
          faqs={faqs}
          title="Preguntas frecuentes sobre ejemplos de factura electrónica"
        />

        <RelatedLinksSection
          title="Más sobre factura electrónica"
          links={eInvoiceRelatedLinks(PAGE_PATH)}
        />

        <CtaDarkSection
          title="Factura bien desde hoy"
          description={`Crea facturas con todos los datos obligatorios y VeriFactu incluido. ${brandConfig.app.name} es gratis hasta 2027.`}
          ctaText="Empieza ya gratis"
        />

        <PricingGuideLink />
        <FooterLanding />
      </div>
    </>
  );
}

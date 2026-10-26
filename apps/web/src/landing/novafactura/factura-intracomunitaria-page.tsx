import type { Metadata } from 'next';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import CtaDarkSection from '@/components/CtaDarkSection';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import SiteHeader from '@/components/site-header';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';
import { PricingGuideLink } from '@/components/marketing/pricing-guide-link';
import {
  InvoiceExamplesSection,
  LegalMentionsSection,
  NifViesSection,
  TemplateDownloadSection,
  VIES_URL,
} from './factura-intracomunitaria-sections';

const PAGE_TITLE = 'Factura intracomunitaria: modelo, ejemplos y plantilla gratis';
const PAGE_DESCRIPTION =
  'Modelo de factura intracomunitaria en Excel, Word y PDF, ejemplos de bienes y servicios con y sin IVA, la coletilla de inversión del sujeto pasivo lista para copiar y cómo validar el NIF en VIES.';
const PAGE_URL = `${brandConfig.app.url}/facturas/intracomunitaria`;

export const novafacturaFacturaIntracomunitariaMetadata: Metadata = {
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
  dateModified: '2026-10-26',
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    { '@type': 'ListItem', position: 2, name: 'Facturas', item: `${brandConfig.app.url}/facturas` },
    { '@type': 'ListItem', position: 3, name: 'Factura intracomunitaria', item: PAGE_URL },
  ],
};

const steps = [
  {
    num: '1',
    title: 'Date de alta en el ROI (Registro de Operadores Intracomunitarios)',
    desc: 'Antes de emitir tu primera factura intracomunitaria, debes estar dado de alta en el ROI. Se solicita con el modelo 036, marcando la casilla de operador intracomunitario. Tu NIF-IVA será ES + tu NIF (ej: ES12345678Z).',
  },
  {
    num: '2',
    title: 'Verifica el NIF-IVA de tu cliente en el VIES',
    desc: `Antes de emitir la factura, comprueba que el número de IVA europeo de tu cliente es válido en el VIES (${VIES_URL}). Guarda el justificante de la consulta como evidencia.`,
  },
  {
    num: '3',
    title: 'Emite la factura sin IVA y con la mención legal',
    desc: 'La cuota de IVA es 0 € y el total coincide con la base imponible. Añade la mención que corresponda: entrega intracomunitaria exenta (bienes) o inversión del sujeto pasivo (servicios). Las tienes abajo para copiar.',
  },
  {
    num: '4',
    title: 'Declara la operación en el modelo 349',
    desc: 'Cada trimestre (o mensualmente si superas ciertos volúmenes) debes declarar las operaciones intracomunitarias en el modelo 349. También afecta al modelo 303 de IVA (sin cuota de IVA pero sí con base imponible).',
  },
];

const requiredFields = [
  'Tu NIF-IVA intracomunitario (formato ES + tu NIF)',
  'NIF-IVA intracomunitario del cliente (verificado en VIES)',
  'Cuota de IVA: 0,00 €',
  'Mención legal: entrega exenta (bienes) o inversión del sujeto pasivo (servicios)',
  'Total: igual a la base imponible (sin IVA)',
  'Todos los datos estándar de cualquier factura (número, fecha, descripción...)',
];

const faqs = [
  {
    q: '¿Siempre se factura sin IVA a empresas de otro país de la UE?',
    a: 'No necesariamente. La exención de IVA en operaciones intracomunitarias B2B requiere que se cumplan todas estas condiciones: ambas partes deben estar dadas de alta en el ROI (Registro de Operadores Intracomunitarios), el NIF europeo del cliente debe ser válido y estar verificado en el VIES en el momento de emitir la factura, y — para entregas de bienes — debe existir prueba de que los bienes han sido transportados a otro Estado miembro.',
  },
  {
    q: '¿Qué pasa si no verifico el VIES y el NIF intracomunitario del cliente no es válido?',
    a: 'Si emites una factura sin IVA a un cliente cuyo NIF europeo no es válido en el VIES, la AEAT puede considerar que la exención no procede y exigirte el IVA no repercutido. Como el cliente ya pagó sin IVA, tendrías que asumir tú la cuota. Por eso es imprescindible verificar el VIES antes de cada factura, guardar una captura de pantalla con la fecha como evidencia y conservarla junto a la factura.',
  },
  {
    q: '¿Qué es el ROI y cómo me doy de alta?',
    a: 'El ROI (Registro de Operadores Intracomunitarios) es el censo de la AEAT para empresas que realizan operaciones con países de la UE. Para darte de alta presentas el modelo 036 marcando la casilla de operador intracomunitario. El trámite es gratuito y se resuelve en pocos días hábiles. Sin estar en el ROI no puedes aplicar la exención de IVA intracomunitaria, aunque el cliente sí esté en el VIES.',
  },
  {
    q: '¿Qué es el modelo 349 y cuándo tengo que presentarlo?',
    a: 'Es la Declaración Recapitulativa de Operaciones Intracomunitarias, donde se declaran todas las entregas y adquisiciones con empresas de la UE. Se presenta mensualmente si superas 50.000€ por trimestre, trimestralmente si superas 35.000€ anuales, o anualmente si no alcanzas ese umbral. Incluye el NIF europeo del cliente o proveedor, el país, el tipo de operación y el importe total del periodo. El plazo de presentación es el día 25 del mes siguiente al periodo.',
  },
  {
    q: '¿Qué diferencia hay entre operación intracomunitaria y exportación?',
    a: 'La diferencia principal es geográfica: la operación intracomunitaria es entre países miembros de la Unión Europea; la exportación es a países fuera de la UE (EE.UU., Reino Unido tras el Brexit, etc.). En ambos casos el IVA es 0% para el emisor español, pero los procedimientos son distintos: las exportaciones requieren documento aduanero de exportación (DUA) y se declaran en el modelo 303 con código específico, no en el modelo 349.',
  },
  {
    q: '¿Cómo tributa si el cliente de la UE es un particular (B2C)?',
    a: 'Si el cliente es una persona física sin NIF europeo de operador (consumidor final), no aplica la exención intracomunitaria. Para servicios a particulares de la UE, desde 2021 existe el sistema OSS (One Stop Shop): si tus ventas B2C intracomunitarias superan 10.000€ anuales al conjunto de países de la UE, debes registrarte en OSS y repercutir el IVA del país del destinatario. Por debajo de ese umbral, puedes aplicar el IVA español.',
  },
  {
    q: '¿Qué evidencia debo conservar de una operación intracomunitaria?',
    a: 'Debes conservar: la factura emitida, la validación VIES del NIF del cliente con fecha y resultado (captura de pantalla o PDF), el contrato o pedido, y el documento de transporte que acredite que los bienes han llegado al otro Estado miembro (albarán, carta de porte CMR, seguimiento logístico). Sin esta documentación, la AEAT puede impugnar la exención en caso de inspección.',
  },
];

function StepsSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-10 text-2xl font-bold text-slate-900">
          Cómo emitir una factura intracomunitaria: 4 pasos
        </h2>
        <div className="space-y-8">
          {steps.map((step) => (
            <div key={step.num} className="flex gap-5">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {step.num}
              </div>
              <div className="flex-1 pt-0.5">
                <h3 className="mb-2 font-bold text-slate-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RequiredFieldsSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-8 text-2xl font-bold text-slate-900">
          Datos específicos de la factura intracomunitaria
        </h2>
        <div className="space-y-2">
          {requiredFields.map((field) => (
            <div
              key={field}
              className="flex items-start gap-3 rounded-lg border border-neutral-100 bg-white px-4 py-3"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
              <p className="text-sm text-slate-700">{field}</p>
            </div>
          ))}
        </div>
        <LegalMentionsSection />
      </div>
    </section>
  );
}

export function NovafacturaFacturaIntracomunitariaPage(): React.JSX.Element {
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

        {/* Hero */}
        <section className="bg-gradient-to-b from-indigo-50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <PageBreadcrumb
              items={[
                { href: '/', label: 'Inicio' },
                { href: '/facturas', label: 'Facturas' },
                { label: 'Factura intracomunitaria' },
              ]}
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
              <BookOpen className="h-4 w-4" />
              Clientes UE · Modelo gratis en Excel, Word y PDF
            </div>
            <h1
              data-speakable
              className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
            >
              Factura intracomunitaria: modelo, ejemplos y plantilla gratis
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-slate-600">
              Si vendes o prestas servicios a una empresa de otro país de la UE con NIF-IVA válido,
              la factura va sin IVA y con una mención legal obligatoria. Aquí tienes el modelo listo
              para usar, ejemplos y la coletilla para copiar.
            </p>
          </div>
        </section>

        <TemplateDownloadSection />
        <InvoiceExamplesSection />
        <NifViesSection />
        <StepsSection />
        <RequiredFieldsSection />

        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre la factura intracomunitaria" />

        <RelatedLinksSection
          title="Guías relacionadas"
          links={[
            { href: '/facturas/como-hacer-una-factura', label: 'Cómo hacer una factura completa' },
            { href: '/facturas/con-irpf', label: 'Factura con IRPF — para clientes nacionales' },
            { href: '/factura-electronica', label: 'Factura electrónica' },
            { href: '/facturas', label: 'Todos los tipos de facturas' },
            { href: '/facturacion-online', label: 'Programa de facturación online para autónomos' },
          ]}
        />

        <CtaDarkSection
          title={`${brandConfig.app.name} pone la mención legal por ti`}
          description="Elige un cliente intracomunitario y la factura incluye sola la mención de entrega exenta o de inversión del sujeto pasivo. Gratis hasta 2027."
          ctaText="Crear mi factura gratis"
        />

        <PricingGuideLink />
        <FooterLanding />
      </div>
    </>
  );
}

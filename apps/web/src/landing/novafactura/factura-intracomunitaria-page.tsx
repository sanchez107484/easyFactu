import type { Metadata } from 'next';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import CtaDarkSection from '@/components/CtaDarkSection';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import SiteHeader from '@/components/site-header';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';

export const novafacturaFacturaIntracomunitariaMetadata: Metadata = {
  title: `Factura intracomunitaria — Cómo facturar a empresas de la UE 2026 | ${brandConfig.app.name}`,
  description:
    'Guía sobre la factura intracomunitaria: IVA 0%, requisito VIES/ROI, inversión del sujeto pasivo, modelo 349 y cómo rellenar la factura correctamente para clientes de la UE.',
  keywords: [
    'factura intracomunitaria',
    'factura intracomunitaria iva 0',
    'como facturar a empresa europea',
    'factura empresa ue sin iva',
    'inversión del sujeto pasivo iva',
    'modelo 349 operaciones intracomunitarias',
    'roi registro operadores intracomunitarios',
    'vies verificar nif europeo',
    'como hacer factura intracomunitaria',
    'exencion iva factura ue',
  ],
  alternates: { canonical: `${brandConfig.app.url}/facturas/intracomunitaria` },
  openGraph: {
    title: `Factura intracomunitaria — IVA 0% para clientes UE | ${brandConfig.app.name}`,
    description:
      'Cómo facturar a una empresa de otro país de la UE: exención de IVA, VIES, ROI y modelo 349.',
    url: `${brandConfig.app.url}/facturas/intracomunitaria`,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: `Factura intracomunitaria — IVA 0% para clientes UE | ${brandConfig.app.name}`,
    description:
      'Cómo facturar a una empresa de otro país de la UE: exención de IVA, VIES, ROI y modelo 349.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Factura intracomunitaria — Cómo facturar a empresas de la UE',
  description: 'Guía completa sobre la factura intracomunitaria: IVA 0%, ROI, VIES y modelo 349.',
  author: { '@type': 'Organization', name: brandConfig.app.name, url: brandConfig.app.url },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    logo: { '@type': 'ImageObject', url: `${brandConfig.app.url}${brandConfig.logos.main}` },
  },
  datePublished: '2025-01-15',
  dateModified: '2026-05-19',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Siempre se factura sin IVA a empresas de la UE?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. La exención de IVA (IVA 0%) solo aplica si tanto el emisor como el receptor están dados de alta en el Registro de Operadores Intracomunitarios (ROI) y el número de IVA europeo del receptor está validado en el censo VIES. Si el receptor es un particular (consumidor final) en otro país de la UE, se aplican reglas de OSS y puede que tengas que aplicar el IVA del país del receptor.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué es el VIES y cómo verifico el NIF europeo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El VIES (VAT Information Exchange System) es el sistema de verificación del número de IVA intracomunitario. Puedes verificar cualquier NIF europeo en ec.europa.eu/taxation_customs/vies. Si la validación devuelve "válido", puedes emitir la factura sin IVA.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué es el modelo 349?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El modelo 349 es la declaración recapitulativa de operaciones intracomunitarias que hay que presentar ante la AEAT. Se presenta mensual, trimestral o anualmente según el volumen de operaciones. Incluye todas las entregas y adquisiciones de bienes y servicios con empresas de otros países de la UE.',
      },
    },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    { '@type': 'ListItem', position: 2, name: 'Facturas', item: `${brandConfig.app.url}/facturas` },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Factura intracomunitaria',
      item: `${brandConfig.app.url}/facturas/intracomunitaria`,
    },
  ],
};

const steps = [
  {
    num: '1',
    title: 'Date de alta en el ROI (Registro de Operadores Intracomunitarios)',
    desc: 'Antes de emitir tu primera factura intracomunitaria, debes estar dado de alta en el ROI. Se solicita con el modelo 036, marcando la casilla de operador intracomunitario. El NIF-IVA que te asignarán tendrá el formato ES + tu NIF (ej: ES12345678Z).',
  },
  {
    num: '2',
    title: 'Verifica el NIF-IVA de tu cliente en el VIES',
    desc: 'Antes de emitir la factura, verifica que el número de IVA europeo de tu cliente es válido en el VIES (ec.europa.eu/taxation_customs/vies). Guarda la captura o el PDF de la validación como evidencia.',
  },
  {
    num: '3',
    title: 'Emite la factura con IVA 0% y la mención legal obligatoria',
    desc: 'La factura debe incluir la mención: "Exenta de IVA. Art. 25 Ley 37/1992 - Operación Intracomunitaria - Inversión del Sujeto Pasivo". El importe del IVA es 0€. La base imponible es el total neto.',
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
  'Tipo de IVA: 0% (exento)',
  'Cuota de IVA: 0,00 €',
  'Mención legal de inversión del sujeto pasivo',
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

export function NovafacturaFacturaIntracomunitariaPage(): React.JSX.Element {
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
              Clientes UE — IVA 0% — Guía 2026
            </div>
            <h1 data-speakable className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Factura intracomunitaria: cómo facturar a empresas de la UE
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
              Si prestas servicios o vendes productos a empresas de otro país de la Unión Europea,
              la factura va sin IVA (IVA 0%). Pero hay requisitos previos: alta en el ROI y
              verificación en el VIES.
            </p>
          </div>
        </section>

        {/* Pasos */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-2xl font-bold text-slate-900">
              Cómo emitir una factura intracomunitaria: 4 pasos
            </h2>
            <div className="space-y-8">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-5">
                  <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                    {step.num}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="mb-2 font-bold text-slate-900">{step.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Datos obligatorios */}
        <section className="bg-slate-50 py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              Datos específicos de la factura intracomunitaria
            </h2>
            <div className="space-y-2">
              {requiredFields.map((f) => (
                <div
                  key={f}
                  className="flex items-start gap-3 rounded-lg bg-white border border-neutral-100 px-4 py-3"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-500" />
                  <p className="text-sm text-slate-700">{f}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-4">
              <p className="text-sm font-semibold text-indigo-800 mb-1">
                Mención legal obligatoria en la factura:
              </p>
              <code className="block text-xs text-indigo-700 leading-relaxed">
                "Exenta de IVA. Art. 25 Ley 37/1992 - Operación Intracomunitaria - Inversión del
                Sujeto Pasivo"
              </code>
            </div>
          </div>
        </section>

        {/* Ejemplo cálculo */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Ejemplo de factura intracomunitaria
            </h2>
            <div className="rounded-2xl border border-neutral-100 bg-neutral-50 overflow-hidden">
              <div className="divide-y divide-neutral-100">
                {[
                  { label: 'Servicios de consultoría (base imponible)', value: '3.000,00 €' },
                  { label: 'IVA 0% (operación intracomunitaria)', value: '0,00 €', muted: true },
                  { label: 'Retención IRPF', value: 'N/A — no aplica a clientes UE', muted: true },
                  { label: 'Total a pagar', value: '3.000,00 €', bold: true },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between px-5 py-4 ${row.bold ? 'bg-white font-bold' : 'bg-white/50'}`}
                  >
                    <span
                      className={`text-sm ${row.muted ? 'text-slate-400' : row.bold ? 'text-slate-900' : 'text-slate-600'}`}
                    >
                      {row.label}
                    </span>
                    <span
                      className={`font-mono text-sm ${row.muted ? 'text-slate-400' : 'text-slate-900 font-semibold'}`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-indigo-50 px-5 py-3 text-xs text-indigo-700">
                💡 El cliente aplica la inversión del sujeto pasivo: él mismo se autoliquida el IVA
                en su país.
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre la factura intracomunitaria" />

        <RelatedLinksSection
          title="Guías relacionadas"
          links={[
            { href: '/facturas/como-hacer-una-factura', label: 'Cómo hacer una factura completa' },
            { href: '/facturas/con-irpf', label: 'Factura con IRPF — para clientes nacionales' },
            { href: '/factura-electronica', label: 'Factura electrónica' },
            { href: '/facturas', label: 'Todos los tipos de facturas' },
            { href: '/facturacion-online', label: 'Software para facturas intracomunitarias' },
          ]}
        />

        <CtaDarkSection
          title="NovaFactura gestiona facturas intracomunitarias"
          description="Valida el NIF-IVA en VIES, aplica IVA 0% automáticamente e incluye la mención legal correcta."
        />

        <FooterLanding />
      </div>
    </>
  );
}

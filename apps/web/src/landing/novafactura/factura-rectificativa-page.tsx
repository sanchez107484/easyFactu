import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import CtaDarkSection from '@/components/CtaDarkSection';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import SiteHeader from '@/components/site-header';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';

export const novafacturaFacturaRectificativaMetadata: Metadata = {
  title: `Factura rectificativa — Qué es y cómo hacerla 2026 | ${brandConfig.app.name}`,
  description:
    'Guía sobre la factura rectificativa: qué es, cuándo se emite, qué datos debe incluir, cómo afecta al IVA y cómo hacerla correctamente según la normativa española.',
  keywords: [
    'factura rectificativa',
    'que es una factura rectificativa',
    'como hacer una factura rectificativa',
    'factura rectificativa ejemplo',
    'cuando emitir factura rectificativa',
    'rectificar factura emitida',
    'factura rectificativa iva',
    'nota de credito factura',
    'factura rectificativa modelo',
    'corregir una factura',
  ],
  alternates: { canonical: `${brandConfig.app.url}/facturas/rectificativa` },
  openGraph: {
    title: `Factura rectificativa — Cómo corregir una factura 2026 | ${brandConfig.app.name}`,
    description:
      'Qué es una factura rectificativa, cuándo se usa y cómo hacerla según la normativa española.',
    url: `${brandConfig.app.url}/facturas/rectificativa`,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: `Factura rectificativa — Cómo corregir una factura 2026 | ${brandConfig.app.name}`,
    description:
      'Qué es una factura rectificativa, cuándo se usa y cómo hacerla según la normativa española.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Factura rectificativa — Qué es y cómo hacerla',
  description:
    'Guía sobre la factura rectificativa y sus requisitos según la normativa española de facturación.',
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
      name: '¿Se puede anular una factura?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No se puede anular ni eliminar una factura ya emitida. La forma correcta de corregir una factura es emitir una factura rectificativa que haga referencia a la original. La factura original sigue existiendo en el registro; la rectificativa es la que corrige los datos o el importe.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué número lleva una factura rectificativa?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Las facturas rectificativas deben tener su propia numeración correlativa. Lo habitual es usar una serie específica con prefijo "R-" (ejemplo: R-2026-001, R-2026-002...). Nunca deben mezclarse en la misma serie que las facturas ordinarias.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo afecta una factura rectificativa al IVA?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La factura rectificativa genera una variación del IVA. Si reduces el importe, el IVA también se reduce, lo que puede dar lugar a una devolución o compensación. Si corriges un error sin cambiar el importe, el IVA puede quedar igual. En cualquier caso, la rectificativa debe contabilizarse en el trimestre en que se emite.',
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
      name: 'Factura rectificativa',
      item: `${brandConfig.app.url}/facturas/rectificativa`,
    },
  ],
};

const useCases = [
  {
    icon: '✏️',
    title: 'Error en la factura original',
    desc: 'Datos del cliente incorrectos, NIF mal escrito, concepto equivocado o fecha errónea.',
  },
  {
    icon: '💰',
    title: 'Devolución total o parcial',
    desc: 'El cliente devuelve la mercancía o rescinde el servicio prestado.',
  },
  {
    icon: '🎁',
    title: 'Descuento posterior',
    desc: 'Aplicas un descuento o rappel después de haber emitido la factura original.',
  },
  {
    icon: '📦',
    title: 'Ajuste de cantidad',
    desc: 'La cantidad real entregada difiere de la facturada.',
  },
  {
    icon: '💸',
    title: 'Corrección del tipo de IVA',
    desc: 'Aplicaste un tipo incorrecto de IVA en la factura original.',
  },
];

const requiredFields = [
  'Denominación "Factura rectificativa" o "Nota de crédito" claramente visible',
  'Número correlativo dentro de la serie de rectificativas (ej: R-2026-001)',
  'Fecha de emisión de la rectificativa',
  'Referencia expresa a la factura original que se corrige (número y fecha)',
  'Causa de la rectificación (error, devolución, descuento...)',
  'Descripción de la corrección realizada',
  'Base imponible rectificada, tipo de IVA y cuota',
  'Total rectificado (positivo si añades importe, negativo si restas)',
  'Hash SHA-256 y QR VeriFactu (desde julio 2025)',
];

const faqs = [
  {
    q: '¿Se puede anular o eliminar una factura ya emitida?',
    a: 'No. Una vez emitida, una factura no puede modificarse ni eliminarse. Esto es un requisito del Reglamento de facturación (RD 1619/2012) y se refuerza con VeriFactu, ya que el hash encadenado hace que cualquier alteración sea detectable por la AEAT. La única forma legal de corregir un error o revertir una operación es emitir una factura rectificativa que haga referencia expresa a la original.',
  },
  {
    q: '¿Qué número de serie lleva una factura rectificativa?',
    a: 'La factura rectificativa debe tener su propia numeración correlativa dentro de una serie específica para rectificativas (por ejemplo, la serie "R" o "RECT"). No puede continuar la numeración de las facturas ordinarias. Cada rectificativa tiene su propio número correlativo dentro de esa serie (R-1, R-2, R-2026-001, etc.).',
  },
  {
    q: '¿Cómo afecta al IVA una factura rectificativa?',
    a: 'Genera un ajuste de IVA que debe reflejarse en la declaración trimestral del periodo en que se emite la rectificativa — no del periodo de la factura original. Si la rectificativa reduce el importe, puedes recuperar la cuota de IVA ingresada en exceso. Si aumenta el importe, deberás declarar e ingresar la diferencia en el modelo 303 del trimestre correspondiente.',
  },
  {
    q: '¿Una factura rectificativa puede tener importe positivo?',
    a: 'Sí. Existen dos tipos: las de reducción (cuando la factura original era por más del importe correcto, o hay una devolución) con importe negativo, y las de complemento (cuando la factura original era por menos del importe correcto) con importe positivo. Ambas son válidas y deben incluir referencia expresa a la factura original y descripción de la causa de la rectificación.',
  },
  {
    q: '¿En qué plazo hay que emitir una factura rectificativa?',
    a: 'No existe un plazo legal máximo específico en términos generales. Sin embargo, para la modificación de la base imponible por créditos incobrables (impago del cliente), el plazo es de 3 meses desde que se cumple el año de vencimiento del crédito. Cuanto antes emitas la rectificativa por un error, mejor: así recuperas el IVA excedente en el trimestre inmediato.',
  },
  {
    q: '¿Una factura rectificativa requiere VeriFactu?',
    a: 'Sí. Las facturas rectificativas están sujetas a los mismos requisitos VeriFactu que cualquier factura: hash encadenado SHA-256, código QR y transmisión a la AEAT. VeriFactu identifica específicamente el tipo de registro (ordinaria, rectificativa, etc.) para que la Agencia Tributaria pueda hacer el seguimiento completo de la cadena de facturación.',
  },
  {
    q: '¿Qué datos obligatorios debe tener una factura rectificativa?',
    a: 'Además de los datos de cualquier factura (número de serie propio, fecha, NIF emisor, NIF receptor, base imponible, IVA), la rectificativa debe incluir: referencia explícita al número y fecha de la factura original, descripción de la causa de la rectificación (error en precio, devolución, impago, datos incorrectos, etc.) e importe de la diferencia. Con VeriFactu, también lleva el hash encadenado y el código QR.',
  },
];

export function NovafacturaFacturaRectificativaPage(): React.JSX.Element {
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
        <section className="bg-gradient-to-b from-orange-50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <PageBreadcrumb
              items={[
                { href: '/', label: 'Inicio' },
                { href: '/facturas', label: 'Facturas' },
                { label: 'Factura rectificativa' },
              ]}
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
              <BookOpen className="h-4 w-4" />
              Corrección de facturas — Guía 2026
            </div>
            <h1 data-speakable className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Factura rectificativa: qué es y cómo hacerla
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
              Una factura rectificativa es el único mecanismo legal para corregir una factura ya
              emitida en España. No puedes anular ni eliminar facturas: debes emitir una
              rectificativa que haga referencia a la original.
            </p>
          </div>
        </section>

        {/* Cuándo se emite */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              ¿Cuándo debes emitir una factura rectificativa?
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {useCases.map((u) => (
                <div key={u.title} className="rounded-xl border border-neutral-100 bg-white p-5">
                  <span className="text-2xl">{u.icon}</span>
                  <p className="mt-2 font-semibold text-slate-900 text-sm">{u.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{u.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Datos obligatorios */}
        <section className="bg-slate-50 py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              Datos que debe incluir una factura rectificativa
            </h2>
            <div className="space-y-2">
              {requiredFields.map((f, i) => (
                <div
                  key={f}
                  className={`flex items-start gap-3 rounded-lg px-4 py-3 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border border-neutral-100`}
                >
                  <span className="flex-shrink-0 rounded-full bg-green-100 px-1.5 py-0.5 text-xs font-bold text-green-700">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm text-slate-700">{f}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre la factura rectificativa" />

        <RelatedLinksSection
          title="Guías relacionadas"
          links={[
            { href: '/facturas/como-hacer-una-factura', label: 'Cómo hacer una factura' },
            { href: '/facturas/con-irpf', label: 'Factura con IRPF' },
            { href: '/facturas/proforma', label: 'Factura proforma' },
            { href: '/facturas', label: 'Todos los tipos de facturas' },
            { href: '/facturacion-online', label: 'Software para emitir rectificativas' },
          ]}
        />

        <CtaDarkSection
          title="NovaFactura gestiona las rectificativas automáticamente"
          description="Con un clic genera la rectificativa referenciando la original, con su serie R- y el QR VeriFactu correcto."
        />

        <FooterLanding />
      </div>
    </>
  );
}

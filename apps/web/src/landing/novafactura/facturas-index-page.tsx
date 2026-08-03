import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Sparkles } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import FaqSection from '@/components/FaqSection';
import RelatedLinksSection from '@/components/RelatedLinksSection';

export const novafacturaFacturasIndexMetadata: Metadata = {
  title: `Guías de facturación en España — Tipos de facturas y cómo hacerlas | ${brandConfig.app.name}`,
  description:
    'Todo sobre facturación en España: cómo hacer una factura, facturas con IRPF, rectificativas, proforma, simplificadas, intracomunitarias. Guías prácticas y gratuitas.',
  keywords: [
    'tipos de facturas en españa',
    'guia facturacion españa',
    'como hacer una factura',
    'tipos de facturas autonomos',
    'factura con irpf',
    'factura rectificativa',
    'factura proforma',
    'factura simplificada',
    'factura intracomunitaria',
    'facturacion autónomos españa',
  ],
  alternates: { canonical: `${brandConfig.app.url}/facturas` },
  openGraph: {
    title: `Guías de facturación en España | ${brandConfig.app.name}`,
    description:
      'Todos los tipos de facturas explicados: IRPF, rectificativas, proforma, simplificadas, intracomunitarias. Guías actualizadas 2026.',
    url: `${brandConfig.app.url}/facturas`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: `Guías de facturación en España | ${brandConfig.app.name}`,
    description:
      'Todos los tipos de facturas explicados: IRPF, rectificativas, proforma, simplificadas, intracomunitarias. Guías actualizadas 2026.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Guías de facturación',
      item: `${brandConfig.app.url}/facturas`,
    },
  ],
};

const faqs = [
  {
    q: '¿Qué diferencia hay entre factura ordinaria, proforma y simplificada?',
    a: 'La factura ordinaria (o completa) es el documento fiscal estándar con todos los datos del emisor y receptor, base imponible, IVA y, desde 2025, hash VeriFactu y QR. La factura proforma no tiene valor fiscal: es una propuesta comercial previa a la venta, sin obligación de pago ni devengo de IVA. La factura simplificada (tícket) es válida para ventas al público hasta 400€ sin incluir los datos del cliente, aunque no permite deducir el IVA.',
  },
  {
    q: '¿Cuándo necesito emitir una factura rectificativa?',
    a: 'Cuando hay un error en una factura ya emitida (precio incorrecto, NIF equivocado, concepto erróneo) o cuando se produce una devolución total o parcial. En España no se pueden anular ni modificar facturas emitidas: la corrección siempre se hace mediante una factura rectificativa que referencia a la original. Con VeriFactu, el hash encadenado hace imposible alterar una factura ya registrada sin que la AEAT lo detecte.',
  },
  {
    q: '¿Qué datos son obligatorios en cualquier factura en España?',
    a: 'Los datos obligatorios son: número y serie correlativa, fecha de emisión, NIF y nombre o razón social del emisor y del receptor, domicilio fiscal de ambas partes, descripción de los bienes o servicios, base imponible, tipo de IVA aplicado y cuota de IVA. Opcionalmente, retención de IRPF si aplica. Desde 2025, también hash encadenado SHA-256 y código QR VeriFactu.',
  },
  {
    q: '¿Durante cuánto tiempo tengo que conservar mis facturas?',
    a: 'La Ley General Tributaria (artículo 66) exige conservar las facturas durante 4 años desde el fin del plazo de presentación de la declaración correspondiente, a efectos fiscales. El Código de Comercio añade 6 años a efectos mercantiles. Con VeriFactu, el registro en la AEAT garantiza la conservación del registro digital, pero el emisor sigue obligado a conservar sus propios ejemplares.',
  },
  {
    q: '¿Cuándo se emite una factura intracomunitaria y en qué se diferencia de una exportación?',
    a: 'La factura intracomunitaria es para operaciones entre empresas de países miembros de la Unión Europea. El IVA es 0% si ambas partes están en el ROI y el NIF europeo del cliente es válido en el VIES. La exportación es para clientes de países fuera de la UE (EE.UU., Reino Unido, etc.) y también lleva IVA 0%, pero requiere documento aduanero de exportación (DUA) y se declara en modelos diferentes al modelo 349 intracomunitario.',
  },
  {
    q: '¿Todas las facturas necesitan VeriFactu?',
    a: 'Sí, una vez superado el plazo que corresponda: el software de facturación solo puede comercializarse adaptado desde el 29 de julio de 2025; las sociedades deben facturar con software VeriFactu desde el 1 de enero de 2027; y los autónomos, desde el 1 de julio de 2027. Todos los tipos de factura — ordinarias, rectificativas, simplificadas, intracomunitarias — deben cumplir los requisitos VeriFactu una vez entre en vigor el plazo correspondiente.',
  },
];

const facturasFaqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const itemListJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Guías de facturación en España',
  description: 'Colección de guías sobre tipos de facturas y cómo emitirlas correctamente.',
  numberOfItems: 6,
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Cómo hacer una factura',
      url: `${brandConfig.app.url}/facturas/como-hacer-una-factura`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Factura con IRPF',
      url: `${brandConfig.app.url}/facturas/con-irpf`,
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Factura rectificativa',
      url: `${brandConfig.app.url}/facturas/rectificativa`,
    },
    {
      '@type': 'ListItem',
      position: 4,
      name: 'Factura proforma',
      url: `${brandConfig.app.url}/facturas/proforma`,
    },
    {
      '@type': 'ListItem',
      position: 5,
      name: 'Factura simplificada',
      url: `${brandConfig.app.url}/facturas/simplificada`,
    },
    {
      '@type': 'ListItem',
      position: 6,
      name: 'Factura intracomunitaria',
      url: `${brandConfig.app.url}/facturas/intracomunitaria`,
    },
  ],
};

const guides = [
  {
    href: '/facturas/como-hacer-una-factura',
    title: 'Cómo hacer una factura',
    desc: 'Los datos obligatorios, el número de serie, cómo calcular IVA e IRPF y qué pasa si te equivocas.',
    badge: 'Guía esencial',
    popular: true,
    volume: '20k-35k búsquedas/mes',
  },
  {
    href: '/facturas/con-irpf',
    title: 'Factura con IRPF',
    desc: '¿Cuándo aplicar retención? ¿Al 7% o al 15%? ¿Quién está obligado? Todo explicado con ejemplos.',
    badge: 'IRPF',
    popular: true,
    volume: '3k-5k búsquedas/mes',
  },
  {
    href: '/facturas/rectificativa',
    title: 'Factura rectificativa',
    desc: 'Cómo corregir una factura ya emitida: cuándo se hace, qué datos cambian y qué pasa con el IVA.',
    badge: 'Correcciones',
    popular: false,
    volume: '4k-6k búsquedas/mes',
  },
  {
    href: '/facturas/proforma',
    title: 'Factura proforma',
    desc: 'Qué es, para qué sirve, diferencias con el presupuesto y con la factura definitiva.',
    badge: 'Pre-venta',
    popular: false,
    volume: '5k-8k búsquedas/mes',
  },
  {
    href: '/facturas/simplificada',
    title: 'Factura simplificada',
    desc: 'El tícket que sustituye a la factura en ventas al público: cuándo es válido y sus límites.',
    badge: 'B2C',
    popular: false,
    volume: '2.5k-4k búsquedas/mes',
  },
  {
    href: '/facturas/intracomunitaria',
    title: 'Factura intracomunitaria',
    desc: 'Cómo facturar a una empresa de otro país de la UE: exención de IVA, VIES y ROI.',
    badge: 'Unión Europea',
    popular: false,
    volume: '2k-3.5k búsquedas/mes',
  },
];

export function NovafacturaFacturasIndexPage(): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(facturasFaqJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />

        {/* Hero */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
              <BookOpen className="h-4 w-4" />
              Guías actualizadas 2026
            </div>
            <h1 data-speakable className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Todo sobre facturación en España
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-600 leading-relaxed">
              Guías prácticas y gratuitas sobre todos los tipos de facturas: cómo hacerlas, qué
              datos son obligatorios y cómo cumplir con Hacienda.
            </p>
          </div>
        </section>

        {/* Grid de guías */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {guides.map((guide) => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="group relative flex flex-col rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  {guide.popular && (
                    <span className="absolute -top-2.5 left-4 rounded-full bg-blue-600 px-3 py-0.5 text-xs font-bold text-white">
                      Más consultada
                    </span>
                  )}
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex-shrink-0 rounded-lg bg-blue-50 p-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="rounded-full border border-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                      {guide.badge}
                    </span>
                  </div>
                  <h2 className="mb-2 text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {guide.title}
                  </h2>
                  <p className="flex-1 text-sm text-slate-500 leading-relaxed">{guide.desc}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600">
                    Leer guía{' '}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <RelatedLinksSection
          title="Guías relacionadas que también necesitas"
          links={[
            {
              href: '/factura-electronica',
              label: 'Factura electrónica',
              description: 'Qué es, diferencias con VeriFactu y cuándo será obligatoria.',
            },
            {
              href: '/verifactu',
              label: 'VeriFactu AEAT',
              description: 'El hash encadenado del Reglamento VeriFactu. Qué es y cómo cumplirlo.',
            },
          ]}
        />

        {/* CTA */}
        <section className="border-t py-12 md:py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="mb-3 text-2xl font-bold text-slate-900">
              ¿Listo para facturar correctamente?
            </h2>
            <p className="mb-7 text-slate-500">
              NovaFactura aplica todas estas reglas automáticamente. Solo introduces los datos; el
              software hace el resto.
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow transition hover:bg-blue-700"
            >
              <Sparkles className="h-5 w-5" />
              Empezar gratis — hasta 2027 sin coste
            </Link>
          </div>
        </section>

        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre facturas" />

        <FooterLanding />
      </div>
    </>
  );
}

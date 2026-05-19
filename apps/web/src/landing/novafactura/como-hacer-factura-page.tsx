import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, BookOpen, CheckCircle2 } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import CtaDarkSection from '@/components/CtaDarkSection';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import SiteHeader from '@/components/site-header';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';

export const novafacturaComoHacerFacturaMetadata: Metadata = {
  title: `Cómo hacer una factura en España — Guía paso a paso 2026 | ${brandConfig.app.name}`,
  description:
    'Aprende a hacer una factura correcta: qué datos son obligatorios, cómo numerar las series, cómo calcular IVA e IRPF y qué hacer si te equivocas. Guía actualizada 2026.',
  keywords: [
    'como hacer una factura',
    'como hacer una factura en españa',
    'como rellenar una factura',
    'datos obligatorios factura',
    'como hacer una factura autonomo',
    'partes de una factura',
    'numeracion facturas',
    'calcular iva factura',
    'como hacer factura correcta',
    'factura bien hecha',
  ],
  alternates: { canonical: `${brandConfig.app.url}/facturas/como-hacer-una-factura` },
  openGraph: {
    title: `Cómo hacer una factura paso a paso 2026 | ${brandConfig.app.name}`,
    description:
      'Guía completa: datos obligatorios, numeración, IVA, IRPF y errores comunes al hacer una factura.',
    url: `${brandConfig.app.url}/facturas/como-hacer-una-factura`,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: `Cómo hacer una factura paso a paso 2026 | ${brandConfig.app.name}`,
    description:
      'Guía completa: datos obligatorios, numeración, IVA, IRPF y errores comunes al hacer una factura en España.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Cómo hacer una factura correcta en España',
  description:
    'Pasos para emitir una factura válida fiscalmente en España, incluyendo todos los datos obligatorios.',
  tool: [{ '@type': 'HowToTool', name: brandConfig.app.name }],
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Asigna un número de serie correlativo',
      text: 'Cada factura necesita un número único y secuencial. No puedes saltarte números ni repetirlos. Lo habitual es usar el formato YYYY-NNN (ej: 2026-001, 2026-002...).',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Indica la fecha de emisión',
      text: 'La fecha en la que emites la factura. Debe coincidir con el período en el que se prestó el servicio o se entregó el producto.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Añade los datos del emisor (tú)',
      text: 'Nombre o razón social, NIF/CIF, dirección fiscal completa. Si eres autónomo, tu nombre completo y DNI/NIE.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Añade los datos del receptor (tu cliente)',
      text: 'Nombre o razón social del cliente, NIF/CIF, dirección completa. Imprescindible para facturas a empresas.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Describe el concepto, cantidad y precio unitario',
      text: 'Describe brevemente el servicio o producto facturado. Incluye la cantidad, el precio unitario (sin IVA) y el total de cada línea.',
    },
    {
      '@type': 'HowToStep',
      position: 6,
      name: 'Aplica el IVA correspondiente',
      text: 'En España existen varios tipos: 21% (general), 10% (reducido: alimentación, hostelería, construcción) y 4% (superreducido: libros, medicamentos). También existen operaciones exentas de IVA.',
    },
    {
      '@type': 'HowToStep',
      position: 7,
      name: 'Aplica la retención de IRPF si aplica',
      text: 'Si eres autónomo en actividad profesional (abogado, consultor, diseñador, etc.) y facturas a una empresa, debes aplicar retención de IRPF: 7% los primeros 3 años, 15% después.',
    },
    {
      '@type': 'HowToStep',
      position: 8,
      name: 'Indica la base imponible, el IVA y el total',
      text: 'La base imponible es el importe sin IVA. El IVA es el importe del impuesto. El total es base imponible + IVA − retención IRPF.',
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué datos son obligatorios en una factura?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Una factura debe incluir: número de serie y correlativo, fecha de emisión, datos del emisor (nombre, NIF, dirección), datos del receptor (nombre, NIF, dirección), descripción del servicio o producto, base imponible, tipo de IVA aplicado, cuota de IVA y total. Desde 2025, también debe incluir el hash encadenado SHA-256 y el código QR VeriFactu.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo se numeran las facturas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Las facturas deben numerarse de forma correlativa y sin saltar números. Lo más habitual es usar el formato YYYY-NNN (ejemplo: 2026-001). Puedes tener distintas series (por ejemplo, una para servicios y otra para productos), pero dentro de cada serie la numeración debe ser secuencial.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuándo hay que aplicar IRPF en una factura?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La retención de IRPF se aplica en facturas de actividades profesionales (no empresariales) cuando el cliente es una empresa o autónomo. No se aplica en facturas a particulares. Los primeros 3 años de alta como autónomo, la retención es del 7%; después, el 15%.',
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
      name: 'Cómo hacer una factura',
      item: `${brandConfig.app.url}/facturas/como-hacer-una-factura`,
    },
  ],
};

const requiredFields = [
  {
    field: 'Número de factura',
    detail: 'Correlativo y único. No puedes saltarte ni repetir números.',
  },
  { field: 'Fecha de emisión', detail: 'Cuando emites la factura, no cuando cobras.' },
  { field: 'Datos del emisor', detail: 'Nombre/razón social, NIF/CIF, dirección fiscal completa.' },
  {
    field: 'Datos del receptor',
    detail: 'Nombre/razón social, NIF/CIF, dirección. Obligatorio para B2B.',
  },
  {
    field: 'Descripción del servicio/producto',
    detail: 'Suficientemente detallada para identificar la operación.',
  },
  { field: 'Base imponible', detail: 'El importe antes de IVA. Si hay descuento, se aplica aquí.' },
  { field: 'Tipo de IVA (%)', detail: '21%, 10%, 4% o exento según el tipo de operación.' },
  { field: 'Cuota de IVA (€)', detail: 'El resultado de aplicar el % de IVA a la base imponible.' },
  { field: 'Total factura', detail: 'Base imponible + cuota IVA − retención IRPF (si aplica).' },
  {
    field: 'Hash SHA-256 + QR VeriFactu',
    detail: 'Obligatorio desde julio 2025 en software certificado.',
    new: true,
  },
];

const steps = [
  {
    num: '1',
    title: 'Asigna número de serie correlativo',
    content: (
      <p className="text-sm text-slate-600 leading-relaxed">
        Cada factura necesita un <strong>número único y secuencial</strong>. No puedes saltarte
        números ni repetirlos. Lo habitual es usar el formato{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">YYYY-NNN</code> (ej:
        2026-001, 2026-002...).
        <br />
        <br />
        Puedes tener <strong>múltiples series</strong> (por ejemplo,{' '}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">R-2026-001</code>{' '}
        para rectificativas), pero dentro de cada serie la numeración debe ser secuencial.
      </p>
    ),
  },
  {
    num: '2',
    title: 'Rellena tus datos como emisor',
    content: (
      <p className="text-sm text-slate-600 leading-relaxed">
        Incluye tu <strong>nombre completo o razón social</strong>, tu{' '}
        <strong>NIF, CIF o NIE</strong> y tu <strong>dirección fiscal completa</strong> (calle,
        código postal, ciudad, provincia). Si tienes varios locales, usa la dirección fiscal
        registrada en la AEAT.
      </p>
    ),
  },
  {
    num: '3',
    title: 'Añade los datos del cliente',
    content: (
      <p className="text-sm text-slate-600 leading-relaxed">
        Para facturas a empresas (<strong>B2B</strong>): nombre, NIF/CIF y dirección completa. Todos
        los datos son obligatorios.
        <br />
        <br />
        Para facturas a particulares (<strong>B2C</strong>): nombre y NIF si lo pide. Si no lo pide,
        puedes emitir una{' '}
        <Link href="/facturas/simplificada" className="text-blue-600 hover:underline">
          factura simplificada (tícket)
        </Link>{' '}
        para importes inferiores a 400€.
      </p>
    ),
  },
  {
    num: '4',
    title: 'Describe el concepto y las líneas de factura',
    content: (
      <p className="text-sm text-slate-600 leading-relaxed">
        Describe el servicio o producto con suficiente detalle para identificar la operación. Para
        cada línea:{' '}
        <strong>descripción, cantidad, precio unitario (sin IVA) y total de línea</strong>.
        <br />
        <br />
        Si ofreces descuento, aplícalo en la descripción o como línea de descuento negativa.
      </p>
    ),
  },
  {
    num: '5',
    title: 'Calcula el IVA',
    content: (
      <div>
        <p className="text-sm text-slate-600 leading-relaxed mb-3">
          En España existen <strong>tres tipos de IVA</strong>:
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {[
            {
              rate: '21%',
              name: 'General',
              examples: 'Servicios profesionales, ropa, electrónica',
            },
            { rate: '10%', name: 'Reducido', examples: 'Hostelería, construcción, transporte' },
            {
              rate: '4%',
              name: 'Superreducido',
              examples: 'Libros, medicamentos, alimentos básicos',
            },
          ].map((t) => (
            <div key={t.rate} className="rounded-xl border border-neutral-100 p-3">
              <p className="text-lg font-bold text-blue-600">{t.rate}</p>
              <p className="text-sm font-semibold text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-500">{t.examples}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          También existen operaciones exentas de IVA (sanidad, educación, seguros) e
          intracomunitarias.
        </p>
      </div>
    ),
  },
  {
    num: '6',
    title: 'Aplica IRPF si eres autónomo profesional',
    content: (
      <p className="text-sm text-slate-600 leading-relaxed">
        Si eres autónomo en actividad <strong>profesional</strong> (abogado, consultor, arquitecto,
        diseñador...) y facturas a una empresa o autónomo, debes aplicar{' '}
        <strong>retención de IRPF</strong>:
        <br />
        <br />— <strong>7%</strong> los primeros 3 años tras el alta como autónomo
        <br />— <strong>15%</strong> a partir del tercer año
        <br />
        <br />
        La retención se <strong>resta del total</strong>: es dinero que tu cliente pagará
        directamente a Hacienda en tu nombre. A ti se te ingresa el total menos la retención.{' '}
        <Link href="/facturas/con-irpf" className="text-blue-600 hover:underline">
          Ver guía completa sobre IRPF en facturas →
        </Link>
      </p>
    ),
  },
  {
    num: '7',
    title: 'Incluye los totales',
    content: (
      <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-sm font-mono">
        <div className="flex justify-between border-b border-neutral-100 pb-2 mb-2">
          <span className="text-slate-600">Base imponible</span>
          <span className="font-semibold text-slate-900">1.000,00 €</span>
        </div>
        <div className="flex justify-between border-b border-neutral-100 pb-2 mb-2">
          <span className="text-slate-600">IVA (21%)</span>
          <span className="font-semibold text-slate-900">+210,00 €</span>
        </div>
        <div className="flex justify-between border-b border-neutral-100 pb-2 mb-2">
          <span className="text-slate-600">Retención IRPF (15%)</span>
          <span className="font-semibold text-red-600">−150,00 €</span>
        </div>
        <div className="flex justify-between">
          <span className="font-bold text-slate-900">Total a pagar</span>
          <span className="font-bold text-slate-900">1.060,00 €</span>
        </div>
      </div>
    ),
  },
];

const commonMistakes = [
  {
    mistake: 'No usar numeración correlativa',
    consequence: 'Infracción tributaria. Hacienda puede invalidar las facturas.',
  },
  {
    mistake: 'No incluir el NIF del cliente',
    consequence: 'La factura no es válida para que el cliente deduzca el IVA.',
  },
  {
    mistake: 'Aplicar el tipo de IVA incorrecto',
    consequence: 'Puedes tener que ingresar la diferencia más intereses.',
  },
  {
    mistake: 'Olvidar la retención IRPF cuando aplica',
    consequence: 'Ambas partes pueden tener problemas en la declaración anual.',
  },
  {
    mistake: 'No usar software VeriFactu',
    consequence: 'Multas de hasta 50.000€. Autónomos y pymes obligados desde julio 2027.',
  },
];

const faqs = [
  {
    q: '¿Cuál es la diferencia entre factura completa y tícket (factura simplificada)?',
    a: 'La factura completa incluye todos los datos del emisor y del receptor (NIF, nombre, dirección), número de serie, descripción detallada, base imponible e IVA desglosado. Es obligatoria para ventas a empresarios y para cualquier importe cuando el cliente la solicita para deducir el IVA. La factura simplificada (tícket) no requiere los datos del destinatario y es válida solo hasta 400€ para ventas al público en general (B2C). Para operaciones B2B siempre se necesita factura completa.',
  },
  {
    q: '¿Puedo hacer una factura a mano en papel?',
    a: 'Sí, las facturas en papel siguen siendo válidas legalmente cuando el receptor las acepta. Sin embargo, desde julio 2025, el registro de cada factura debe realizarse con software VeriFactu certificado aunque la factura se imprima en papel. El software genera el hash encadenado y el código QR que debe imprimirse en la factura. Sin ese QR VeriFactu, la factura impresa no es válida fiscalmente a partir de los plazos establecidos.',
  },
  {
    q: '¿Puedo facturar a clientes de fuera de España?',
    a: 'Sí, con reglas distintas según el destino. Si el cliente es una empresa de otro país de la UE y está en el VIES, la factura puede ir sin IVA (exención intracomunitaria). Para clientes de fuera de la UE se considera exportación (también sin IVA, pero con procedimiento aduanero distinto). Si es un particular de la UE, aplica el sistema OSS desde 10.000€/año de ventas B2C intracomunitarias. En todos los casos, el software debe cumplir VeriFactu.',
  },
  {
    q: '¿Con qué frecuencia debo numerar mis facturas?',
    a: 'Las facturas deben tener numeración correlativa dentro de cada serie, sin saltos ni repeticiones. Puedes reiniciar la numeración al inicio de cada año natural si la serie lo incluye (ej: 2026-001, 2026-002) o mantener una numeración continua sin reinicio anual. Lo importante es que sea correlativa, sin huecos y que permita identificar el orden cronológico de emisión. Con VeriFactu, cualquier salto en la numeración es detectable por la AEAT.',
  },
  {
    q: '¿Debo guardar copia de todas mis facturas y durante cuánto tiempo?',
    a: 'Sí. La normativa tributaria española (Ley General Tributaria, artículo 66) exige conservar las facturas durante 4 años desde el fin del plazo de presentación de la declaración correspondiente. El Código de Comercio añade 6 años a efectos mercantiles. Con VeriFactu, el registro en la AEAT garantiza la conservación del registro digital, pero el emisor sigue obligado a conservar sus propios ejemplares.',
  },
  {
    q: '¿Puedo emitir facturas en otro idioma o en otra moneda?',
    a: 'Sí. No hay prohibición de emitir facturas en inglés, francés u otro idioma para clientes internacionales. La recomendación es que los datos fiscales del emisor español estén claramente identificables. En cuanto a la moneda, puedes facturar en euros, dólares u otra divisa, pero debes indicar el tipo de cambio aplicado si la declaración de IVA se hace en euros (tipo del Banco Central Europeo del día de la operación).',
  },
];

export function NovafacturaComoHacerFacturaPage(): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
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
        <section className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <PageBreadcrumb
              items={[
                { href: '/', label: 'Inicio' },
                { href: '/facturas', label: 'Facturas' },
                { label: 'Cómo hacer una factura' },
              ]}
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600">
              <BookOpen className="h-4 w-4" />
              Guía actualizada 2026 · 8 pasos
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Cómo hacer una factura correcta en España
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
              Una factura válida en España debe incluir datos obligatorios del emisor y receptor,
              número correlativo, base imponible, IVA y — desde julio 2025 — el hash VeriFactu y el
              código QR.
            </p>
          </div>
        </section>

        {/* Datos obligatorios */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              Datos obligatorios en una factura (checklist)
            </h2>
            <div className="rounded-2xl border border-neutral-100 overflow-hidden">
              {requiredFields.map((f, i) => (
                <div
                  key={f.field}
                  className={`flex items-start gap-3 px-5 py-4 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} ${f.new ? 'border-l-4 border-blue-500' : ''}`}
                >
                  <BadgeCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900 text-sm">{f.field}</p>
                      {f.new && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          Nuevo 2025
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{f.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pasos */}
        <section className="bg-slate-50 py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-2xl font-bold text-slate-900">
              Paso a paso: cómo rellenar una factura
            </h2>
            <div className="space-y-8">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-5">
                  <div className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {step.num}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="mb-3 font-bold text-slate-900">{step.title}</h3>
                    {step.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Errores comunes */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              Errores más comunes al hacer una factura
            </h2>
            <div className="space-y-3">
              {commonMistakes.map((m) => (
                <div
                  key={m.mistake}
                  className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3.5"
                >
                  <span className="mt-0.5 flex-shrink-0 rounded-full bg-red-100 p-0.5 text-red-600">
                    <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{m.mistake}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{m.consequence}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre cómo hacer una factura" />

        <RelatedLinksSection
          title="Guías relacionadas"
          links={[
            { href: '/facturas/con-irpf', label: 'Factura con IRPF — cuándo y cómo aplicarlo' },
            {
              href: '/facturas/rectificativa',
              label: 'Factura rectificativa — cómo corregir una factura',
            },
            { href: '/facturas/proforma', label: 'Factura proforma — qué es y para qué sirve' },
            { href: '/verifactu', label: 'VeriFactu — el hash obligatorio en tus facturas' },
            { href: '/facturacion-online', label: 'Software de facturación online gratuito' },
          ]}
        />

        <CtaDarkSection
          title="NovaFactura hace esto automáticamente"
          description="Solo introduces el cliente y el concepto. El software calcula el IVA, aplica el IRPF, genera el hash VeriFactu y envía a la AEAT. Todo en 60 segundos."
          ctaText="Empezar gratis — hasta 2027 sin coste"
          showArrow
        />

        <FooterLanding />
      </div>
    </>
  );
}

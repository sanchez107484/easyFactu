import type { Metadata } from 'next';
import { BookOpen, CheckCircle2 } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import CtaDarkSection from '@/components/CtaDarkSection';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import SiteHeader from '@/components/site-header';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';

export const novafacturaFacturaIrpfMetadata: Metadata = {
  title: `Factura con IRPF: Retención del 7% y 15% | ${brandConfig.app.name}`,
  description:
    'Guía completa sobre el IRPF en las facturas de autónomos: quién está obligado, porcentajes (7% o 15%), cómo calcular la retención y cómo rellenar la factura.',
  keywords: [
    'factura con irpf',
    'como aplicar irpf en una factura',
    'retencion irpf autonomo',
    'irpf factura autonomo profesional',
    'porcentaje irpf factura',
    'cuando se aplica irpf en factura',
    'irpf 7% autonomo nuevo',
    'irpf 15% autonomo',
    'calculo retencion irpf factura',
    'factura con irpf ejemplo',
  ],
  alternates: { canonical: `${brandConfig.app.url}/facturas/con-irpf` },
  openGraph: {
    title: `Factura con IRPF: Retención del 7% y 15% | ${brandConfig.app.name}`,
    description:
      'Quién debe aplicar IRPF, al 7% o al 15%, cómo se calcula y cómo se rellena la factura.',
    url: `${brandConfig.app.url}/facturas/con-irpf`,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: `Factura con IRPF: Retención del 7% y 15% | ${brandConfig.app.name}`,
    description:
      'Cuándo aplicar el 7% o el 15% de IRPF en tus facturas, quién está obligado y ejemplo de factura con desglose.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Factura con IRPF: Retención del 7% y 15%',
  description:
    'Cuándo aplicar el 7% o el 15% de IRPF en tus facturas, quién está obligado y ejemplo de factura con desglose.',
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
      name: '¿Todos los autónomos tienen que aplicar IRPF en sus facturas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Solo los autónomos en actividades profesionales (sección 2 del IAE: abogados, economistas, ingenieros, consultores, diseñadores, etc.) están obligados a aplicar retención de IRPF. Los autónomos en actividades empresariales (sección 1 del IAE: tiendas, restaurantes, constructoras...) NO aplican IRPF en sus facturas.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuándo se aplica el 7% y cuándo el 15%?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El 7% se aplica durante los primeros 3 años de actividad como autónomo (el año de alta más los dos siguientes), siempre que no hayas ejercido esta actividad en los 2 años anteriores. A partir del cuarto año (o si ya ejerciste antes), se aplica el 15%.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué pasa si facturo a un particular?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Si tu cliente es una persona física que no actúa como empresario o profesional (un particular), NO debes aplicar retención de IRPF. La retención solo se aplica cuando facturas a empresas, sociedades o autónomos.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Dónde se declara la retención de IRPF?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La retención la ingresa tu cliente en Hacienda (modelo 111 trimestral y 190 anual). Tú debes declararla en tu IRPF anual como un pago a cuenta ya realizado, lo que reduce lo que tendrás que pagar en la declaración de la renta.',
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
      name: 'Factura con IRPF',
      item: `${brandConfig.app.url}/facturas/con-irpf`,
    },
  ],
};

const whoApplies = [
  {
    apply: true,
    label: 'Actividades profesionales (sección 2 IAE)',
    examples:
      'Abogados, ingenieros, arquitectos, consultores, diseñadores, programadores, traductores, médicos con consulta privada...',
  },
  {
    apply: false,
    label: 'Actividades empresariales (sección 1 IAE)',
    examples: 'Comercios, restaurantes, talleres, constructoras, tiendas online, academias...',
  },
  {
    apply: false,
    label: 'Facturas a particulares (B2C)',
    examples: 'Tu cliente es una persona física que no actúa como empresario ni profesional.',
  },
  {
    apply: false,
    label: 'Arrendadores de inmuebles (en algunos casos)',
    examples: 'Salvo que el arrendatario sea obligado a retener.',
  },
];

const faqs = [
  {
    q: '¿Todos los autónomos tienen que aplicar retención de IRPF en sus facturas?',
    a: 'No, solo los autónomos en actividades profesionales (sección 2 del IAE): médicos, abogados, diseñadores, traductores, arquitectos, consultores, informáticos, etc. Los autónomos en actividades empresariales (sección 1 del IAE), como comerciantes, hosteleros o constructores, no aplican retención de IRPF salvo excepciones. La clave es comprobar el epígrafe del IAE de tu actividad para saber si estás en la sección 1 o en la 2.',
  },
  {
    q: '¿Cuándo se aplica el 7% de IRPF y cuándo el 15%?',
    a: 'El 7% se aplica durante los 3 primeros años completos desde el inicio de la actividad profesional (tipo reducido por inicio de actividad), siempre que no hayas ejercido la misma actividad en los 5 años anteriores. A partir del cuarto año, el tipo general es el 15%. El tipo aplicable debe indicarse expresamente en la factura.',
  },
  {
    q: '¿Qué pasa si facturo a un particular que no es empresario?',
    a: 'Si tu cliente es un consumidor final (persona física que no realiza actividad económica), no tienes que aplicar retención de IRPF. La retención solo se aplica cuando el pagador es un empresario o profesional que actúa como retenedor. Si facturas a particulares, la factura incluirá IVA pero no retención de IRPF.',
  },
  {
    q: '¿Qué ocurre si me olvido de aplicar la retención de IRPF?',
    a: 'La responsabilidad de ingresar la retención es del pagador (tu cliente), no tuya. Sin embargo, si emites la factura sin retención cuando debería llevarla, podrías tener que emitir una factura rectificativa y tu cliente podría reclamarte la diferencia. Además, si la AEAT detecta que tus clientes no retuvieron correctamente, puede iniciar actuaciones que indirectamente te afecten. Lo más seguro es aplicar siempre la retención correcta.',
  },
  {
    q: '¿Cómo se calcula el total a cobrar de una factura con IRPF?',
    a: 'La retención de IRPF se resta del total a pagar. Ejemplo práctico: base imponible 1.000€ + IVA 21% (210€) - retención IRPF 15% (150€) = total a cobrar 1.060€. Tú declaras los 1.000€ como ingreso; tu cliente ingresa los 150€ a Hacienda en tu nombre mediante el modelo 111 trimestral; y tú descuentas esos 150€ en tu declaración anual de IRPF (modelo 100).',
  },
  {
    q: '¿Tengo que hacer también la declaración de IRPF aunque me hayan retenido en las facturas?',
    a: 'Sí. Las retenciones son pagos a cuenta del IRPF anual. Al hacer la declaración de la renta (modelo 100), calculas tu cuota real sobre todos tus ingresos y restas las retenciones ya practicadas. Si las retenciones superan la cuota, Hacienda te devuelve la diferencia. Si son insuficientes, pagas el resto. Además, si tributas en estimación directa simplificada, también presentas pagos fraccionados trimestrales (modelo 130) descontando las retenciones recibidas.',
  },
  {
    q: '¿Puedo acordar con mi cliente no aplicar retención de IRPF?',
    a: 'No. Si tu actividad está sujeta a retención y tu cliente es un obligado a retener (empresario o profesional), la retención es obligatoria por ley. No puedes renunciar a ella ni acordar con el cliente que no se aplique. Lo que sí puedes hacer es fijar el precio neto deseado e indicar que el precio con IRPF sería el equivalente al 15% más, para que el cliente lo tenga en cuenta.',
  },
];

export function NovafacturaFacturaIrpfPage(): React.JSX.Element {
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
        <section className="bg-gradient-to-b from-violet-50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <PageBreadcrumb
              items={[
                { href: '/', label: 'Inicio' },
                { href: '/facturas', label: 'Facturas' },
                { label: 'Factura con IRPF' },
              ]}
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700">
              <BookOpen className="h-4 w-4" />
              Retención IRPF — Autónomos profesionales
            </div>
            <h1
              data-speakable
              className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
            >
              Factura con IRPF: cuándo y cómo aplicarlo
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
              El IRPF en la factura es una retención a cuenta del impuesto sobre la renta. Solo se
              aplica en actividades profesionales y cuando el cliente es una empresa. Aquí te
              explicamos cuándo, cuánto y cómo.
            </p>
          </div>
        </section>

        {/* ¿Quién aplica IRPF? */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              ¿Quién tiene que aplicar IRPF?
            </h2>
            <div className="space-y-3">
              {whoApplies.map((w) => (
                <div
                  key={w.label}
                  className={`flex items-start gap-4 rounded-xl border p-5 ${
                    w.apply ? 'border-green-200 bg-green-50' : 'border-neutral-100 bg-white'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex-shrink-0 rounded-full p-0.5 ${
                      w.apply ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {w.apply ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </span>
                  <div>
                    <p
                      className={`font-semibold text-sm ${w.apply ? 'text-green-800' : 'text-slate-600'}`}
                    >
                      {w.apply ? '✓ Aplica IRPF' : '✗ No aplica IRPF'} — {w.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{w.examples}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Porcentajes */}
        <section className="bg-slate-50 py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              ¿Cuánto IRPF aplico? 7% o 15%
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                {
                  rate: '7%',
                  title: 'Retención reducida',
                  when: 'Primeros 3 años de actividad como autónomo profesional (el año de alta + 2 siguientes), siempre que no hayas ejercido la misma actividad en los 2 años anteriores.',
                  tip: 'Debes indicarlo en la factura como "IRPF (7% — inicio de actividad)"',
                  color: 'violet',
                },
                {
                  rate: '15%',
                  title: 'Retención general',
                  when: 'A partir del cuarto año de actividad, o desde el inicio si ya ejerciste antes la misma actividad profesional.',
                  tip: 'La mayoría de autónomos profesionales aplican este porcentaje.',
                  color: 'blue',
                },
              ].map((r) => (
                <div
                  key={r.rate}
                  className={`rounded-2xl border p-6 ${
                    r.color === 'violet'
                      ? 'border-violet-200 bg-violet-50'
                      : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <p
                    className={`text-4xl font-extrabold mb-1 ${
                      r.color === 'violet' ? 'text-violet-700' : 'text-blue-700'
                    }`}
                  >
                    {r.rate}
                  </p>
                  <p className="font-bold text-slate-900 mb-3">{r.title}</p>
                  <p className="text-sm text-slate-600 mb-4">{r.when}</p>
                  <p
                    className={`text-xs font-medium ${
                      r.color === 'violet' ? 'text-violet-700' : 'text-blue-700'
                    }`}
                  >
                    💡 {r.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ejemplo de cálculo */}
        <section className="py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              Ejemplo de cálculo: factura con IVA e IRPF
            </h2>
            <p className="mb-6 text-slate-600">
              Consultor freelance con 4+ años de experiencia factura 2.000€ de honorarios a una
              empresa:
            </p>
            <div className="rounded-2xl border border-neutral-100 bg-neutral-50 overflow-hidden">
              <div className="divide-y divide-neutral-100">
                {[
                  { label: 'Honorarios (base imponible)', value: '2.000,00 €', highlight: false },
                  { label: 'IVA 21%', value: '+420,00 €', highlight: false },
                  {
                    label: 'Retención IRPF 15%',
                    value: '−300,00 €',
                    highlight: false,
                    negative: true,
                  },
                  { label: 'Total a pagar por el cliente', value: '2.120,00 €', highlight: true },
                ].map((row) => (
                  <div
                    key={row.label}
                    className={`flex items-center justify-between px-5 py-4 ${
                      row.highlight ? 'bg-white font-bold' : ''
                    }`}
                  >
                    <span
                      className={`text-sm ${row.highlight ? 'text-slate-900' : 'text-slate-600'}`}
                    >
                      {row.label}
                    </span>
                    <span
                      className={`font-mono text-sm font-semibold ${
                        row.negative
                          ? 'text-red-600'
                          : row.highlight
                            ? 'text-slate-900 text-base'
                            : 'text-slate-900'
                      }`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 px-5 py-3 text-xs text-blue-700">
                💡 Los 300€ de retención los ingresa la empresa a Hacienda en tu nombre. Tú recibes
                2.120€.
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre el IRPF en facturas" />

        <RelatedLinksSection
          title="Guías relacionadas"
          links={[
            { href: '/facturas/como-hacer-una-factura', label: 'Cómo hacer una factura completa' },
            { href: '/facturas/rectificativa', label: 'Factura rectificativa' },
            { href: '/facturas', label: 'Todos los tipos de facturas' },
            { href: '/facturacion-online', label: 'Software que calcula el IRPF automáticamente' },
          ]}
        />

        <CtaDarkSection
          title="NovaFactura calcula el IRPF solo"
          description="Configuras si eres profesional y cuántos años llevas. El software aplica el 7% o el 15% automáticamente en cada factura."
        />

        <FooterLanding />
      </div>
    </>
  );
}

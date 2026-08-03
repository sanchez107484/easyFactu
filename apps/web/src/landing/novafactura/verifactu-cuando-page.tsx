import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';
import { VerifactuDeadlines } from '@/components/verifactu-deadlines';

export const novafacturaVerifactuCuandoMetadata: Metadata = {
  title: `¿Cuándo es obligatorio VeriFactu? Fechas y plazos 2025-2027 | ${brandConfig.app.name}`,
  description:
    'Fechas VeriFactu según el Real Decreto 1007/2023 y el Real Decreto 254/2025: software certificado desde el 29 julio 2025, sociedades desde el 1 enero 2027 y autónomos desde el 1 julio 2027.',
  keywords: [
    'cuando es obligatorio verifactu',
    'verifactu 2025 obligatorio',
    'verifactu fecha obligatorio',
    'verifactu fecha límite',
    'verifactu autonomos cuando',
    'verifactu pymes fecha',
    'ley antifraude 2025 plazo',
    'obligacion verifactu hacienda',
    'plazo verifactu aeat',
  ],
  alternates: { canonical: `${brandConfig.app.url}/verifactu/cuando-es-obligatorio` },
  openGraph: {
    title: `¿Cuándo es obligatorio VeriFactu? 2025 vs 2027 | ${brandConfig.app.name}`,
    description:
      'Plazos VeriFactu: software (29 julio 2025), sociedades (1 enero 2027), autónomos (1 julio 2027). Excepciones incluidas.',
    url: `${brandConfig.app.url}/verifactu/cuando-es-obligatorio`,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: `¿Cuándo es obligatorio VeriFactu? 2025 vs 2027 | ${brandConfig.app.name}`,
    description:
      'Plazos VeriFactu: software (29 julio 2025), sociedades (enero 2027), autónomos (julio 2027).',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuándo es obligatorio VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Los plazos oficiales son escalonados: el software de facturación solo puede comercializarse adaptado al Reglamento VeriFactu desde el 29 de julio de 2025; las sociedades (SL, SA y demás personas jurídicas) deben facturar con software VeriFactu desde el 1 de enero de 2027; y los autónomos persona física en estimación directa, desde el 1 de julio de 2027 (Real Decreto 1007/2023 y Real Decreto 254/2025, de 1 de abril).',
      },
    },
    {
      '@type': 'Question',
      name: '¿Quién está obligado a usar VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Están obligados todos los contribuyentes del IRPF en estimación directa (autónomos) y todas las sociedades sujetas al Impuesto de Sociedades (pymes, SL, SA). También gestorías y asesorías que emitan facturas en nombre de sus clientes. Están exentos: agricultores en estimación objetiva, contribuyentes del régimen simplificado de IVA, recargo de equivalencia y algunos sujetos pasivos del SII.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué pasa si sigo facturando con Excel después del plazo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Tras la fecha límite, facturar con Excel o cualquier software no certificado puede acarrear multas de entre 1.000€ y 50.000€ por factura o período. La AEAT considera infracción grave el incumplimiento de la obligación de hash encadenado y registro.',
      },
    },
  ],
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '¿Cuándo es obligatorio VeriFactu? Fechas y plazos 2025-2027',
  description:
    'Fechas exactas de obligación VeriFactu por tipo de contribuyente: autónomos, pymes, SL y excepciones.',
  author: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    logo: { '@type': 'ImageObject', url: `${brandConfig.app.url}${brandConfig.logos.main}` },
  },
  datePublished: '2025-04-15',
  dateModified: '2026-05-19',
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
    {
      '@type': 'ListItem',
      position: 3,
      name: '¿Cuándo es obligatorio?',
      item: `${brandConfig.app.url}/verifactu/cuando-es-obligatorio`,
    },
  ],
};

const timeline = [
  {
    date: '1 Abril 2025',
    title: 'Real Decreto 254/2025 publicado',
    description:
      'El Real Decreto 254/2025, de 1 de abril, modifica el Reglamento VeriFactu (aprobado por el Real Decreto 1007/2023) y fija los plazos definitivos para cada tipo de contribuyente.',
    status: 'past',
    who: 'Todos los contribuyentes',
  },
  {
    date: '29 Julio 2025',
    title: 'Software de facturación debe cumplir',
    description:
      'Fecha límite para que los proveedores adapten sus programas a los requisitos técnicos: hash SHA-256, QR verificable y envío a la AEAT. NovaFactura ya está certificado.',
    status: 'past',
    who: 'Proveedores de software de facturación',
  },
  {
    date: '1 Enero 2027',
    title: 'Obligatorio para sociedades',
    description:
      'Las sociedades (SL, SA, cooperativas y demás personas jurídicas) deben emitir facturas con software certificado VeriFactu.',
    status: 'upcoming',
    who: 'Sociedades y personas jurídicas',
  },
  {
    date: '1 Julio 2027',
    title: 'Obligatorio para autónomos',
    description:
      'Los autónomos persona física en estimación directa (normal o simplificada) deben emitir facturas con software certificado VeriFactu. Es el plazo más relevante para la mayoría.',
    status: 'future',
    who: 'Autónomos persona física en estimación directa',
  },
];

const profiles = [
  {
    icon: Users,
    title: 'Autónomos en estimación directa',
    subtitle: '(normal o simplificada)',
    obligation: 'Obligatorio desde el 1 de julio de 2027',
    note: 'Cualquier autónomo que emita facturas y tribute en IRPF en estimación directa normal o simplificada.',
    color: 'blue',
  },
  {
    icon: Building2,
    title: 'Sociedades (SL, SA y personas jurídicas)',
    subtitle: 'Contribuyentes del Impuesto de Sociedades',
    obligation: 'Obligatorio desde el 1 de enero de 2027',
    note: 'Todas las sociedades sujetas al Impuesto de Sociedades deben facturar con software certificado VeriFactu. Es el plazo más próximo.',
    color: 'indigo',
  },
  {
    icon: Shield,
    title: 'Asesorías y gestorías',
    subtitle: 'Que facturen en nombre de clientes',
    obligation: 'Software certificado según plazo de cada cliente',
    note: 'El software debe estar certificado antes de que llegue el plazo de cada uno de tus clientes.',
    color: 'indigo',
  },
  {
    icon: CheckCircle2,
    title: 'Exentos de VeriFactu',
    subtitle: 'Módulos, SII, territorios forales, recargo equivalencia',
    obligation: 'No les aplica VeriFactu',
    note: 'Estimación objetiva (módulos), SII, recargo de equivalencia y territorios forales (TicketBAI en País Vasco/Navarra).',
    color: 'green',
  },
];

const faqs = [
  {
    q: '¿Cuándo exactamente es obligatorio VeriFactu para cada tipo de contribuyente?',
    a: 'Los plazos son escalonados según el Real Decreto 1007/2023 y el Real Decreto 254/2025: el software de facturación solo puede comercializarse adaptado desde el 29 de julio de 2025; las sociedades (SL, SA, cooperativas y demás personas jurídicas) deben facturar con software VeriFactu desde el 1 de enero de 2027; y los autónomos persona física en estimación directa, desde el 1 de julio de 2027. Estos plazos son definitivos — no se esperan nuevas prórrogas.',
  },
  {
    q: '¿Qué pasa si no cumplo con VeriFactu en la fecha límite?',
    a: 'La Ley Antifraude 11/2021 tipifica el incumplimiento como infracción grave. Las multas van desde 1.000€ por cada factura emitida sin los requisitos técnicos (hash, QR, registro AEAT) hasta 50.000€ si la conducta es reiterada durante un ejercicio fiscal. Las sanciones aplican aunque no hayas cometido fraude intencionado: el incumplimiento técnico ya es sancionable. Además, la AEAT puede iniciar comprobaciones al cruzar tus declaraciones de IVA con la ausencia de registros VeriFactu.',
  },
  {
    q: '¿Cómo sé si mi programa de facturación actual es compatible con VeriFactu?',
    a: 'Solo si está certificado por la AEAT como "software garante". Los requisitos son concretos: el programa debe generar hash encadenado SHA-256, código QR verificable y transmitir cada factura a la AEAT en tiempo real. Si usas Excel, Word, LibreOffice o un programa sin actualización VeriFactu, no cumples. La forma de verificarlo es pedir a tu proveedor el certificado de software garante emitido por la Agencia Tributaria.',
  },
  {
    q: '¿Puedo seguir emitiendo facturas en papel después del plazo?',
    a: 'Las facturas en papel siguen siendo válidas legalmente cuando el receptor las acepta (ventas a particulares, por ejemplo). Pero el registro interno de cada factura debe hacerse obligatoriamente con software certificado VeriFactu. La factura impresa debe incluir el QR generado por el software y el número de hash encadenado. Sin ese QR, la factura no es válida fiscalmente aunque esté bien impresa y con todos los datos correctos.',
  },
  {
    q: '¿Hay prórroga para autónomos que acaban de iniciar su actividad?',
    a: 'El plazo es el mismo para todos los autónomos persona física: el 1 de julio de 2027, con independencia de la fecha de alta en el Censo de Empresarios. El Reglamento VeriFactu no contempla ningún periodo de gracia adicional una vez superado ese plazo: quien se dé de alta después del 1 de julio de 2027 deberá usar software certificado VeriFactu desde la primera factura que emita.',
  },
  {
    q: '¿Las facturas emitidas antes del plazo necesitan ser actualizadas?',
    a: 'No. VeriFactu aplica únicamente a las facturas emitidas a partir del plazo establecido para cada tipo de contribuyente. Las facturas anteriores son válidas tal como están y no tienes que tocarlas. La cadena VeriFactu comienza en la primera factura que emitas con el software certificado.',
  },
  {
    q: '¿VeriFactu aplica si solo facturo a particulares (B2C)?',
    a: 'Sí. VeriFactu no distingue entre facturas B2B (a empresas) y B2C (a particulares). Cualquier factura emitida en el ejercicio de una actividad económica — sea a una empresa, a otro autónomo o a un consumidor final — debe cumplir los requisitos de hash encadenado, QR y transmisión a la AEAT. La única excepción son ciertas facturas simplificadas (tíckets) en actividades tasadas por reglamento.',
  },
];

export function NovafacturaVerifactuCuandoPage(): React.JSX.Element {
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
        <section className="bg-gradient-to-b from-blue-50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <PageBreadcrumb
              items={[
                { href: '/', label: 'Inicio' },
                { href: '/verifactu', label: 'VeriFactu' },
                { label: '¿Cuándo es obligatorio?' },
              ]}
              color="text-blue-700"
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <Clock className="h-4 w-4" />
              Actualizado — Real Decreto 254/2025
            </div>
            <h1 data-speakable className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              ¿Cuándo es obligatorio VeriFactu?
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
              El <strong>software de facturación</strong> solo puede comercializarse adaptado desde
              el <strong>29 de julio de 2025</strong>. Las <strong>sociedades</strong> tienen hasta
              el <strong>1 de enero de 2027</strong> y los <strong>autónomos</strong>, hasta el{' '}
              <strong>1 de julio de 2027</strong>. Adopta VeriFactu ahora y olvídate del plazo.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-600" />
              <span>
                Cambiar de software en el último mes genera errores y riesgo de multas. Migra ahora
                con tranquilidad.
              </span>
            </div>
          </div>
        </section>

        {/* Canonical deadlines + BOE sources */}
        <section className="pb-14 md:pb-20">
          <div className="mx-auto max-w-4xl px-6">
            <VerifactuDeadlines />
          </div>
        </section>

        {/* Timeline */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-2xl font-bold text-slate-900">
              Calendario de implantación VeriFactu
            </h2>
            <div className="relative ml-4 space-y-0">
              {timeline.map((item, idx) => (
                <div key={item.date} className="flex gap-6">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        item.status === 'past'
                          ? 'bg-slate-200 text-slate-600'
                          : item.status === 'upcoming'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    {idx < timeline.length - 1 && (
                      <div className="mt-1 w-0.5 flex-1 bg-neutral-100" style={{ minHeight: 32 }} />
                    )}
                  </div>
                  <div className="pb-8">
                    <p
                      className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                        item.status === 'upcoming' ? 'text-blue-600' : 'text-slate-400'
                      }`}
                    >
                      {item.date}
                    </p>
                    <h3 className="font-bold text-slate-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-600 mb-1.5">{item.description}</p>
                    <p className="text-xs text-slate-400">Afecta a: {item.who}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Por perfil */}
        <section className="bg-slate-50 py-14 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              ¿A quién afecta VeriFactu y cuándo?
            </h2>
            <div className="grid gap-5 sm:grid-cols-2">
              {profiles.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.title}
                    className={`rounded-2xl border p-6 ${
                      p.color === 'green'
                        ? 'border-green-100 bg-green-50'
                        : 'border-neutral-100 bg-white'
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div
                        className={`rounded-lg p-2 ${
                          p.color === 'green'
                            ? 'bg-green-100'
                            : p.color === 'indigo'
                              ? 'bg-indigo-50'
                              : 'bg-blue-50'
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            p.color === 'green'
                              ? 'text-green-600'
                              : p.color === 'indigo'
                                ? 'text-indigo-600'
                                : 'text-blue-600'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{p.title}</p>
                        <p className="text-xs text-slate-500">{p.subtitle}</p>
                      </div>
                    </div>
                    <p
                      className={`mb-2 text-sm font-semibold ${
                        p.color === 'green' ? 'text-green-700' : 'text-blue-700'
                      }`}
                    >
                      {p.obligation}
                    </p>
                    <p className="text-xs text-slate-500">{p.note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre fechas y plazos de VeriFactu" />

        {/* CTA */}
        <section className="border-t bg-blue-600 py-14 md:py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="mb-3 text-3xl font-bold text-white">
              Empieza ahora, antes de la fecha límite
            </h2>
            <p className="mb-8 text-blue-100">
              NovaFactura ya está certificado. Migra en minutos y olvídate de VeriFactu para
              siempre.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-base font-semibold text-blue-700 shadow transition hover:bg-blue-50"
              >
                <Sparkles className="h-5 w-5" />
                Crear cuenta gratis — hasta 2027 sin coste
              </Link>
              <Link
                href="/verifactu"
                className="inline-flex items-center gap-2 text-sm text-blue-200 hover:text-white"
              >
                ¿Qué es VeriFactu? <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <RelatedLinksSection
          title="Más sobre VeriFactu"
          links={[
            {
              href: '/verifactu/software-garante',
              label: 'Software garante AEAT — ¿qué debe cumplir?',
            },
            { href: '/verifactu/sanciones', label: 'Sanciones por incumplimiento VeriFactu' },
            { href: '/facturacion-online', label: 'Software de facturación certificado VeriFactu' },
          ]}
        />

        <FooterLanding />
      </div>
    </>
  );
}

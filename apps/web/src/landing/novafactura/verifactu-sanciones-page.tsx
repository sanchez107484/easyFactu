import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, BadgeCheck, Scale, Shield, Sparkles, X } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';

export const novafacturaVerifactuSancionesMetadata: Metadata = {
  title: `Sanciones VeriFactu 2026: Multas de 50.000 € y Cómo Evitarlas | ${brandConfig.app.name}`,
  description:
    'Multa de 50.000 € al año para el usuario y 150.000 € al desarrollador (art. 201 bis LGT). Qué se considera infracción, quién inspecciona y cómo cumplir hoy.',
  keywords: [
    'sanciones verifactu',
    'multas verifactu',
    'sancion no usar verifactu',
    'multa facturar excel 2025',
    'sancion ley antifraude facturacion',
    'multa software no certificado',
    'inspeccion hacienda verifactu',
    'cuanto multa hacienda verifactu',
    'riesgo no cumplir verifactu',
    'sancion incumplimiento hash encadenado',
  ],
  alternates: { canonical: `${brandConfig.app.url}/verifactu/sanciones` },
  openGraph: {
    title: `Sanciones VeriFactu 2026: Multas de 50.000 € y Cómo Evitarlas | ${brandConfig.app.name}`,
    description:
      'Multa de 50.000 € al año para el usuario y 150.000 € al desarrollador (art. 201 bis LGT). Qué se considera infracción, quién inspecciona y cómo cumplir hoy.',
    url: `${brandConfig.app.url}/verifactu/sanciones`,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: `Sanciones VeriFactu 2026: Multas de 50.000 € y Cómo Evitarlas | ${brandConfig.app.name}`,
    description:
      'Multa de 50.000 € al año para el usuario y 150.000 € al desarrollador (art. 201 bis LGT). Qué se considera infracción, quién inspecciona y cómo cumplir hoy.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuánto es la multa por no cumplir VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La Ley Antifraude 11/2021 establece sanciones de hasta 50.000€ por el uso de software que no cumpla los requisitos de inalterabilidad y trazabilidad. Las multas específicas por factura pueden ir de 1.000€ a 10.000€ dependiendo de la gravedad y la reincidencia.',
      },
    },
    {
      '@type': 'Question',
      name: '¿La AEAT detecta automáticamente si no usas VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Al recibir las declaraciones trimestrales de IVA (modelo 303) o en una inspección, la AEAT puede cruzar los datos con el registro VeriFactu. Si tus facturas no tienen hash encadenado registrado en la AEAT, es señal inmediata de incumplimiento. Además, si un cliente escanea el QR de tu factura y no encuentra el registro en la AEAT, puede denunciarlo.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Hay multa si sigo facturando con Excel después del plazo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. Una vez superado el plazo obligatorio (1 de enero de 2027 para sociedades y 1 de julio de 2027 para autónomos persona física), emitir facturas con Excel o cualquier software no certificado puede acarrear las sanciones establecidas en la Ley Antifraude.',
      },
    },
  ],
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Sanciones VeriFactu 2026: Multas de 50.000 € y Cómo Evitarlas',
  description:
    'Multa de 50.000 € al año para el usuario y 150.000 € al desarrollador (art. 201 bis LGT). Qué se considera infracción, quién inspecciona y cómo cumplir hoy.',
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
      name: 'Sanciones',
      item: `${brandConfig.app.url}/verifactu/sanciones`,
    },
  ],
};

const infractions = [
  {
    severity: 'Leve',
    description:
      'No conservar las facturas emitidas con el hash correcto durante el período obligatorio.',
    fine: 'Hasta 1.000€ por infracción',
    color: 'amber',
  },
  {
    severity: 'Grave',
    description:
      'Usar software que no genera hash encadenado SHA-256 y QR, o que permite alterar facturas ya emitidas.',
    fine: '1.000€ – 10.000€',
    color: 'orange',
  },
  {
    severity: 'Muy grave',
    description:
      'Conducta reiterada, alteración deliberada del registro o colaboración con software diseñado para ocultar operaciones.',
    fine: 'Hasta 50.000€ + inspección completa',
    color: 'red',
  },
];

const risks = [
  {
    title: 'Inspección fiscal completa',
    desc: 'El incumplimiento de VeriFactu es un indicador de riesgo para la AEAT. Una inspección puede revisar los últimos 4 años de declaraciones.',
  },
  {
    title: 'Invalidez de las facturas',
    desc: 'Las facturas emitidas sin cumplir VeriFactu pueden ser consideradas no válidas fiscalmente, afectando a la deducción de IVA del receptor.',
  },
  {
    title: 'Responsabilidad del software',
    desc: 'Si tu asesor o gestor emite tus facturas con software no certificado, puede compartir la responsabilidad por la infracción.',
  },
  {
    title: 'Daño reputacional',
    desc: 'Tus clientes empresas pueden solicitar el QR de verificación de tus facturas. Si no existe, podrían cuestionar tu seriedad fiscal.',
  },
];

const howToAvoid = [
  {
    num: '01',
    title: 'Cambia a un software garante certificado',
    desc: 'La solución más sencilla: usar software como NovaFactura, que está certificado por la AEAT y hace todo de forma automática.',
  },
  {
    num: '02',
    title: 'Verifica la certificación de tu software actual',
    desc: 'Pregunta a tu proveedor si tiene certificación VeriFactu. Si no la tiene, cambia de proveedor antes del plazo.',
  },
  {
    num: '03',
    title: 'No esperes al último mes',
    desc: 'La migración de software requiere tiempo. Si esperas a diciembre 2025, corres el riesgo de entrar en incumplimiento mientras migras.',
  },
  {
    num: '04',
    title: 'Informa a tu asesor',
    desc: 'Tu gestor fiscal debe usar también software certificado. Asegúrate de que el programa que gestiona tu contabilidad cumple VeriFactu.',
  },
];

const faqs = [
  {
    q: '¿Cuáles son exactamente las sanciones por no usar VeriFactu?',
    a: 'La Ley General Tributaria y la Ley Antifraude 11/2021 establecen un régimen sancionador por niveles: hasta 1.000€ por cada factura emitida sin los requisitos técnicos obligatorios; hasta 10.000€ si la conducta afecta a un periodo impositivo completo; hasta 50.000€ si es reiterada o existe ocultación intencionada. Además, si la AEAT detecta ingresos no declarados gracias al cruce de datos VeriFactu, las sanciones adicionales pueden llegar al 150% de las cuotas defraudadas más intereses de demora.',
  },
  {
    q: '¿La AEAT detecta automáticamente si no usas VeriFactu?',
    a: 'Sí, a través de varios mecanismos. El principal es el cruce automático de datos: la AEAT compara las declaraciones trimestrales de IVA (modelo 303) con los registros VeriFactu recibidos. Si tus clientes deducen IVA de facturas que no aparecen en el registro VeriFactu, se genera una alerta automática. Además, cualquier persona puede escanear el QR de tu factura: si no encuentra el registro en la sede electrónica de la AEAT, puede denunciarlo directamente.',
  },
  {
    q: '¿Puedo usar Excel si todos mis clientes son particulares (B2C)?',
    a: 'No. La obligación de VeriFactu no distingue entre facturas a empresas (B2B) y a particulares (B2C). Cualquier factura emitida en el ejercicio de una actividad profesional debe cumplir los requisitos de hash encadenado, QR y registro en la AEAT. La única excepción son determinadas facturas simplificadas (tíckets de caja) en sectores tasados por reglamento, que tienen sus propias reglas.',
  },
  {
    q: '¿Y si mi facturación anual es muy pequeña?',
    a: 'La ley no establece ningún mínimo de facturación para la obligación de VeriFactu. Un autónomo que factura 3.000€ al año tiene exactamente las mismas obligaciones que uno que factura 3.000.000€. Las sanciones aplican igualmente con independencia del volumen. De hecho, las primeras actuaciones de la AEAT se centran habitualmente en sectores con alta presencia de economía sumergida, con independencia del tamaño del negocio.',
  },
  {
    q: '¿Cuándo puede la AEAT iniciar una inspección por VeriFactu?',
    a: 'La AEAT puede iniciar una comprobación en cualquier momento tras el plazo obligatorio. Lo más habitual es que surja tras un cruce de datos en la declaración anual (modelos 100 o 200), una denuncia de un tercero (proveedor, cliente, competidor) o como parte de un plan de inspección sectorial. Los sectores con mayor riesgo inicial son construcción, hostelería, comercio minorista y servicios profesionales de alto volumen en efectivo.',
  },
  {
    q: '¿Es posible regularizar la situación si no cumplí con VeriFactu?',
    a: 'Sí. La regularización voluntaria antes de que la AEAT inicie un procedimiento formal reduce significativamente las sanciones. Si llevas tiempo incumpliendo, lo recomendable es adoptar un software VeriFactu certificado de inmediato, presentar declaraciones complementarias si hubiera cuotas pendientes y consultar con un asesor fiscal. La regularización espontánea puede reducir las sanciones hasta un 75% respecto a las que se aplicarían en un procedimiento de inspección.',
  },
  {
    q: '¿Las sanciones de VeriFactu prescriben?',
    a: 'Sí. Las infracciones tributarias prescriben a los 4 años contados desde el día siguiente al de finalización del plazo de presentación de la declaración correspondiente (artículo 66 de la Ley General Tributaria). Durante esos 4 años la AEAT puede iniciar actuaciones en cualquier momento. Si el periodo prescribe sin que se haya actuado, la deuda queda extinguida.',
  },
];

export function NovafacturaVerifactuSancionesPage(): React.JSX.Element {
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
        <section className="bg-gradient-to-b from-red-50 to-white py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <PageBreadcrumb
              items={[
                { href: '/', label: 'Inicio' },
                { href: '/verifactu', label: 'VeriFactu' },
                { label: 'Sanciones' },
              ]}
              color="text-red-700"
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Ley Antifraude 11/2021 — Multas hasta 50.000€
            </div>
            <h1
              data-speakable
              className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl"
            >
              Sanciones por no cumplir VeriFactu
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
              La Ley Antifraude 11/2021 establece multas de <strong>hasta 50.000€</strong> para
              autónomos y empresas que sigan usando software no certificado para facturar. Conoce
              los riesgos y cómo evitarlos.
            </p>
          </div>
        </section>

        {/* Tabla sanciones */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              Escala de sanciones previstas en la Ley Antifraude
            </h2>
            <div className="space-y-4">
              {infractions.map((inf) => (
                <div
                  key={inf.severity}
                  className={`rounded-2xl border p-6 ${
                    inf.color === 'red'
                      ? 'border-red-200 bg-red-50'
                      : inf.color === 'orange'
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-amber-200 bg-amber-50'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span
                        className={`mb-2 inline-block rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wider ${
                          inf.color === 'red'
                            ? 'bg-red-100 text-red-800'
                            : inf.color === 'orange'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Infracción {inf.severity}
                      </span>
                      <p className="text-slate-700">{inf.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <p
                        className={`text-right text-lg font-bold ${
                          inf.color === 'red'
                            ? 'text-red-700'
                            : inf.color === 'orange'
                              ? 'text-orange-700'
                              : 'text-amber-700'
                        }`}
                      >
                        {inf.fine}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              * Importes orientativos según la escala establecida en la Ley Antifraude 11/2021 y la
              Ley General Tributaria. Las sanciones exactas las determina la AEAT en cada
              expediente.
            </p>
          </div>
        </section>

        {/* Otros riesgos */}
        <section className="bg-slate-50 py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-2xl font-bold text-slate-900">
              Más allá de la multa: otros riesgos del incumplimiento
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {risks.map((r) => (
                <div
                  key={r.title}
                  className="flex items-start gap-3 rounded-xl bg-white border border-neutral-100 p-5"
                >
                  <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">{r.title}</p>
                    <p className="text-sm text-slate-600">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo evitar las sanciones */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Cómo evitar las sanciones en 4 pasos
            </h2>
            <p className="mb-10 text-slate-600">
              La forma de evitar las sanciones es sencilla: usar software garante certificado.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {howToAvoid.map((step) => (
                <div key={step.num} className="flex gap-4">
                  <div className="flex-shrink-0 rounded-xl bg-green-100 px-3 py-2 text-sm font-bold text-green-700 h-fit">
                    {step.num}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 mb-1">{step.title}</p>
                    <p className="text-sm text-slate-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA intermedio */}
        <section className="bg-green-50 border border-green-100 mx-6 rounded-2xl py-10 md:mx-auto md:max-w-4xl md:px-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-900 mb-1">
                NovaFactura — Certificado. Automático. Gratis hasta 2027.
              </p>
              <p className="text-sm text-slate-600">
                Sin configurar nada: hash, QR y envío a la AEAT en cada factura.
              </p>
            </div>
            <Link
              href="/registro"
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-green-700"
            >
              <Sparkles className="h-4 w-4" />
              Empezar gratis
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre las sanciones por VeriFactu" />

        <RelatedLinksSection
          title="Más sobre VeriFactu"
          links={[
            { href: '/verifactu', label: '¿Qué es VeriFactu? — Guía completa AEAT' },
            {
              href: '/verifactu/cuando-es-obligatorio',
              label: '¿Cuándo es obligatorio VeriFactu?',
            },
            { href: '/verifactu/software-garante', label: 'Requisitos del software garante AEAT' },
            { href: '/facturacion-online', label: 'Software de facturación certificado' },
          ]}
        />

        <FooterLanding />
      </div>
    </>
  );
}

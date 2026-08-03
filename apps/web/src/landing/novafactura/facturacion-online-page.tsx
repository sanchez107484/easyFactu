import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Headphones,
  Lock,
  Send,
  Shield,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { brandConfig, PRICING } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';

const faqs = [
  {
    q: '¿Qué es un software de facturación online y en qué se diferencia de Excel?',
    a: 'Un software de facturación online es una aplicación web que permite crear, enviar y gestionar facturas desde cualquier dispositivo sin instalar nada. A diferencia de Excel, está diseñado para cumplir con la normativa fiscal española: genera numeración correlativa automática, calcula IVA e IRPF, produce PDFs con el formato legal correcto y está adaptado al Reglamento VeriFactu (hash encadenado y código QR), obligatorio para sociedades desde el 1 de enero de 2027 y para autónomos desde el 1 de julio de 2027. Excel no puede hacer nada de esto y su uso para facturar dejará de ser legal una vez superados esos plazos.',
  },
  {
    q: '¿Por qué ya no se puede facturar con Excel a partir de 2025?',
    a: 'La Ley Antifraude 11/2021 (Real Decreto 254/2025) exige que el software de facturación sea “garante”: debe generar un hash encadenado SHA-256 que vincula cada factura con la anterior, un código QR verificable por la AEAT y transmitir cada factura al registro de la Agencia Tributaria. Excel no puede cumplir ninguno de estos requisitos. Las sanciones por seguir usando Excel después del plazo pueden llegar hasta 50.000€ por ejercicio fiscal.',
  },
  {
    q: '¿Necesito instalar algo para usar NovaFactura?',
    a: 'No. NovaFactura funciona completamente en el navegador web (Chrome, Firefox, Safari, Edge) sin instalar nada. Es compatible con ordenador, móvil y tablet. Tus facturas se almacenan de forma segura en la nube con cifrado AES-256 y están disponibles desde cualquier dispositivo en cualquier momento.',
  },
  {
    q: '¿Cuánto cuesta NovaFactura?',
    a: `NovaFactura es completamente gratuito hasta 2027. A partir de entonces: Plan Starter ${PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes (VeriFactu incluido, hasta 60 facturas/año) o ${PRICING.starter.annualMonthly.toFixed(2).replace('.', ',')}€/mes en pago anual. Plan PRO ${PRICING.pro.monthly.toFixed(2).replace('.', ',')}€/mes (VeriFactu automático, facturas ilimitadas, soporte prioritario) o ${PRICING.pro.annualMonthly.toFixed(2).replace('.', ',')}€/mes anual. Sin permanencia.`,
  },
  {
    q: '¿NovaFactura está homologado por la AEAT como software garante?',
    a: 'Sí. NovaFactura es software garante certificado por la Agencia Tributaria española. Genera automáticamente el hash encadenado SHA-256, el código QR verificable y transmite cada factura al registro de la AEAT en tiempo real, cumpliendo íntegramente el Real Decreto 254/2025. El cumplimiento es automático desde la primera factura que emites.',
  },
  {
    q: '¿Puedo migrar mis facturas y clientes anteriores a NovaFactura?',
    a: 'Sí. Puedes importar tu base de clientes y el historial de facturas desde Excel, CSV o directamente desde Holded. El proceso es guiado y gratuito. Una vez importados, tus datos históricos quedan disponibles en tu cuenta para consulta y exportación.',
  },
  {
    q: '¿El software genera un resumen de IVA trimestral para el modelo 303?',
    a: 'NovaFactura genera un resumen de IVA trimestral con todos los datos necesarios para preparar el modelo 303: base imponible, cuota de IVA repercutido y cuota deducible. El resumen es exportable en PDF o Excel para que tú o tu asesor lo reviséis y presentéis el modelo en la sede electrónica de la AEAT.',
  },
];

export const novafacturaFacturacionOnlineMetadata: Metadata = {
  title: `Software de facturación online para autónomos y pymes — Gratis hasta 2027 | ${brandConfig.app.name}`,
  description:
    'Programa de facturación online con VeriFactu incluido. Crea facturas profesionales en 60 segundos, envía automáticamente a Hacienda y cumple la ley. Gratis hasta 2027. Sin tarjeta.',
  keywords: [
    'software de facturación online',
    'programa de facturación',
    'programa facturación autónomos',
    'software facturación pymes',
    'facturación online gratis',
    'programa facturar autónomo',
    'software facturar españa',
    'facturación verifactu',
    'programa facturación verifactu',
    'mejor programa facturación autónomos 2026',
  ],
  alternates: { canonical: `${brandConfig.app.url}/facturacion-online` },
  openGraph: {
    title: `Software de facturación online — Gratis hasta 2027 | ${brandConfig.app.name}`,
    description:
      'Programa de facturación con VeriFactu automático. Factura en 60 segundos y cumple con Hacienda sin esfuerzo.',
    url: `${brandConfig.app.url}/facturacion-online`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Software de facturación online gratis hasta 2027 | ${brandConfig.app.name}`,
    description: 'Factura en 60 segundos. VeriFactu automático. Sin tarjeta.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
  robots: { index: true, follow: true },
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: brandConfig.app.name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: `${brandConfig.app.url}/facturacion-online`,
  description:
    'Software de facturación online con VeriFactu automático para autónomos y pymes españolas. Gratis hasta 2027.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Completamente gratuito hasta 2027',
    validThrough: '2027-07-01',
  },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
    logo: { '@type': 'ImageObject', url: `${brandConfig.app.url}${brandConfig.logos.main}` },
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué es un software de facturación online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Es una aplicación web que permite crear, enviar y gestionar facturas desde cualquier dispositivo sin instalar nada. En España, desde 2025 también debe incluir VeriFactu (hash encadenado, QR y envío a la AEAT).',
      },
    },
    {
      '@type': 'Question',
      name: '¿Por qué ya no se puede facturar con Excel?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La Ley Antifraude 11/2021 obliga a usar software garante certificado por la AEAT. Excel, Word y otros programas no certificados no generan el hash encadenado SHA-256 ni el código QR obligatorio, por lo que las facturas emitidas con ellos no son válidas fiscalmente desde julio 2025.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Necesito instalar algo para usar NovaFactura?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. NovaFactura funciona completamente en el navegador web, sin instalaciones. Es compatible con ordenador, móvil y tablet.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta NovaFactura?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: `NovaFactura es completamente gratuito hasta 2027. Después, el Plan Starter cuesta ${PRICING.starter.monthly.toFixed(2).replace('.', ',')}€/mes y el Plan PRO ${PRICING.pro.monthly.toFixed(2).replace('.', ',')}€/mes, ambos con VeriFactu incluido.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿NovaFactura está homologado por la AEAT?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. NovaFactura es software garante certificado por la AEAT. Genera automáticamente el hash encadenado SHA-256, el código QR y transmite cada factura al registro de la Agencia Tributaria en tiempo real.',
      },
    },
  ],
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Software de facturación online',
      item: `${brandConfig.app.url}/facturacion-online`,
    },
  ],
};

const features = [
  {
    icon: Shield,
    title: 'VeriFactu 100% automático',
    description:
      'Hash encadenado, QR y envío a la AEAT incluidos en cada factura. Cumplimiento garantizado sin configurar nada.',
    highlight: true,
  },
  {
    icon: Zap,
    title: 'Factura en 60 segundos',
    description:
      'Interfaz diseñada para profesionales sin conocimientos contables. Primera factura en minutos.',
    highlight: false,
  },
  {
    icon: Send,
    title: 'Envío por email en PDF',
    description:
      'Tu cliente recibe la factura profesional por email al instante, con el QR VeriFactu incluido.',
    highlight: false,
  },
  {
    icon: FileText,
    title: 'Presupuestos y facturas',
    description:
      'Crea presupuestos y conviértelos en factura con un clic cuando el cliente confirme.',
    highlight: false,
  },
  {
    icon: Smartphone,
    title: 'Funciona en móvil',
    description: 'Factura desde casa del cliente, en obra o en desplazamiento. Sin instalar nada.',
    highlight: false,
  },
  {
    icon: Headphones,
    title: 'Soporte en español',
    description: 'Atención personalizada con respuesta en menos de 2 horas hábiles.',
    highlight: false,
  },
];

const comparisonRows = [
  { feature: 'Cumplimiento Ley Antifraude 11/2021', excel: false, traditional: false, nova: true },
  { feature: 'Hash encadenado SHA-256 automático', excel: false, traditional: false, nova: true },
  { feature: 'Código QR VeriFactu en cada factura', excel: false, traditional: false, nova: true },
  { feature: 'Envío automático a la AEAT', excel: false, traditional: 'Coste extra', nova: true },
  { feature: 'Gratis hasta 2027', excel: '—', traditional: false, nova: true },
  { feature: 'Sin instalación', excel: false, traditional: false, nova: true },
  { feature: 'Funciona en móvil', excel: false, traditional: 'Parcial', nova: true },
];

// Machine-readable version of the comparison table below.
const comparisonTableJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Table',
  name: `Comparativa: ${brandConfig.app.name} vs. Excel vs. software tradicional`,
  about:
    'Comparativa de cumplimiento de la Ley Antifraude 11/2021: hash encadenado SHA-256, código QR VeriFactu, envío automático a la AEAT, precio, instalación y uso en móvil.',
  description: `${brandConfig.app.name} cumple la Ley Antifraude 11/2021 con hash encadenado SHA-256 automático, código QR VeriFactu en cada factura y envío automático a la AEAT incluido. Ni Excel ni el software tradicional cumplen estos requisitos de serie: en el software tradicional el envío a la AEAT tiene coste extra.`,
};

const steps = [
  {
    num: '01',
    icon: FileText,
    title: 'Introduce los datos',
    desc: 'Cliente, concepto e importe. Menos de 60 segundos.',
  },
  {
    num: '02',
    icon: Shield,
    title: 'El software hace el resto',
    desc: 'Hash encadenado, QR y envío a la AEAT. Todo automático, sin que toques nada.',
  },
  {
    num: '03',
    icon: BadgeCheck,
    title: 'Factura entregada y registrada',
    desc: 'Tu cliente recibe el PDF. Hacienda tiene el registro. Tú, tranquilo.',
  },
];

const trustBadges = [
  { icon: CreditCard, text: 'Sin tarjeta al registrarte' },
  { icon: Clock, text: 'Activación inmediata' },
  { icon: Shield, text: 'Certificado AEAT' },
  { icon: Lock, text: 'RGPD compliant' },
];

function CheckCell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-green-600 font-semibold text-sm">✓ Sí</span>;
  if (value === false) return <span className="text-red-400 text-sm">✗ No</span>;
  return <span className="text-neutral-400 text-sm">{value}</span>;
}

export function NovafacturaFacturacionOnlinePage(): React.JSX.Element {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonTableJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
              <Shield className="h-4 w-4" />
              Software garante certificado AEAT · Ley Antifraude 11/2021
            </div>
            <h1 data-speakable className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              Programa de <span className="text-indigo-600">facturación online</span> para autónomos
              y pymes
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
              Factura en 60 segundos. VeriFactu automático incluido. Cumple con Hacienda sin
              conocimientos contables — y gratis hasta 2027.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-700"
              >
                <Sparkles className="h-5 w-5" />
                Empezar gratis — hasta 2027 sin coste
              </Link>
              <Link
                href="/precios"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
              >
                Ver planes y precios
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              {trustBadges.map((b) => {
                const Icon = b.icon;
                return (
                  <div key={b.text} className="flex items-center gap-1.5 text-sm text-slate-500">
                    <Icon className="h-4 w-4 text-indigo-500" />
                    {b.text}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Por qué Excel ya no es válido */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-8 md:p-10">
              <h2 className="mb-6 text-2xl font-bold text-slate-900">
                Excel ya no es válido para facturar en España
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: X,
                    title: 'Sin hash encadenado',
                    desc: 'Excel no genera el hash SHA-256 del Reglamento VeriFactu → factura no válida tras los plazos de 2027.',
                  },
                  {
                    icon: X,
                    title: 'Sin código QR',
                    desc: 'Cada factura debe llevar un QR verificable por la AEAT. Excel no puede generarlo.',
                  },
                  {
                    icon: X,
                    title: 'Sin envío a Hacienda',
                    desc: 'La AEAT debe recibir el registro en tiempo real. Con Excel, multas de hasta 50.000€.',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-3">
                      <div className="mt-0.5 flex-shrink-0 rounded-full bg-red-100 p-1">
                        <Icon className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                        <p className="text-sm text-slate-600 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-6 text-sm text-slate-600">
                <strong>La solución:</strong> NovaFactura genera el hash, el QR y envía a la AEAT
                automáticamente en cada factura. Tú solo introduces los datos.
              </p>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="bg-slate-50 py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-12 text-center text-3xl font-bold text-slate-900">
              Facturar online nunca fue tan fácil
            </h2>
            <div className="grid gap-8 sm:grid-cols-3">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.num} className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="mb-1 text-xs font-bold uppercase tracking-widest text-indigo-500">
                      Paso {step.num}
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-slate-900">{step.title}</h3>
                    <p className="text-sm text-slate-500">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Funcionalidades */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-4 text-center text-3xl font-bold text-slate-900">
              Todo lo que necesitas para facturar en España
            </h2>
            <p className="mb-12 text-center text-slate-500">
              Diseñado para autónomos y pymes que quieren cumplir la ley sin complicaciones.
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className={`rounded-2xl p-6 ${f.highlight ? 'bg-indigo-600 text-white' : 'border border-neutral-100 bg-white'}`}
                  >
                    <div
                      className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.highlight ? 'bg-white/20' : 'bg-indigo-50'}`}
                    >
                      <Icon
                        className={`h-5 w-5 ${f.highlight ? 'text-white' : 'text-indigo-600'}`}
                      />
                    </div>
                    <h3
                      className={`mb-2 font-bold ${f.highlight ? 'text-white' : 'text-slate-900'}`}
                    >
                      {f.title}
                    </h3>
                    <p className={`text-sm ${f.highlight ? 'text-indigo-100' : 'text-slate-500'}`}>
                      {f.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Tabla comparativa */}
        <section className="bg-slate-50 py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-center text-3xl font-bold text-slate-900">
              NovaFactura vs. Excel vs. software tradicional
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-neutral-100 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="px-6 py-4 text-left font-semibold text-slate-900">
                      Característica
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-500">Excel</th>
                    <th className="px-4 py-4 text-center font-semibold text-slate-500">
                      Software tradicional
                    </th>
                    <th className="px-4 py-4 text-center font-bold text-indigo-600">NovaFactura</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-6 py-3 text-slate-700">{row.feature}</td>
                      <td className="px-4 py-3 text-center">
                        <CheckCell value={row.excel} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckCell value={row.traditional} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <CheckCell value={row.nova} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-center text-sm leading-relaxed text-slate-500">
              En síntesis: ni Excel ni el software tradicional cumplen de serie la Ley Antifraude
              11/2021 — sin hash encadenado SHA-256, sin código QR VeriFactu y con el envío a la
              AEAT como coste extra. {brandConfig.app.name} lo incluye todo automáticamente, sin
              instalación y gratis hasta 2027.
            </p>
          </div>
        </section>

        {/* Para quién */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-center text-3xl font-bold text-slate-900">
              Diseñado para cualquier profesional que facture en España
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { title: 'Autónomos', desc: 'En estimación directa normal o simplificada.' },
                {
                  title: 'Freelances',
                  desc: 'Diseñadores, desarrolladores, consultores, creativos.',
                },
                {
                  title: 'Pequeñas empresas',
                  desc: 'SL, SA y otras formas jurídicas con facturación básica.',
                },
                {
                  title: 'Asesorías',
                  desc: 'Gestiona la facturación de todos tus clientes desde un panel centralizado. Gratis para siempre.',
                  link: '/asesoria',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 rounded-xl border border-neutral-100 p-5"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-500" />
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                    {item.link && (
                      <Link
                        href={item.link}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                      >
                        Más info para asesorías <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Precio */}
        <section className="bg-indigo-50 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">
              Gratis hasta 2027. Luego desde {PRICING.starter.monthly.toFixed(2).replace('.', ',')}
              €/mes.
            </h2>
            <p className="mb-8 text-slate-600">
              Sin tarjeta al registrarte. Sin permanencia. VeriFactu incluido en todos los planes.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-indigo-700"
              >
                <Sparkles className="h-5 w-5" />
                Crear mi cuenta gratis
              </Link>
              <Link href="/precios" className="text-sm font-medium text-indigo-700 hover:underline">
                Ver todos los planes →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre facturación online" />

        <RelatedLinksSection
          title="Guías de facturación"
          links={[
            { href: '/facturas', label: 'Todos los tipos de facturas' },
            {
              href: '/facturas/como-hacer-una-factura',
              label: 'Cómo hacer una factura paso a paso',
            },
            { href: '/verifactu', label: 'VeriFactu — guía completa AEAT' },
            {
              href: '/verifactu/cuando-es-obligatorio',
              label: '¿Cuándo es obligatorio VeriFactu?',
            },
          ]}
        />

        {/* CTA final */}
        <section className="border-t bg-slate-900 py-16 md:py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Empieza a facturar correctamente hoy
            </h2>
            <p className="mb-8 text-slate-400">
              Gratis hasta 2027. Sin tarjeta. Sin compromisos. VeriFactu automático desde el primer
              día.
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-indigo-400"
            >
              <Sparkles className="h-5 w-5" />
              Crear mi cuenta gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-4 text-sm text-slate-500">
              ¿Tienes dudas sobre VeriFactu?{' '}
              <Link href="/verifactu" className="text-indigo-400 hover:underline">
                Lee nuestra guía completa →
              </Link>
            </p>
          </div>
        </section>

        <FooterLanding />
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  FileText,
  Send,
  QrCode,
  Lock,
  Clock,
  BadgeCheck,
  ChevronRight,
  Info,
  Zap,
} from 'lucide-react';
import { brandConfig, PRICING } from '@easyfactura/brand-config';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { VerifactuDeadlines } from '@/components/verifactu-deadlines';

export const nafacturaVerifactuMetadata: Metadata = {
  title: `Cumplimiento fiscal para autónomos navarros — Guía 2027 | ${brandConfig.app.name}`,
  description:
    'Guía completa sobre las obligaciones de facturación para autónomos y pymes en Navarra. Hacienda Foral de Navarra, VeriFactu, fechas clave y cómo cumplir sin complicaciones.',
  keywords: [
    'facturación navarra',
    'hacienda foral navarra autónomos',
    'verifactu navarra',
    'software facturación navarra',
    'obligacion factura navarra',
    'autónomo navarra hacienda',
    'cumplimiento fiscal navarra',
    'software garante navarra',
    'factura electronica navarra',
    'ley antifraude navarra',
    'programa facturación navarra',
    'hacienda navarra irpf autónomo',
    'registro factura navarra',
    'naticket navarra',
    'naticket verifactu diferencia',
    'qué es naticket navarra',
  ],
  alternates: { canonical: `${brandConfig.app.url}/verifactu` },
  openGraph: {
    title: `Cumplimiento fiscal para autónomos navarros — Guía 2027 | ${brandConfig.app.name}`,
    description:
      'Todo lo que necesita saber un autónomo navarro sobre obligaciones de facturación: Hacienda Foral, VeriFactu y cómo cumplir con software certificado.',
    url: `${brandConfig.app.url}/verifactu`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `Cumplimiento fiscal Navarra — Guía para autónomos | ${brandConfig.app.name}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Cumplimiento fiscal autónomos Navarra 2027 | ${brandConfig.app.name}`,
    description:
      'VeriFactu y Hacienda Foral de Navarra: qué necesitas saber y cómo cumplir con software certificado.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
  robots: { index: true, follow: true },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Cumplimiento fiscal para autónomos en Navarra: guía completa 2027',
  description:
    'Guía sobre las obligaciones de facturación para autónomos navarros: Hacienda Foral de Navarra, VeriFactu y software certificado.',
  url: `${brandConfig.app.url}/verifactu`,
  datePublished: '2026-01-01',
  dateModified: '2026-05-11',
  wordCount: 2200,
  author: { '@type': 'Organization', name: brandConfig.app.name, url: brandConfig.app.url },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
    logo: { '@type': 'ImageObject', url: `${brandConfig.app.url}${brandConfig.logos.main}` },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${brandConfig.app.url}/verifactu` },
  about: {
    '@type': 'Thing',
    name: 'Facturación Navarra',
    description:
      'Obligaciones fiscales de facturación para autónomos navarros bajo la Hacienda Foral de Navarra.',
    sameAs: 'https://hacienda.navarra.es/',
  },
  mentions: [
    {
      '@type': 'Legislation',
      name: 'Ley Antifraude 11/2021',
      url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2021-9433',
    },
    {
      '@type': 'Organization',
      name: 'Hacienda Foral de Navarra',
      sameAs: 'https://hacienda.navarra.es/',
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Los autónomos navarros tienen que usar VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. VeriFactu es una obligación estatal que se aplica en toda España, incluida Navarra. Hacienda Foral de Navarra supervisa su cumplimiento. Desde julio de 2027, los autónomos navarros en estimación directa deben usar software garante certificado.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuándo es obligatorio en Navarra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Para autónomos navarros: 1 de julio de 2027. Para sociedades con sede en Navarra: 1 de enero de 2027. Desde julio de 2025, solo se puede adquirir software certificado.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuáles son las sanciones por no cumplir?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Las sanciones pueden llegar hasta 50.000€ por ejercicio fiscal, en consonancia con la Ley Antifraude 11/2021.',
      },
    },
    {
      '@type': 'Question',
      name: `¿${brandConfig.app.name} es válido para autónomos navarros?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Sí. ${brandConfig.app.name} está diseñado específicamente para autónomos navarros y cumple con todos los requisitos de Hacienda Foral de Navarra y el sistema VeriFactu de la AEAT.`,
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué es NaTicket y cómo afecta a los autónomos navarros?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'NaTicket es el sistema de trazabilidad de facturas que la Hacienda Foral de Navarra está desarrollando, complementario a VeriFactu. Cuando entre en vigor (previsiblemente a partir de 2027), los autónomos navarros deberán reportar tanto a la AEAT (VeriFactu) como a Hacienda Foral (NaTicket). NaFactura está siendo preparado para gestionar ambas obligaciones automáticamente.',
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
      name: 'Cumplimiento fiscal Navarra',
      item: `${brandConfig.app.url}/verifactu`,
    },
  ],
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Cómo emitir facturas cumpliendo con Hacienda Navarra',
  description:
    'Pasos para que un autónomo navarro cumpla con las obligaciones fiscales de facturación usando software certificado.',
  totalTime: 'PT1M',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Crea la factura en tu software certificado',
      text: 'Introduce los datos del cliente, conceptos e IVA navarro correspondiente.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'El sistema genera el hash encadenado',
      text: 'El software genera automáticamente el hash SHA-256 encadenado requerido por VeriFactu.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Se añade el código QR verificable',
      text: 'El QR único de la factura permite comprobar su autenticidad.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Envío automático a la AEAT',
      text: 'La factura se transmite automáticamente al registro de la AEAT, visible también para Hacienda Navarra.',
    },
  ],
};

const TIMELINE = [
  {
    date: 'Octubre 2024',
    datetime: '2024-10',
    event: 'Reglamento aprobado (Orden HAC/1177/2024)',
    detail:
      'Publicación en el BOE de los requisitos técnicos para software de facturación. Hacienda Navarra se adhiere al sistema estatal.',
    done: true,
  },
  {
    date: '1 julio 2025',
    datetime: '2025-07-01',
    event: 'Solo software certificado en el mercado',
    detail:
      'Los fabricantes solo pueden comercializar software garante. Nuevos contribuyentes navarros deben usarlo desde el primer día.',
    done: true,
  },
  {
    date: '1 enero 2027',
    datetime: '2027-01-01',
    event: 'Obligatorio para sociedades (SL, SA) en Navarra',
    detail:
      'Todas las sociedades con sede en Navarra deben emitir facturas verificables y registrarlas en la AEAT.',
    done: false,
  },
  {
    date: '1 julio 2027',
    datetime: '2027-07-01',
    event: 'Obligatorio para autónomos navarros',
    detail:
      'Los autónomos navarros en estimación directa deben usar exclusivamente software garante. Hacienda Foral supervisa el cumplimiento.',
    done: false,
  },
];

const HOW_IT_WORKS = [
  {
    icon: FileText,
    step: '1',
    title: 'Emites tu factura',
    description:
      'Creas la factura como siempre. El software aplica el tipo de IVA y IRPF correspondiente a tu actividad en Navarra.',
  },
  {
    icon: Lock,
    step: '2',
    title: 'El sistema genera el hash',
    description:
      'El software calcula el hash SHA-256 encadenado con la factura anterior, formando una cadena inalterable que Hacienda puede verificar.',
  },
  {
    icon: QrCode,
    step: '3',
    title: 'Se añade el código QR',
    description:
      'Un QR único aparece en el PDF de la factura. Cualquier cliente puede escanearlo para verificar su autenticidad en la AEAT.',
  },
  {
    icon: Send,
    step: '4',
    title: 'Envío automático',
    description:
      'El registro de la factura se transmite a la AEAT en tiempo real. Cumplimiento fiscal acreditado sin gestión manual.',
  },
];

const PENALTIES = [
  {
    type: 'Infracción leve',
    amount: 'Hasta 3.000€',
    cause: 'Incumplimientos formales menores sin ocultación de ingresos',
    color: 'yellow',
  },
  {
    type: 'Infracción grave',
    amount: 'Hasta 50.000€',
    cause: 'Uso de software no certificado o con doble registro por ejercicio fiscal',
    color: 'orange',
  },
  {
    type: 'Infracción muy grave',
    amount: '+ Posible delito fiscal',
    cause: 'Alteración deliberada del registro de facturación con fraude probado',
    color: 'red',
  },
];

const WHO_IS_AFFECTED = [
  { label: 'Autónomos navarros en estimación directa normal', affected: true },
  { label: 'Autónomos navarros en estimación directa simplificada', affected: true },
  { label: 'Sociedades con sede en Navarra (SL, SA)', affected: true },
  { label: 'Cooperativas y personas jurídicas en Navarra', affected: true },
  { label: 'Autónomos en módulos (estimación objetiva)', affected: false },
  { label: 'Autónomos sin obligación de emitir facturas', affected: false },
  { label: 'Regímenes especiales de IVA (REAGYP, recargo de equivalencia)', affected: false },
];

const FAQS = [
  {
    q: '¿Los autónomos navarros tienen que usar VeriFactu?',
    a: 'Sí. VeriFactu es una obligación estatal (Ley Antifraude 11/2021) que se aplica en toda España, incluida Navarra. Hacienda Foral de Navarra supervisa el cumplimiento. Desde el 1 de julio de 2027, los autónomos navarros en estimación directa deben usar software garante certificado.',
  },
  {
    q: '¿Hacienda Navarra tiene sus propias normas de facturación?',
    a: 'Hacienda Foral de Navarra gestiona el IRPF y el IVA de los navarros dentro de su Convenio Económico. En materia de VeriFactu, Navarra se ha adherido al sistema estatal de la AEAT. Aunque los navarros declaran ante Hacienda Navarra, el registro de facturas se realiza en la AEAT.',
  },
  {
    q: '¿Cuándo es obligatorio para los autónomos navarros?',
    a: 'Para autónomos navarros persona física en estimación directa: 1 de julio de 2027. Para sociedades con sede en Navarra: 1 de enero de 2027. A partir de julio de 2025, solo se puede adquirir software certificado en el mercado.',
  },
  {
    q: '¿Puedo seguir usando Excel?',
    a: 'No. Excel y cualquier software no certificado como "software garante" no es válido para emitir facturas una vez entre en vigor VeriFactu. Hacienda Navarra tampoco lo aceptará.',
  },
  {
    q: '¿Qué es el hash encadenado?',
    a: 'Es una firma digital SHA-256 que vincula cada factura con la anterior, formando una cadena inalterable. Si alguien intentara modificar o eliminar una factura, Hacienda podría detectarlo al instante.',
  },
  {
    q: '¿VeriFactu es lo mismo que la factura electrónica?',
    a: 'No. VeriFactu añade hash y QR a cualquier factura (incluso papel). La factura electrónica (Ley Crea y Crece) obliga a emitir en formato digital entre empresas. Son normativas complementarias que coexistirán.',
  },
  {
    q: `¿${brandConfig.app.name} es válido para autónomos navarros?`,
    a: `Sí. ${brandConfig.app.name} está diseñado específicamente para autónomos navarros: incluye los tipos impositivos navarros, se integra con el sistema VeriFactu de la AEAT, y cumple con todos los requisitos de Hacienda Foral de Navarra.`,
  },
  {
    q: '¿Qué es NaTicket y cómo afecta a los autónomos navarros?',
    a: 'NaTicket es el sistema de trazabilidad de facturas que la Hacienda Foral de Navarra está desarrollando. Es complementario a VeriFactu (no lo sustituye): los autónomos navarros podrían necesitar cumplir con ambos cuando NaTicket entre en vigor. NaFactura está siendo preparado para gestionar los dos sistemas automáticamente.',
  },
];

export function NafacturaVerifactuPage(): React.JSX.Element {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />

        {/* Hero */}
        <section id="cumplimiento-navarra" className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
              <Shield className="h-4 w-4" />
              Cumplimiento Hacienda Foral de Navarra · Normativa fiscal
            </div>
            <h1 data-speakable className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              ¿Qué necesito para facturar{' '}
              <span className="text-red-600">correctamente en Navarra</span>?
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
              Guía completa sobre las obligaciones fiscales de facturación para autónomos navarros:
              VeriFactu, Hacienda Foral de Navarra, fechas clave y cómo cumplir con software
              certificado.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-red-700"
              >
                Empezar gratis — hasta 2027 sin coste
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/precios"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
              >
                Ver planes y precios
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Definición */}
        <section id="definicion" className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-3xl font-bold text-slate-900">
              VeriFactu en Navarra: qué es y por qué te afecta
            </h2>
            <div className="space-y-4 text-slate-500 leading-relaxed">
              <p>
                <strong className="text-slate-900">VeriFactu</strong> es el sistema de verificación
                de facturas creado por la{' '}
                <a
                  href="https://www.boe.es/buscar/act.php?id=BOE-A-2021-9433"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-slate-900 underline decoration-dotted underline-offset-2 hover:text-red-600"
                >
                  Ley Antifraude 11/2021
                </a>
                . Obliga a usar software de facturación certificado por la AEAT que genere un{' '}
                <strong className="text-slate-900">hash encadenado SHA-256</strong> en cada factura
                y la transmita en tiempo real a Hacienda.
              </p>
              <p>
                <strong className="text-slate-900">¿Y si eres autónomo navarro?</strong> Aunque
                Navarra tiene su propia hacienda foral con competencias en IRPF e IVA, VeriFactu es
                legislación estatal de aplicación general.{' '}
                <strong className="text-slate-900">
                  Hacienda Foral de Navarra ha confirmado su adhesión al sistema
                </strong>
                , por lo que todos los autónomos navarros en estimación directa deben cumplir con
                estas obligaciones.
              </p>
            </div>
            <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <p className="text-sm text-red-800">
                  <strong>¿Navarra tiene sus propias normas?</strong> Hacienda Foral de Navarra
                  gestiona tu IRPF e IVA en virtud del Convenio Económico. Sin embargo, en materia
                  de VeriFactu, el registro de facturas se realiza en la AEAT siguiendo el sistema
                  estatal. Debes cumplir con ambas administraciones.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ventajas */}
        <section id="ventajas" className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">
              Ventajas para el autónomo navarro
            </h2>
            <p className="mb-10 text-slate-500">
              Más allá del cumplimiento legal, el software certificado simplifica tu gestión fiscal
              con Hacienda Navarra.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  icon: Shield,
                  title: 'Cero riesgo de sanción',
                  desc: 'Hacienda Foral y la AEAT verifican el cumplimiento en tiempo real. Con software certificado, tu registro queda automáticamente acreditado.',
                },
                {
                  icon: Clock,
                  title: 'Declaraciones más sencillas',
                  desc: 'Tus datos de facturación llegan a Hacienda Navarra en tiempo real. En el futuro próximo, tus modelos trimestrales estarán pre-rellenados.',
                },
                {
                  icon: BadgeCheck,
                  title: 'Facturas verificables',
                  desc: 'El QR de cada factura permite a tus clientes navarros comprobar su autenticidad al instante.',
                },
                {
                  icon: FileText,
                  title: 'Custodia en la AEAT',
                  desc: 'Las facturas quedan registradas en la AEAT. No tienes que preocuparte por la conservación durante los 4 años de prescripción.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
                    <Icon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-slate-900">{title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">
              Cómo cumplir con Hacienda Navarra, paso a paso
            </h2>
            <p className="mb-10 text-slate-500">
              Con {brandConfig.app.name}, diseñado para autónomos navarros, todo ocurre
              automáticamente.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }) => (
                <div
                  key={step}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                      {step}
                    </span>
                    <Icon className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="mb-2 font-semibold text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cronograma */}
        <section
          id="fechas-navarra"
          className="border-y border-slate-100 bg-slate-50 py-16 md:py-24"
        >
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-3xl font-bold text-slate-900">
              Fechas clave para autónomos navarros
            </h2>
            <div className="space-y-6">
              {TIMELINE.map(({ date, datetime, event, detail, done }) => (
                <div key={date} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${done ? 'bg-red-600 text-white' : 'border-2 border-orange-400 bg-orange-50 text-orange-600'}`}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="mt-2 h-full w-0.5 bg-slate-100 last:hidden" />
                  </div>
                  <div className="pb-8">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider ${done ? 'text-red-600' : 'text-orange-500'}`}
                    >
                      <time dateTime={datetime}>{date}</time>
                    </p>
                    <h3 className="mt-1 font-semibold text-slate-900">{event}</h3>
                    <p className="mt-1 text-sm text-slate-500">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-6">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <div>
                  <p className="font-semibold text-orange-900">
                    ¿Eres autónomo navarro activo antes de julio 2025?
                  </p>
                  <p className="mt-1 text-sm text-orange-700">
                    Tienes hasta el <strong>1 de julio de 2027</strong> para migrar a software
                    garante. No esperes al último momento — Hacienda Navarra supervisa el
                    cumplimiento activamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Plazos canónicos + fuentes BOE */}
        <section className="pb-16 md:pb-24">
          <div className="mx-auto max-w-4xl px-6">
            <VerifactuDeadlines />
          </div>
        </section>

        {/* A quién afecta */}
        <section id="a-quien-afecta" className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-3xl font-bold text-slate-900">
              ¿A qué autónomos navarros afecta?
            </h2>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white">
              {WHO_IS_AFFECTED.map(({ label, affected }) => (
                <div key={label} className="flex items-center gap-4 px-5 py-4">
                  {affected ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-red-600" />
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <span className="h-1.5 w-3 rounded bg-slate-400" />
                    </span>
                  )}
                  <span
                    className={`text-sm ${affected ? 'font-medium text-slate-900' : 'text-slate-500'}`}
                  >
                    {label}
                    {!affected && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                        Exento
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sanciones */}
        <section id="sanciones" className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-3xl font-bold text-slate-900">
              Sanciones por incumplimiento en Navarra
            </h2>
            <div className="space-y-4">
              {PENALTIES.map(({ type, amount, cause, color }) => (
                <div
                  key={type}
                  className={`rounded-2xl border p-5 ${color === 'yellow' ? 'border-yellow-100 bg-yellow-50' : color === 'orange' ? 'border-orange-100 bg-orange-50' : 'border-red-100 bg-red-50'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-wider ${color === 'yellow' ? 'text-yellow-700' : color === 'orange' ? 'text-orange-700' : 'text-red-700'}`}
                      >
                        {type}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">{cause}</p>
                    </div>
                    <p
                      className={`shrink-0 text-xl font-black ${color === 'yellow' ? 'text-yellow-700' : color === 'orange' ? 'text-orange-700' : 'text-red-700'}`}
                    >
                      {amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo cumplir */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-3xl font-bold text-slate-900">
              Cómo cumplir con Hacienda Navarra sin complicaciones
            </h2>
            <p className="mb-8 text-slate-500">
              Usa un <strong className="text-slate-900">software garante</strong> diseñado para
              autónomos navarros. {brandConfig.app.name} hace todo automáticamente.
            </p>
            <div className="space-y-4">
              {[
                {
                  icon: Zap,
                  title: 'Hash encadenado automático',
                  desc: 'Cada factura genera su hash SHA-256 encadenado sin que tengas que hacer nada. Cumplimiento técnico garantizado.',
                },
                {
                  icon: QrCode,
                  title: 'Código QR en todos los PDFs',
                  desc: 'El QR de verificación aparece automáticamente en todas tus facturas navarras.',
                },
                {
                  icon: Send,
                  title: 'Envío en tiempo real',
                  desc: 'Cada factura se transmite automáticamente al registro de la AEAT. Hacienda Navarra puede verificarlo en cualquier momento.',
                },
                {
                  icon: BadgeCheck,
                  title: 'Adaptado para Navarra',
                  desc: `${brandConfig.app.name} incluye los tipos impositivos navarros y cumple con los requisitos de Hacienda Foral de Navarra.`,
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                    <Icon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-sm text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-3xl bg-red-600 p-8 text-center text-white shadow-xl">
              <h3 className="mb-2 text-2xl font-bold">
                Gratis hasta 2027. Para autónomos navarros.
              </h3>
              <p className="mb-6 text-red-100">
                Empieza a facturar cumpliendo con Hacienda Navarra. Completamente gratuito hasta
                2027.
              </p>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-red-600 shadow-lg transition hover:bg-red-50"
              >
                Crear cuenta gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* NaTicket */}
        <section id="naticket-navarra" className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
              <span className="flex h-2 w-2 rounded-full bg-amber-500" />
              Próximamente · En desarrollo
            </div>
            <h2 className="mb-4 text-3xl font-bold text-slate-900">
              NaTicket: el futuro sistema de Hacienda Foral de Navarra
            </h2>
            <div className="space-y-4 text-slate-500 leading-relaxed">
              <p>
                Más allá de VeriFactu, la Hacienda Foral de Navarra está desarrollando{' '}
                <strong className="text-slate-900">NaTicket</strong>: su propio sistema de
                trazabilidad de facturas, complementario a VeriFactu y específico para el territorio
                navarro.
              </p>
              <p>
                A diferencia de VeriFactu (que reporta a la AEAT), NaTicket reportará directamente a
                Hacienda Foral de Navarra. Los autónomos navarros podrían necesitar cumplir con
                ambos sistemas simultáneamente cuando NaTicket entre en vigor, previsiblemente a
                partir de 2027.
              </p>
            </div>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm text-amber-800">
                <strong>Importante:</strong> NaTicket no sustituye a VeriFactu. Son sistemas
                complementarios. Como autónomo navarro, seguirás necesitando VeriFactu (AEAT) y,
                cuando esté listo, también NaTicket (Hacienda Navarra).{' '}
                <strong>{brandConfig.app.name}</strong> está siendo preparado para gestionar ambas
                obligaciones automáticamente sin que tengas que hacer nada.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/naticket"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-600"
              >
                Guía completa sobre NaTicket para autónomos navarros
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-3xl font-bold text-slate-900">
              Preguntas frecuentes sobre facturación en Navarra
            </h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="rounded-2xl border border-slate-100 bg-white p-6">
                  <h3 className="mb-2 font-semibold text-slate-900">{q}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Interlinks */}
        <RelatedLinksSection
          title="También te puede interesar"
          links={[
            {
              href: '/naticket',
              label: 'NaTicket para autónomos navarros',
              description: 'El futuro sistema de Hacienda Foral de Navarra, explicado',
            },
            {
              href: '/funcionalidades',
              label: 'Todas las funcionalidades',
              description: 'Descubre todo lo que incluye el software para autónomos navarros.',
            },
            {
              href: '/alternativa-holded-navarra',
              label: 'Alternativa a Holded en Navarra',
              description: 'Por qué los autónomos navarros prefieren NaFactura a Holded.',
            },
            {
              href: '/mejor-software-facturacion-navarra',
              label: 'Mejor software de facturación Navarra',
              description: 'Comparativa de los 4 mejores programas para autónomos navarros.',
            },
            {
              href: '/precios',
              label: 'Planes y precios',
              description: `Desde ${PRICING.starter.monthly}€/mes. Gratis hasta 2027.`,
            },
            {
              href: '/asesoria',
              label: 'Para asesorías en Navarra',
              description: 'Gestiona la facturación de todos tus clientes navarros.',
            },
          ]}
        />

        <FooterLanding />
      </div>
    </>
  );
}

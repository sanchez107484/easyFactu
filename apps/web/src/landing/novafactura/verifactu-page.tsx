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
import SiteHeader from '@/components/site-header';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';

export const novafacturaVerifactuMetadata: Metadata = {
  title: `¿Qué es VeriFactu? Guía completa para autónomos 2027 | ${brandConfig.app.name}`,
  description:
    'VeriFactu es el sistema de verificación de facturas de la AEAT obligatorio desde 2025-2027. Descubre qué es, a quién afecta, fechas de obligatoriedad, sanciones y cómo cumplir automáticamente.',
  keywords: [
    'qué es verifactu',
    'verifactu obligatorio',
    'verifactu autónomos',
    'verifactu 2025 2026',
    'sistema verifactu aeat',
    'verifactu ley antifraude',
    'software verifactu',
    'facturación verifactu',
    'hash encadenado factura',
    'factura verificable aeat',
    'obligación verifactu autónomos',
    'sanción verifactu',
    'qué necesito para verifactu',
    'software garante verifactu',
    'cumplir con verifactu',
    'verifactu qr factura',
  ],
  alternates: { canonical: `${brandConfig.app.url}/verifactu` },
  openGraph: {
    title: `¿Qué es VeriFactu? Guía completa para autónomos 2027 | ${brandConfig.app.name}`,
    description:
      'Todo lo que necesitas saber sobre VeriFactu: qué es, a quién afecta, fechas obligatorias, sanciones y cómo tu software puede hacerlo automático.',
    url: `${brandConfig.app.url}/verifactu`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `VeriFactu — Guía completa para autónomos | ${brandConfig.app.name}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `¿Qué es VeriFactu? Guía completa 2027 | ${brandConfig.app.name}`,
    description:
      'VeriFactu es obligatorio para autónomos y empresas. Descubre qué es, cuándo entra en vigor y cómo cumplir sin complicaciones.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '¿Qué es VeriFactu? Guía completa para autónomos y pymes 2027',
  description:
    'VeriFactu es el sistema de verificación de facturas de la Agencia Tributaria española, obligatorio desde 2025-2027.',
  url: `${brandConfig.app.url}/verifactu`,
  datePublished: '2026-01-01',
  dateModified: '2026-05-11',
  wordCount: 2500,
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
    name: 'VeriFactu',
    description:
      'Sistema de verificación de facturas de la Agencia Tributaria Española, regulado por la Ley Antifraude 11/2021 y la Orden HAC/1177/2024.',
    sameAs: 'https://www.agenciatributaria.es/',
  },
  mentions: [
    {
      '@type': 'Legislation',
      name: 'Ley Antifraude 11/2021',
      url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2021-9433',
    },
    {
      '@type': 'Legislation',
      name: 'Orden HAC/1177/2024',
      url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2024-22138',
    },
    {
      '@type': 'Organization',
      name: 'Agencia Tributaria',
      sameAs: 'https://www.agenciatributaria.es/',
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué es VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VeriFactu es el sistema de verificación de facturas de la Agencia Tributaria española (AEAT), creado por la Ley Antifraude 11/2021. Obliga a que cada factura incluya un hash encadenado SHA-256, un código QR verificable y sea transmitida en tiempo real a la AEAT.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuándo es obligatorio VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Desde el 1 de julio de 2025 para nuevos contribuyentes. Desde el 1 de enero de 2027 para sociedades (SL, SA) y desde el 1 de julio de 2027 para autónomos persona física en estimación directa (Orden HAC/1177/2024).',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuáles son las sanciones por no usar VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Las sanciones pueden llegar hasta 50.000€ por ejercicio fiscal. El uso de software no homologado puede considerarse infracción tributaria grave.',
      },
    },
    {
      '@type': 'Question',
      name: `¿Cómo puedo cumplir con VeriFactu sin complicaciones?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Usando un software garante certificado por la AEAT como ${brandConfig.app.name}. Genera automáticamente el hash encadenado, el código QR y envía cada factura a la AEAT en tiempo real.`,
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
      name: 'VeriFactu',
      item: `${brandConfig.app.url}/verifactu`,
    },
  ],
};

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Cómo emitir facturas con VeriFactu paso a paso',
  description:
    'Pasos para emitir facturas que cumplan con el sistema VeriFactu de la AEAT usando un software garante certificado.',
  totalTime: 'PT1M',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Crea la factura en tu software garante',
      text: 'Introduce los datos del cliente, conceptos, cantidades e IVA en el software como siempre.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'El sistema genera el hash encadenado SHA-256',
      text: 'El software calcula automáticamente el hash SHA-256 encadenado con la factura anterior, formando una cadena inalterable.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Se añade el código QR verificable',
      text: 'El sistema genera un código QR único que permite verificar la autenticidad de la factura.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Envío automático en tiempo real a la AEAT',
      text: 'El registro de la factura se transmite automáticamente al sistema de la Agencia Tributaria.',
    },
  ],
};

const TIMELINE = [
  {
    date: 'Octubre 2024',
    datetime: '2024-10',
    event: 'Reglamento aprobado (Orden HAC/1177/2024)',
    detail:
      'Se publica en el BOE la Orden HAC/1177/2024 que fija los requisitos técnicos para los programas de facturación.',
    done: true,
  },
  {
    date: '1 julio 2025',
    datetime: '2025-07-01',
    event: 'Solo software homologado en el mercado',
    detail:
      'Los fabricantes de software solo pueden comercializar programas certificados. Nuevos contribuyentes deben usar software garante desde el primer día.',
    done: true,
  },
  {
    date: '1 enero 2027',
    datetime: '2027-01-01',
    event: 'Obligatorio para sociedades (SL, SA)',
    detail:
      'Todas las sociedades limitadas, anónimas y otras personas jurídicas deben emitir y enviar facturas verificables en tiempo real.',
    done: false,
  },
  {
    date: '1 julio 2027',
    datetime: '2027-07-01',
    event: 'Obligatorio para autónomos',
    detail:
      'Los autónomos persona física que tributen en estimación directa deben usar exclusivamente software garante para emitir facturas.',
    done: false,
  },
];

const HOW_IT_WORKS = [
  {
    icon: FileText,
    step: '1',
    title: 'Emites tu factura',
    description:
      'Creas la factura en el software como siempre. Con los datos del cliente, los conceptos y el IVA correspondiente.',
  },
  {
    icon: Lock,
    step: '2',
    title: 'El sistema genera el hash',
    description:
      'El software calcula automáticamente el hash SHA-256 que incluye los datos de la factura enlazados con el hash de la factura anterior, formando una cadena inalterable.',
  },
  {
    icon: QrCode,
    step: '3',
    title: 'Se añade el código QR',
    description:
      'Se genera un código QR único para esa factura que permite verificar su autenticidad escaneándolo. Aparece impreso en el PDF de la factura.',
  },
  {
    icon: Send,
    step: '4',
    title: 'Envío automático a la AEAT',
    description:
      'El registro de la factura se transmite en tiempo real al sistema de la Agencia Tributaria. Queda guardada en su base de datos de forma permanente.',
  },
];

const PENALTIES = [
  {
    type: 'Infracción leve',
    amount: 'Hasta 3.000€',
    cause: 'Incumplimientos formales sin ocultación de ingresos',
    color: 'yellow',
  },
  {
    type: 'Infracción grave',
    amount: 'Hasta 50.000€',
    cause: 'Uso de software no homologado o con doble registro por ejercicio fiscal',
    color: 'orange',
  },
  {
    type: 'Infracción muy grave',
    amount: '+ Posible delito fiscal',
    cause: 'Alteración deliberada de registros de facturación con fraude probado',
    color: 'red',
  },
];

const WHO_IS_AFFECTED = [
  { label: 'Autónomos en estimación directa normal', affected: true },
  { label: 'Autónomos en estimación directa simplificada', affected: true },
  { label: 'Sociedades limitadas y anónimas', affected: true },
  { label: 'Cooperativas y otras personas jurídicas', affected: true },
  { label: 'Autónomos en módulos (estimación objetiva)', affected: false },
  { label: 'Autónomos sin obligación de emitir facturas', affected: false },
  { label: 'Regímenes especiales de IVA (REAGYP, recargo de equivalencia)', affected: false },
];

const FAQS = [
  {
    q: '¿Qué es VeriFactu exactamente?',
    a: 'VeriFactu (Verificación de Facturas) es el sistema de control fiscal de la Agencia Tributaria española creado por la Ley Antifraude 11/2021 y desarrollado por el Real Decreto 254/2025. Obliga a que cada factura lleve un hash encadenado SHA-256 que la vincula con la anterior, un código QR verificable por cualquier persona y sea enviada automáticamente al registro de la AEAT. Su objetivo principal es eliminar el fraude del "software de doble uso", que permitía a los negocios mantener dos contabilidades paralelas eliminando facturas sin dejar rastro.',
  },
  {
    q: '¿Cuándo es obligatorio VeriFactu en España?',
    a: 'Desde el 1 de julio de 2025 para nuevos contribuyentes que se den de alta en el Censo de Empresarios. Desde el 1 de enero de 2027 para sociedades (SL, SA, cooperativas y demás personas jurídicas). Desde el 1 de julio de 2027 para autónomos persona física en estimación directa. Estas fechas están fijadas por la Orden HAC/1177/2024 y el Real Decreto 254/2025 y son definitivas.',
  },
  {
    q: '¿Cuáles son las sanciones concretas por no cumplir con VeriFactu?',
    a: 'Las sanciones oscilan entre 1.000€ por incidente aislado y 50.000€ por ejercicio fiscal si la conducta es reiterada o grave. El uso de software que permita modificar o eliminar facturas —lo que la ley denomina "software de doble uso"— puede tipificarse como infracción muy grave con multas proporcionales al volumen de negocio oculto. Además, la AEAT puede reclamar las cuotas de IVA e IRPF no declaradas con sus correspondientes recargos e intereses de demora.',
  },
  {
    q: '¿Puedo seguir usando Excel o Word para emitir facturas?',
    a: 'No. Excel, Word y cualquier software no certificado como "software garante" dejan de ser válidos legalmente a partir de los plazos establecidos. La razón es técnica: Excel permite modificar o borrar filas sin dejar rastro, lo que es incompatible con el requisito de inalterabilidad del registro. Tampoco puede generar el hash encadenado SHA-256 ni conectarse a la API de la AEAT. Usar Excel después del plazo puede derivar en sanciones de hasta 50.000€.',
  },
  {
    q: '¿Qué es el hash encadenado SHA-256 de VeriFactu?',
    a: 'El hash encadenado es una firma digital que se genera para cada factura incluyendo los datos de la factura anterior. Si alguien intentara modificar o eliminar una factura, la cadena se rompería y la AEAT lo detectaría inmediatamente al comparar el registro. El algoritmo SHA-256 es el estándar de seguridad utilizado también en la firma de contratos electrónicos y certificados digitales. Es el mecanismo técnico central que hace que VeriFactu sea a prueba de fraude.',
  },
  {
    q: '¿VeriFactu es lo mismo que la factura electrónica (Ley Crea y Crece)?',
    a: 'No, son normativas distintas y complementarias. VeriFactu (Ley Antifraude 11/2021) añade hash encadenado y QR a cualquier factura — incluso las impresas en papel — y afecta a todos los negocios. La factura electrónica (Ley Crea y Crece, pendiente de reglamento definitivo) obligará a intercambiar facturas en formato digital estructurado (Facturae XML) entre empresas (B2B). Deberás cumplir con ambas normativas, aunque los plazos y el ámbito de aplicación son distintos.',
  },
  {
    q: '¿Qué información muestra el código QR de VeriFactu?',
    a: 'El código QR incluye el número de la factura, el NIF del emisor, la fecha, el importe total y el hash encadenado. Cualquier persona — tus clientes, la AEAT o un inspector — puede escanearlo para verificar que la factura está registrada correctamente en el sistema de la Agencia Tributaria. Si el QR no encuentra el registro, la factura puede considerarse inválida y tu cliente podría denunciarlo.',
  },
  {
    q: `¿${brandConfig.app.name} es software garante certificado por la AEAT?`,
    a: `Sí. ${brandConfig.app.name} está certificado como software garante VeriFactu por la Agencia Tributaria. Genera automáticamente el hash encadenado SHA-256, el código QR verificable y transmite cada factura al registro de la AEAT en tiempo real, cumpliendo íntegramente el Real Decreto 254/2025. No necesitas configurar ningún parámetro técnico: el cumplimiento es automático desde la primera factura que emites.`,
  },
];

export function NovafacturaVerifactuPage(): React.JSX.Element {
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
        <section
          id="que-es-verifactu"
          className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-20 md:py-28"
        >
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <Shield className="h-4 w-4" />
              Obligatorio desde julio 2025 · Ley Antifraude 11/2021
            </div>
            <h1 data-speakable className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              ¿Qué es <span className="text-blue-600">VeriFactu</span>?
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
              El sistema de verificación de facturas de la AEAT que obliga a autónomos y empresas a
              usar software certificado para emitir facturas. Te explicamos todo lo que necesitas
              saber — y cómo cumplir sin complicaciones.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-blue-700"
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
              Qué es VeriFactu y por qué existe
            </h2>
            <div className="space-y-4 text-slate-500 leading-relaxed">
              <p>
                <strong className="text-slate-900">VeriFactu</strong> (Verificación de Facturas) es
                el sistema creado por la{' '}
                <a
                  href="https://www.boe.es/buscar/act.php?id=BOE-A-2021-9433"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-slate-900 underline decoration-dotted underline-offset-2 hover:text-blue-600"
                >
                  Ley Antifraude 11/2021
                </a>{' '}
                que obliga a los contribuyentes españoles a usar software de facturación certificado
                por la Agencia Tributaria (AEAT).
              </p>
              <p>
                Antes de VeriFactu, era técnicamente posible emitir una factura, cobrarla, y después
                modificarla o eliminarla del software para ocultar ingresos a Hacienda. VeriFactu lo
                hace imposible: cada factura queda firmada digitalmente con un{' '}
                <strong className="text-slate-900">hash encadenado SHA-256</strong> que la vincula
                con la anterior, y la información se envía en tiempo real a la AEAT.
              </p>
            </div>
            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <p className="text-sm text-blue-800">
                  <strong>¿Y la factura electrónica (Ley Crea y Crece)?</strong> No es lo mismo.
                  VeriFactu añade hash y QR a cualquier factura (incluso las de papel). La factura
                  electrónica obliga a emitir en formato digital estructurado entre empresas. Son
                  normativas complementarias.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Ventajas */}
        <section id="ventajas" className="border-y border-slate-100 bg-slate-50 py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">
              ¿Qué ventajas tiene usar VeriFactu?
            </h2>
            <p className="mb-10 text-slate-500">
              Más allá del cumplimiento legal, VeriFactu simplifica la gestión fiscal.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  icon: Shield,
                  title: 'Cero riesgo de sanción',
                  desc: 'Al enviar cada factura en tiempo real a la AEAT, tu cumplimiento queda acreditado automáticamente. Sanciones de hasta 50.000€ que dejan de ser un riesgo.',
                },
                {
                  icon: Clock,
                  title: 'Declaraciones fiscales más rápidas',
                  desc: 'La AEAT recibe tus datos en tiempo real. En el futuro próximo, tus modelos trimestrales (303, 130) estarán pre-rellenados automáticamente.',
                },
                {
                  icon: BadgeCheck,
                  title: 'Más confianza con tus clientes',
                  desc: 'Cada factura lleva el sello "VERI*FACTU" y un código QR verificable. Tus clientes pueden comprobar su autenticidad al instante.',
                },
                {
                  icon: FileText,
                  title: 'Custodia de facturas en la AEAT',
                  desc: 'Al estar registradas en la Agencia Tributaria, la AEAT las custodia por ti. Sin necesidad de guardarlas 4 años por tu cuenta.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="h-6 w-6 text-blue-600" />
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
              Cómo funciona VeriFactu, paso a paso
            </h2>
            <p className="mb-10 text-slate-500">
              Con un software garante como {brandConfig.app.name}, todo ocurre automáticamente.
            </p>
            <div className="grid gap-6 sm:grid-cols-2">
              {HOW_IT_WORKS.map(({ icon: Icon, step, title, description }) => (
                <div
                  key={step}
                  className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                      {step}
                    </span>
                    <Icon className="h-5 w-5 text-blue-600" />
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
          id="fechas-obligatoriedad"
          className="border-y border-slate-100 bg-slate-50 py-16 md:py-24"
        >
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-3xl font-bold text-slate-900">Fechas de obligatoriedad</h2>
            <div className="space-y-6">
              {TIMELINE.map(({ date, datetime, event, detail, done }) => (
                <div key={date} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${done ? 'bg-blue-600 text-white' : 'border-2 border-orange-400 bg-orange-50 text-orange-600'}`}
                    >
                      {done ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div className="mt-2 h-full w-0.5 bg-slate-100 last:hidden" />
                  </div>
                  <div className="pb-8">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider ${done ? 'text-blue-600' : 'text-orange-500'}`}
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
                    ¿Empezaste actividad antes de julio 2025?
                  </p>
                  <p className="mt-1 text-sm text-orange-700">
                    Tienes hasta el <strong>1 de enero de 2027</strong> si eres una sociedad (SL,
                    SA), o hasta el <strong>1 de julio de 2027</strong> si eres autónomo, para
                    migrar a software garante. No esperes al último momento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* A quién afecta */}
        <section id="a-quien-afecta" className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-8 text-3xl font-bold text-slate-900">¿A quién afecta VeriFactu?</h2>
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white">
              {WHO_IS_AFFECTED.map(({ label, affected }) => (
                <div key={label} className="flex items-center gap-4 px-5 py-4">
                  {affected ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600" />
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
              Sanciones por no cumplir con VeriFactu
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
              Cómo cumplir con VeriFactu sin complicaciones
            </h2>
            <p className="mb-8 text-slate-500">
              La forma más sencilla es usar un{' '}
              <strong className="text-slate-900">software garante</strong> que haga todo
              automáticamente. {brandConfig.app.name} es uno de ellos.
            </p>
            <div className="space-y-4">
              {[
                {
                  icon: Zap,
                  title: 'Hash encadenado automático',
                  desc: 'Cada factura genera su hash SHA-256 encadenado con la anterior sin que tengas que hacer nada.',
                },
                {
                  icon: QrCode,
                  title: 'Código QR en todos los PDFs',
                  desc: 'El QR de verificación aparece automáticamente en todas tus facturas imprimibles.',
                },
                {
                  icon: Send,
                  title: 'Envío en tiempo real a la AEAT',
                  desc: 'Cada factura se transmite automáticamente al registro de la Agencia Tributaria en el momento de su emisión.',
                },
                {
                  icon: BadgeCheck,
                  title: 'Homologado por la Agencia Tributaria',
                  desc: `${brandConfig.app.name} está certificado como software garante. Cumplimiento garantizado con la Ley Antifraude 11/2021.`,
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="mt-1 text-sm text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-3xl bg-blue-600 p-8 text-center text-white shadow-xl">
              <h3 className="mb-2 text-2xl font-bold">Gratis hasta 2027. Sin tarjeta.</h3>
              <p className="mb-6 text-blue-100">
                Empieza a facturar con VeriFactu hoy. Completamente gratuito hasta 2027.
              </p>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-blue-600 shadow-lg transition hover:bg-blue-50"
              >
                Crear cuenta gratis
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={FAQS} title="Preguntas frecuentes sobre VeriFactu" />

        {/* Sub-páginas VeriFactu */}
        <section className="py-10">
          <div className="mx-auto max-w-4xl px-6">
            <p className="mb-4 text-sm font-medium text-slate-500">Profundiza en VeriFactu</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                {
                  href: '/verifactu/cuando-es-obligatorio',
                  label: '¿Cuándo es obligatorio VeriFactu?',
                },
                {
                  href: '/verifactu/software-garante',
                  label: 'Requisitos del software garante AEAT',
                },
                {
                  href: '/verifactu/sanciones',
                  label: 'Sanciones por incumplimiento — hasta 50.000€',
                },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-2 rounded-xl border border-neutral-100 px-4 py-3 text-sm font-medium text-slate-700 hover:border-blue-200 hover:text-blue-600 transition-colors"
                >
                  <ArrowRight className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <RelatedLinksSection
          title="También te puede interesar"
          links={[
            {
              href: '/funcionalidades',
              label: 'Todas las funcionalidades',
              description: 'Descubre qué incluye el software más allá de VeriFactu.',
            },
            {
              href: '/precios',
              label: 'Planes y precios',
              description: `Desde ${PRICING.starter.monthly}€/mes. Gratis hasta 2027 para empezar.`,
            },
            {
              href: '/asesoria',
              label: 'Para asesorías',
              description: 'Gestiona el VeriFactu de todos tus clientes. Gratis para asesorías.',
            },
          ]}
        />

        <FooterLanding />
      </div>
    </>
  );
}

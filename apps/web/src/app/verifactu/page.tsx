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
import FooterLanding from '@/components/FooterLanding';

// ?????????????????????????????????????????????????????????????????????????????
// SEO — Metadata
// ?????????????????????????????????????????????????????????????????????????????
export const metadata: Metadata = {
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
  alternates: {
    canonical: `${brandConfig.app.url}/verifactu`,
  },
  openGraph: {
    title: `¿Qué es VeriFactu? Guía completa para autónomos 2027 | ${brandConfig.app.name}`,
    description:
      'Todo lo que necesitas saber sobre VeriFactu: qué es, a quién afecta, fechas obligatorias, sanciones y cómo tu software puede hacerlo automático.',
    url: `${brandConfig.app.url}/verifactu`,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}/og-image.jpg`,
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
    images: [`${brandConfig.app.url}/og-image.jpg`],
  },
};

// ?????????????????????????????????????????????????????????????????????????????
// JSON-LD structured data
// ?????????????????????????????????????????????????????????????????????????????
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: '¿Qué es VeriFactu? Guía completa para autónomos y pymes 2027',
  description:
    'VeriFactu es el sistema de verificación de facturas de la Agencia Tributaria española, obligatorio desde 2025-2027. Descubre qué es, a quién afecta y cómo cumplir.',
  url: `${brandConfig.app.url}/verifactu`,
  datePublished: '2026-01-01',
  dateModified: '2026-05-11',
  wordCount: 2500,
  author: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
    logo: {
      '@type': 'ImageObject',
      url: `${brandConfig.app.url}/brand/logo.png`,
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${brandConfig.app.url}/verifactu`,
  },
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
  speakable: {
    '@type': 'SpeakableSpecification',
    cssSelector: ['h1', 'h2', 'p:first-of-type'],
  },
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
        text: 'VeriFactu es el sistema de verificación de facturas de la Agencia Tributaria española (AEAT), creado por la Ley Antifraude 11/2021. Obliga a que cada factura incluya un hash encadenado SHA-256, un código QR verificable y sea transmitida en tiempo real a la AEAT. Su objetivo es eliminar el fraude fiscal que permite modificar o eliminar facturas sin dejar rastro.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuándo es obligatorio VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VeriFactu es obligatorio desde el 1 de julio de 2025 para los nuevos contribuyentes. Para los existentes: desde el 1 de enero de 2027 para sociedades (SL, SA) y desde el 1 de julio de 2027 para autónomos persona física en estimación directa (según la Orden HAC/1177/2024).',
      },
    },
    {
      '@type': 'Question',
      name: '¿A quién afecta VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'VeriFactu afecta a autónomos que tributen en estimación directa (normal o simplificada) y a las empresas (sociedades limitadas, anónimas, etc.) que usen software de facturación. Están exentos los autónomos en módulos (estimación objetiva), los que no estén obligados a emitir facturas y algunos regímenes especiales.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué es el hash encadenado de VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El hash encadenado es una firma digital SHA-256 que vincula cada factura con la anterior, creando una cadena inalterable. Si alguien intentara modificar o eliminar una factura, la cadena se rompería y sería detectable por la AEAT. Es la columna vertebral técnica de VeriFactu.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuáles son las sanciones por no usar VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Las sanciones por incumplir con VeriFactu pueden llegar hasta 50.000€ por cada ejercicio fiscal. Además, el uso de software que permita modificar o eliminar facturas (los llamados "dobles registros") puede considerarse delito fiscal. La Ley Antifraude 11/2021 establece que el incumplimiento es una infracción tributaria grave.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puedo seguir usando Excel para mis facturas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. Excel, Word y cualquier software que no esté certificado como "software garante" por la AEAT deja de ser legal para emitir facturas una vez entre en vigor VeriFactu. Solo los programas homologados por la Agencia Tributaria pueden generar facturas válidas con el hash encadenado y el código QR requeridos.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué es un "software garante" de VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Un software garante es un programa de facturación certificado por la AEAT que garantiza la integridad de los registros de facturación. Implementa automáticamente el hash encadenado SHA-256, el código QR verificable y la transmisión en tiempo real al registro de la Agencia Tributaria. NovaFactura es software garante certificado.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué es el código QR de VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El código QR de VeriFactu es un código bidimensional que se imprime en cada factura y permite que cualquier persona verifique su autenticidad escaneándolo. Al escanearlo, se accede al registro de la AEAT donde consta la factura original. Si la factura fue alterada, el QR lo detecta.',
      },
    },
    {
      '@type': 'Question',
      name: '¿VeriFactu es lo mismo que la factura electrónica?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No son lo mismo, aunque están relacionados. La factura electrónica (Ley Crea y Crece) obliga a empresas y autónomos a emitir facturas en formato digital estructurado (XML/JSON) cuando facturen a otras empresas. VeriFactu es un sistema de verificación que añade hash encadenado y QR a cualquier factura (también las impresas en papel). Ambas normativas son complementarias.',
      },
    },
    {
      '@type': 'Question',
      name: `¿Cómo puedo cumplir con VeriFactu sin complicaciones?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Usando un software garante certificado por la AEAT como ${brandConfig.app.name}. El sistema genera automáticamente el hash encadenado, el código QR y envía cada factura al registro de la AEAT en el momento de su emisión. No necesitas saber nada de informática ni de la normativa técnica — el software lo hace todo por ti.`,
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
      text: 'El software calcula automáticamente el hash SHA-256 encadenado con la factura anterior, formando una cadena inalterable que no puede modificarse.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Se añade el código QR verificable',
      text: 'El sistema genera un código QR único que permite verificar la autenticidad de la factura escaneándolo. Aparece impreso en el PDF.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Envío automático en tiempo real a la AEAT',
      text: 'El registro de la factura se transmite automáticamente al sistema de la Agencia Tributaria en el momento de confirmarla. Sin acciones manuales.',
    },
  ],
};

// ?????????????????????????????????????????????????????????????????????????????
// Static data
// ?????????????????????????????????????????????????????????????????????????????
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
    q: '¿Qué es VeriFactu?',
    a: 'VeriFactu es el sistema de verificación de facturas de la Agencia Tributaria española (AEAT), creado por la Ley Antifraude 11/2021. Obliga a que cada factura incluya un hash encadenado SHA-256, un código QR verificable y sea transmitida en tiempo real a la AEAT. Su objetivo es eliminar el fraude fiscal que permite modificar o eliminar facturas sin dejar rastro.',
  },
  {
    q: '¿Cuándo es obligatorio VeriFactu?',
    a: 'Desde el 1 de julio de 2025 para nuevos contribuyentes. Desde el 1 de enero de 2027 para sociedades (SL, SA) y desde el 1 de julio de 2027 para autónomos persona física en estimación directa (Orden HAC/1177/2024).',
  },
  {
    q: '¿Cuáles son las sanciones por no cumplir?',
    a: 'Las sanciones pueden llegar hasta 50.000€ por ejercicio fiscal. El uso de software que permita modificar o eliminar facturas sin rastro puede considerarse además una infracción tributaria grave.',
  },
  {
    q: '¿Puedo seguir usando Excel?',
    a: 'No. Excel, Word y cualquier software no certificado como "software garante" deja de ser legal para emitir facturas una vez entre en vigor VeriFactu. Solo los programas homologados por la AEAT pueden generar facturas válidas.',
  },
  {
    q: '¿Qué es el hash encadenado?',
    a: 'Es una firma digital SHA-256 que vincula cada factura con la anterior, creando una cadena inalterable. Si alguien intentara modificar o eliminar una factura, la cadena se rompería y sería detectable por la AEAT.',
  },
  {
    q: '¿VeriFactu es lo mismo que la factura electrónica?',
    a: 'No. La factura electrónica (Ley Crea y Crece) obliga a emitir facturas en formato digital entre empresas. VeriFactu añade hash encadenado y QR a cualquier factura, incluyendo las impresas en papel. Son normativas complementarias.',
  },
  {
    q: `¿${brandConfig.app.name} es software garante?`,
    a: `Sí. ${brandConfig.app.name} está certificado como software garante por la AEAT. Genera automáticamente el hash encadenado SHA-256, el código QR y transmite cada factura al registro de la Agencia Tributaria en tiempo real. No necesitas configurar nada.`,
  },
];

// ?????????????????????????????????????????????????????????????????????????????
// Page
// ?????????????????????????????????????????????????????????????????????????????
export default function VerifactuPage() {
  return (
    <>
      {/* JSON-LD */}
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

      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <SiteHeader />

        {/* ?? Hero ??????????????????????????????????????????????????????????? */}
        <section
          id="que-es-verifactu"
          className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-950 py-20 md:py-28"
        >
          <div className="mx-auto max-w-7xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
              <Shield className="h-4 w-4" />
              Obligatorio desde julio 2025 · Ley Antifraude 11/2021
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              ¿Qué es <span className="text-blue-600 dark:text-blue-400">VeriFactu</span>?
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              El sistema de verificación de facturas de la AEAT que obliga a autónomos y empresas a
              usar software certificado para emitir facturas. Te explicamos todo lo que necesitas
              saber — y cómo cumplir sin complicaciones.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-blue-700"
              >
                Empezar gratis — {PRICING.freePeriodMonths} meses sin coste
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/precios"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-7 py-3.5 text-base font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
              >
                Ver planes y precios
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ?? Definición ?????????????????????????????????????????????????????? */}
        <section id="definicion" className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Qué es VeriFactu y por qué existe
            </h2>
            <div className="space-y-4 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                <strong className="text-gray-900 dark:text-white">VeriFactu</strong> (Verificación
                de Facturas) es el sistema creado por la{' '}
                <a
                  href="https://www.boe.es/buscar/act.php?id=BOE-A-2021-9433"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-gray-900 underline decoration-dotted underline-offset-2 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                >
                  Ley Antifraude 11/2021
                </a>{' '}
                que obliga a los contribuyentes españoles a usar software de facturación certificado
                por la Agencia Tributaria (AEAT).
              </p>
              <p>
                Antes de VeriFactu, era técnicamente posible emitir una factura, cobrarla, y después
                modificarla o eliminarla del software para ocultar ingresos a Hacienda. Esto es lo
                que se conoce como{' '}
                <strong className="text-gray-900 dark:text-white">software de doble uso</strong> o{' '}
                <strong className="text-gray-900 dark:text-white">caja B</strong>, y generaba
                pérdidas de millones de euros de recaudación fiscal al año.
              </p>
              <p>
                VeriFactu lo hace imposible: cada factura queda firmada digitalmente con un{' '}
                <strong className="text-gray-900 dark:text-white">hash encadenado SHA-256</strong>{' '}
                que la vincula con la anterior, y la información se envía en tiempo real a la AEAT.
                Cualquier modificación posterior sería inmediatamente detectable.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-900/50 dark:bg-blue-950/20">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>¿Y la factura electrónica (Ley Crea y Crece)?</strong> No es lo mismo.
                  VeriFactu añade hash y QR a cualquier factura (incluso las de papel). La factura
                  electrónica obliga a emitir en formato digital estructurado entre empresas. Son
                  normativas complementarias, no alternativas.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ?? Ventajas ??????????????????????????????????????????????????????? */}
        <section id="ventajas" className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                ¿Qué ventajas tiene usar VeriFactu?
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Más allá del cumplimiento legal, VeriFactu simplifica la gestión fiscal.
              </p>
            </div>
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
                  desc: 'Al estar registradas en la Agencia Tributaria, no necesitas conservarlas durante 4 años. La AEAT las custodia por ti.',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
                      <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ?? Cómo funciona ??????????????????????????????????????????????????? */}
        <section id="como-funciona" className="bg-gray-50 py-16 dark:bg-gray-900/50 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                Cómo funciona VeriFactu, paso a paso
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Con un software garante como {brandConfig.app.name}, todo ocurre automáticamente.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              {HOW_IT_WORKS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                        {item.step}
                      </span>
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ?? Cronograma ?????????????????????????????????????????????????????? */}
        <section id="fechas-obligatoriedad" className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-10 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Fechas de obligatoriedad
            </h2>
            <div className="space-y-6">
              {TIMELINE.map((item) => (
                <div key={item.date} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        item.done
                          ? 'bg-blue-600 text-white'
                          : 'border-2 border-orange-400 bg-orange-50 text-orange-600 dark:bg-orange-950/20'
                      }`}
                    >
                      {item.done ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Clock className="h-5 w-5" />
                      )}
                    </div>
                    <div className="mt-2 h-full w-0.5 bg-gray-100 last:hidden dark:bg-gray-800" />
                  </div>
                  <div className="pb-8">
                    <p
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        item.done ? 'text-blue-600 dark:text-blue-400' : 'text-orange-500'
                      }`}
                    >
                      <time dateTime={item.datetime}>{item.date}</time>
                    </p>
                    <h3 className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {item.event}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-6 dark:border-orange-900/30 dark:bg-orange-950/10">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <div>
                  <p className="font-semibold text-orange-900 dark:text-orange-300">
                    ¿Empezaste actividad antes de julio 2025?
                  </p>
                  <p className="mt-1 text-sm text-orange-700 dark:text-orange-400">
                    Tienes hasta el <strong>1 de enero de 2027</strong> si eres una sociedad (SL,
                    SA), o hasta el <strong>1 de julio de 2027</strong> si eres autónomo, para
                    migrar a software garante. No esperes al último momento — cambiar de software
                    lleva tiempo y formación.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ?? A quién afecta ??????????????????????????????????????????????????? */}
        <section id="a-quien-afecta" className="bg-gray-50 py-16 dark:bg-gray-900/50 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-8 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              ¿A quién afecta VeriFactu?
            </h2>
            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
              {WHO_IS_AFFECTED.map((item) => (
                <div key={item.label} className="flex items-center gap-4 px-5 py-4">
                  {item.affected ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      <span className="h-1.5 w-3 rounded bg-gray-400" />
                    </span>
                  )}
                  <span
                    className={`text-sm ${
                      item.affected
                        ? 'font-medium text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {item.label}
                    {!item.affected && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        Exento
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              * Consulta con tu asesor si tienes dudas sobre tu régimen específico. Si tu caso no
              está en esta lista, lo más probable es que sí estés afectado.
            </p>
          </div>
        </section>

        {/* ?? Comparativa ???????????????????????????????????????????????????????????????????????? */}
        <section id="comparativa" className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              VeriFactu vs software de facturación tradicional
            </h2>
            <p className="mb-8 text-gray-600 dark:text-gray-400">
              Qué cambia en tu negocio cuando usas software garante frente a Excel u otro software
              no homologado.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm dark:border-gray-800">
              <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900">
                    <th className="w-2/5 px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Característica
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-red-600 dark:text-red-400">
                      Sin VeriFactu (Excel / no homologado)
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Con VeriFactu (software garante)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-950">
                  {[
                    {
                      feature: 'Envío a la AEAT',
                      noVf: '❌ No envía',
                      vf: '✅ Automático en tiempo real',
                    },
                    {
                      feature: 'Hash encadenado SHA-256',
                      noVf: '❌ No disponible',
                      vf: '✅ En cada factura',
                    },
                    {
                      feature: 'Código QR verificable',
                      noVf: '❌ No incluido',
                      vf: '✅ Impreso en el PDF',
                    },
                    {
                      feature: 'Legalidad desde 2027',
                      noVf: '❌ Ilegal (sin homologar)',
                      vf: '✅ 100% conforme',
                    },
                    {
                      feature: 'Riesgo de sanción',
                      noVf: '⚠️ Hasta 50.000€/año',
                      vf: '✅ Ninguno',
                    },
                    {
                      feature: 'Custodia de facturas',
                      noVf: '⚠️ Tu responsabilidad (4 años)',
                      vf: '✅ La AEAT las custodia',
                    },
                    {
                      feature: 'Modificar facturas emitidas',
                      noVf: '⚠️ Posible (y sancionable)',
                      vf: '✅ Protegido e inalterable',
                    },
                    {
                      feature: 'Declaraciones fiscales',
                      noVf: '⚠️ 100% manuales',
                      vf: '✅ Pre-rellenadas por AEAT',
                    },
                  ].map((row) => (
                    <tr key={row.feature} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        {row.noVf}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-medium text-gray-900 dark:text-white">
                        {row.vf}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ?? Sanciones ????????????????????????????????????????????????????????????????????????? */}
        <section id="sanciones" className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-8 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Sanciones por no cumplir con VeriFactu
            </h2>
            <div className="space-y-4">
              {PENALTIES.map((penalty) => (
                <div
                  key={penalty.type}
                  className={`rounded-2xl border p-5 ${
                    penalty.color === 'yellow'
                      ? 'border-yellow-100 bg-yellow-50 dark:border-yellow-900/30 dark:bg-yellow-950/10'
                      : penalty.color === 'orange'
                        ? 'border-orange-100 bg-orange-50 dark:border-orange-900/30 dark:bg-orange-950/10'
                        : 'border-red-100 bg-red-50 dark:border-red-900/30 dark:bg-red-950/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          penalty.color === 'yellow'
                            ? 'text-yellow-700 dark:text-yellow-400'
                            : penalty.color === 'orange'
                              ? 'text-orange-700 dark:text-orange-400'
                              : 'text-red-700 dark:text-red-400'
                        }`}
                      >
                        {penalty.type}
                      </p>
                      <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                        {penalty.cause}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-xl font-black ${
                        penalty.color === 'yellow'
                          ? 'text-yellow-700 dark:text-yellow-400'
                          : penalty.color === 'orange'
                            ? 'text-orange-700 dark:text-orange-400'
                            : 'text-red-700 dark:text-red-400'
                      }`}
                    >
                      {penalty.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ?? Cómo cumplir con NovaFactura ??????????????????????????????????? */}
        <section className="bg-gray-50 py-16 dark:bg-gray-900/50 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Cómo cumplir con VeriFactu sin complicaciones
            </h2>
            <p className="mb-8 text-gray-600 dark:text-gray-400">
              La forma más sencilla de cumplir con VeriFactu es usar un{' '}
              <strong className="text-gray-900 dark:text-white">software garante</strong> que haga
              todo automáticamente. {brandConfig.app.name} es uno de ellos.
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
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{feature.title}</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 rounded-3xl bg-blue-600 p-8 text-center text-white shadow-xl dark:bg-blue-700">
              <h3 className="mb-2 text-2xl font-bold">
                {PRICING.freePeriodMonths} meses gratis. Sin tarjeta.
              </h3>
              <p className="mb-6 text-blue-100">
                Empieza a facturar con VeriFactu hoy. Completamente gratuito durante{' '}
                {PRICING.freePeriodMonths} meses.
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

        {/* ?? FAQ ???????????????????????????????????????????????????????????? */}
        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-10 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Preguntas frecuentes sobre VeriFactu
            </h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <div
                  key={q}
                  className="rounded-2xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
                >
                  <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">{q}</h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ?? Interlinks ?????????????????????????????????????????????????????? */}
        <section className="border-t border-gray-100 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900/50">
          <div className="mx-auto max-w-7xl px-6">
            <p className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              También te puede interesar
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  href: '/funcionalidades',
                  title: 'Todas las funcionalidades',
                  desc: 'Descubre qué incluye el software más allá de VeriFactu.',
                },
                {
                  href: '/precios',
                  title: 'Planes y precios',
                  desc: `Desde ${PRICING.starter.monthly}€/mes. ${PRICING.freePeriodMonths} meses gratis para empezar.`,
                },
                {
                  href: '/asesoria',
                  title: 'Para asesorías',
                  desc: 'Gestiona el VeriFactu de todos tus clientes. Gratis para asesorías.',
                },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-2xl border border-gray-100 bg-white p-5 transition hover:border-blue-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-800"
                >
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                    {link.title} →
                  </p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{link.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <FooterLanding />
      </div>
    </>
  );
}

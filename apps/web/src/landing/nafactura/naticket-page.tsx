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
  Clock,
  BadgeCheck,
  ChevronRight,
  Info,
  Zap,
  HelpCircle,
  Building2,
  Map,
  BarChart3,
  Layers,
} from 'lucide-react';
import { brandConfig, PRICING } from '@easyfactura/brand-config';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import SiteHeader from '@/components/site-header';
import FooterLanding from '@/components/FooterLanding';
import { VerifactuDeadlines } from '@/components/verifactu-deadlines';

// ─────────────────────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────────────────────
export const nafacturaNavicketMetadata: Metadata = {
  title: `NaTicket Navarra 2027: qué es y cuándo será obligatorio | ${brandConfig.app.name}`,
  description:
    'Guía actualizada de NaTicket, el sistema de Hacienda Foral de Navarra: qué es, a quién obliga, calendario previsto y diferencias con VeriFactu y TicketBAI.',
  keywords: [
    'NaTicket',
    'NaTicket Navarra',
    'qué es NaTicket',
    'NaTicket software compatible',
    'NaTicket autónomos Navarra',
    'NaTicket cuándo obligatorio',
    'NaTicket vs VeriFactu',
    'NaTicket TicketBAI diferencia',
    'NaTicket Hacienda Navarra',
    'facturación electrónica Navarra',
    'sistema facturación foral Navarra',
    'TicketBAI Navarra autónomos',
    'VeriFactu Navarra autónomos',
    'software facturación Navarra NaTicket',
    'Hacienda Foral Navarra factura electrónica',
    'naticket software',
    'naticket navarra 2027',
    'programa facturación naticket',
  ],
  alternates: { canonical: `${brandConfig.app.url}/naticket` },
  openGraph: {
    title: `NaTicket Navarra 2027: qué es y cuándo será obligatorio | ${brandConfig.app.name}`,
    description:
      'Guía actualizada de NaTicket, el sistema de Hacienda Foral de Navarra: qué es, a quién obliga, calendario previsto y diferencias con VeriFactu y TicketBAI.',
    url: `${brandConfig.app.url}/naticket`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `NaTicket Navarra — Guía para autónomos | ${brandConfig.app.name}`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `NaTicket Navarra 2027: qué es y cuándo será obligatorio | ${brandConfig.app.name}`,
    description:
      'Guía actualizada de NaTicket, el sistema de Hacienda Foral de Navarra: qué es, a quién obliga, calendario previsto y diferencias con VeriFactu y TicketBAI.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
  robots: { index: true, follow: true },
};

// ─────────────────────────────────────────────────────────────────────────────
// Schema.org JSON-LD
// ─────────────────────────────────────────────────────────────────────────────
const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'NaTicket Navarra 2027: qué es y cuándo será obligatorio',
  description:
    'Guía actualizada de NaTicket, el sistema de Hacienda Foral de Navarra: qué es, a quién obliga, calendario previsto y diferencias con VeriFactu y TicketBAI.',
  url: `${brandConfig.app.url}/naticket`,
  datePublished: '2026-05-19',
  dateModified: '2026-05-19',
  wordCount: 2800,
  author: { '@type': 'Organization', name: brandConfig.app.name, url: brandConfig.app.url },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
    logo: { '@type': 'ImageObject', url: `${brandConfig.app.url}${brandConfig.logos.main}` },
  },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${brandConfig.app.url}/naticket` },
  about: {
    '@type': 'Thing',
    name: 'NaTicket',
    description:
      'Sistema de trazabilidad de facturas de la Hacienda Foral de Navarra, equivalente a VeriFactu para el territorio navarro.',
    sameAs: 'https://hacienda.navarra.es/',
  },
  mentions: [
    {
      '@type': 'Organization',
      name: 'Hacienda Foral de Navarra',
      sameAs: 'https://hacienda.navarra.es/',
    },
    {
      '@type': 'Legislation',
      name: 'Ley Antifraude 11/2021',
      url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2021-9433',
    },
    {
      '@type': 'Thing',
      name: 'VeriFactu',
      description:
        'Sistema de verificación de facturas de la AEAT para el territorio común español.',
    },
    {
      '@type': 'Thing',
      name: 'TicketBAI',
      description:
        'Sistema de control de facturación de las haciendas vascas y foral de Navarra para el sector minorista.',
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué es NaTicket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'NaTicket es el sistema de trazabilidad y registro de facturas que la Hacienda Foral de Navarra está desarrollando para los autónomos y empresas navarras. Es el equivalente navarro de VeriFactu (AEAT) y similar al TicketBAI del País Vasco: obligará a registrar cada factura emitida ante Hacienda Navarra para garantizar su autenticidad e inalterabilidad.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuándo será obligatorio NaTicket en Navarra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A fecha de mayo de 2026, NaTicket se encuentra en fase de desarrollo técnico. La Hacienda Foral de Navarra no ha publicado todavía un calendario oficial de obligatoriedad. Se espera su implementación progresiva a partir de 2027, pero las fechas exactas están pendientes de confirmación oficial. El sistema VeriFactu (AEAT) sí es ya de aplicación y los autónomos navarros en estimación directa deben cumplirlo desde julio de 2027.',
      },
    },
    {
      '@type': 'Question',
      name: '¿NaTicket sustituye a VeriFactu en Navarra?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. NaTicket y VeriFactu son sistemas complementarios, no sustitutivos. VeriFactu es legislación estatal que se aplica en toda España, incluida Navarra. NaTicket será el sistema específico de Hacienda Foral de Navarra para el registro de facturas dentro del territorio navarro. Los autónomos navarros podrían necesitar cumplir con ambos sistemas simultáneamente.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Los autónomos navarros tienen que usar VeriFactu Y NaTicket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Actualmente, VeriFactu (AEAT) es obligatorio para todos los autónomos españoles en estimación directa, incluidos los navarros, desde julio de 2027. NaTicket es el sistema que Hacienda Foral de Navarra está desarrollando de forma complementaria. Es probable que los autónomos navarros deban cumplir con ambos: VeriFactu para el registro en la AEAT y NaTicket para el registro en Hacienda Foral de Navarra.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué diferencia hay entre NaTicket y TicketBAI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'TicketBAI es el sistema ya operativo del País Vasco (y adoptado parcialmente en Navarra para el sector minorista) que obliga a registrar tickets y facturas. NaTicket es el nuevo sistema que Hacienda Foral de Navarra está desarrollando con un alcance más amplio, que irá más allá del comercio minorista y cubrirá la facturación de todos los autónomos y pymes navarras.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Es NaTicket lo mismo que TicketBAI?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No exactamente. TicketBAI ya está implantado en el País Vasco y en Navarra para el sector minorista (comercio, hostelería). NaTicket es un sistema nuevo que Hacienda Foral de Navarra está desarrollando para ampliar la trazabilidad de facturas a todos los sectores y tipos de actividad, con mayor cobertura que el actual TicketBAI navarro.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo me preparo para NaTicket siendo autónomo navarro?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'La mejor forma de prepararse para NaTicket es usar ya un software de facturación adaptado a Navarra que cumpla con VeriFactu (el sistema ya activo de la AEAT) y que esté siendo preparado para la integración con NaTicket. Así cuando NaTicket entre en vigor, tu software ya estará listo sin necesidad de cambiar. NaFactura está siendo desarrollado específicamente para esta doble compatibilidad.',
      },
    },
    {
      '@type': 'Question',
      name: `¿${brandConfig.app.name} será compatible con NaTicket?`,
      acceptedAnswer: {
        '@type': 'Answer',
        text: `Sí. ${brandConfig.app.name} está siendo desarrollado con la compatibilidad NaTicket como prioridad. Nuestra arquitectura ya implementa el hash encadenado SHA-256 (requerido por VeriFactu) y estamos preparando la integración con Hacienda Foral de Navarra para cuando NaTicket entre en vigor. Los usuarios de ${brandConfig.app.name} no necesitarán cambiar de software cuando NaTicket sea obligatorio.`,
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
      name: 'NaTicket Navarra',
      item: `${brandConfig.app.url}/naticket`,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const COMPARISON_TABLE = [
  {
    feature: 'Ámbito territorial',
    naticket: 'Comunidad Foral de Navarra',
    verifactu: 'España (territorio común)',
    ticketbai: 'País Vasco + Navarra (minorista)',
  },
  {
    feature: 'Hacienda receptora',
    naticket: 'Hacienda Foral de Navarra',
    verifactu: 'AEAT (Agencia Tributaria)',
    ticketbai: 'Haciendas vascas / Hacienda Navarra',
  },
  {
    feature: 'Tipo de facturación',
    naticket: 'Toda factura (en desarrollo)',
    verifactu: 'Toda factura (B2B y B2C)',
    ticketbai: 'Tickets y facturas sector minorista',
  },
  {
    feature: 'Estado actual',
    naticket: 'En desarrollo (2026)',
    verifactu: 'Activo desde jul. 2025',
    ticketbai: 'Activo en EH, parcial en Navarra',
  },
  {
    feature: 'Obligatoriedad prevista',
    naticket: 'Pendiente de calendario oficial',
    verifactu: '1 jul. 2027 (autónomos navarros)',
    ticketbai: 'Ya obligatorio en Euskadi',
  },
  {
    feature: 'Normativa base',
    naticket: 'Decreto foral (pendiente)',
    verifactu: 'Ley Antifraude 11/2021',
    ticketbai: 'Norma foral vasca / Navarra',
  },
];

// Machine-readable version of the NaTicket / VeriFactu / TicketBAI comparison
// table (the visual table already renders plain text cells).
const comparisonTableJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Table',
  name: 'Comparativa: NaTicket vs. VeriFactu vs. TicketBAI',
  about:
    'Comparativa de los sistemas de verificación de facturas en España: ámbito territorial, hacienda receptora, tipo de facturación, estado actual, obligatoriedad prevista y normativa base.',
  description:
    'VeriFactu (AEAT) está activo desde julio de 2025 y será obligatorio para los autónomos navarros el 1 de julio de 2027. NaTicket, el sistema de Hacienda Foral de Navarra, está en desarrollo y pendiente de calendario oficial. TicketBAI ya es obligatorio en Euskadi y aplica al sector minorista. Los autónomos navarros probablemente tendrán que reportar a VeriFactu y NaTicket a la vez desde el mismo software.',
};

const AFFECTED_GROUPS = [
  {
    label: 'Autónomos navarros en estimación directa',
    affected: true,
    note: 'Con toda probabilidad',
  },
  {
    label: 'Sociedades limitadas (SL) con sede en Navarra',
    affected: true,
    note: 'Con toda probabilidad',
  },
  { label: 'Pymes y cooperativas navarras', affected: true, note: 'Con toda probabilidad' },
  {
    label: 'Profesionales liberales navarros (médicos, abogados, etc.)',
    affected: true,
    note: 'Con toda probabilidad',
  },
  {
    label: 'Autónomos navarros en módulos (estimación objetiva)',
    affected: false,
    note: 'Probablemente exentos',
  },
  {
    label: 'Autónomos sin obligación de emitir facturas',
    affected: false,
    note: 'Fuera de ámbito',
  },
];

const TIMELINE = [
  {
    date: 'Nov. 2025',
    datetime: '2025-11',
    event: 'Hacienda Navarra anuncia el proyecto NaTicket',
    detail:
      'La Hacienda Foral de Navarra comunica el inicio del desarrollo técnico de NaTicket en reuniones con asociaciones empresariales navarras.',
    done: true,
  },
  {
    date: '2026',
    datetime: '2026',
    event: 'Fase de desarrollo técnico y consulta pública',
    detail:
      'La Hacienda Foral de Navarra trabaja en la arquitectura técnica de NaTicket. Se esperan consultas públicas con el sector.',
    done: false,
    current: true,
  },
  {
    date: '2027',
    datetime: '2027',
    event: 'Implementación progresiva esperada',
    detail:
      'Se espera que NaTicket comience su implantación progresiva a lo largo de 2027, aunque las fechas exactas aún no son oficiales.',
    done: false,
  },
];

const FAQS = [
  {
    q: '¿Qué es NaTicket?',
    a: 'NaTicket es el sistema de trazabilidad y registro de facturas que la Hacienda Foral de Navarra está desarrollando. Es el equivalente navarro de VeriFactu (AEAT) y similar al TicketBAI del País Vasco: obligará a registrar cada factura emitida ante Hacienda Navarra para garantizar su autenticidad e inalterabilidad.',
  },
  {
    q: '¿Cuándo será obligatorio NaTicket en Navarra?',
    a: 'A fecha de mayo de 2026, NaTicket está en fase de desarrollo técnico. La Hacienda Foral de Navarra no ha publicado todavía un calendario oficial. Se espera su implementación progresiva a partir de 2027, pero las fechas exactas están pendientes de confirmación oficial.',
  },
  {
    q: '¿NaTicket sustituye a VeriFactu en Navarra?',
    a: 'No. Son sistemas complementarios. VeriFactu es legislación estatal aplicable en toda España, incluida Navarra. NaTicket será el sistema específico de Hacienda Foral de Navarra. Los autónomos navarros probablemente deberán cumplir con ambos.',
  },
  {
    q: '¿Qué diferencia hay entre NaTicket y TicketBAI?',
    a: 'TicketBAI ya está operativo en Navarra para el sector minorista. NaTicket es un sistema nuevo que ampliará la trazabilidad de facturas a todos los sectores y actividades, con mayor cobertura que el actual TicketBAI navarro.',
  },
  {
    q: '¿A qué autónomos navarros afectará NaTicket?',
    a: 'Previsiblemente a todos los autónomos navarros en estimación directa, sociedades con sede en Navarra y profesionales liberales. Los autónomos en módulos probablemente quedarán exentos, como ocurre con VeriFactu.',
  },
  {
    q: '¿Cómo me preparo para NaTicket ahora mismo?',
    a: 'Usando un software de facturación adaptado a Navarra que ya cumpla VeriFactu. Cuando NaTicket entre en vigor, tu software añadirá la compatibilidad sin que tengas que cambiar de herramienta. NaFactura está siendo preparado específicamente para esta transición.',
  },
  {
    q: '¿Necesito un software diferente para NaTicket?',
    a: 'No necesariamente. Un buen software de facturación navarro, cuando implemente la compatibilidad NaTicket, no requerirá que cambies de herramienta. La integración se producirá en el software que ya usas.',
  },
  {
    q: `¿${brandConfig.app.name} será compatible con NaTicket?`,
    a: `Sí. ${brandConfig.app.name} está siendo desarrollado con la compatibilidad NaTicket como prioridad. Nuestra arquitectura ya implementa el hash encadenado requerido por VeriFactu y preparamos la integración con Hacienda Foral de Navarra para cuando NaTicket entre en vigor.`,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function NafacturaNavicketPage(): React.JSX.Element {
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonTableJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white">
        <SiteHeader />

        {/* Hero */}
        <section className="bg-white py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
              <Map className="h-4 w-4" />
              Exclusivo Navarra · Hacienda Foral de Navarra
            </div>
            <h1
              data-speakable
              className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
            >
              NaTicket Navarra: qué es, cuándo será obligatorio en Navarra{' '}
              <span className="text-red-600">y cómo prepararte</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-500">
              NaTicket es el nuevo sistema de registro de facturas que la{' '}
              <strong className="text-slate-900">Hacienda Foral de Navarra</strong> está
              desarrollando. Guía completa para autónomos navarros: qué es, en qué se diferencia de
              VeriFactu y TicketBAI, y cómo prepararte hoy.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-red-700"
              >
                Empezar gratis — preparado para NaTicket
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/verifactu"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-7 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
              >
                Guía VeriFactu en Navarra
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>

            {/* Aviso de estado actual */}
            <div className="mt-10 inline-flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-left text-sm text-amber-800">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <span>
                <strong>Estado actual (mayo 2026):</strong> NaTicket está en fase de desarrollo
                técnico. Hacienda Foral de Navarra no ha publicado todavía fechas oficiales de
                obligatoriedad. Esta guía se actualiza mensualmente con las últimas novedades.
              </span>
            </div>
          </div>
        </section>

        {/* ¿Qué es NaTicket? */}
        <section id="que-es-naticket" className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-3xl font-bold text-slate-900">¿Qué es NaTicket?</h2>
            <div className="space-y-4 text-slate-500 leading-relaxed">
              <p>
                <strong className="text-slate-900">NaTicket</strong> es el sistema de trazabilidad y
                registro de facturas que la{' '}
                <a
                  href="https://hacienda.navarra.es/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-slate-900 underline decoration-dotted underline-offset-2 hover:text-red-600"
                >
                  Hacienda Foral de Navarra
                </a>{' '}
                está desarrollando. Su objetivo es garantizar la integridad y la inalterabilidad de
                las facturas emitidas por autónomos y empresas navarras, registrándolas
                automáticamente ante la administración foral.
              </p>
              <p>
                La idea es la misma que la de <strong className="text-slate-900">VeriFactu</strong>{' '}
                (el sistema de la AEAT para el territorio común español) y el{' '}
                <strong className="text-slate-900">TicketBAI</strong> (del País Vasco): cada factura
                que emitas quedará registrada con un código único e inalterable, de modo que
                Hacienda Navarra pueda verificar en cualquier momento que no ha sido manipulada.
              </p>
              <p>
                La diferencia clave es que mientras VeriFactu reporta a la AEAT (Agencia Tributaria
                estatal),{' '}
                <strong className="text-slate-900">
                  NaTicket reportará directamente a Hacienda Foral de Navarra
                </strong>
                , respetando así la autonomía fiscal que otorga el Convenio Económico a la Comunidad
                Foral de Navarra.
              </p>
            </div>

            <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-6">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div className="text-sm text-red-800">
                  <p>
                    <strong>¿Por qué Navarra tiene su propio sistema?</strong> Navarra gestiona su
                    propio IRPF e IVA gracias al Convenio Económico con el Estado. Esto implica que,
                    aunque VeriFactu es ley estatal y también aplica en Navarra, Hacienda Foral
                    necesita su propio mecanismo de control de facturas dentro de su sistema fiscal
                    propio. NaTicket es esa respuesta.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Diferencias NaTicket vs VeriFactu vs TicketBAI */}
        <section
          id="diferencias-naticket-verifactu-ticketbai"
          className="border-y border-slate-100 bg-slate-50 py-16 md:py-24"
        >
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">
              NaTicket, VeriFactu y TicketBAI: diferencias clave
            </h2>
            <p className="mb-10 text-slate-500">
              Los tres sistemas buscan lo mismo (trazabilidad de facturas), pero cada uno tiene su
              propio ámbito, hacienda receptora y calendario. Entender las diferencias es esencial
              para saber qué te afecta como autónomo navarro.
            </p>

            {/* Tabla de comparación */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Característica
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-red-700">
                      NaTicket
                      <div className="mt-0.5 text-xs font-normal text-red-600">En desarrollo</div>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">
                      VeriFactu
                      <div className="mt-0.5 text-xs font-normal text-slate-500">AEAT · Activo</div>
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">
                      TicketBAI
                      <div className="mt-0.5 text-xs font-normal text-slate-500">
                        EH · Parcial Navarra
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_TABLE.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.feature}</td>
                      <td className="px-4 py-3 text-center text-red-700">{row.naticket}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{row.verifactu}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{row.ticketbai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Key insight */}
            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold mb-1">
                    ¿Tengo que usar VeriFactu y NaTicket a la vez?
                  </p>
                  <p>
                    Probablemente sí. VeriFactu (AEAT) ya es obligatorio para todos los autónomos
                    españoles, incluidos los navarros. NaTicket será el sistema complementario de
                    Hacienda Foral de Navarra. Cuando entre en vigor, los autónomos navarros tendrán
                    que reportar a ambas haciendas desde el mismo software. Un buen programa de
                    facturación navarro gestionará ambas obligaciones automáticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ¿A quién afecta? */}
        <section id="a-quien-afecta-naticket" className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">
              ¿A qué autónomos navarros afectará NaTicket?
            </h2>
            <p className="mb-8 text-slate-500">
              Aunque el reglamento definitivo está pendiente, todo apunta a que NaTicket seguirá
              criterios similares a VeriFactu en cuanto a quién queda obligado.
            </p>

            <div className="space-y-3">
              {AFFECTED_GROUPS.map(({ label, affected, note }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      affected ? 'bg-red-100' : 'bg-slate-100'
                    }`}
                  >
                    {affected ? (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${affected ? 'text-slate-900' : 'text-slate-500'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{note}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      affected ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {affected ? 'Afectado' : 'Probablemente exento'}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-6 text-sm text-slate-400">
              * Previsión basada en los criterios de VeriFactu y el estado actual del proyecto
              NaTicket. Las categorías definitivas se confirmarán cuando Hacienda Navarra publique
              el reglamento oficial.
            </p>
          </div>
        </section>

        {/* Fechas clave */}
        <section
          id="fechas-naticket-navarra"
          className="border-y border-slate-100 bg-slate-50 py-16 md:py-24"
        >
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-4 text-3xl font-bold text-slate-900">
              Fechas clave para NaTicket en Navarra
            </h2>
            <p className="mb-10 text-slate-500">
              Estado actual del proyecto NaTicket y calendario esperado. Última actualización:{' '}
              <time dateTime="2026-05">mayo 2026</time>.
            </p>

            <div className="mb-10">
              <VerifactuDeadlines />
            </div>

            <div className="relative space-y-6 pl-8">
              <div className="absolute left-3 top-2 h-full w-0.5 bg-slate-200" />
              {TIMELINE.map(({ date, datetime, event, detail, done, current }) => (
                <div key={date} className="relative">
                  <div
                    className={`absolute -left-5 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white ${
                      done ? 'border-green-500' : current ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : current ? (
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-slate-300" />
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <time
                        dateTime={datetime}
                        className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700"
                      >
                        {date}
                      </time>
                      {current && (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          Momento actual
                        </span>
                      )}
                      {done && (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          Completado
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1">{event}</h3>
                    <p className="text-sm text-slate-500">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ¿Qué software será compatible? */}
        <section id="software-compatible-naticket" className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-3xl font-bold text-slate-900">
              ¿Qué software será compatible con NaTicket?
            </h2>
            <div className="space-y-4 text-slate-500 leading-relaxed">
              <p>
                Aunque aún no existe una lista oficial de software compatible con NaTicket (el
                sistema está en desarrollo), ya es posible identificar qué características técnicas
                deberá tener un programa de facturación para cumplir con él:
              </p>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {[
                {
                  icon: Layers,
                  title: 'Integración con Hacienda Foral de Navarra',
                  desc: 'El software deberá poder enviar datos de facturación directamente a los sistemas de Hacienda Navarra, no solo a la AEAT.',
                },
                {
                  icon: Shield,
                  title: 'Hash encadenado navarro',
                  desc: 'Generación de una huella digital inalterable para cada factura, encadenada con la anterior, conforme al estándar que defina Hacienda Navarra.',
                },
                {
                  icon: QrCode,
                  title: 'Código QR verificable',
                  desc: 'Un código QR en cada factura que permita verificar su autenticidad en los sistemas de Hacienda Foral de Navarra.',
                },
                {
                  icon: Zap,
                  title: 'Doble reporting (VeriFactu + NaTicket)',
                  desc: 'El software deberá reportar simultáneamente a la AEAT (VeriFactu) y a Hacienda Navarra (NaTicket) sin necesidad de doble trabajo.',
                },
                {
                  icon: BarChart3,
                  title: 'Tipos impositivos forales',
                  desc: 'IVA e IRPF conforme al régimen de Hacienda Foral de Navarra, con las particularidades del Convenio Económico.',
                },
                {
                  icon: Building2,
                  title: 'Certificación homologada',
                  desc: 'El software deberá estar homologado por Hacienda Navarra como "software garante" para el sistema NaTicket.',
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

            <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <p className="text-sm text-blue-800">
                  <strong>Consejo práctico:</strong> Si ya usas un software de facturación adaptado
                  a Navarra y compatible con VeriFactu, estás en el mejor punto de partida. La
                  integración con NaTicket se añadirá como actualización cuando el sistema esté
                  listo. No tendrás que cambiar de software.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* NaFactura y NaTicket */}
        <section
          id="nafactura-naticket"
          className="border-y border-slate-100 bg-slate-50 py-16 md:py-24"
        >
          <div className="mx-auto max-w-4xl px-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600">
                <BadgeCheck className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-slate-900">
                {brandConfig.app.name} y NaTicket
              </h2>
            </div>
            <div className="space-y-4 text-slate-500 leading-relaxed">
              <p>
                <strong className="text-slate-900">{brandConfig.app.name}</strong> está siendo
                desarrollado con la compatibilidad NaTicket como prioridad desde el primer día. Como
                software especializado en autónomos navarros, nuestra hoja de ruta incluye la
                integración completa con Hacienda Foral de Navarra en cuanto NaTicket entre en
                vigor.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: CheckCircle2,
                  text: 'Ya implementa hash encadenado SHA-256 (base técnica de NaTicket)',
                },
                {
                  icon: CheckCircle2,
                  text: 'Cumplimiento completo con VeriFactu (AEAT) ya activo',
                },
                {
                  icon: CheckCircle2,
                  text: 'Arquitectura preparada para doble reporting (AEAT + Hacienda Navarra)',
                },
                {
                  icon: CheckCircle2,
                  text: 'IVA e IRPF según el régimen de Hacienda Foral de Navarra',
                },
                {
                  icon: CheckCircle2,
                  text: 'Actualización a NaTicket incluida en tu plan sin coste adicional',
                },
                {
                  icon: CheckCircle2,
                  text: 'Soporte especializado para autónomos navarros en español',
                },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-start gap-3 rounded-xl bg-white p-4 border border-slate-100 shadow-sm"
                >
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  <span className="text-sm text-slate-700">{text}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-red-700"
              >
                Empezar gratis — preparado para NaTicket
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="text-sm text-slate-500">
                Sin tarjeta · Gratis hasta 2027 · Cancelación inmediata
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="preguntas-frecuentes-naticket" className="py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-10 text-3xl font-bold text-slate-900">
              Preguntas frecuentes sobre NaTicket
            </h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex gap-3">
                    <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2">{q}</h3>
                      <p className="text-sm leading-relaxed text-slate-500">{a}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related links */}
        <RelatedLinksSection
          title="Guías relacionadas para autónomos navarros"
          links={[
            {
              href: '/verifactu',
              label: 'VeriFactu en Navarra',
              description: 'Cumplimiento fiscal completo para autónomos navarros',
            },
            {
              href: '/alternativa-holded-navarra',
              label: 'Alternativa a Holded',
              description: 'Por qué los autónomos navarros prefieren NaFactura',
            },
            {
              href: '/mejor-software-facturacion-navarra',
              label: 'Mejor software Navarra 2027',
              description: 'Comparativa de los 4 mejores programas de facturación',
            },
            {
              href: '/software-facturacion-pamplona',
              label: 'Software para Pamplona',
              description: 'Especializado para autónomos de la capital navarra',
            },
            {
              href: '/funcionalidades',
              label: 'Funcionalidades de NaFactura',
              description: 'Todo lo que incluye el software para autónomos navarros',
            },
            {
              href: '/precios',
              label: 'Planes y precios',
              description: `Gratis hasta 2027. Desde ${PRICING.starter.monthly}€/mes después.`,
            },
          ]}
        />

        {/* CTA final */}
        <section className="py-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Prepárate para NaTicket hoy, sin coste
            </h2>
            <p className="text-slate-500 mb-8">
              Empieza gratis con {brandConfig.app.name}, el único software de facturación diseñado
              exclusivamente para autónomos navarros. Gratis hasta 2027, preparado para NaTicket
              cuando entre en vigor.
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-red-700"
            >
              Empezar gratis — sin tarjeta
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-4 text-sm text-slate-400">
              Gratis hasta 2027 · Sin tarjeta · Sin permanencia · Soporte en español
            </p>
          </div>
        </section>

        <FooterLanding />
      </div>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Shield,
  Zap,
  Download,
  Clock,
  Users,
  Lock,
  Smartphone,
  ArrowRight,
  Sparkles,
  CreditCard,
  BadgeCheck,
  Calculator,
  ClipboardList,
  BarChart3,
  RefreshCcw,
  Globe,
  Palette,
  UserCircle,
  Wallet,
  FileX,
} from 'lucide-react';
import { brandConfig, PRICING } from '@easyfactura/brand-config';
import { freeSlotsLabel, getSignupSlots } from '@/lib/signup-slots';
import SiteHeader from '@/components/site-header';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';
import {
  FeatureBlockCta,
  FeatureShowcase,
  type FeatureShowcaseItem,
} from '@/components/marketing/feature-showcase';

const PAGE_TITLE = `Funcionalidades del programa de facturación, una a una | ${brandConfig.app.name}`;
const PAGE_DESCRIPTION = `Qué hace ${brandConfig.app.name}, función a función: facturas en 60 segundos, IVA e IRPF, presupuestos, recurrentes, cobros, móvil, PDF con tu logo y VeriFactu.`;

export const novafacturaFuncionalidadesMetadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${brandConfig.app.url}/funcionalidades` },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: `${brandConfig.app.url}/funcionalidades`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} — Funcionalidades del programa de facturación`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
  robots: { index: true, follow: true },
};

interface FeatureBlock {
  id: string;
  label: string;
  title: string;
  ctaText: string;
  features: FeatureShowcaseItem[];
}

// Screenshots: drop real captures in /public/capturas/funcionalidades/<id>.webp
// (1200×750) and add `screenshot: { src, alt }` to the matching feature.
// VeriFactu is intentionally the last feature of the last block.
const featureBlocks: FeatureBlock[] = [
  {
    id: 'facturar',
    label: 'Facturar',
    title: 'Hacer facturas sin errores',
    ctaText: 'Haz tu primera factura en menos de un minuto.',
    features: [
      {
        id: 'facturas-60-segundos',
        icon: Zap,
        title: 'Facturas en 60 segundos',
        description:
          'Eliges el cliente, añades los conceptos y la factura está lista. Sin plantillas que copiar ni datos que volver a teclear.',
        points: [
          'Datos del cliente y del producto rellenados automáticamente',
          'Numeración correlativa por series (A-2026, R-2026…)',
          'Envío del PDF por email desde el propio programa',
        ],
        guide: { href: '/facturas/como-hacer-una-factura', label: 'Guía: cómo hacer una factura' },
      },
      {
        id: 'iva-irpf',
        icon: Calculator,
        title: 'IVA e IRPF calculados solos',
        description:
          'El programa aplica el tipo de IVA de cada línea y la retención de IRPF que te corresponde, y cuadra los totales.',
        points: [
          'IVA del 21 %, 10 %, 4 % y operaciones exentas',
          'Retención del 7 % (nuevos autónomos) o del 15 %',
          'Resumen trimestral para preparar el modelo 303',
        ],
        guide: { href: '/facturas/con-irpf', label: 'Guía: factura con IRPF' },
      },
      {
        id: 'rectificativas',
        icon: FileX,
        title: 'Facturas rectificativas',
        description:
          '¿Te equivocaste en una factura emitida? Crea la rectificativa desde la original, con su serie propia y la referencia correcta.',
        points: [
          'Rectificativa generada a partir de la factura original',
          'Serie de rectificativas separada y correlativa',
          'La factura original nunca se modifica',
        ],
        guide: { href: '/facturas/rectificativa', label: 'Guía: factura rectificativa' },
      },
      {
        id: 'intracomunitarias',
        icon: Globe,
        title: 'Clientes de la UE y del extranjero',
        description:
          'Factura a clientes intracomunitarios con la mención de inversión del sujeto pasivo y sin IVA cuando corresponde.',
        points: [
          'Clientes nacionales, intracomunitarios y extracomunitarios',
          'Mención legal de inversión del sujeto pasivo',
          'NIF-IVA del cliente en la factura',
        ],
        guide: { href: '/facturas/intracomunitaria', label: 'Guía: factura intracomunitaria' },
      },
    ],
  },
  {
    id: 'vender-y-cobrar',
    label: 'Vender y cobrar',
    title: 'Del presupuesto al cobro',
    ctaText: 'Deja de perseguir cobros con una hoja de Excel.',
    features: [
      {
        id: 'presupuestos',
        icon: ClipboardList,
        title: 'Presupuestos que pasan a factura',
        description:
          'Envía el presupuesto y, cuando el cliente lo acepte, conviértelo en factura o en proforma con un clic.',
        points: [
          'Estado de cada presupuesto: enviado, aceptado o rechazado',
          'Conversión a factura o proforma sin volver a escribir',
          'Facturas proforma para anticipos',
        ],
        guide: { href: '/facturas/proforma', label: 'Guía: factura proforma' },
      },
      {
        id: 'recurrentes',
        icon: RefreshCcw,
        title: 'Facturas recurrentes',
        description:
          'Configura una vez las cuotas que se repiten y el programa genera cada factura en su fecha.',
        points: [
          'Frecuencia mensual, trimestral, semestral o anual',
          'Confirmación automática opcional',
          'Pausa y reanuda cuando cambie el contrato',
        ],
        guide: {
          href: '/facturacion-online#recurrentes',
          label: 'Cómo funcionan las facturas recurrentes',
        },
      },
      {
        id: 'cobros',
        icon: Wallet,
        title: 'Control de cobros',
        description:
          'Cada factura sabe si está cobrada. Registra pagos completos o parciales y ve de un vistazo quién te debe.',
        points: [
          'Estados: pendiente, cobrada parcialmente o cobrada',
          'Pagos con fecha y método (transferencia, tarjeta, efectivo…)',
          'Facturas vencidas destacadas',
        ],
        guide: { href: '/facturacion-online#cobros', label: 'Control de cobros para autónomos' },
      },
      {
        id: 'clientes-productos',
        icon: UserCircle,
        title: 'Clientes y catálogo de productos',
        description:
          'Guarda tus clientes con sus datos fiscales y tus servicios con precio e IVA. Los reutilizas en cada factura.',
        points: [
          'Directorio de clientes con NIF/CIF validado',
          'Historial de facturas e importe pendiente por cliente',
          'Catálogo de productos y servicios con su tipo de IVA',
        ],
        guide: {
          href: '/facturas/como-hacer-una-factura',
          label: 'Datos obligatorios de una factura',
        },
      },
    ],
  },
  {
    id: 'organizar',
    label: 'Organizar tu negocio',
    title: 'Tu negocio, en orden y en cualquier sitio',
    ctaText: 'Lleva tu facturación en el bolsillo.',
    features: [
      {
        id: 'panel',
        icon: BarChart3,
        title: 'Panel de ingresos',
        description:
          'Ingresos, facturas pendientes y cobradas y evolución mensual nada más entrar.',
        points: [
          'Facturado, cobrado y pendiente del periodo',
          'Evolución mensual de ingresos',
          'Clientes que más facturan',
        ],
        guide: { href: '/facturas', label: 'Todos los tipos de facturas' },
      },
      {
        id: 'pdf-personalizable',
        icon: Palette,
        title: 'PDF con tu logo',
        description:
          'Facturas con tu imagen: logo, color principal, IBAN y pie de página con tus condiciones.',
        points: [
          'Logo en JPG, PNG o SVG',
          'Color y plantilla de diseño a elegir',
          'IBAN y condiciones de pago en cada factura',
        ],
        guide: {
          href: '/factura-electronica/ejemplos',
          label: 'Ejemplos de factura en PDF y XML',
        },
      },
      {
        id: 'movil',
        icon: Smartphone,
        title: 'Desde el móvil',
        description:
          'Funciona en el navegador del móvil y puedes añadirlo a la pantalla de inicio como una app.',
        points: [
          'Sin descargar nada de la tienda',
          'Mismos datos en el móvil y en el ordenador',
          'Envía la factura al terminar el trabajo',
        ],
        guide: { href: '/facturacion-online#movil', label: 'Facturar desde el móvil' },
      },
      {
        id: 'migracion',
        icon: Download,
        title: 'Importación desde Excel',
        description:
          'Trae tus clientes y tus facturas anteriores desde Excel, CSV o Holded. Te ayudamos sin coste.',
        points: [
          'Importación de clientes y productos',
          'Historial de facturas disponible en tu cuenta',
          'Migración asistida y gratuita',
        ],
        guide: {
          href: '/blog/excel-dejara-de-ser-valido-con-verifactu',
          label: '¿Excel seguirá valiendo para facturar?',
        },
      },
    ],
  },
  {
    id: 'preparado-para-el-futuro',
    label: 'Preparado para el futuro',
    title: 'Listo para VeriFactu cuando sea obligatorio',
    ctaText: 'Empieza hoy y no tendrás que cambiar de programa en 2028.',
    features: [
      {
        id: 'verifactu',
        icon: Shield,
        title: 'VeriFactu',
        description:
          'Cada factura lleva el hash encadenado y el código QR que exige el Reglamento, y el registro puede enviarse a la AEAT.',
        points: [
          'Hash encadenado SHA-256 y QR verificable',
          'Envío del registro a la AEAT',
          'Adaptado mediante declaración responsable del fabricante',
        ],
        guide: { href: '/verifactu', label: 'Guía completa de VeriFactu' },
      },
    ],
  },
];

const softwareAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: brandConfig.app.name,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  description: brandConfig.app.description,
  url: `${brandConfig.app.url}/funcionalidades`,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: `Gratis hasta 2027 para las primeras ${PRICING.freePeriodSlots.toLocaleString('es-ES')} inscripciones.`,
    availability: 'https://schema.org/LimitedAvailability',
  },
  featureList: featureBlocks.flatMap((block) => block.features.map((feature) => feature.title)),
  publisher: { '@type': 'Organization', name: brandConfig.app.name, url: brandConfig.app.url },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Funcionalidades',
      item: `${brandConfig.app.url}/funcionalidades`,
    },
  ],
};

const faqs = [
  {
    q: '¿Necesito conocimientos de contabilidad o fiscal para usar el programa?',
    a: 'No. Introduces el cliente, el concepto y el importe — el programa calcula el IVA (21 %, 10 % o 4 %), aplica la retención de IRPF si procede (7 % los primeros años, 15 % después) y genera el PDF listo para enviar. También ves un resumen de tus ingresos y del IVA para preparar el modelo 303 trimestral.',
  },
  {
    q: '¿Qué incluye el acceso gratuito hasta 2027?',
    a: 'Acceso completo sin restricciones: facturas, clientes y productos, presupuestos, proformas, recurrentes, control de cobros, panel de ingresos, PDF personalizable y VeriFactu. Sin límite de facturas ni funciones bloqueadas. El acceso gratuito es para las primeras plazas disponibles.',
  },
  {
    q: '¿Es posible configurar facturas recurrentes automáticas?',
    a: 'Sí. Para clientes con cuotas fijas puedes programar facturas mensuales, trimestrales, semestrales o anuales. El programa genera cada factura en la fecha indicada y, si lo activas, la confirma automáticamente.',
  },
  {
    q: '¿Puedo personalizar las facturas con mi logo y marca?',
    a: 'Sí. Puedes subir tu logo (JPG, PNG o SVG), elegir el color principal y la plantilla, añadir tu IBAN e incluir un pie de página con tus condiciones de pago.',
  },
  {
    q: '¿Puedo migrar mis datos desde otro programa de facturación?',
    a: `Sí. Puedes importar clientes y facturas desde Excel, CSV o directamente desde Holded. El historial queda en tu cuenta para consulta. La migración es gratuita y el equipo de ${brandConfig.app.name} te ayuda en el proceso.`,
  },
  {
    q: '¿Qué pasa con mis datos si cancelo la suscripción?',
    a: 'Tus datos son tuyos. Puedes exportar facturas, clientes y productos en cualquier momento. Los datos se conservan 90 días tras la cancelación por si quieres recuperarlos, y no eliminamos registros fiscales sin tu confirmación, ya que la normativa obliga a conservarlos entre 4 y 6 años.',
  },
  {
    q: '¿El programa cumple con el RGPD?',
    a: 'Sí. Los servidores están en la Unión Europea, los datos se cifran con TLS 1.3 en tránsito y AES-256 en reposo, y nunca cedemos datos a terceros con fines comerciales.',
  },
  {
    q: '¿Qué es VeriFactu y cuándo será obligatorio?',
    a: 'VeriFactu es el sistema de la Ley Antifraude 11/2021 que obliga a que el programa de facturación genere un registro inalterable de cada factura, con hash encadenado y código QR. Hacienda ha anunciado octubre de 2028 (pendiente de BOE), a la vez que la factura electrónica obligatoria. Con este programa ya lo cumples hoy.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const trustBadges = [
  { icon: CreditCard, text: 'Sin tarjeta al registrarte' },
  { icon: Clock, text: 'Activación inmediata' },
  { icon: Shield, text: 'Adaptado a VeriFactu' },
  { icon: Lock, text: 'RGPD compliant' },
];

function FeatureIndex() {
  return (
    <nav aria-label="Índice de funcionalidades" className="mx-auto mt-10 max-w-4xl">
      <ul className="flex flex-wrap justify-center gap-2">
        {featureBlocks.flatMap((block) =>
          block.features.map((feature) => (
            <li key={feature.id}>
              <a
                href={`#${feature.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
              >
                <feature.icon className="h-3.5 w-3.5" />
                {feature.title}
              </a>
            </li>
          )),
        )}
      </ul>
    </nav>
  );
}

function FeatureBlockSection({
  block,
  isAlternate,
}: {
  block: FeatureBlock;
  isAlternate: boolean;
}) {
  return (
    <section
      id={block.id}
      className={`py-16 md:py-24 ${isAlternate ? 'border-y border-slate-100 bg-slate-50' : 'bg-white'}`}
    >
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-14 text-center">
          <span className="mb-4 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {block.label}
          </span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{block.title}</h2>
        </div>
        <div className="space-y-20">
          {block.features.map((feature, i) => (
            <FeatureShowcase key={feature.id} item={feature} isReversed={i % 2 === 1} />
          ))}
        </div>
        <FeatureBlockCta text={block.ctaText} />
      </div>
    </section>
  );
}

export async function NovafacturaFuncionalidadesPage(): Promise<React.JSX.Element> {
  const slotsLabel = freeSlotsLabel(await getSignupSlots());
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white text-slate-900">
        <SiteHeader />

        <main className="flex-1">
          {/* Hero */}
          <section className="relative overflow-hidden py-20 md:py-24">
            <div className="relative mx-auto max-w-4xl px-4 text-center">
              <nav className="mb-6 flex justify-center" aria-label="Breadcrumb">
                <ol className="flex items-center gap-2 text-sm text-slate-500">
                  <li>
                    <Link href="/" className="hover:text-slate-700">
                      Inicio
                    </Link>
                  </li>
                  <li aria-hidden="true">/</li>
                  <li className="font-medium text-slate-700">Funcionalidades</li>
                </ol>
              </nav>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
                <BadgeCheck className="h-4 w-4 text-blue-600" />
                {featureBlocks.reduce((total, block) => total + block.features.length, 0)} funciones
                explicadas
              </div>
              <h1
                data-speakable
                className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
              >
                Funcionalidades del programa de facturación,{' '}
                <span className="text-blue-600">una a una</span>
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-500 sm:text-xl">
                Mira qué hace {brandConfig.app.name} en cada paso: de la factura al cobro. Cada
                función con su captura y una guía para sacarle partido.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/registro"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
                >
                  <Sparkles className="h-4 w-4" />
                  Pruébalo gratis hasta 2027
                </Link>
                <Link
                  href="/precios"
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  Ver precios
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-500">
                {trustBadges.map(({ icon: Icon, text }) => (
                  <span key={text} className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-blue-500" />
                    {text}
                  </span>
                ))}
              </div>
              <FeatureIndex />
            </div>
          </section>

          {featureBlocks.map((block, i) => (
            <FeatureBlockSection key={block.id} block={block} isAlternate={i % 2 === 0} />
          ))}

          <FaqSection
            faqs={faqs}
            title="Preguntas frecuentes"
            subtitle="Resuelve tus dudas sobre las funcionalidades del programa."
          />

          {/* Final CTA */}
          <section className="py-16 md:py-24">
            <div className="mx-auto max-w-2xl px-4 text-center">
              {slotsLabel && (
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
                  <Users className="h-4 w-4" />
                  {slotsLabel}
                </div>
              )}
              <h2 className="mb-4 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Pruébalas todas sin pagar nada
              </h2>
              <p className="mb-8 text-lg text-slate-500">
                Acceso completo a todas las funcionalidades hasta 2027, sin tarjeta y sin
                compromisos.
              </p>
              <Link
                href="/registro"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-10 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-xl"
              >
                <Sparkles className="h-5 w-5" />
                Registrarme ahora — gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-sm text-slate-400">
                Sin tarjeta · Activación inmediata · Cancela cuando quieras
              </p>
            </div>
          </section>
        </main>

        <FooterLanding />
      </div>
    </>
  );
}

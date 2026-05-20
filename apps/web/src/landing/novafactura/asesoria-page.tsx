import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';
import { brandConfig } from '@easyfactura/brand-config';

const faqs = [
  {
    q: '¿Necesito que mis clientes creen una cuenta para gestionar su facturación?',
    a: 'No es necesario. Puedes dar de alta a cada cliente directamente desde tu panel de asesoría con sus datos fiscales (NIF, razón social, domicilio). El cliente no necesita saber que usas NovaFactura para operar. Si en el futuro quiere gestionar sus facturas directamente, puedes transferirle el control de su cuenta sin perder ningún dato.',
  },
  {
    q: '¿Las facturas quedan registradas bajo el NIF de cada cliente?',
    a: `Sí, y es la parte más importante desde el punto de vista fiscal. Aunque tú operas desde tu panel de asesoría, cada factura pertenece al tenant fiscal del cliente: tiene su NIF, su serie correlativa propia, su cadena VeriFactu y se transmite a la AEAT como emitida por ese cliente. Hacienda las ve exactamente igual que si el cliente las hubiera emitido él mismo.`,
  },
  {
    q: `¿Qué pasa si un cliente ya tiene cuenta en ${brandConfig.app.name}?`,
    a: 'Puedes vincularte a su cuenta existente mediante invitación por email. El cliente te otorga un rol de gestor y tú puedes operar en su nombre desde tu panel de asesoría. Todos los datos previos (facturas, clientes, configuración VeriFactu) se conservan íntegramente.',
  },
  {
    q: '¿Mis clientes pueden ver las acciones que realizo en su cuenta?',
    a: 'Todas las acciones quedan registradas en el log de auditoría interno. Cuando actúas en nombre de un cliente, cada factura creada o modificada queda marcada con tu usuario y la fecha/hora de la acción. El cliente puede consultar este log desde su panel en cualquier momento, lo que aporta transparencia y trazabilidad completa.',
  },
  {
    q: '¿Cuánto cuesta el software para asesorías?',
    a: `${brandConfig.app.name} es completamente gratuito para asesorías y gestorías durante el periodo de lanzamiento hasta 2027. Sin límite de clientes gestionados, sin coste mensual por cliente adicional, sin restricciones funcionales. A partir de 2027, el modelo de precios para asesorías se confirmará con antelación suficiente.`,
  },
  {
    q: '¿Puedo gestionar clientes con diferentes regímenes fiscales?',
    a: 'Sí. La plataforma soporta autónomos en estimación directa normal y simplificada, sociedades (SL, SA), arrendadores y otros regímenes habituales. Cada cliente tiene configurada su propia serie de facturación, sus tipos de IVA y su retención de IRPF. Puedes gestionar simultáneamente un autónomo con IRPF al 7%, una SL sin IRPF y un profesional con IRPF al 15%, cada uno con sus propias reglas.',
  },
  {
    q: '¿El software emite las facturas en nombre del cliente o en el mío?',
    a: 'Siempre en nombre del cliente. Cuando tú, como asesor, emites una factura para el cliente A, esa factura sale con el NIF, la razón social, el domicilio y la serie de facturación del cliente A. Tú actúas como operador autorizado, pero el emisor legal es siempre el cliente. Esto es fundamental para que la cadena VeriFactu y los registros de la AEAT sean correctos.',
  },
];
import {
  ArrowRight,
  CheckCircle2,
  LayoutDashboard,
  FileText,
  Sparkles,
  Shield,
  TrendingUp,
  UserCheck,
  Repeat,
  Gift,
  ChevronRight,
} from 'lucide-react';

export const novafacturaAsesoriaMetadata: Metadata = {
  title: `Software VeriFactu para asesorías y gestorías | ${brandConfig.app.name}`,
  description:
    'Gestiona la facturación VeriFactu de todos tus clientes desde un único panel. Completamente gratis para asesorías y gestorías. Panel centralizado, VeriFactu automático bajo cada NIF.',
  keywords: [
    'software facturación asesorías',
    'programa facturación gestorías',
    'verifactu asesorías',
    'software gestoría verifactu gratis',
    'gestión facturas múltiples clientes',
    'panel centralizado facturación asesoría',
    'facturación electrónica gestorías',
    'software contable asesorías',
    'programa facturación despacho profesional',
    'verifactu gestoría gratis',
  ],
  alternates: {
    canonical: `${brandConfig.app.url}/asesoria`,
  },
  openGraph: {
    title: `Software VeriFactu para asesorías y gestorías | ${brandConfig.app.name}`,
    description:
      'Gestiona la facturación VeriFactu de todos tus clientes desde un único panel. Completamente gratis para asesorías.',
    url: `${brandConfig.app.url}/asesoria`,
    type: 'website',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [
      {
        url: `${brandConfig.app.url}${brandConfig.app.ogImage}`,
        width: 1200,
        height: 630,
        alt: `${brandConfig.app.name} para asesorías — Software VeriFactu gratis`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `Software VeriFactu para asesorías | ${brandConfig.app.name}`,
    description:
      'Panel centralizado para gestionar la facturación VeriFactu de todos tus clientes. Gratis para siempre.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: `${brandConfig.app.name} para Asesorías`,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: `${brandConfig.app.url}/asesoria`,
  description:
    'Software de facturación VeriFactu gratuito para asesorías y gestorías. Panel centralizado para gestionar la facturación de múltiples clientes bajo sus propios NIFs.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Completamente gratuito para asesorías y gestorías',
  },
  publisher: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
};

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Inicio', item: brandConfig.app.url },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Para asesorías',
      item: `${brandConfig.app.url}/asesoria`,
    },
  ],
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: `${brandConfig.app.name} para Asesorías y Gestorías`,
  serviceType: 'Software de facturación VeriFactu para gestorías',
  description:
    'Software de facturación VeriFactu gratuito para asesorías y gestorías. Panel centralizado, VeriFactu automático bajo el NIF de cada cliente y directorio de empresas compartido sin coste.',
  provider: {
    '@type': 'Organization',
    name: brandConfig.app.name,
    url: brandConfig.app.url,
  },
  areaServed: { '@type': 'Country', name: 'España' },
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'EUR',
    description: 'Completamente gratuito para asesorías y gestorías',
  },
};

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Panel central de clientes',
    description:
      'Ve todos tus clientes en una sola pantalla. Accede al dashboard de cada uno con un solo clic, sin cerrar sesión.',
  },
  {
    icon: FileText,
    title: 'Factura en nombre de tus clientes',
    description:
      'Emite facturas directamente sobre el tenant fiscal de cada cliente. Todo queda registrado bajo su NIF y su cadena VeriFactu.',
  },
  {
    icon: UserCheck,
    title: 'Directorio de clientes compartido',
    description:
      'Crea una empresa una sola vez en tu directorio y reutilízala para todos tus autónomos. Sin duplicados, sin trabajo repetido.',
  },
  {
    icon: Shield,
    title: 'VeriFactu automático para cada cliente',
    description:
      'Cada factura cumple con la Ley Antifraude 11/2021 bajo el NIF del cliente correspondiente. Sin configuración extra.',
  },
  {
    icon: Repeat,
    title: 'Cambio de contexto en un clic',
    description:
      'Pasa del dashboard de un cliente al siguiente en segundos. Un banner permanente te recuerda siempre en qué empresa estás operando.',
  },
  {
    icon: TrendingUp,
    title: 'Vista agregada de tu cartera',
    description:
      'Consulta el estado global: facturas pendientes, alertas fiscales y actividad reciente de toda tu cartera desde una sola pantalla.',
  },
];

const FOR_WHO = [
  'Asesorías fiscales y contables',
  'Gestorías que gestionan autónomos y PYMEs',
  'Despachos de abogados con clientes empresariales',
  'Contables freelance con múltiples clientes',
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Crea tu cuenta de asesoría',
    description:
      'Regístrate en menos de 2 minutos con los datos de tu gestoría. Sin tarjeta, sin pagos.',
  },
  {
    step: '02',
    title: 'Añade a tus clientes',
    description:
      'Da de alta a cada autónomo o empresa directamente, o invítales por email para que completen sus datos.',
  },
  {
    step: '03',
    title: 'Opera en su nombre',
    description:
      'Accede al dashboard de cada cliente, crea facturas, gestiona cobros y consulta informes como si fueras ellos.',
  },
];

const USE_CASES = [
  {
    icon: UserCheck,
    title: 'La asesoría con 5-15 autónomos en cartera',
    description:
      'Llevas la facturación de varios autónomos en paralelo. Antes saltabas entre cuentas y perdías tiempo. Ahora tienes un panel único y emites facturas bajo cada NIF en segundos.',
    points: [
      'Accede a cada cliente en un clic sin cerrar sesión',
      'VeriFactu configurado automáticamente bajo cada NIF',
      'Directorio de proveedores compartido entre todos tus clientes',
    ],
  },
  {
    icon: LayoutDashboard,
    title: 'El contable freelance con múltiples clientes',
    description:
      'Trabajas solo y gestionas más de 20 clientes. La herramienta tiene que ser rápida, sin complicaciones y sin coste que reduzca tu margen.',
    points: [
      'Panel de cartera con visión global de todos tus clientes',
      'Alertas de facturas pendientes de cobro por cliente',
      'Gratis para siempre — sin coste que te reste margen',
    ],
  },
  {
    icon: Shield,
    title: 'La gestoría que quiere cumplir VeriFactu ya',
    description:
      'VeriFactu es obligatorio para tus clientes desde julio de 2027. Con NovaFactura, cumples desde el primer día y controlas la transición a tu ritmo.',
    points: [
      'Cada factura cumple la Ley Antifraude 11/2021 desde el inicio',
      'Hash encadenado y envío AEAT bajo el NIF del cliente',
      'Sin configuración extra — funciona desde el registro',
    ],
  },
  {
    icon: TrendingUp,
    title: 'La asesoría en crecimiento que escala su cartera',
    description:
      'Tienes 30 clientes hoy y quieres llegar a 80. Sin límite de clientes en cartera y sin precio que escale contigo.',
    points: [
      'Sin límite de clientes gestionados en tu cuenta de asesoría',
      'Onboarding de nuevos clientes en menos de 3 minutos',
      'Vista agregada de toda la cartera en tiempo real',
    ],
  },
];

const ASESOR_COMPARISON: {
  label: string;
  novafactura: string | boolean;
  holded: string | boolean;
  quipu: string | boolean;
}[] = [
  {
    label: 'Precio para la asesoría',
    novafactura: 'Gratis para siempre',
    holded: '40-90€/mes',
    quipu: '25€+/mes',
  },
  { label: 'Panel multi-cliente centralizado', novafactura: true, holded: true, quipu: false },
  { label: 'VeriFactu bajo NIF de cada cliente', novafactura: true, holded: true, quipu: false },
  { label: 'Directorio de clientes compartido', novafactura: true, holded: false, quipu: false },
  { label: 'Cambio de contexto en un clic', novafactura: true, holded: false, quipu: false },
  {
    label: 'Sin límite de clientes en cartera',
    novafactura: true,
    holded: 'Según plan',
    quipu: 'Según plan',
  },
  { label: 'Log de auditoría por cliente', novafactura: true, holded: false, quipu: false },
];

export function NovafacturaAsesoriaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />

      <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
        <SiteHeader />

        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white dark:from-indigo-950/30 dark:to-gray-950 py-24 md:py-32">
          <div className="absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,white,transparent)]">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e7ff_1px,transparent_1px),linear-gradient(to_bottom,#e0e7ff_1px,transparent_1px)] bg-[size:64px_64px] opacity-40 dark:opacity-10" />
          </div>

          <div className="mx-auto max-w-5xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Gift className="h-4 w-4" />
              Completamente gratis para asesorías y gestorías
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
              Gestiona la facturación
              <br />
              <span className="text-indigo-600 dark:text-indigo-400">de todos tus clientes</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
              Un único panel para operar como si fueras cada uno de tus autónomos y empresas.
              VeriFactu automático bajo cada NIF. Sin complicaciones, sin coste.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:bg-indigo-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              >
                Crear cuenta de asesoría
                <ArrowRight className="h-5 w-5" />
              </Link>
              <span className="text-sm text-gray-500">Sin tarjeta · Gratis para siempre</span>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
              {FOR_WHO.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                En marcha en 3 pasos
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Sin migraciones, sin formación, sin trabajo previo.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {HOW_IT_WORKS.map((step, index) => (
                <div key={step.step} className="relative">
                  {index < HOW_IT_WORKS.length - 1 && (
                    <div className="absolute right-0 top-6 hidden h-0.5 w-1/2 translate-x-full bg-indigo-100 dark:bg-indigo-900 md:block" />
                  )}
                  <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-4 text-4xl font-black text-indigo-100 dark:text-indigo-900">
                      {step.step}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Todo lo que necesitas para gestionar tu cartera
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
                      <Icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Free plan callout */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <div className="rounded-3xl bg-indigo-600 p-12 text-center text-white shadow-2xl dark:bg-indigo-700">
              <div className="mb-4 flex justify-center">
                <Sparkles className="h-10 w-10 text-indigo-200" />
              </div>
              <h2 className="mb-4 text-3xl font-bold">Gratis para asesorías. Para siempre.</h2>
              <p className="mb-8 text-lg text-indigo-100">
                Nosotros te damos la herramienta gratis. A cambio, tus clientes descubren{' '}
                {brandConfig.app.name} a través de ti. Todo el mundo gana.
              </p>
              <div className="mb-8 flex flex-col items-center gap-3 text-indigo-100">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-indigo-300" />
                  Clientes ilimitados en tu cartera
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-indigo-300" />
                  Todas las funcionalidades incluidas
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-indigo-300" />
                  Soporte prioritario
                </span>
              </div>
              <Link
                href="/registro/asesoria"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-indigo-600 shadow-lg transition-all hover:bg-indigo-50"
              >
                Empezar gratis ahora
                <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Casos de uso */}
        <section className="bg-gray-50 py-20 dark:bg-gray-900/50 md:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                ¿Para qué tipo de asesoría es {brandConfig.app.name}?
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Desde el contable freelance con 5 clientes hasta la gestoría con 100 autónomos.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {USE_CASES.map((useCase) => {
                const Icon = useCase.icon;
                return (
                  <div
                    key={useCase.title}
                    className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950">
                      <Icon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                      {useCase.title}
                    </h3>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                      {useCase.description}
                    </p>
                    <ul className="space-y-2">
                      {useCase.points.map((point) => (
                        <li
                          key={point}
                          className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Comparativa para asesorías */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-4xl px-6">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                {brandConfig.app.name} vs. otras soluciones para asesorías
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Comparativa honesta. Sin asteriscos.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
                    <th className="px-4 py-4 text-left font-semibold text-gray-600 dark:text-gray-400">
                      Característica
                    </th>
                    <th className="bg-indigo-50 px-4 py-4 text-center font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {brandConfig.app.name}
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-gray-500 dark:text-gray-400">
                      Holded
                    </th>
                    <th className="px-4 py-4 text-center font-semibold text-gray-500 dark:text-gray-400">
                      Quipu
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ASESOR_COMPARISON.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-gray-50 last:border-0 dark:border-gray-800 ${
                        i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/30'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">
                        {row.label}
                      </td>
                      {(
                        [
                          { col: 'novafactura', val: row.novafactura, isNova: true },
                          { col: 'holded', val: row.holded, isNova: false },
                          { col: 'quipu', val: row.quipu, isNova: false },
                        ] as const
                      ).map(({ col, val, isNova }) => (
                        <td
                          key={col}
                          className={`px-4 py-3 text-center ${
                            isNova ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                          }`}
                        >
                          {typeof val === 'boolean' ? (
                            val ? (
                              <CheckCircle2
                                className={`mx-auto h-4 w-4 ${
                                  isNova ? 'text-indigo-600' : 'text-gray-400'
                                }`}
                              />
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            )
                          ) : (
                            <span
                              className={`text-xs font-semibold ${
                                isNova
                                  ? 'text-indigo-700 dark:text-indigo-300'
                                  : 'text-gray-500 dark:text-gray-400'
                              }`}
                            >
                              {val}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-center text-xs text-gray-400">
              * Datos basados en análisis de mercado a mayo de 2026. Los competidores pueden
              actualizar precios y funcionalidades en cualquier momento.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre el plan para asesorías" />

        <FooterLanding />
      </div>
    </>
  );
}

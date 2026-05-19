import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Code2,
  FileCheck,
  Lock,
  QrCode,
  Send,
  Shield,
  Sparkles,
  X,
} from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import SiteHeader from '@/components/site-header';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import RelatedLinksSection from '@/components/RelatedLinksSection';
import FaqSection from '@/components/FaqSection';
import FooterLanding from '@/components/FooterLanding';

export const novafacturaVerifactuSoftwareMetadata: Metadata = {
  title: `Software garante VeriFactu AEAT — Requisitos y cómo elegirlo | ${brandConfig.app.name}`,
  description:
    'Qué es un software garante certificado por la AEAT, qué requisitos técnicos debe cumplir (hash SHA-256, QR, envío AEAT, integridad de datos) y cómo saber si tu programa está homologado.',
  keywords: [
    'software garante verifactu',
    'software garante aeat',
    'que es software garante verifactu',
    'requisitos software verifactu',
    'software certificado verifactu',
    'programa facturación homologado aeat',
    'hash sha-256 verifactu',
    'qr verifactu factura',
    'como saber si mi software es verifactu',
    'software garante requisitos tecnicos',
  ],
  alternates: { canonical: `${brandConfig.app.url}/verifactu/software-garante` },
  openGraph: {
    title: `Software garante VeriFactu — Qué es y cómo elegirlo | ${brandConfig.app.name}`,
    description:
      'Todo sobre los requisitos técnicos del software garante AEAT: hash SHA-256, QR, envío a la AEAT y cómo verificar que tu software cumple.',
    url: `${brandConfig.app.url}/verifactu/software-garante`,
    type: 'article',
    siteName: brandConfig.app.name,
    locale: 'es_ES',
    images: [{ url: `${brandConfig.app.url}${brandConfig.app.ogImage}`, width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  twitter: {
    card: 'summary_large_image',
    title: `Software garante VeriFactu — Qué es y cómo elegirlo | ${brandConfig.app.name}`,
    description:
      'Qué es un software garante certificado por la AEAT, requisitos técnicos (hash SHA-256, QR, envío AEAT) y cómo verificar si tu programa cumple.',
    images: [`${brandConfig.app.url}${brandConfig.app.ogImage}`],
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué es un software garante VeriFactu?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Un software garante es un programa de facturación que cumple todos los requisitos técnicos de la Ley Antifraude 11/2021: genera un hash encadenado SHA-256 en cada factura, incluye un código QR verificable, envía los registros a la AEAT en tiempo real y garantiza la inalterabilidad del registro. La AEAT mantiene un listado de software certificado.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo sé si mi software de facturación es garante?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pregunta a tu proveedor si dispone de certificación VeriFactu de la AEAT. El software certificado debe mostrar en cada factura un código QR con el hash encadenado y un aviso de "Factura verificable en la AEAT". Si no ves esas características, tu software probablemente no está certificado.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puede NovaFactura ser el software garante para mi asesoría?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. NovaFactura está certificado como software garante y permite a asesorías y gestorías gestionar la facturación de múltiples clientes desde un panel único, con VeriFactu automático para cada uno. El plan para asesorías es gratuito.',
      },
    },
  ],
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Software garante VeriFactu AEAT — Requisitos técnicos y cómo elegirlo',
  description:
    'Guía técnica sobre los requisitos del software garante VeriFactu: hash SHA-256, QR, envío a AEAT y inalterabilidad del registro.',
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
      name: 'Software garante AEAT',
      item: `${brandConfig.app.url}/verifactu/software-garante`,
    },
  ],
};

const requirements = [
  {
    icon: Code2,
    title: 'Hash encadenado SHA-256',
    description:
      'Cada factura genera una huella digital SHA-256 que incorpora el hash de la factura anterior. Esto crea una cadena inviolable: si alguien modifica una factura, toda la cadena posterior queda invalidada.',
    critical: true,
  },
  {
    icon: QrCode,
    title: 'Código QR verificable en la AEAT',
    description:
      'Cada factura debe llevar un código QR que, al escanearse, muestre los datos registrados en la AEAT para comparar con lo que aparece en el documento. El receptor puede verificar la autenticidad al instante.',
    critical: true,
  },
  {
    icon: Send,
    title: 'Envío automático a la AEAT',
    description:
      'El software debe enviar automáticamente el registro de cada factura al sistema de la Agencia Tributaria en tiempo real o en lotes. El emisor recibe confirmación de recepción de cada factura.',
    critical: true,
  },
  {
    icon: Lock,
    title: 'Inalterabilidad del registro',
    description:
      'El software no puede permitir la modificación ni eliminación de facturas ya emitidas. Para correcciones, se usa una factura rectificativa con su propio hash encadenado.',
    critical: true,
  },
  {
    icon: FileCheck,
    title: 'Trazabilidad y auditoría',
    description:
      'El sistema debe mantener un log completo de todas las operaciones, incluyendo timestamps y el usuario que realizó cada acción. La AEAT puede solicitarlo en cualquier auditoría.',
    critical: false,
  },
  {
    icon: Clock,
    title: 'Firma temporal',
    description:
      'Cada factura debe llevar una marca de tiempo fiable. Esto garantiza que no se pueden predatar o postdatar facturas para manipular la contabilidad.',
    critical: false,
  },
];

const notCertified = [
  'Microsoft Excel',
  'Microsoft Word',
  'Google Docs / Sheets',
  'Cualquier plantilla de factura descargada de internet',
  'Software de contabilidad que no ha actualizado a VeriFactu',
  'Programas de facturación sin actualizar desde antes de 2025',
];

const checklistRows = [
  { item: 'Genera hash SHA-256 encadenado en cada factura', nova: true },
  { item: 'Código QR verificable en la AEAT visible en la factura', nova: true },
  { item: 'Envío automático de registros a la AEAT', nova: true },
  { item: 'Inalterabilidad — no permite editar facturas confirmadas', nova: true },
  { item: 'Trazabilidad y log de auditoría', nova: true },
  { item: 'Firma temporal en cada factura', nova: true },
  { item: 'Certificación oficial AEAT como software garante', nova: true },
  { item: 'Compatible con asesorías (multi-cliente)', nova: true },
];

const faqs = [
  {
    q: '¿Cómo sé si mi software de facturación es garante VeriFactu?',
    a: 'Existen tres señales concretas: (1) El software muestra un código QR en cada factura con el hash de verificación. (2) El software tiene conexión directa con la API de la AEAT y transmite cada factura automáticamente. (3) Tu proveedor puede acreditarte un certificado de software garante emitido por la Agencia Tributaria. Si tu programa actual no tiene estas características, no está certificado y deberás cambiar antes del plazo que te corresponda según tu tipo de contribuyente.',
  },
  {
    q: '¿Excel o Google Sheets pueden obtener la certificación VeriFactu?',
    a: 'No, y nunca podrán obtenerla. Excel y Google Sheets son herramientas de hoja de cálculo cuya arquitectura permite modificar y eliminar datos libremente, lo que es incompatible con el principio de inalterabilidad que exige VeriFactu. Tampoco pueden generar hash encadenado SHA-256 de forma nativa ni conectarse a la API oficial de la AEAT. Usar Excel después del plazo es ilegal para emitir facturas y puede derivar en sanciones de hasta 50.000€.',
  },
  {
    q: '¿Puedo usar un software para emitir facturas y otro diferente para el registro VeriFactu?',
    a: 'No. El Reglamento VeriFactu exige que el software garante sea el mismo que emite las facturas. Toda la cadena — creación de la factura, generación del hash, código QR y envío a la AEAT — debe ocurrir en el mismo sistema certificado. No es posible "parchear" un programa no certificado con un módulo externo de VeriFactu: el origen del registro debe ser el software garante.',
  },
  {
    q: '¿El software garante reemplaza al gestor o asesor fiscal?',
    a: 'No. El software garante garantiza el cumplimiento técnico de VeriFactu (hash encadenado, QR, registro AEAT), pero no sustituye el asesoramiento fiscal. Un asesor sigue siendo necesario para la planificación fiscal, la presentación de modelos (303, 130, 100), la gestión de deducciones y las situaciones fiscales complejas. Lo que sí ahorra el software es tiempo en preparar la documentación de facturas para entregársela al gestor.',
  },
  {
    q: '¿Qué requisitos técnicos exactos debe cumplir un software garante según la AEAT?',
    a: 'Según el Reglamento VeriFactu (RD 254/2025), el software debe: (1) Generar un hash SHA-256 encadenado para cada registro de facturación. (2) Incluir un código QR verificable en cada factura. (3) Transmitir los registros a la AEAT en tiempo real mediante la API oficial. (4) Garantizar la inalterabilidad de los registros una vez enviados. (5) Conservar los registros durante el período legal (mínimo 4 años). (6) Identificar al proveedor del software con su NIF y número de versión en cada registro.',
  },
  {
    q: '¿Existe un listado oficial de software garante publicado por la AEAT?',
    a: 'La AEAT no publica un directorio oficial de software garante. La verificación se realiza mediante la declaración responsable del proveedor y la posibilidad de validar las facturas en la sede electrónica de la AEAT escaneando el QR. Cuando contrates un software, solicita la documentación que acredite su conformidad con el Reglamento VeriFactu y comprueba que el QR de las facturas generadas es verificable en la sede de la AEAT.',
  },
  {
    q: '¿Qué ocurre si mi proveedor de software pierde la certificación VeriFactu?',
    a: 'Si tu proveedor pierde la certificación —por incumplimiento técnico, cierre de empresa o no adaptación a nuevas versiones del Reglamento— las facturas que emitas a partir de ese momento no serían válidas conforme a VeriFactu. Por eso es importante elegir un proveedor con respaldo legal y técnico sólido, que publique actualizaciones cada vez que la AEAT modifica los requisitos técnicos y que tenga historial demostrable de cumplimiento.',
  },
];

export function NovafacturaVerifactuSoftwarePage(): React.JSX.Element {
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
                { label: 'Software garante AEAT' },
              ]}
              color="text-blue-700"
            />
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              <FileCheck className="h-4 w-4" />
              Requisitos técnicos AEAT 2025
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Software garante VeriFactu — qué es y qué debe cumplir
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-2xl">
              Un <strong>software garante</strong> es el único tipo de programa que puede emitir
              facturas válidas en España desde julio 2025. Debe generar hash SHA-256, código QR y
              enviar cada factura a la AEAT automáticamente.
            </p>
          </div>
        </section>

        {/* Requisitos técnicos */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Requisitos técnicos obligatorios
            </h2>
            <p className="mb-10 text-slate-600">
              La AEAT define estos requisitos en el Reglamento VeriFactu. Sin alguno de los marcados
              como críticos, el software no puede obtener la certificación.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              {requirements.map((r) => {
                const Icon = r.icon;
                return (
                  <div
                    key={r.title}
                    className={`rounded-2xl border p-6 ${
                      r.critical
                        ? 'border-blue-100 bg-white'
                        : 'border-neutral-100 bg-neutral-50/50'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0 rounded-lg bg-blue-50 p-2">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-slate-900">{r.title}</h3>
                      </div>
                      {r.critical && (
                        <span className="flex-shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Crítico
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{r.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Lo que NO es software garante */}
        <section className="bg-red-50 py-12 md:py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-6 text-2xl font-bold text-slate-900">
              Estos programas NO pueden usarse para facturar en España
            </h2>
            <p className="mb-6 text-slate-600">
              Desde julio 2025, emitir facturas con estos programas supone incumplimiento de la Ley
              Antifraude:
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {notCertified.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-white border border-red-100 px-4 py-3"
                >
                  <X className="h-4 w-4 flex-shrink-0 text-red-500" />
                  <span className="text-sm text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* NovaFactura cumple todo */}
        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              ¿Cumple NovaFactura todos los requisitos?
            </h2>
            <p className="mb-8 text-slate-600">
              Sí. NovaFactura está certificado como software garante por la AEAT. Este es el
              checklist completo:
            </p>
            <div className="rounded-2xl border border-green-100 bg-white overflow-hidden">
              <div className="border-b border-neutral-100 bg-slate-50 px-5 py-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <span>Requisito</span>
                  <span>NovaFactura</span>
                </div>
              </div>
              {checklistRows.map((row, i) => (
                <div
                  key={row.item}
                  className={`flex items-center justify-between px-5 py-3.5 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                >
                  <span className="text-sm text-slate-700">{row.item}</span>
                  {row.nova ? (
                    <BadgeCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <X className="h-4 w-4 text-red-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FaqSection faqs={faqs} title="Preguntas frecuentes sobre el software garante" />

        {/* CTA */}
        <section className="border-t bg-slate-900 py-14 md:py-16">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <Shield className="mx-auto mb-4 h-10 w-10 text-blue-400" />
            <h2 className="mb-3 text-3xl font-bold text-white">
              NovaFactura — Software garante certificado
            </h2>
            <p className="mb-8 text-slate-400">
              Gratis hasta 2027. Hash, QR y envío a la AEAT automático en cada factura. Sin
              configurar nada.
            </p>
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-7 py-3.5 text-base font-semibold text-white shadow-lg transition hover:bg-blue-400"
            >
              <Sparkles className="h-5 w-5" />
              Empezar gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        <RelatedLinksSection
          title="Más sobre VeriFactu"
          links={[
            {
              href: '/verifactu/cuando-es-obligatorio',
              label: '¿Cuándo es obligatorio VeriFactu?',
            },
            { href: '/verifactu/sanciones', label: 'Sanciones por incumplimiento — hasta 50.000€' },
            { href: '/facturacion-online', label: 'Software de facturación certificado VeriFactu' },
          ]}
        />

        <FooterLanding />
      </div>
    </>
  );
}

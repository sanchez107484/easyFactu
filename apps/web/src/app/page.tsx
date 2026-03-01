'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { brandConfig } from '@easyfactura/brand-config';
import { useAuthStore } from '@/store/auth-store';
import {
  Shield,
  Zap,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  TrendingUp,
  FileCheck,
  Lock,
  Smartphone,
  ArrowRight,
} from 'lucide-react';

// Schema.org JSON-LD para SEO
const schemaData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: brandConfig.app.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
        priceValidUntil: '2027-01-01',
        availability: 'https://schema.org/InStock',
      },
      description:
        'Software de facturación VeriFactu para autónomos y pymes. Cumple con la Ley Antifraude 11/2021 de forma automática.',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '127',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: '¿Cuándo es obligatorio VeriFactu?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'VeriFactu es obligatorio desde julio de 2025 para nuevos autónomos y desde julio de 2026 para los existentes. Todos los sistemas de facturación deben cumplir con los requisitos de la Ley Antifraude 11/2021.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué multas hay por no usar un software certificado?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'El uso de software no certificado o manipular facturas puede conllevar sanciones de hasta 50.000€ según la Ley General Tributaria. Por eso es crucial usar un sistema VeriFactu homologado.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Es EasyFactura compatible con el sistema de la AEAT?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sí, EasyFactura tiene conexión API directa con la Agencia Tributaria. Cada factura se envía automáticamente cumpliendo con todos los requisitos del Reglamento de facturación.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Puedo usarlo si soy autónomo en módulos?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sí, EasyFactura está adaptado a todos los regímenes fiscales: estimación directa, objetiva (módulos) y recargo de equivalencia.',
          },
        },
        {
          '@type': 'Question',
          name: '¿Qué pasa en 2027 con mis datos?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Tus datos son tuyos. Podrás exportarlos en cualquier momento o seguir usando EasyFactura desde 9,99€/mes. Sin permanencia ni letra pequeña.',
          },
        },
      ],
    },
  ],
};

const features = [
  {
    icon: Shield,
    title: 'Automatización VeriFactu',
    description: 'Envío instantáneo de registros a Hacienda con hash encadenado y QR automático.',
  },
  {
    icon: Zap,
    title: 'Simplicidad Absoluta',
    description: 'Diseñado para personas que no saben de contabilidad. Crea facturas en segundos.',
  },
  {
    icon: Download,
    title: 'Migración Fácil',
    description: 'Importa tus clientes y facturas desde Excel o Holded en un solo clic.',
  },
];

const technicalKeywords = [
  'Ley 11/2021',
  'Reglamento de facturación',
  'Integridad de registros',
  'Trazabilidad',
  'Inalterabilidad',
  'QR en facturas',
  'Firma electrónica',
  'AEAT',
];

const comparisonData = [
  {
    feature: 'Cumple Ley Antifraude',
    traditional: false,
    easyFactura: true,
  },
  {
    feature: 'Hash encadenado automático',
    traditional: false,
    easyFactura: true,
  },
  {
    feature: 'Envío a AEAT integrado',
    traditional: false,
    easyFactura: true,
  },
  {
    feature: 'Código QR en facturas',
    traditional: false,
    easyFactura: true,
  },
  {
    feature: 'Sin instalación',
    traditional: false,
    easyFactura: true,
  },
  {
    feature: 'Gratis hasta 2027',
    traditional: false,
    easyFactura: true,
  },
];

const faqs = [
  {
    question: '¿Cuándo es obligatorio VeriFactu?',
    answer:
      'VeriFactu es obligatorio desde julio de 2025 para nuevos autónomos y desde julio de 2026 para los existentes. Todos los sistemas de facturación deben cumplir con los requisitos de la Ley Antifraude 11/2021.',
  },
  {
    question: '¿Qué multas hay por no usar un software certificado?',
    answer:
      'El uso de software no certificado o manipular facturas puede conllevar sanciones de hasta 50.000€ según la Ley General Tributaria. Por eso es crucial usar un sistema VeriFactu homologado.',
  },
  {
    question: '¿Es EasyFactura compatible con el sistema de la AEAT?',
    answer:
      'Sí, EasyFactura tiene conexión API directa con la Agencia Tributaria. Cada factura se envía automáticamente cumpliendo con todos los requisitos del Reglamento de facturación.',
  },
  {
    question: '¿Puedo usarlo si soy autónomo en módulos?',
    answer:
      'Sí, EasyFactura está adaptado a todos los regímenes fiscales: estimación directa, objetiva (módulos) y recargo de equivalencia.',
  },
  {
    question: '¿Qué pasa en 2027 con mis datos?',
    answer:
      'Tus datos son tuyos. Podrás exportarlos en cualquier momento o seguir usando EasyFactura desde 9,99€/mes. Sin permanencia ni letra pequeña.',
  },
];

export default function HomePage() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  useEffect(() => {
    checkAuth();

    // Sticky CTA al hacer scroll
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [checkAuth]);

  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary-600">{brandConfig.app.name}</span>
              <Badge variant="success" className="hidden sm:inline-flex">
                100% VeriFactu
              </Badge>
            </div>
            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button>Ir a Inicio</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:inline-flex">
                    <Button variant="ghost">Iniciar sesión</Button>
                  </Link>
                  <Link href="/registro">
                    <Button>Probar Gratis</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {/* SECCIÓN 1: Hero Section */}
          <section className="container px-4 py-16 md:py-24">
            <div className="mx-auto max-w-4xl text-center">
              <Badge variant="outline" className="mb-4">
                El primer software nativo VeriFactu
              </Badge>

              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Programa de Facturación VeriFactu para Autónomos y Pymes
              </h1>

              <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:text-2xl">
                Cumple con la <strong>Ley Antifraude 11/2021</strong> de forma automática. Crea
                facturas legales en segundos, envíalas a la AEAT y olvídate de sanciones.
              </p>

              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                {!isAuthenticated && (
                  <>
                    <Link href="/registro">
                      <Button size="lg" className="w-full sm:w-auto">
                        Probar Gratis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto">
                        Ya tengo cuenta
                      </Button>
                    </Link>
                  </>
                )}
                {isAuthenticated && (
                  <Link href="/dashboard">
                    <Button size="lg">
                      Ir a Inicio
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                <CheckCircle2 className="mr-1 inline h-4 w-4 text-green-600" />
                Adaptado 100% a los requisitos de la Agencia Tributaria
              </p>
            </div>
          </section>

          {/* SECCIÓN 2: El Problema (Agitación) */}
          <section className="border-y bg-muted/40 py-16">
            <div className="container px-4">
              <div className="mx-auto max-w-3xl">
                <div className="mb-6 flex items-center justify-center">
                  <AlertTriangle className="h-12 w-12 text-yellow-600" />
                </div>

                <h2 className="mb-6 text-center text-3xl font-bold sm:text-4xl">
                  ¿Tu software actual está listo para VeriFactu?
                </h2>

                <div className="space-y-4 text-lg text-muted-foreground">
                  <p>
                    A partir de 2025/2026, usar Excel o programas no certificados conlleva{' '}
                    <strong className="text-destructive">multas de hasta 50.000€</strong>.
                  </p>
                  <p>
                    No te la juegues con soluciones a medias. {brandConfig.app.name} nace para que
                    no tengas que preocuparte por el "hash encadenado" ni los códigos QR.{' '}
                    <strong className="text-foreground">Nosotros lo hacemos por ti</strong>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 3: Beneficios (La Solución) */}
          <section className="container px-4 py-16">
            <div className="mx-auto max-w-6xl">
              <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">
                Funcionalidades de {brandConfig.app.name} para cumplir con Hacienda
              </h2>

              <div className="grid gap-8 md:grid-cols-3">
                {features.map((feature) => (
                  <Card key={feature.title} className="border-2">
                    <CardContent className="p-6">
                      <feature.icon className="mb-4 h-12 w-12 text-primary-600" />
                      <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-12">
                <h3 className="mb-6 text-center text-2xl font-bold">
                  Generación de facturas con código QR y Hash
                </h3>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <FileCheck className="mx-auto mb-3 h-8 w-8 text-primary-600" />
                      <h4 className="font-semibold">Hash encadenado</h4>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Garantiza la inalterabilidad
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Lock className="mx-auto mb-3 h-8 w-8 text-primary-600" />
                      <h4 className="font-semibold">Firma electrónica</h4>
                      <p className="mt-2 text-sm text-muted-foreground">Integridad certificada</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Smartphone className="mx-auto mb-3 h-8 w-8 text-primary-600" />
                      <h4 className="font-semibold">Código QR</h4>
                      <p className="mt-2 text-sm text-muted-foreground">Cumplimiento normativo</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <TrendingUp className="mx-auto mb-3 h-8 w-8 text-primary-600" />
                      <h4 className="font-semibold">Conexión AEAT</h4>
                      <p className="mt-2 text-sm text-muted-foreground">Envío automático</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 4: Autoridad Técnica (SEO Semántico) */}
          <section className="border-y bg-muted/40 py-16">
            <div className="container px-4">
              <div className="mx-auto max-w-4xl">
                <h2 className="mb-8 text-center text-3xl font-bold sm:text-4xl">
                  ¿Qué es VeriFactu y por qué es obligatorio para autónomos?
                </h2>

                <div className="prose prose-lg mx-auto max-w-none dark:prose-invert">
                  <p>
                    <strong>VeriFactu</strong> es el nombre del sistema de gestión de facturación
                    que exige la <strong>Ley Antifraude 11/2021</strong>. Este reglamento obliga a
                    todos los autónomos y empresas a usar un <strong>software garante</strong> que
                    garantice la <strong>trazabilidad</strong>, <strong>inalterabilidad</strong> e{' '}
                    <strong>integridad de registros</strong> de todas sus facturas.
                  </p>
                  <p>
                    Cada factura debe incluir un <strong>hash encadenado</strong> (huella digital
                    única), un <strong>código QR</strong> y enviarse automáticamente a la{' '}
                    <strong>AEAT</strong> (Agencia Tributaria). Esto significa que ya no puedes usar
                    Excel, Word ni software que no cumpla con el{' '}
                    <strong>Reglamento de facturación</strong>.
                  </p>
                  <p>
                    {brandConfig.app.name} implementa <strong>firma electrónica</strong>, genera el
                    hash automáticamente y se conecta con la{' '}
                    <strong>facturación electrónica obligatoria</strong> desde el primer día.
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-2">
                  {technicalKeywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN: Comparativa */}
          <section className="container px-4 py-16">
            <div className="mx-auto max-w-4xl">
              <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">
                Comparativa: {brandConfig.app.name} vs Software Tradicional
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="py-4 text-left">Característica</th>
                      <th className="py-4 text-center">Software Tradicional</th>
                      <th className="py-4 text-center">{brandConfig.app.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-4">{row.feature}</td>
                        <td className="py-4 text-center">
                          {row.traditional ? (
                            <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
                          ) : (
                            <span className="text-destructive">✕</span>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          {row.easyFactura && (
                            <CheckCircle2 className="mx-auto h-5 w-5 text-green-600" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* SECCIÓN 5: Oferta Irresistible */}
          <section className="border-y bg-primary-50 py-16 dark:bg-primary-950">
            <div className="container px-4">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="mb-6 text-4xl font-bold sm:text-5xl">
                  Gratis hoy. Gratis mañana. Gratis hasta 2027.
                </h2>

                <p className="mb-8 text-xl text-muted-foreground">
                  Queremos ayudarte en la transición a VeriFactu. Por eso, todas las funciones
                  premium son <strong className="text-foreground">gratuitas</strong> para los
                  primeros 5.000 usuarios hasta el{' '}
                  <strong className="text-foreground">1 de enero de 2027</strong>. Sin letra
                  pequeña.
                </p>

                <div className="grid gap-6 sm:grid-cols-3">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Users className="mx-auto mb-3 h-10 w-10 text-primary-600" />
                      <div className="text-3xl font-bold">5.000</div>
                      <p className="text-sm text-muted-foreground">Plazas gratuitas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Clock className="mx-auto mb-3 h-10 w-10 text-primary-600" />
                      <div className="text-3xl font-bold">Hasta 2027</div>
                      <p className="text-sm text-muted-foreground">100% gratis</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6 text-center">
                      <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary-600" />
                      <div className="text-3xl font-bold">0€</div>
                      <p className="text-sm text-muted-foreground">Sin tarjeta</p>
                    </CardContent>
                  </Card>
                </div>

                {!isAuthenticated && (
                  <div className="mt-8">
                    <Link href="/registro">
                      <Button size="lg" className="h-12 px-8 text-lg">
                        Empezar Gratis Ahora
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <p className="mt-3 text-sm text-muted-foreground">
                      No se requiere tarjeta de crédito
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECCIÓN: Preguntas Frecuentes */}
          <section className="container px-4 py-16">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-12 text-center text-3xl font-bold sm:text-4xl">
                Preguntas frecuentes sobre el sistema VeriFactu
              </h2>

              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left text-lg font-semibold">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>

          {/* CTA Final */}
          <section className="border-t bg-muted/40 py-16">
            <div className="container px-4 text-center">
              <h2 className="mb-4 text-3xl font-bold">¿Listo para cumplir con Hacienda?</h2>
              <p className="mb-8 text-xl text-muted-foreground">
                Únete a los autónomos que ya confían en {brandConfig.app.name}
              </p>
              {!isAuthenticated && (
                <Link href="/registro">
                  <Button size="lg" className="h-12 px-8">
                    Crear mi cuenta gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="container px-4 text-center text-sm text-muted-foreground">
            © 2026 {brandConfig.app.legalEntity}. Todos los derechos reservados.
          </div>
        </footer>

        {/* Sticky CTA Button (Mobile/Scroll) */}
        {showStickyCTA && !isAuthenticated && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:hidden">
            <Link href="/registro" className="block">
              <Button size="lg" className="w-full">
                Registro Gratis
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

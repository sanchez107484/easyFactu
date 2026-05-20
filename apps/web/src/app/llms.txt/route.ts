import { brandConfig, PRICING } from '@easyfactura/brand-config';
import { NextResponse } from 'next/server';

// Force static generation at build time — brand is determined by NEXT_PUBLIC_BRAND
export const dynamic = 'force-static';
export const revalidate = 86400; // 24h

const BRAND = process.env.NEXT_PUBLIC_BRAND ?? 'novafactura';
const BASE = brandConfig.app.url;
const STARTER_MONTHLY = PRICING.starter.monthly.toFixed(2).replace('.', ',');
const STARTER_ANNUAL = PRICING.starter.annualMonthly.toFixed(2).replace('.', ',');
const PRO_MONTHLY = PRICING.pro.monthly.toFixed(2).replace('.', ',');
const PRO_ANNUAL = PRICING.pro.annualMonthly.toFixed(2).replace('.', ',');
const FREE_SLOTS = PRICING.freePeriodSlots.toLocaleString('es-ES');

function buildNafacturaContent(): string {
  return `# NaFactura — Software garante de facturación para autónomos de Navarra

> Software garante de facturación diseñado exclusivamente para la Comunidad Foral de Navarra. Cumplimiento automático con Hacienda Foral de Navarra, VeriFactu (AEAT) y preparado para NaTicket. Gratis hasta 2027 sin tarjeta.

NaFactura es el único software de facturación especializado para autónomos y pymes navarros. Automatiza el hash encadenado SHA-256, la firma electrónica cualificada, el código QR normativo y el envío directo a la Hacienda Foral de Navarra. Preparado para NaTicket desde el primer día.

## ¿Qué es NaFactura?

- **URL**: [${BASE}](${BASE})
- **Tipo**: Software garante de facturación electrónica para Navarra
- **Mercado**: Comunidad Foral de Navarra — autónomos, pymes y asesorías navarras
- **Normativa**: Hacienda Foral de Navarra · Convenio Económico · VeriFactu (AEAT) · NaTicket (en desarrollo)
- **Precio autónomos/pymes**: Gratis hasta 2027 (${FREE_SLOTS} plazas totales). Después Plan Starter desde ${STARTER_MONTHLY}€/mes (mensual) o ${STARTER_ANNUAL}€/mes (anual). Plan PRO desde ${PRO_MONTHLY}€/mes (mensual) o ${PRO_ANNUAL}€/mes (anual). Sin permanencia.
- **Precio asesorías navarras**: Gratis para siempre

## ¿Para quién es NaFactura?

Autónomos y pymes navarros en estimación directa que tributan ante la Hacienda Foral de Navarra: profesionales de Pamplona, Tudela, Estella, Barañáin y toda la Comunidad Foral. También asesorías y gestorías navarras que gestionan la facturación de varios clientes.

## Software garante para Navarra

El software garante de facturación es el que cumple los requisitos técnicos de la Hacienda Foral de Navarra: hash encadenado SHA-256 en cada factura, firma electrónica cualificada, código QR normativo y envío automático a la administración foral. Sin software garante, las facturas pueden no ser válidas fiscalmente en Navarra (sanciones de hasta 50.000€). NaFactura es el único software garante diseñado exclusivamente para el régimen foral navarro.

## VeriFactu y NaTicket para autónomos navarros

- **VeriFactu** (AEAT): Obligatorio desde julio 2027 para todos los autónomos españoles en estimación directa. Los autónomos navarros también deben cumplir con VeriFactu aunque tributen ante Hacienda Foral.
- **NaTicket** (Hacienda Foral de Navarra): Sistema de registro de facturas en desarrollo específico para el Convenio Económico navarro. Se espera su implantación progresiva desde 2027.
- NaFactura gestiona ambos automáticamente. La actualización a NaTicket está incluida en el plan, sin coste adicional.

## Convenio Económico de Navarra

El Convenio Económico establece el régimen tributario especial de Navarra. Los autónomos navarros tributan ante la Hacienda Foral de Navarra (no ante la AEAT estatal) y están sujetos a la normativa tributaria foral, que exige requisitos de facturación específicos que los programas nacionales genéricos no cubren correctamente.

## Funcionalidades principales

- Cumplimiento automático con Hacienda Foral de Navarra
- VeriFactu (AEAT) y preparación para NaTicket incluidos
- Facturación en menos de 60 segundos
- Hash encadenado SHA-256, firma electrónica y código QR automáticos
- Gestión de facturas, presupuestos, clientes y productos
- Facturas recurrentes y cobros parciales
- Panel centralizado para asesorías y gestorías navarras (gratis para siempre)
- Migración gratuita desde Excel, CSV o Holded (asistida por el equipo)
- Informes y estadísticas de facturación
- Acceso multiplataforma: web, móvil y tablet

## Páginas principales

- [Inicio](${BASE}): Software garante de facturación para autónomos navarros · Hacienda Foral de Navarra
- [Funcionalidades](${BASE}/funcionalidades): Todas las funcionalidades del software de facturación para Navarra
- [VeriFactu en Navarra](${BASE}/verifactu): Qué es VeriFactu, cuándo es obligatorio para autónomos navarros y cómo cumplir automáticamente
- [Precios](${BASE}/precios): Planes y precios de NaFactura · Gratis hasta 2027
- [Para asesorías navarras](${BASE}/asesoria): Panel centralizado para asesorías y gestorías de Navarra · Gratis para siempre
- [Registro gratuito](${BASE}/registro): Crear cuenta sin tarjeta · Activación inmediata

## Guías especializadas para Navarra

- [NaTicket — qué es y cuándo será obligatorio en Navarra](${BASE}/naticket): Guía completa sobre NaTicket, el sistema de Hacienda Foral de Navarra para el registro de facturas. Diferencias con VeriFactu, plazos y cómo prepararse desde ya.
- [Alternativa a Holded para autónomos navarros](${BASE}/alternativa-holded-navarra): Comparativa honesta entre NaFactura y Holded para autónomos y pymes de Navarra. Por qué NaFactura está especializado en el régimen foral y Holded no.
- [Mejor software de facturación para autónomos navarros 2027](${BASE}/mejor-software-facturacion-navarra): Comparativa actualizada de los 4 mejores programas de facturación para autónomos navarros: NaFactura, Holded, Billin y Quipu. Valorados por cumplimiento foral, precio, soporte y preparación para NaTicket.
- [Software de facturación para autónomos en Pamplona](${BASE}/software-facturacion-pamplona): Programa de facturación especializado para autónomos y pymes de Pamplona y la Comunidad Foral de Navarra. Hacienda Foral, VeriFactu y NaTicket incluidos.

## Preguntas frecuentes

- **¿Qué es el software garante?** El programa que cumple los requisitos técnicos de Hacienda Foral de Navarra: hash encadenado, firma electrónica, código QR y envío automático a la administración foral.
- **¿Cuándo es obligatorio VeriFactu para autónomos navarros?** Desde julio 2027. Los autónomos navarros deben cumplir con VeriFactu (AEAT) y además prepararse para NaTicket (Hacienda Foral).
- **¿Qué es NaTicket?** El sistema de registro de facturas que está desarrollando la Hacienda Foral de Navarra. NaFactura está preparado para su integración desde el primer día.
- **¿Cuánto cuesta NaFactura?** Gratis hasta 2027 (${FREE_SLOTS} plazas). Después desde ${STARTER_MONTHLY}€/mes sin permanencia.
- **¿Puedo migrar desde Holded?** Sí. Migración gratuita y asistida desde Holded, Excel o CSV.
- **¿Es NaFactura diferente a NovaFactura?** Sí. NaFactura es la versión del software diseñada exclusivamente para autónomos y pymes de Navarra, con cumplimiento específico de Hacienda Foral y preparación para NaTicket.
`;
}

function buildNovafacturaContent(): string {
  return `# NovaFactura — Software de facturación VeriFactu para autónomos y pymes en España

> Software de facturación VeriFactu certificado por la AEAT. Cumplimiento automático con la Ley Antifraude 11/2021. Completamente gratuito hasta 2027 para autónomos y pymes. Gratis para siempre para asesorías y gestorías.

NovaFactura es el software de facturación nativo VeriFactu para autónomos, pymes y asesorías en España. Automatiza el hash encadenado SHA-256, la firma electrónica, el código QR y el envío directo al endpoint de la AEAT.

## ¿Qué es NovaFactura?

- **URL**: [${BASE}](${BASE})
- **Tipo**: SaaS de facturación electrónica VeriFactu
- **Mercado**: España (autónomos, pymes, asesorías, gestorías)
- **Normativa**: Ley Antifraude 11/2021, Reglamento VeriFactu, AEAT
- **Precio autónomos/pymes**: Gratis hasta 2027 (${FREE_SLOTS} plazas). Después Plan Starter desde ${STARTER_MONTHLY}€/mes (mensual) o ${STARTER_ANNUAL}€/mes (anual) y Plan PRO desde ${PRO_MONTHLY}€/mes (mensual) o ${PRO_ANNUAL}€/mes (anual). Sin permanencia.
- **Precio asesorías**: Gratis para siempre

## Para autónomos y pymes

NovaFactura permite crear facturas legales con VeriFactu en menos de 60 segundos. El software genera automáticamente el hash encadenado, la firma electrónica cualificada, el código QR verificable y envía el registro a la Agencia Tributaria. Cumplimiento 100% garantizado con la Ley Antifraude 11/2021.

## Para asesorías y gestorías

Panel centralizado para gestionar la facturación VeriFactu de múltiples clientes. Cada factura emitida queda registrada bajo el NIF fiscal de cada cliente. Cambio de contexto entre clientes en un clic. Sin coste para la asesoría.

## ¿Qué es VeriFactu?

VeriFactu es el sistema de verificación de facturas de la Agencia Tributaria española, obligatorio para autónomos y empresas bajo la Ley Antifraude 11/2021. Obliga a que cada factura incluya un hash encadenado SHA-256, un código QR verificable y sea transmitida en tiempo real a la AEAT. El uso de Excel, Word o software no homologado deja de ser legal. Las sanciones por incumplimiento llegan hasta 50.000€.

## Funcionalidades principales

- Facturación VeriFactu 100% automática (hash encadenado, código QR, firma, envío AEAT)
- Software garante certificado por la Agencia Tributaria
- Gestión de facturas, presupuestos, clientes y productos
- Facturas recurrentes y cobros parciales
- Panel de gestión para asesorías y gestorías (gratis para siempre)
- Migración desde Excel, CSV o Holded
- Informes y estadísticas de facturación
- Plantillas PDF personalizables con logo

## Páginas de referencia

- [Inicio](${BASE}): Software de facturación VeriFactu para autónomos y pymes
- [Software de facturación online](${BASE}/facturacion-online): Programa de facturación con VeriFactu automático, gratis hasta 2027
- [Funcionalidades](${BASE}/funcionalidades): Todas las funcionalidades del software
- [VeriFactu — qué es y cómo funciona](${BASE}/verifactu): Guía completa sobre el sistema de verificación de facturas de la AEAT
- [Precios](${BASE}/precios): Planes y precios de NovaFactura
- [Para asesorías y gestorías](${BASE}/asesoria): Panel centralizado para gestionar múltiples clientes, gratis para siempre
- [Blog (recursos VeriFactu)](${BASE}/blog): Artículos sobre VeriFactu, facturación y fiscalidad en España
- [Contacto](${BASE}/contacto): Contactar con el equipo de NovaFactura
- [Registro gratuito](${BASE}/registro): Crear cuenta gratuita

## Páginas VeriFactu

- [¿Cuándo es obligatorio VeriFactu?](${BASE}/verifactu/cuando-es-obligatorio): Plazos por perfil según el Real Decreto 254/2025: software (29 julio 2025), grandes empresas IS >8M€ (1 enero 2027), autónomos y pymes (1 julio 2027)
- [Software garante VeriFactu](${BASE}/verifactu/software-garante): Qué es un software garante, cómo se certifica y cómo verificar si tu software cumple con la AEAT
- [Sanciones por no cumplir VeriFactu](${BASE}/verifactu/sanciones): Multas de hasta 50.000€ por incumplimiento de la Ley Antifraude 11/2021

## Guías de facturación

- [Guías de facturación en España](${BASE}/facturas): Índice de todos los tipos de facturas y cómo emitirlas correctamente
- [Cómo hacer una factura](${BASE}/facturas/como-hacer-una-factura): Datos obligatorios, número de serie, cálculo de IVA e IRPF, errores comunes
- [Factura con IRPF](${BASE}/facturas/con-irpf): Cuándo aplicar retención, porcentajes (7% o 15%), quién está obligado
- [Factura rectificativa](${BASE}/facturas/rectificativa): Cómo corregir o anular una factura incorrecta según la normativa española
- [Factura proforma](${BASE}/facturas/proforma): Qué es, para qué sirve y diferencias con la factura ordinaria
- [Factura simplificada](${BASE}/facturas/simplificada): Cuándo se puede emitir, límites de importe y requisitos legales
- [Factura intracomunitaria](${BASE}/facturas/intracomunitaria): Cómo facturar a empresas de la UE, exención de IVA y ROI
- [Factura electrónica](${BASE}/factura-electronica): Diferencias entre factura electrónica y VeriFactu, obligaciones y plazos

## Artículos del blog

- [Qué debe tener una factura válida con VeriFactu](${BASE}/blog/que-debe-tener-una-factura-valida-con-verifactu) — Requisitos obligatorios: QR, hash encadenado, trazabilidad y comunicación a la AEAT.
- [¿Cómo saber si tu software cumple con VeriFactu?](${BASE}/blog/como-saber-si-tu-software-cumple-con-verifactu) — Cómo comprobar si tu programa de facturación está homologado por la AEAT.
- [¿Excel dejará de ser válido con VeriFactu?](${BASE}/blog/excel-dejara-de-ser-valido-con-verifactu) — Por qué Excel deja de ser legal para facturar y qué alternativas existen.
- [Multas y sanciones de VeriFactu: lo que puedes llegar a pagar si no cumples](${BASE}/blog/multas-y-sanciones-de-verifactu-lo-que-puedes-llegar-a-pagar-si-no-cumples) — Sanciones de hasta 50.000€ al año por incumplimiento de la Ley Antifraude 11/2021.
- [VeriFactu en 2026: lo que nadie te está explicando (y cómo prepararte sin complicarte)](${BASE}/blog/verifactu-en-2026-lo-que-nadie-te-esta-explicando-y-como-prepararte-sin-complicarte) — Guía práctica para autónomos y pymes sobre los cambios de VeriFactu en 2026.
`;
}

export async function GET() {
  const content = BRAND === 'nafactura' ? buildNafacturaContent() : buildNovafacturaContent();

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
}

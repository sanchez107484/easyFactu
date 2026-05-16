// brand.config.ts
// ============================================================
// IDENTIDAD DE MARCA
// ============================================================
// Este archivo define la identidad textual y los logos del
// producto. Para crear un producto con otra marca, cambia
// los valores de este archivo y de theme.config.ts.
//
// - Nombre, descripción, tagline, URLs, email de soporte
// - Rutas de logos (deben existir en apps/web/public/brand/)
//
// Los colores están en theme.config.ts
// ============================================================

export interface BrandConfig {
  app: {
    name: string;
    shortName: string;
    description: string;
    tagline: string;
    url: string;
    domain: string;
    supportEmail: string;
    legalEntity: string;
    nif: string;
    address: string;
    city: string;
  };
  logos: {
    main: string;
    icon: string;
    white: string;
    email: string;
    favicon: string;
    pwa: {
      icon192: string;
      icon512: string;
      maskable: string;
    };
  };
}

export const brandConfig: BrandConfig = {
  // ==================== IDENTIDAD ====================
  app: {
    name: 'NovaFactura',
    shortName: 'NovaFactura',
    description: 'Facturación inteligente para autónomos y PYMEs con VeriFactu integrado',
    tagline: 'Factura sin complicaciones. VeriFactu automático.',
    url: 'https://www.novafactura.es',
    domain: 'www.novafactura.es',
    supportEmail: 'info@novafactura.es',
    legalEntity: 'NovaFactura S.L.',
    // TODO: Actualizar con datos reales antes de lanzar
    nif: '[NIF/CIF]',
    address: '[Dirección fiscal completa]',
    city: '[Ciudad]',
  },

  // ==================== LOGOS ====================
  // Los archivos deben existir en apps/web/public/brand/
  logos: {
    main: '/brand/logo.png',
    icon: '/brand/logo-icon.png',
    white: '/brand/logo-white.png',
    email: '/brand/logo-email.png',
    favicon: '/brand/favicon.ico',
    pwa: {
      icon192: '/brand/pwa-192x192.png',
      icon512: '/brand/pwa-512x512.png',
      maskable: '/brand/pwa-maskable-512x512.png',
    },
  },
};

// ============================================================
// PLAZAS CONFIG — actualiza `ocupadas` desde tu backend
// ============================================================
export const PLAZAS_CONFIG = {
  total: 5000,
  ocupadas: 2562,
  get disponibles() {
    return this.total - this.ocupadas;
  },
  get porcentaje() {
    return Math.round((this.ocupadas / this.total) * 100);
  },
};

// ============================================================
// PRICING CONFIG — única fuente de precios
// Dos planes: Starter (VeriFactu incluido, hasta 60 facturas/año) y PRO (VeriFactu incluido, facturas ilimitadas)
// ============================================================
export const PRICING = {
  starter: {
    monthly: 15.9,
    annualMonthly: 12.9,
    annualTotal: 154.8, // 12.9 × 12
    annualSaving: 36, // (15.9 - 12.9) × 12
  },
  pro: {
    monthly: 29.9,
    annualMonthly: 24.9,
    annualTotal: 298.8, // 24.9 × 12
    annualSaving: 60, // (29.9 - 24.9) × 12
  },
  freePeriodMonths: 6,
  freePeriodSlots: 5000,
} as const;

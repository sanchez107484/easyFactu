// ============================================================
// NAFACTURA — Configuración de marca
// Facturación para autónomos y PYMEs conectada a Hacienda Navarra
// ============================================================

export const nafacturaBrandConfig = {
  colors: {
    highlight: '#012641',
    highlightBg: 'rgba(1, 38, 65, 0.1)',
    highlightBorder: '#01375e',
  },
  app: {
    name: 'NaFactura',
    shortName: 'NaFactura',
    description:
      'Facturación inteligente para autónomos y PYMEs navarros con cumplimiento fiscal integrado',
    tagline: 'Factura sin complicaciones. Cumplimiento foral automático.',
    url: 'https://www.nafactura.es',
    domain: 'www.nafactura.es',
    ogImage: '/brand/nafactura/og-image.png',
    supportEmail: 'info@nafactura.es',
    legalEntity: 'NaFactura S.L.',
    nif: '[NIF/CIF]',
    address: '[Dirección fiscal completa]',
    city: '[Ciudad]',
    sameAs: ['https://www.linkedin.com/company/nafactura', 'https://www.instagram.com/na.factura'],
  },
  logos: {
    main: '/brand/nafactura/logo.png',
    icon: '/brand/nafactura/logo-icon.png',
    white: '/brand/nafactura/logo-white.png',
    email: '/brand/nafactura/logo-email.png',
    favicon: '/brand/nafactura/favicon.ico',
    pwa: {
      icon192: '/brand/nafactura/pwa-192x192.png',
      icon512: '/brand/nafactura/pwa-512x512.png',
      maskable: '/brand/nafactura/pwa-maskable-512x512.png',
    },
  },
};

export const nafacturaPlazasConfig = {
  total: 1000,
  ocupadas: 237,
  get disponibles() {
    return this.total - this.ocupadas;
  },
  get porcentaje() {
    return Math.round((this.ocupadas / this.total) * 100);
  },
};

export const nafacturaPricing = {
  starter: {
    monthly: 6.9,
    annualMonthly: 5.9,
    annualTotal: 82.8,
    annualSaving: 12,
  },
  pro: {
    monthly: 8.9,
    annualMonthly: 7.5,
    annualTotal: 106.8,
    annualSaving: 16.8,
  },
  freePeriodMonths: 6,
  freePeriodSlots: 1000,
};

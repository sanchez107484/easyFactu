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
    supportEmail: 'info@nafactura.es',
    legalEntity: 'NaFactura S.L.',
    nif: '[NIF/CIF]',
    address: '[Dirección fiscal completa]',
    city: '[Ciudad]',
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
  ocupadas: 0,
  get disponibles() {
    return this.total - this.ocupadas;
  },
  get porcentaje() {
    return Math.round((this.ocupadas / this.total) * 100);
  },
};

export const nafacturaPricing = {
  starter: {
    monthly: 15.9,
    annualMonthly: 12.9,
    annualTotal: 154.8,
    annualSaving: 36,
  },
  pro: {
    monthly: 29.9,
    annualMonthly: 24.9,
    annualTotal: 298.8,
    annualSaving: 60,
  },
  freePeriodMonths: 6,
  freePeriodSlots: 1000,
};

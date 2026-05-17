// ============================================================
// NOVAFACTURA — Configuración de marca
// Facturación para autónomos y PYMEs conectada a la AEAT (España)
// ============================================================

export const novafacturaBrandConfig = {
  colors: {
    highlight: '#4F46E5',
    highlightBg: 'rgba(79, 70, 229, 0.1)',
    highlightBorder: '#6366F1',
  },
  app: {
    name: 'NovaFactura',
    shortName: 'NovaFactura',
    description: 'Facturación inteligente para autónomos y PYMEs con VeriFactu integrado',
    tagline: 'Factura sin complicaciones. VeriFactu automático.',
    url: 'https://www.novafactura.es',
    domain: 'www.novafactura.es',
    supportEmail: 'info@novafactura.es',
    legalEntity: 'NovaFactura S.L.',
    nif: '[NIF/CIF]',
    address: '[Dirección fiscal completa]',
    city: '[Ciudad]',
  },
  logos: {
    main: '/brand/novafactura/logo.png',
    icon: '/brand/novafactura/logo-icon.png',
    white: '/brand/novafactura/logo-white.png',
    email: '/brand/novafactura/logo-email.png',
    favicon: '/brand/novafactura/favicon.ico',
    pwa: {
      icon192: '/brand/novafactura/pwa-192x192.png',
      icon512: '/brand/novafactura/pwa-512x512.png',
      maskable: '/brand/novafactura/pwa-maskable-512x512.png',
    },
  },
};

export const novafacturaPlazasConfig = {
  total: 5000,
  ocupadas: 2562,
  get disponibles() {
    return this.total - this.ocupadas;
  },
  get porcentaje() {
    return Math.round((this.ocupadas / this.total) * 100);
  },
};

export const novafacturaPricing = {
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
  freePeriodSlots: 5000,
};

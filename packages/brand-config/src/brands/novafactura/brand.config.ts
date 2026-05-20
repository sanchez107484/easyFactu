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
    ogImage: '/brand/novafactura/og-image.png',
    supportEmail: 'info@novafactura.es',
    legalEntity: 'NovaFactura S.L.',
    nif: '[NIF/CIF]',
    address: '[Dirección fiscal completa]',
    city: '[Ciudad]',
    sameAs: [
      'https://www.linkedin.com/company/novafactura',
      'https://www.instagram.com/nova.factura',
    ],
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
  auth: {
    testimonial: {
      text: 'Llevaba meses preocupada por VeriFactu. Con NovaFactura me despreocupé en 10 minutos. Lo mejor es que es completamente gratis.',
      author: 'Laura García',
      role: 'Diseñadora freelance',
      rating: 5,
    },
    benefits: [
      {
        iconName: 'Shield' as const,
        title: 'VeriFactu automático',
        description: 'Cumplimiento garantizado con Hacienda',
      },
      {
        iconName: 'Clock' as const,
        title: 'Gratis hasta 2027',
        description: 'Sin tarjeta de crédito requerida',
      },
      {
        iconName: 'Zap' as const,
        title: 'Facturas en 60 segundos',
        description: 'Sin conocimientos técnicos',
      },
      {
        iconName: 'Users' as const,
        title: '+3.000 profesionales',
        description: 'Ya confían en nosotros',
      },
    ],
    testimonialCardBg: 'rgba(255, 255, 255, 0.10)',
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

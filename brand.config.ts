// brand.config.ts
// ============================================================
// CONFIGURACIÓN CENTRAL DE MARCA
// ============================================================
// Este archivo es el ÚNICO lugar donde se define la identidad
// visual del producto. Para crear un producto nuevo con otra
// marca, solo hay que duplicar este archivo y cambiar los valores.
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
  colors: {
    primary: Record<number, string>;
    secondary: Record<number, string>;
  };
}

export const brandConfig: BrandConfig = {
  // ==================== IDENTIDAD ====================
  app: {
    name: "EasyFactura",
    shortName: "EasyFactura",
    description:
      "Facturación inteligente para autónomos y PYMEs con VeriFactu integrado",
    tagline: "Factura sin complicaciones. VeriFactu automático.",
    url: "https://easyfactura.es",
    domain: "easyfactura.es",
    supportEmail: "soporte@easyfactura.es",
    legalEntity: "EasyFactura S.L.",
  },

  // ==================== LOGOS ====================
  // Los archivos deben existir en apps/web/public/brand/
  logos: {
    main: "/brand/logo.svg",
    icon: "/brand/logo-icon.svg",
    white: "/brand/logo-white.svg",
    email: "/brand/logo-email.png",
    favicon: "/brand/favicon.ico",
    pwa: {
      icon192: "/brand/pwa-192x192.png",
      icon512: "/brand/pwa-512x512.png",
      maskable: "/brand/pwa-maskable-512x512.png",
    },
  },

  // ==================== COLORES ====================
  colors: {
    primary: {
      50: "#EFF6FF",
      100: "#DBEAFE",
      200: "#BFDBFE",
      300: "#93C5FD",
      400: "#60A5FA",
      500: "#3B82F6",
      600: "#2563EB",
      700: "#1D4ED8",
      800: "#1E40AF",
      900: "#1E3A8A",
    },
    secondary: {
      50: "#F0FDF4",
      100: "#DCFCE7",
      200: "#BBF7D0",
      300: "#86EFAC",
      400: "#4ADE80",
      500: "#22C55E",
      600: "#16A34A",
      700: "#15803D",
      800: "#166534",
      900: "#14532D",
    },
  },
};

// brand.config.ts
// ============================================================
// SELECTOR DE MARCA
// ============================================================
// Este archivo es el punto de entrada único para la identidad
// de marca. Lee la variable de entorno NEXT_PUBLIC_BRAND y
// re-exporta la configuración correspondiente.
//
// Valores válidos: 'novafactura' (por defecto) | 'nafactura'
//
// Los valores concretos de cada marca están en:
//   src/brands/novafactura/brand.config.ts
//   src/brands/nafactura/brand.config.ts
// ============================================================

import {
  novafacturaBrandConfig,
  novafacturaPlazasConfig,
  novafacturaPricing,
} from './brands/novafactura/brand.config';
import {
  nafacturaBrandConfig,
  nafacturaPlazasConfig,
  nafacturaPricing,
} from './brands/nafactura/brand.config';

// ============================================================
// Tipos compartidos (misma forma para todas las marcas)
// ============================================================

export interface BrandConfig {
  /** Brand accent colors — used for highlighted nav links, banners, and key UI elements */
  colors: {
    /** Primary accent color (e.g. '#012641' for NaFactura, '#4F46E5' for NovaFactura) */
    highlight: string;
    /** Semi-transparent background for hover/active states (10% opacity of highlight) */
    highlightBg: string;
    /** Border color for highlight containers (slightly lighter than highlight) */
    highlightBorder: string;
  };
  app: {
    name: string;
    shortName: string;
    description: string;
    tagline: string;
    url: string;
    domain: string;
    ogImage: string;
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

export interface PricingConfig {
  starter: { monthly: number; annualMonthly: number; annualTotal: number; annualSaving: number };
  pro: { monthly: number; annualMonthly: number; annualTotal: number; annualSaving: number };
  freePeriodMonths: number;
  freePeriodSlots: number;
}

// ============================================================
// Selector de marca — lee NEXT_PUBLIC_BRAND en build time
// ============================================================

type SupportedBrand = 'novafactura' | 'nafactura';

const ACTIVE_BRAND = (process.env.NEXT_PUBLIC_BRAND ?? 'novafactura') as SupportedBrand;

export const brandConfig: BrandConfig =
  ACTIVE_BRAND === 'nafactura' ? nafacturaBrandConfig : novafacturaBrandConfig;

export const PLAZAS_CONFIG =
  ACTIVE_BRAND === 'nafactura' ? nafacturaPlazasConfig : novafacturaPlazasConfig;

export const PRICING: PricingConfig =
  ACTIVE_BRAND === 'nafactura' ? nafacturaPricing : novafacturaPricing;

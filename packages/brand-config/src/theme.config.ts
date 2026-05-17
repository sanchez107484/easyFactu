// theme.config.ts
// ============================================================
// SELECTOR DE TEMA VISUAL
// ============================================================
// Lee la variable de entorno NEXT_PUBLIC_BRAND y re-exporta
// el tema correspondiente.
//
// Los temas concretos de cada marca están en:
//   src/brands/novafactura/theme.config.ts  (azul)
//   src/brands/nafactura/theme.config.ts    (rojo granate)
// ============================================================
//
// [NOTA HISTÓRICA] Este archivo definía antes los colores
// directamente. Ahora actúa únicamente como selector.
// Para editar colores, ve al archivo de marca correspondiente.
// ============================================================

import { novafacturaThemeConfig } from './brands/novafactura/theme.config';
import { nafacturaThemeConfig } from './brands/nafactura/theme.config';

export interface ThemeColorScale {
  [shade: string]: string;
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

export interface ThemeCssVars {
  [key: string]: string;
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
  radius: string;
}

export interface ThemeConfig {
  scales: {
    primary: ThemeColorScale;
    secondary: ThemeColorScale;
    invoice: ThemeColorScale;
    proforma: ThemeColorScale;
    rectificativa: ThemeColorScale;
    customer: ThemeColorScale;
    product: ThemeColorScale;
    agency: ThemeColorScale;
    overdue: ThemeColorScale;
    neutral: ThemeColorScale;
  };
  cssVars: {
    light: ThemeCssVars;
    dark: ThemeCssVars;
  };
}

// ============================================================
// Selector de tema — lee NEXT_PUBLIC_BRAND en build time
// ============================================================

type SupportedBrand = 'novafactura' | 'nafactura';

const ACTIVE_BRAND = (process.env.NEXT_PUBLIC_BRAND ?? 'novafactura') as SupportedBrand;

export const themeConfig: ThemeConfig =
  ACTIVE_BRAND === 'nafactura' ? nafacturaThemeConfig : novafacturaThemeConfig;

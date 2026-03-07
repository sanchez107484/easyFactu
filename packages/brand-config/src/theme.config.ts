// theme.config.ts
// ============================================================
// CONFIGURACIÓN VISUAL CENTRAL
// ============================================================
// Este archivo es el ÚNICO lugar donde se definen los colores
// del producto. Para crear una web con otro branding, solo
// hay que cambiar brand.config.ts (identidad) y este archivo
// (colores y apariencia visual).
//
// Estructura:
//   scales → escalas de color hex (50–950) para clases Tailwind
//             ej: bg-primary-100, text-invoice-600
//   cssVars → variables CSS HSL para componentes shadcn/ui
//             ej: hsl(var(--primary)), hsl(var(--border))
// ============================================================

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
  /** Escalas de color hex (50–950) para clases de utilidad Tailwind */
  scales: {
    /** Color primario de la marca: botones, links, acciones principales */
    primary: ThemeColorScale;
    /** Color secundario de la marca: éxito, cobros, estados positivos */
    secondary: ThemeColorScale;
    /** Color semántico para facturas estándar */
    invoice: ThemeColorScale;
    /** Color semántico para proformas y presupuestos */
    proforma: ThemeColorScale;
    /** Color semántico para facturas rectificativas */
    rectificativa: ThemeColorScale;
    /** Color semántico para la entidad Cliente */
    customer: ThemeColorScale;
    /** Color semántico para la entidad Producto / Servicio */
    product: ThemeColorScale;
  };
  /** Variables CSS HSL para componentes shadcn/ui (sin wrapper hsl()) */
  cssVars: {
    light: ThemeCssVars;
    dark: ThemeCssVars;
  };
}

export const themeConfig: ThemeConfig = {
  scales: {
    // ==================== COLORES DE MARCA ====================

    // Azul — color principal de la marca
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
      950: '#172554',
    },

    // Verde — color secundario: cobros, éxito, resultados positivos
    secondary: {
      50: '#F0FDF4',
      100: '#DCFCE7',
      200: '#BBF7D0',
      300: '#86EFAC',
      400: '#4ADE80',
      500: '#22C55E',
      600: '#16A34A',
      700: '#15803D',
      800: '#166534',
      900: '#14532D',
      950: '#052E16',
    },

    // ==================== COLORES DE ENTIDAD ====================

    // Azul — factura estándar (mismo espectro que primary, pueden divergir en otro branding)
    invoice: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
      950: '#172554',
    },

    // Ámbar — proforma / presupuesto (pendiente, informativo, sin valor legal)
    proforma: {
      50: '#FFFBEB',
      100: '#FEF3C7',
      200: '#FDE68A',
      300: '#FCD34D',
      400: '#FBBF24',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
      950: '#451A03',
    },

    // Rosa / rojo — factura rectificativa (corrección, anulación parcial)
    rectificativa: {
      50: '#FFF1F2',
      100: '#FFE4E6',
      200: '#FECDD3',
      300: '#FDA4AF',
      400: '#FB7185',
      500: '#F43F5E',
      600: '#E11D48',
      700: '#BE123C',
      800: '#9F1239',
      900: '#881337',
      950: '#4C0519',
    },

    // Índigo / violeta — clientes (personas, relaciones, CRM)
    customer: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      200: '#C7D2FE',
      300: '#A5B4FC',
      400: '#818CF8',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
      800: '#3730A3',
      900: '#312E81',
      950: '#1E1B4B',
    },

    // Esmeralda — productos y servicios (catálogo, inventario)
    product: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
      950: '#022C22',
    },
  },

  // ==================== CSS VARIABLES SHADCN/UI ====================
  // Valores HSL sin wrapper hsl(). Se inyectan en :root y .dark desde layout.tsx.
  // Para cambiar el tema visual de shadcn basta con cambiar estos valores.

  cssVars: {
    light: {
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
      card: '0 0% 100%',
      'card-foreground': '222.2 84% 4.9%',
      popover: '0 0% 100%',
      'popover-foreground': '222.2 84% 4.9%',
      primary: '217.2 91.2% 59.8%',
      'primary-foreground': '210 40% 98%',
      secondary: '145 63.6% 49%',
      'secondary-foreground': '139.4 80% 10%',
      muted: '210 40% 96.1%',
      'muted-foreground': '215.4 16.3% 46.9%',
      accent: '210 40% 96.1%',
      'accent-foreground': '222.2 47.4% 11.2%',
      destructive: '0 84.2% 60.2%',
      'destructive-foreground': '210 40% 98%',
      border: '214.3 31.8% 91.4%',
      input: '214.3 31.8% 91.4%',
      ring: '217.2 91.2% 59.8%',
      radius: '0.5rem',
    },
    dark: {
      background: '222.2 84% 4.9%',
      foreground: '210 40% 98%',
      card: '222.2 84% 4.9%',
      'card-foreground': '210 40% 98%',
      popover: '222.2 84% 4.9%',
      'popover-foreground': '210 40% 98%',
      primary: '217.2 91.2% 59.8%',
      'primary-foreground': '222.2 47.4% 11.2%',
      secondary: '145 63.6% 42%',
      'secondary-foreground': '144.9 80.4% 10%',
      muted: '217.2 32.6% 17.5%',
      'muted-foreground': '215 20.2% 65.1%',
      accent: '217.2 32.6% 17.5%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62.8% 30.6%',
      'destructive-foreground': '210 40% 98%',
      border: '217.2 32.6% 17.5%',
      input: '217.2 32.6% 17.5%',
      ring: '224.3 76.3% 48%',
      radius: '0.5rem',
    },
  },
};

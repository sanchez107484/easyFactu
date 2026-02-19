import { brandConfig, BrandConfig } from './brand.config';

/**
 * Get app name
 */
export function getAppName(): string {
  return brandConfig.app.name;
}

/**
 * Get app short name
 */
export function getShortName(): string {
  return brandConfig.app.shortName;
}

/**
 * Get app description
 */
export function getDescription(): string {
  return brandConfig.app.description;
}

/**
 * Get app tagline
 */
export function getTagline(): string {
  return brandConfig.app.tagline;
}

/**
 * Get primary color by shade
 */
export function getPrimaryColor(shade: number = 500): string {
  const color = brandConfig.colors.primary[shade as keyof typeof brandConfig.colors.primary];
  return (color || brandConfig.colors.primary[500]) as string;
}

/**
 * Get secondary color by shade
 */
export function getSecondaryColor(shade: number = 500): string {
  const color = brandConfig.colors.secondary[shade as keyof typeof brandConfig.colors.secondary];
  return (color || brandConfig.colors.secondary[500]) as string;
}

/**
 * Get logo path
 */
export function getLogo(type: keyof typeof brandConfig.logos = 'main'): string {
  if (type === 'pwa') {
    return brandConfig.logos.pwa.icon512;
  }
  return brandConfig.logos[type as Exclude<keyof typeof brandConfig.logos, 'pwa'>];
}

/**
 * Get support email
 */
export function getSupportEmail(): string {
  return brandConfig.app.supportEmail;
}

/**
 * Get app URL
 */
export function getAppUrl(): string {
  return brandConfig.app.url;
}

/**
 * Get full brand config (use sparingly, prefer specific getters)
 */
export function getBrandConfig(): BrandConfig {
  return brandConfig;
}

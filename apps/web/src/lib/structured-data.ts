import { brandConfig } from '@easyfactura/brand-config';

// Shared schema.org builders so every page emits the same entities.
// Never add aggregateRating/review here until there are real, verifiable reviews.

const BASE_URL = brandConfig.app.url;
const ORGANIZATION_ID = `${BASE_URL}/#organization`;

export interface BreadcrumbCrumb {
  name: string;
  path: string;
}

export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORGANIZATION_ID,
  name: brandConfig.app.name,
  legalName: brandConfig.app.legalEntity,
  url: BASE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE_URL}${brandConfig.logos.main}`,
  },
  description: brandConfig.app.description,
  foundingDate: '2025',
  areaServed: { '@type': 'Country', name: 'España' },
  knowsLanguage: 'es',
  contactPoint: {
    '@type': 'ContactPoint',
    email: brandConfig.app.supportEmail,
    contactType: 'customer support',
    availableLanguage: 'Spanish',
  },
  sameAs: brandConfig.app.sameAs,
};

/** Home is always the first crumb; pass the rest in order, ending with the current page. */
export function breadcrumbJsonLd(crumbs: BreadcrumbCrumb[]) {
  const trail = [{ name: 'Inicio', path: '/' }, ...crumbs];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.path === '/' ? BASE_URL : `${BASE_URL}${crumb.path}`,
    })),
  };
}

interface SoftwareApplicationOptions {
  /** Page the entity is described on, e.g. '/precios'. */
  path: string;
  description?: string;
  featureList?: string[];
}

export function softwareApplicationJsonLd({
  path,
  description = brandConfig.app.description,
  featureList,
}: SoftwareApplicationOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: brandConfig.app.name,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Facturación',
    operatingSystem: 'Web',
    description,
    url: path === '/' ? BASE_URL : `${BASE_URL}${path}`,
    inLanguage: 'es',
    image: `${BASE_URL}${brandConfig.app.ogImage}`,
    publisher: { '@id': ORGANIZATION_ID },
    offers: {
      '@type': 'Offer',
      name: 'Plan gratuito',
      price: '0',
      priceCurrency: 'EUR',
      // Free signups are capped (see free-slots meter), hence LimitedAvailability.
      availability: 'https://schema.org/LimitedAvailability',
      url: `${BASE_URL}/registro`,
      description: 'Gratis hasta 2027. Sin tarjeta al registrarte.',
    },
    ...(featureList ? { featureList } : {}),
  };
}

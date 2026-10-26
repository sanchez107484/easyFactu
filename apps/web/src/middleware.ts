import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { brandConfig } from '@easyfactura/brand-config';

const PUBLIC_ROUTES = [
  '/',
  // Auth
  '/login',
  '/registro',
  '/verificar-email',
  '/recuperar-password',
  '/nueva-password',
  '/activar-cuenta',
  // Marketing
  '/precios',
  '/funcionalidades',
  '/verifactu',
  '/asesoria',
  '/blog',
  '/contacto',
  // Legal
  '/aviso-legal',
  '/politica-privacidad',
  '/terminos-uso',
  '/cookies',
  '/tratamiento-datos',
] as const;

const PROTECTED_PATHS = ['/dashboard', '/setup'] as const;

// Old public URLs → their current location. Resolved together with the
// host/protocol canonicalisation so every legacy hit is a single 301 hop.
const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  '/asesorias': '/asesoria',
  '/factura-con-irpf': '/facturas/con-irpf',
  '/factura-rectificativa': '/facturas/rectificativa',
  '/factura-proforma': '/facturas/proforma',
  '/privacidad': '/politica-privacidad',
  '/terminos': '/terminos-uso',
};

const canonicalHost = brandConfig.app.url.replace(/^https?:\/\//, '').toLowerCase();

function getRequestHost(request: NextRequest): string {
  const hostHeader = request.headers.get('host');
  return hostHeader ? hostHeader.split(':')[0].toLowerCase() : '';
}

function getRequestProtocol(request: NextRequest): string {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0].trim().replace(/:$/, '').toLowerCase();
  }

  return request.nextUrl.protocol.replace(/:$/, '').toLowerCase();
}

function isLocalhostHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function isLocalRequest(host: string): boolean {
  return isLocalhostHost(host) || process.env.NODE_ENV === 'development';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHost = getRequestHost(request);
  const isLocal = isLocalRequest(requestHost);
  const legacyTarget = LEGACY_REDIRECTS[pathname];

  const isCanonicalOrigin =
    isLocal || (requestHost === canonicalHost && getRequestProtocol(request) === 'https');

  if (legacyTarget || !isCanonicalOrigin) {
    const destination = request.nextUrl.clone();
    if (legacyTarget) destination.pathname = legacyTarget;
    if (!isLocal) {
      destination.protocol = 'https:';
      destination.host = canonicalHost;
      destination.port = '';
    }
    return NextResponse.redirect(destination, 301);
  }

  if (isLocal) {
    return NextResponse.next();
  }

  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/brand') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};

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

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestHost = getRequestHost(request);

  if (isLocalhostHost(requestHost) || process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  const requestProtocol = getRequestProtocol(request);
  const isCanonicalHost = requestHost === canonicalHost;
  const isHttps = requestProtocol === 'https';

  if (!isCanonicalHost || !isHttps) {
    const destination = new URL(request.url);
    destination.protocol = 'https:';
    destination.host = canonicalHost;
    destination.search = search;
    return NextResponse.redirect(destination, 301);
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

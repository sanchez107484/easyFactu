import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  '/',
  '/login',
  '/registro',
  '/verificar-email',
  '/recuperar-password',
  '/nueva-password',
  '/privacidad',
  '/terminos',
  '/aviso-legal',
];

// Rutas protegidas que requieren autenticación
// La verificación real de auth se hace en el layout del dashboard (client-side)
// porque los tokens están en localStorage, no en cookies
const protectedPaths = ['/dashboard', '/setup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas
  if (publicRoutes.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Permitir archivos estáticos y API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/brand') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Rutas protegidas - permitir acceso pero la verificación de auth
  // se hace en el layout del dashboard (client-side con localStorage)
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Por defecto, permitir paso y dejar que el layout maneje auth
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|brand).*)',
  ],
};

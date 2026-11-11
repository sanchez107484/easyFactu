import { BadRequestException } from '@nestjs/common';
import { SSO_DEFAULT_DESTINATION } from './sso.constants';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/**
 * Pages the ERP may open: what it does not do itself ("lo que no está en caja").
 * Users, security, plan, agency and import screens are deliberately left out.
 * Exact paths only: no query strings, fragments or other origins.
 */
const ALLOWED_SSO_DESTINATIONS: readonly RegExp[] = [
  /^\/dashboard$/,
  /^\/dashboard\/facturas(\/nueva)?$/,
  new RegExp(`^/dashboard/facturas/${UUID}$`),
  /^\/dashboard\/(presupuestos|recurrentes|clientes|productos|gastos|proveedores|informes|verifactu)$/,
  /^\/dashboard\/ajustes\/(empresa|facturacion|plantilla|predeterminados)$/,
];

export function isAllowedSsoDestination(path: string): boolean {
  return ALLOWED_SSO_DESTINATIONS.some((pattern) => pattern.test(path));
}

/** Returns the page to open after SSO; rejects anything outside the allow-list. */
export function resolveSsoDestination(requested: string | undefined): string {
  if (requested === undefined) {
    return SSO_DEFAULT_DESTINATION;
  }
  if (!isAllowedSsoDestination(requested)) {
    throw new BadRequestException('El destino solicitado no está permitido');
  }
  return requested;
}

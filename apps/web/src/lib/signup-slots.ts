import { PLAZAS_CONFIG } from '@easyfactura/brand-config';

/** The API caches the count for one hour; pages revalidate on the same cadence. */
const SIGNUP_STATS_REVALIDATE_SECONDS = 60 * 60;

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const SIGNUP_STATS_URL = `${API_BASE.replace(/\/v1$/, '')}/v1/signup-stats`;

export interface SignupSlots {
  total: number;
  occupied: number;
  available: number;
  percentage: number;
  isSoldOut: boolean;
}

export function buildSignupSlots(
  registeredCount: number,
  total = PLAZAS_CONFIG.total,
): SignupSlots {
  const occupied = Math.min(Math.max(registeredCount, 0), total);
  return {
    total,
    occupied,
    available: total - occupied,
    percentage: Math.round((occupied / total) * 100),
    isSoldOut: occupied >= total,
  };
}

function extractRegisteredCount(body: unknown): number | null {
  if (typeof body !== 'object' || body === null || !('data' in body)) return null;
  const { data } = body;
  if (typeof data !== 'object' || data === null || !('registeredCount' in data)) return null;
  return typeof data.registeredCount === 'number' ? data.registeredCount : null;
}

/**
 * Real number of registrations, fetched on the server and cached for at most one hour.
 * Returns null when the API is unreachable so pages hide the counter instead of inventing one.
 */
export async function getSignupSlots(): Promise<SignupSlots | null> {
  try {
    const response = await fetch(SIGNUP_STATS_URL, {
      next: { revalidate: SIGNUP_STATS_REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;
    const registeredCount = extractRegisteredCount(await response.json());
    return registeredCount === null ? null : buildSignupSlots(registeredCount);
  } catch (error) {
    console.error('[signup-slots] No se pudo obtener el contador de registros', error);
    return null;
  }
}

export function formatCount(value: number): string {
  return value.toLocaleString('es-ES');
}

/**
 * Short label for badges and CTAs. The remaining-slots count is deliberately not
 * shown on the site; the label only appears once the free offer has sold out.
 */
export function freeSlotsLabel(slots: SignupSlots | null): string | null {
  return slots?.isSoldOut ? 'Oferta gratuita terminada: plazas agotadas' : null;
}

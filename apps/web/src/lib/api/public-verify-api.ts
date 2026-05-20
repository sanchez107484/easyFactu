import { InvoiceStatus } from '@easyfactura/shared-types';

export interface PublicInvoiceVerification {
  issuer: {
    tradeName: string;
    nifMasked: string;
  };
  invoice: {
    number: string;
    series: string | null;
    issueDate: string;
    subtotal: number;
    taxTotal: number;
    total: number;
    currency: string;
    status: InvoiceStatus;
  };
  hashFragment: string;
  hashFull: string;
  confirmedAt: string;
  mode: string;
}

/**
 * Fetch public invoice verification data by hash.
 * This endpoint requires no authentication.
 */
export async function verifyInvoiceByHash(hash: string): Promise<PublicInvoiceVerification | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
  const res = await fetch(`${apiUrl}/v1/public/verify/${encodeURIComponent(hash)}`, {
    cache: 'no-store',
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`Error al verificar la factura: ${res.status}`);
  }

  const json = await res.json();
  // The backend wraps every response in { success, data, meta } via TransformInterceptor
  return (json?.data ?? json) as PublicInvoiceVerification;
}

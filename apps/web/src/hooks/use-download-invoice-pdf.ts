import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { getAccessToken } from '@/lib/api-client';

interface UseDownloadInvoicePdfOptions {
  invoiceId: string;
  /** Fallback filename used only if the server does not provide one via Content-Disposition. */
  fileName?: string;
}

/**
 * Parses the filename from a Content-Disposition header value.
 * Prefers RFC 5987 (filename*=UTF-8'') over the legacy filename= parameter.
 */
function extractFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const rfc5987 = /filename\*=UTF-8''([^;\s]+)/i.exec(contentDisposition);
  if (rfc5987) return decodeURIComponent(rfc5987[1]);
  const legacy = /filename="?([^";\s]+)"?/i.exec(contentDisposition);
  return legacy ? legacy[1] : null;
}

export function useDownloadInvoicePdf({ invoiceId, fileName }: UseDownloadInvoicePdfOptions) {
  const [isLoading, setIsLoading] = useState(false);
  // Ref-based guard prevents double-execution without adding isLoading to useCallback deps.
  const inProgressRef = useRef(false);

  const download = useCallback(async () => {
    if (inProgressRef.current) return;

    const token = getAccessToken();

    const fetchPdf = async (): Promise<void> => {
      inProgressRef.current = true;
      setIsLoading(true);
      try {
        const res = await fetch(`/api/invoices/${invoiceId}/pdf`, {
          method: 'GET',
          headers: {
            Accept: 'application/pdf',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
        });

        if (!res.ok) {
          if (res.status === 401) {
            throw new Error('Sesión caducada. Por favor, inicia sesión de nuevo.');
          }
          throw new Error('Error al generar el PDF');
        }

        // Prefer the server-provided filename from Content-Disposition;
        // fall back to the prop, ensuring the extension is always .pdf.
        const serverFilename = extractFilename(res.headers.get('content-disposition'));
        const rawFallback = fileName || `Factura-${invoiceId}`;
        const resolvedFilename =
          serverFilename ?? (rawFallback.endsWith('.pdf') ? rawFallback : `${rawFallback}.pdf`);

        const arrayBuffer = await res.arrayBuffer();
        const pdfBlob = new Blob([arrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = resolvedFilename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      } finally {
        inProgressRef.current = false;
        setIsLoading(false);
      }
    };

    toast.promise(fetchPdf(), {
      loading: 'Generando PDF...',
      success: 'PDF descargado correctamente',
      error: (err: unknown) => (err instanceof Error ? err.message : 'Error al descargar el PDF'),
    });
  }, [invoiceId, fileName]);

  return { download, isLoading };
}

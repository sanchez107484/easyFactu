import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { getAccessToken } from '@/lib/api-client';

interface UseDownloadInvoicePdfOptions {
  invoiceId: string;
  fileName?: string;
}

export function useDownloadInvoicePdf({ invoiceId, fileName }: UseDownloadInvoicePdfOptions) {
  const [isLoading, setIsLoading] = useState(false);

  const download = useCallback(async () => {
    if (isLoading) return;

    const token = getAccessToken();

    const fetchPdf = async (): Promise<void> => {
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

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || `Factura-${invoiceId}.pdf`;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
      } finally {
        setIsLoading(false);
      }
    };

    toast.promise(fetchPdf(), {
      loading: 'Generando PDF...',
      success: 'PDF descargado correctamente',
      error: (err: unknown) => (err instanceof Error ? err.message : 'Error al descargar el PDF'),
    });
  }, [invoiceId, fileName, isLoading]);

  return { download, isLoading };
}

import { useCallback } from 'react';
import { toast } from 'sonner';
import { getAccessToken } from '@/lib/api-client';

interface UseDownloadInvoicePdfOptions {
  invoiceId: string;
  fileName?: string;
}

export function useDownloadInvoicePdf({ invoiceId, fileName }: UseDownloadInvoicePdfOptions) {
  const download = useCallback(async () => {
    try {
      // Usar el mismo método que Axios/apiClient para obtener el token
      const token = getAccessToken();
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
          toast.error('Sesión caducada. Por favor, inicia sesión de nuevo.');
          return;
        }
        throw new Error('Error al descargar el PDF');
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
      toast.success('Factura descargada correctamente');
    } catch (error) {
      toast.error('Error al descargar el PDF');
    }
  }, [invoiceId, fileName]);

  return { download };
}

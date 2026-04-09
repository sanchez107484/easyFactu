import { Button } from './button';
import { Download, Loader2 } from 'lucide-react';
import { useDownloadInvoicePdf } from '@/hooks/use-download-invoice-pdf';
import { cn } from '@/lib/utils';

interface DownloadInvoiceButtonProps {
  invoiceId: string;
  fileName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg';
}

export function DownloadInvoiceButton({
  invoiceId,
  fileName,
  className,
  variant = 'default',
  size = 'sm',
}: DownloadInvoiceButtonProps) {
  const { download, isLoading } = useDownloadInvoicePdf({ invoiceId, fileName });

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={download}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-1.5 h-4 w-4" />
      )}
      {isLoading ? 'Generando...' : 'Descargar PDF'}
    </Button>
  );
}

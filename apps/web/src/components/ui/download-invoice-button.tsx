import { Button } from './button';
import { Download } from 'lucide-react';
import { useDownloadInvoicePdf } from '@/hooks/use-download-invoice-pdf';
import { cn } from '@/lib/utils';

interface DownloadInvoiceButtonProps {
  invoiceId: string;
  fileName?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function DownloadInvoiceButton({
  invoiceId,
  fileName,
  className,
  variant = 'default',
  size = 'md',
}: DownloadInvoiceButtonProps) {
  const { download } = useDownloadInvoicePdf({ invoiceId, fileName });

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={download}
    >
      <Download className="mr-1.5 h-4 w-4" />
      Descargar PDF
    </Button>
  );
}

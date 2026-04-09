'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { FileText, FileCheck, LayoutTemplate, ChevronRight, Info } from 'lucide-react';
import { InvoiceTemplate } from '@easyfactura/shared-types';
import { useDefaultTemplate } from '@/hooks/use-invoice-templates';
import { cn } from '@/lib/utils';

// ==================== TYPES ====================

export type InvoiceTypeOption = 'standard' | 'proforma' | 'simplified' | 'template';

// ==================== SUB-COMPONENTS ====================

interface TypeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  active?: boolean;
}

function TypeCard({ icon, title, description, onClick, active }: TypeCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-lg border-2 transition-all',
        'hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'border-primary bg-primary/5' : 'border-border bg-background',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 text-muted-foreground', active && 'text-primary')}>{icon}</div>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <ChevronRight
          className={cn(
            'ml-auto h-4 w-4 text-muted-foreground shrink-0 mt-0.5',
            active && 'text-primary',
          )}
        />
      </div>
    </button>
  );
}

// ==================== MAIN COMPONENT ====================

interface InvoiceTypeModalProps {
  open: boolean;
  onSelect: (type: InvoiceTypeOption, template?: InvoiceTemplate) => void;
  onClose?: () => void;
}

export function InvoiceTypeModal({ open, onSelect, onClose }: InvoiceTypeModalProps) {
  const router = useRouter();
  const { data: defaultTemplate } = useDefaultTemplate();

  const handleTypeSelect = (type: Exclude<InvoiceTypeOption, 'template'>) => {
    onSelect(type);
  };

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleCreateTemplate = () => {
    handleClose();
    router.push('/dashboard/ajustes/plantilla');
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md [&>button:last-child]:hidden"
        // Allow closing when onClose is provided (modal opened by user, not forced)
        onPointerDownOutside={onClose ? handleClose : (e) => e.preventDefault()}
        onEscapeKeyDown={onClose ? handleClose : (e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>¿Qué tipo de factura quieres crear?</DialogTitle>
          <DialogDescription>
            Elige el tipo de documento. Podrás guardarlo como borrador antes de confirmarlo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          <TypeCard
            icon={<FileText className="h-5 w-5" />}
            title="Factura ordinaria"
            description="La más común. Sujeta a IVA e IRPF. Se envía a la AEAT vía VeriFactu."
            onClick={() => handleTypeSelect('standard')}
          />
          <TypeCard
            icon={<FileCheck className="h-5 w-5" />}
            title="Factura proforma"
            description="Documento previo no oficial. No tiene validez fiscal ni número definitivo."
            onClick={() => handleTypeSelect('proforma')}
          />
          <TypeCard
            icon={<LayoutTemplate className="h-5 w-5" />}
            title="Crear plantilla"
            description="Diseña y guarda una plantilla con tu diseño y datos habituales."
            onClick={handleCreateTemplate}
          />
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5 mt-1">
          <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {defaultTemplate ? (
              <>
                El diseño se aplicará usando tu plantilla{' '}
                <span className="font-medium text-foreground">{defaultTemplate.name}</span>.
              </>
            ) : (
              <>
                Se usará el diseño estándar. Puedes personalizarlo en{' '}
                <button
                  type="button"
                  onClick={handleCreateTemplate}
                  className="font-medium text-primary hover:underline"
                >
                  Crear plantilla
                </button>
                .
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

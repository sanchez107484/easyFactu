'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  FileCheck,
  Receipt,
  LayoutTemplate,
  Settings2,
  ChevronRight,
} from 'lucide-react';
import { useInvoiceTemplates } from '@/hooks/use-invoice-templates';
import { InvoiceTemplate } from '@easyfactura/shared-types';
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

interface TemplateListProps {
  onSelect: (template: InvoiceTemplate) => void;
}

function TemplateList({ onSelect }: TemplateListProps) {
  const { data, isLoading, error } = useInvoiceTemplates();
  const templates: InvoiceTemplate[] = data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2 mt-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || templates.length === 0) {
    return (
      <div className="mt-3 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
        No tienes plantillas creadas.{' '}
        <Link href="/dashboard/ajustes/plantilla" className="text-primary hover:underline">
          Crear primera plantilla
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        Selecciona una plantilla
      </p>
      {templates.map((template) => (
        <button
          key={template.id}
          type="button"
          onClick={() => onSelect(template)}
          className={cn(
            'w-full text-left p-3 rounded-lg border transition-all text-sm',
            'hover:border-primary hover:bg-primary/5',
            'border-border bg-background',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">{template.name}</span>
            {template.isDefault && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Por defecto
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

// ==================== MAIN COMPONENT ====================

interface InvoiceTypeModalProps {
  open: boolean;
  onSelect: (type: InvoiceTypeOption, template?: InvoiceTemplate) => void;
}

export function InvoiceTypeModal({ open, onSelect }: InvoiceTypeModalProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  const handleTypeSelect = (type: Exclude<InvoiceTypeOption, 'template'>) => {
    onSelect(type);
  };

  const handleTemplateCardClick = () => {
    setShowTemplates((prev) => !prev);
  };

  const handleTemplateSelect = (template: InvoiceTemplate) => {
    onSelect('template', template);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        // Prevent closing by clicking backdrop — user must choose a type
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
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
            icon={<Receipt className="h-5 w-5" />}
            title="Factura simplificada"
            description="Para operaciones menores a 400 €. No requiere datos del cliente."
            onClick={() => handleTypeSelect('simplified')}
          />
          <TypeCard
            icon={<LayoutTemplate className="h-5 w-5" />}
            title="Usar plantilla"
            description="Elige una plantilla predefinida con tu diseño y datos habituales."
            onClick={handleTemplateCardClick}
            active={showTemplates}
          />

          {showTemplates && <TemplateList onSelect={handleTemplateSelect} />}
        </div>

        <div className="flex items-center justify-end pt-2 border-t mt-2">
          <Link
            href="/dashboard/ajustes/plantilla"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Gestionar plantillas
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

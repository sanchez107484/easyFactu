import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, X, Save } from 'lucide-react';
import { SectionLabel } from '@/components/common/section-label';

interface InvoiceNotesCardProps {
  notes: string | null;
  isEditing: boolean;
  editingValue: string;
  isPending: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onEditChange: (value: string) => void;
  onSave: () => void;
}

export function InvoiceNotesCard({
  notes,
  isEditing,
  editingValue,
  isPending,
  onEditStart,
  onEditCancel,
  onEditChange,
  onSave,
}: InvoiceNotesCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Notas</SectionLabel>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
            onClick={onEditStart}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            {notes ? 'Editar' : 'Añadir nota'}
          </Button>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editingValue}
            onChange={(e) => onEditChange(e.target.value)}
            placeholder="Añade una nota visible en la factura..."
            className="text-sm resize-none"
            rows={4}
            maxLength={1000}
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{editingValue.length}/1000</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onEditCancel} disabled={isPending}>
                <X className="h-3.5 w-3.5 mr-1" />
                Cancelar
              </Button>
              <Button size="sm" onClick={onSave} disabled={isPending}>
                <Save className="h-3.5 w-3.5 mr-1" />
                {isPending ? 'Guardando...' : 'Guardar nota'}
              </Button>
            </div>
          </div>
        </div>
      ) : notes ? (
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{notes}</p>
      ) : (
        <p className="text-sm text-muted-foreground/50 italic">Sin notas</p>
      )}
    </div>
  );
}

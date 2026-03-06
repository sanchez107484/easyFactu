'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Pencil, X, Loader2, CreditCard, Building, ChevronRight } from 'lucide-react';
import { formatIban } from '@easyfactura/shared-validators';

// ── Schema ──────────────────────────────────────────────────────────────────
const bancarioSchema = z.object({
  iban: z
    .string()
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}([A-Z0-9]?){0,16}$/, 'IBAN inválido')
    .optional()
    .or(z.literal('')),
  bankAccountHolder: z.string().max(100).optional().or(z.literal('')),
});

type BancarioFormData = z.infer<typeof bancarioSchema>;

// ── Helpers ──────────────────────────────────────────────────────────────────
function maskIBAN(iban: string) {
  if (!iban || iban.length < 8) return iban;
  const prefix = iban.slice(0, 4);
  const suffix = iban.slice(-4);
  const middle = '•'.repeat(Math.max(0, iban.length - 8));
  return formatIban(prefix + middle + suffix);
}

// ── Tarjeta visual ───────────────────────────────────────────────────────────
function BankCard({ iban, holder }: { iban: string; holder: string }) {
  const displayIban = iban ? maskIBAN(iban.replace(/\s/g, '')) : '•••• •••• •••• ••••';
  const displayHolder = holder || 'TITULAR DE LA CUENTA';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
        borderRadius: '16px',
        padding: '28px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        minHeight: '180px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        userSelect: 'none',
      }}
    >
      {/* Círculos decorativos */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'rgba(99, 179, 237, 0.08)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          right: '60px',
          width: '220px',
          height: '220px',
          borderRadius: '50%',
          background: 'rgba(99, 179, 237, 0.05)',
          pointerEvents: 'none',
        }}
      />
      {/* Línea diagonal sutil */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 40px, rgba(255,255,255,0.012) 40px, rgba(255,255,255,0.012) 41px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header de tarjeta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
          <span
            style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '11px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 500,
            }}
          >
            Cuenta bancaria
          </span>
        </div>
        {/* Chip simulado */}
        <div
          style={{
            width: '36px',
            height: '28px',
            borderRadius: '5px',
            background: 'linear-gradient(135deg, #c8a96e 0%, #f0d080 50%, #c8a96e 100%)',
            opacity: 0.85,
          }}
        />
      </div>

      {/* IBAN */}
      <div>
        <div
          style={{
            color: 'rgba(255,255,255,0.35)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '6px',
            fontWeight: 500,
          }}
        >
          IBAN
        </div>
        <div
          style={{
            color: iban ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.25)',
            fontSize: '15px',
            letterSpacing: '0.15em',
            fontFamily: 'monospace',
            fontWeight: 600,
          }}
        >
          {displayIban}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div
            style={{
              color: 'rgba(255,255,255,0.35)',
              fontSize: '9px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '3px',
            }}
          >
            Titular
          </div>
          <div
            style={{
              color: holder ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)',
              fontSize: '13px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontWeight: 600,
              maxWidth: '220px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {displayHolder}
          </div>
        </div>
        {/* Círculos Mastercard style */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(235, 100, 52, 0.7)',
            }}
          />
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255, 193, 7, 0.6)',
              marginLeft: '-10px',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Vista configurada ────────────────────────────────────────────────────────
function ConfiguredView({
  iban,
  holder,
  onEdit,
}: {
  iban: string;
  holder: string;
  onEdit: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <BankCard iban={iban} holder={holder} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          borderRadius: '10px',
          background: 'hsl(var(--muted))',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              Cuenta configurada
            </div>
            <div
              style={{
                fontSize: '12px',
                color: 'hsl(var(--muted-foreground))',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
              }}
            >
              {iban ? maskIBAN(iban.replace(/\s/g, '')) : '—'}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit} style={{ gap: '6px', fontSize: '13px' }}>
          <Pencil size={13} />
          Editar
          <ChevronRight size={13} style={{ opacity: 0.5 }} />
        </Button>
      </div>
    </div>
  );
}

// ── Vista vacía ──────────────────────────────────────────────────────────────
function EmptyView({ onEdit }: { onEdit: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tarjeta vacía */}
      <BankCard iban="" holder="" />

      {/* Banner informativo */}
      <div
        style={{
          padding: '16px',
          borderRadius: '10px',
          border: '1px dashed hsl(var(--border))',
          background: 'hsl(var(--muted)/0.4)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}
      >
        <CreditCard
          size={18}
          style={{ color: 'hsl(var(--muted-foreground))', flexShrink: 0, marginTop: '1px' }}
        />
        <div>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'hsl(var(--foreground))',
              marginBottom: '3px',
            }}
          >
            Sin cuenta bancaria configurada
          </div>
          <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
            Añade tu IBAN para que tus clientes puedan ver la cuenta de cobro directamente en cada
            factura.
          </div>
        </div>
      </div>

      <Button onClick={onEdit} className="w-full gap-2" variant="outline">
        <CreditCard size={15} />
        Añadir cuenta bancaria
      </Button>
    </div>
  );
}

// ── Formulario de edición ────────────────────────────────────────────────────
function EditForm({
  defaultValues,
  onSave,
  onCancel,
  isPending,
}: {
  defaultValues: BancarioFormData;
  onSave: (data: BancarioFormData) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const form = useForm<BancarioFormData>({
    resolver: zodResolver(bancarioSchema),
    defaultValues,
  });

  const [ibanDisplay, setIbanDisplay] = useState(formatIban(defaultValues.iban ?? ''));

  const watchedHolder = form.watch('bankAccountHolder') ?? '';
  const watchedIban = form.watch('iban') ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Tarjeta en tiempo real */}
      <BankCard iban={watchedIban.replace(/\s/g, '')} holder={watchedHolder} />

      {/* Formulario */}
      <form
        onSubmit={form.handleSubmit(onSave)}
        style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
      >
        <div>
          <Label htmlFor="iban" style={{ fontSize: '13px', fontWeight: 500 }}>
            IBAN
          </Label>
          <Controller
            control={form.control}
            name="iban"
            render={({ field }) => (
              <Input
                id="iban"
                placeholder="ES00 0000 0000 0000 0000 0000"
                value={ibanDisplay}
                onChange={(e) => {
                  const formatted = formatIban(e.target.value);
                  setIbanDisplay(formatted);
                  field.onChange(formatted.replace(/\s/g, ''));
                }}
                style={{ fontFamily: 'monospace', letterSpacing: '0.05em', marginTop: '6px' }}
              />
            )}
          />
          {form.formState.errors.iban && (
            <p style={{ marginTop: '4px', fontSize: '12px', color: 'hsl(var(--destructive))' }}>
              {form.formState.errors.iban.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="bankAccountHolder" style={{ fontSize: '13px', fontWeight: 500 }}>
            Titular de la cuenta
          </Label>
          <Input
            id="bankAccountHolder"
            placeholder="Nombre del titular"
            {...form.register('bankAccountHolder')}
            style={{ marginTop: '6px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', paddingTop: '4px' }}>
          <Button type="submit" disabled={isPending} className="flex-1 gap-2">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Guardar cuenta
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} style={{ gap: '6px' }}>
            <X size={14} />
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

// ── Componente principal exportable ─────────────────────────────────────────
export function BancarioSection({
  iban,
  bankAccountHolder,
  isPending,
  onSave,
}: {
  iban?: string | null;
  bankAccountHolder?: string | null;
  isPending: boolean;
  onSave: (data: BancarioFormData) => void;
}) {
  const hasData = !!(iban || bankAccountHolder);
  const [isEditing, setIsEditing] = useState(false);

  function handleSave(data: BancarioFormData) {
    onSave(data);
    setIsEditing(false);
  }

  if (isEditing || !hasData) {
    return (
      <EditForm
        defaultValues={{ iban: iban ?? '', bankAccountHolder: bankAccountHolder ?? '' }}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
        isPending={isPending}
      />
    );
  }

  if (hasData) {
    return (
      <ConfiguredView
        iban={iban ?? ''}
        holder={bankAccountHolder ?? ''}
        onEdit={() => setIsEditing(true)}
      />
    );
  }

  return <EmptyView onEdit={() => setIsEditing(true)} />;
}

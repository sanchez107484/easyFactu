'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2,
  Save,
  Eye,
  Type,
  Palette,
  FileText,
  Image as ImageIcon,
  Table,
  Hash,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { LiveInvoicePreview } from '@/components/facturas/LiveInvoicePreview';
import { useDefaultTemplate, useUpdateTemplate } from '@/hooks/use-invoice-templates';
import { useInvoiceDefaults, useUpdateInvoiceDefaults } from '@/hooks/use-invoice-defaults';
import { useAuthStore } from '@/store/auth-store';
import { useTenant } from '@/hooks/use-tenant';
import {
  DEFAULT_INVOICE_LAYOUT,
  InvoiceLayout,
  Invoice,
  InvoiceStatus,
  PaymentStatus,
  PaymentMethod,
  Tenant,
} from '@easyfactura/shared-types';
import { PaymentDetails } from '@/components/facturas/LiveInvoicePreview';
import { invoiceTemplateApi } from '@/lib/api/invoice-template-api';
import { resolveUrl } from '@/lib/utils';

// ==================== EXAMPLE DATA ====================

function buildExampleInvoice(tenantId: string): Invoice {
  const now = new Date().toISOString();
  return {
    id: 'preview',
    tenantId,
    seriesId: 'preview',
    customerId: 'preview',
    number: 'FAC-2024-0001',
    issueDate: now,
    dueDate: null,
    status: InvoiceStatus.CONFIRMED,
    subtotal: 1000,
    discountPercent: null,
    discountAmount: null,
    taxTotal: 210,
    total: 1060,
    amountPaid: 0,
    paymentStatus: PaymentStatus.UNPAID,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    paymentDetails: null,
    amountPaid: 0,
    paymentStatus: PaymentStatus.UNPAID,
    notes: 'Gracias por su confianza.',
    irpfPercent: 15,
    irpfTotal: 150,
    pdfUrl: null,
    verifactuHash: null,
    verifactuPrevHash: null,
    verifactuStatus: null,
    verifactuQr: null,
    verifactuSentAt: null,
    verifactuResponse: null,
    isRectificative: false,
    rectifiedInvoiceId: null,
    rectificationReason: null,
    createdAt: now,
    updatedAt: now,
    customer: {
      id: 'preview',
      tenantId,
      type: 'COMPANY' as never,
      name: 'Empresa Cliente S.L.',
      legalName: null,
      nif: 'B87654321',
      email: 'cliente@ejemplo.com',
      phone: null,
      address: 'Calle Gran Vía 28',
      postalCode: '28013',
      city: 'Madrid',
      province: 'Madrid',
      country: 'ES',
      notes: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    lines: [
      {
        id: 'l1',
        tenantId,
        invoiceId: 'preview',
        productId: null,
        description: 'Servicio de consultoría estratégica',
        quantity: 8,
        unitPrice: 75,
        subtotal: 600,
        taxRate: 21,
        taxAmount: 126,
        lineTotal: 600,
        hideQty: false,
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'l2',
        tenantId,
        invoiceId: 'preview',
        productId: null,
        description: 'Licencia de software anual',
        quantity: 1,
        unitPrice: 400,
        subtotal: 400,
        taxRate: 21,
        taxAmount: 84,
        lineTotal: 400,
        hideQty: false,
        sortOrder: 2,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

// ==================== CONSTANTS ====================

const PRESET_PALETTES = [
  {
    name: 'Azul profesional',
    recommended: true,
    primary: '#2563eb',
    tableHeader: '#dbeafe',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
  },
  {
    name: 'Verde esmeralda',
    recommended: false,
    primary: '#059669',
    tableHeader: '#d1fae5',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
  },
  {
    name: 'Gris elegante',
    recommended: false,
    primary: '#374151',
    tableHeader: '#f3f4f6',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
  },
  {
    name: 'Rojo corporativo',
    recommended: false,
    primary: '#dc2626',
    tableHeader: '#fee2e2',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
  },
  {
    name: 'Violeta moderno',
    recommended: false,
    primary: '#7c3aed',
    tableHeader: '#ede9fe',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
  },
  {
    name: 'Naranja cálido',
    recommended: false,
    primary: '#ea580c',
    tableHeader: '#ffedd5',
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
  },
];

const TABLE_STYLES = [
  { value: 'grid', label: 'Cuadrícula', icon: '⊞', desc: 'Celdas con bordes' },
  { value: 'lines', label: 'Líneas', icon: '≡', desc: 'Solo horizontales' },
  { value: 'minimal', label: 'Limpia', icon: '—', desc: 'Sin bordes' },
];

const FONT_OPTIONS = [
  { value: 'helvetica', label: 'Moderna', preview: 'Aa', style: 'font-sans' },
  { value: 'times-roman', label: 'Clásica', preview: 'Aa', style: 'font-serif' },
  { value: 'courier', label: 'Técnica', preview: 'Aa', style: 'font-mono' },
];

const BASE_TEMPLATES: {
  name: string;
  description: string;
  emoji: string;
  layout: Partial<InvoiceLayout>;
}[] = [
  {
    name: 'Profesional',
    description: 'Seria y ordenada',
    emoji: '💼',
    layout: {
      colors: {
        primary: '#2563eb',
        tableHeader: '#dbeafe',
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
      },
      typography: { fontFamily: 'helvetica', baseFontSize: 10 },
      itemsTable: {
        style: 'grid',
        showDiscount: false,
        showReference: false,
        showUnitPrice: true,
        showTaxColumn: true,
        showLineTotal: true,
      },
      logo: { visible: true, position: 'top-left', widthMm: 40 },
      header: { senderSide: 'left', showPhone: true, showIban: true },
      totals: { showTaxBreakdown: true, showIrpf: false },
      footer: { text: 'Gracias por su confianza.', showPaymentInfo: true, showVerifactuQr: false },
    },
  },
  {
    name: 'Moderna',
    description: 'Limpia y minimalista',
    emoji: '✨',
    layout: {
      colors: {
        primary: '#7c3aed',
        tableHeader: '#ede9fe',
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
      },
      typography: { fontFamily: 'helvetica', baseFontSize: 10 },
      itemsTable: {
        style: 'minimal',
        showDiscount: false,
        showReference: false,
        showUnitPrice: true,
        showTaxColumn: true,
        showLineTotal: true,
      },
      logo: { visible: true, position: 'top-center', widthMm: 45 },
      header: { senderSide: 'left', showPhone: false, showIban: true },
      totals: { showTaxBreakdown: false, showIrpf: false },
      footer: { text: '', showPaymentInfo: true, showVerifactuQr: false },
    },
  },
  {
    name: 'Clásica',
    description: 'Tradicional y formal',
    emoji: '🏛️',
    layout: {
      colors: {
        primary: '#374151',
        tableHeader: '#f3f4f6',
        textPrimary: '#111827',
        textSecondary: '#6b7280',
      },
      typography: { fontFamily: 'times-roman', baseFontSize: 11 },
      itemsTable: {
        style: 'lines',
        showDiscount: false,
        showReference: false,
        showUnitPrice: true,
        showTaxColumn: true,
        showLineTotal: true,
      },
      logo: { visible: true, position: 'top-right', widthMm: 35 },
      header: { senderSide: 'left', showPhone: true, showIban: true },
      totals: { showTaxBreakdown: true, showIrpf: true },
      footer: {
        text: 'Documento emitido conforme a la normativa fiscal vigente.',
        showPaymentInfo: true,
        showVerifactuQr: false,
      },
    },
  },
  {
    name: 'Vibrante',
    description: 'Llamativa y moderna',
    emoji: '🚀',
    layout: {
      colors: {
        primary: '#059669',
        tableHeader: '#d1fae5',
        textPrimary: '#1e293b',
        textSecondary: '#64748b',
      },
      typography: { fontFamily: 'helvetica', baseFontSize: 10 },
      itemsTable: {
        style: 'grid',
        showDiscount: true,
        showReference: false,
        showUnitPrice: true,
        showTaxColumn: true,
        showLineTotal: true,
      },
      logo: { visible: true, position: 'top-left', widthMm: 50 },
      header: { senderSide: 'right', showPhone: true, showIban: true },
      totals: { showTaxBreakdown: true, showIrpf: false },
      footer: {
        text: '¡Gracias por confiar en nosotros!',
        showPaymentInfo: true,
        showVerifactuQr: false,
      },
    },
  },
];

// ==================== UI COMPONENTS ====================

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b bg-muted/40">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 py-2.5 cursor-pointer group"
      onClick={() => onChange(!checked)}
    >
      <div>
        <div className="text-sm font-medium group-hover:text-primary transition-colors">
          {label}
        </div>
        {description && <div className="text-xs text-muted-foreground mt-0.5">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

// ==================== SETTINGS PANEL ====================

function SettingsPanel({
  layout,
  onChange,
  logoUrl,
  onApplyTemplate,
  onReset,
}: {
  layout: InvoiceLayout;
  onChange: (patch: Partial<InvoiceLayout>) => void;
  logoUrl?: string | null;
  onApplyTemplate: (tpl: Partial<InvoiceLayout>) => void;
  onReset: () => void;
}) {
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  function patchColors(patch: Partial<InvoiceLayout['colors']>) {
    onChange({ colors: { ...layout.colors, ...patch } });
  }
  function patchTypography(patch: Partial<InvoiceLayout['typography']>) {
    onChange({ typography: { ...layout.typography, ...patch } });
  }
  function patchLogo(patch: Partial<InvoiceLayout['logo']>) {
    onChange({ logo: { ...layout.logo, ...patch } });
  }
  function patchHeader(patch: Partial<InvoiceLayout['header']>) {
    onChange({ header: { ...layout.header, ...patch } });
  }
  function patchItemsTable(patch: Partial<InvoiceLayout['itemsTable']>) {
    onChange({ itemsTable: { ...layout.itemsTable, ...patch } });
  }
  function patchTotals(patch: Partial<InvoiceLayout['totals']>) {
    onChange({ totals: { ...layout.totals, ...patch } });
  }
  function patchFooter(patch: Partial<InvoiceLayout['footer']>) {
    onChange({ footer: { ...layout.footer, ...patch } });
  }
  function patchNotes(patch: Partial<NonNullable<InvoiceLayout['notes']>>) {
    onChange({
      notes: {
        show: layout.notes?.show !== false,
        showLabel: layout.notes?.showLabel !== false,
        defaultText: layout.notes?.defaultText,
        ...patch,
      },
    });
  }

  function handleApplyTemplate(tpl: (typeof BASE_TEMPLATES)[0]) {
    setActiveTemplate(tpl.name);
    onApplyTemplate(tpl.layout);
  }

  return (
    <div className="space-y-4">
      {/* ── 0. Plantillas base ── */}
      <SectionCard icon={Sparkles} title="Empieza con una plantilla">
        <p className="text-xs text-muted-foreground mb-3">
          Elige un estilo de inicio y personalízalo a tu gusto
        </p>
        <div className="grid grid-cols-2 gap-2">
          {BASE_TEMPLATES.map((tpl) => {
            const isActive = activeTemplate === tpl.name;
            return (
              <button
                key={tpl.name}
                onClick={() => handleApplyTemplate(tpl)}
                className={`relative text-left p-3 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-muted hover:border-muted-foreground/40 bg-muted/20'
                }`}
              >
                <div className="text-2xl mb-1">{tpl.emoji}</div>
                <div className={`text-xs font-bold ${isActive ? 'text-primary' : ''}`}>
                  {tpl.name}
                </div>
                <div className="text-[10px] text-muted-foreground">{tpl.description}</div>
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            onReset();
            setActiveTemplate(null);
          }}
          className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-dashed hover:border-muted-foreground/50 transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          Restablecer valores originales
        </button>
      </SectionCard>

      {/* ── 1. Logo ── */}
      <SectionCard icon={ImageIcon} title="Logo">
        {logoUrl ? (
          <div className="mb-3 p-3 rounded-lg bg-muted/40 border flex items-center gap-3">
            <img
              src={logoUrl}
              alt="Tu logo"
              className="h-10 w-auto max-w-[80px] object-contain rounded"
            />
            <div>
              <div className="text-xs font-medium">Tu logo actual</div>
              <div className="text-[10px] text-muted-foreground">Así aparecerá en la factura</div>
            </div>
          </div>
        ) : (
          <div className="mb-3 p-3 rounded-lg bg-muted/40 border flex items-center gap-2 text-muted-foreground">
            <ImageIcon className="w-4 h-4 shrink-0" />
            <div className="text-xs">
              Sin logo — puedes añadirlo en{' '}
              <span className="font-medium text-foreground">Ajustes → Empresa</span>
            </div>
          </div>
        )}
        <ToggleRow
          label="Mostrar logo en la factura"
          checked={layout.logo.visible}
          onChange={(v) => patchLogo({ visible: v })}
        />
        {layout.logo.visible && (
          <div className="mt-3 pt-3 border-t space-y-3">
            <div>
              <div className="text-xs font-medium mb-1.5">Posición</div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { value: 'top-left', label: 'Izquierda', icon: '◧' },
                    { value: 'top-center', label: 'Centro', icon: '◫' },
                    { value: 'top-right', label: 'Derecha', icon: '◨' },
                  ] as const
                ).map((pos) => (
                  <button
                    key={pos.value}
                    onClick={() => patchLogo({ position: pos.value })}
                    className={`flex flex-col items-center gap-0.5 py-2 rounded-lg border text-xs transition-all ${
                      layout.logo.position === pos.value
                        ? 'border-primary bg-primary/5 text-primary font-semibold'
                        : 'border-muted text-muted-foreground hover:border-muted-foreground/40'
                    }`}
                  >
                    <span className="text-base">{pos.icon}</span>
                    <span className="text-[10px]">{pos.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <div className="text-xs font-medium">Tamaño</div>
                <span className="text-xs text-muted-foreground">{layout.logo.widthMm} mm</span>
              </div>
              <input
                type="range"
                min={20}
                max={80}
                value={layout.logo.widthMm}
                onChange={(e) => patchLogo({ widthMm: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                <span>Pequeño</span>
                <span>Grande</span>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ── 2. Color ── */}
      <SectionCard icon={Palette} title="Color de tu marca">
        <p className="text-xs text-muted-foreground mb-3">
          El color principal que aparecerá en tu factura
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PRESET_PALETTES.map((palette) => {
            const isActive = palette.primary === layout.colors.primary;
            return (
              <button
                key={palette.primary}
                onClick={() =>
                  patchColors({
                    primary: palette.primary,
                    tableHeader: palette.tableHeader,
                    textPrimary: palette.textPrimary,
                    textSecondary: palette.textSecondary,
                  })
                }
                className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'border-primary shadow-sm scale-[1.03]'
                    : 'border-transparent hover:border-muted-foreground/30 hover:scale-[1.02]'
                }`}
              >
                {palette.recommended && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap">
                    Popular
                  </div>
                )}
                <div
                  className="w-8 h-8 rounded-full shadow-sm mt-1"
                  style={{ background: palette.primary }}
                />
                <span className="text-[10px] text-center leading-tight text-muted-foreground font-medium">
                  {palette.name}
                </span>
                {isActive && (
                  <div
                    className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full flex items-center justify-center"
                    style={{ background: palette.primary }}
                  >
                    <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                      <path
                        d="M1 3.5L3 5.5L6 1.5"
                        stroke="white"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-2.5 pt-3 border-t">
          <input
            type="color"
            value={layout.colors.primary}
            onChange={(e) => patchColors({ primary: e.target.value })}
            className="w-8 h-8 cursor-pointer rounded-md border shrink-0"
          />
          <div>
            <div className="text-xs font-medium">Color personalizado</div>
            <div className="text-[10px] text-muted-foreground">
              Pon exactamente el color de tu marca
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── 3. Fuente ── */}
      <SectionCard icon={Type} title="Estilo de letra">
        <p className="text-xs text-muted-foreground mb-3">Tipografía del texto en la factura</p>
        <div className="grid grid-cols-3 gap-2">
          {FONT_OPTIONS.map((font) => {
            const isActive = layout.typography.fontFamily === font.value;
            return (
              <button
                key={font.value}
                onClick={() =>
                  patchTypography({
                    fontFamily: font.value as InvoiceLayout['typography']['fontFamily'],
                  })
                }
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/40'
                }`}
              >
                <span className={`text-2xl font-bold ${font.style}`}>{font.preview}</span>
                <span
                  className={`text-[10px] font-semibold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {font.label}
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* ── 4. Tabla ── */}
      <SectionCard icon={Table} title="Estilo de tabla">
        <div className="grid grid-cols-3 gap-2 mb-3">
          {TABLE_STYLES.map((style) => {
            const isActive = layout.itemsTable.style === style.value;
            return (
              <button
                key={style.value}
                onClick={() =>
                  patchItemsTable({ style: style.value as InvoiceLayout['itemsTable']['style'] })
                }
                className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/40'
                }`}
              >
                <span className="text-xl">{style.icon}</span>
                <span
                  className={`text-[10px] font-semibold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {style.label}
                </span>
                <span className="text-[9px] text-muted-foreground text-center leading-tight">
                  {style.desc}
                </span>
              </button>
            );
          })}
        </div>
        <div className="divide-y">
          <ToggleRow
            label="Mostrar columna de descuento"
            checked={layout.itemsTable.showDiscount}
            onChange={(v) => patchItemsTable({ showDiscount: v })}
          />
          <ToggleRow
            label="Mostrar precio unitario en cada línea"
            description="Útil para facturas de un único servicio"
            checked={layout.itemsTable.showUnitPrice ?? true}
            onChange={(v) => patchItemsTable({ showUnitPrice: v })}
          />
          <ToggleRow
            label="Mostrar % de IVA en cada línea"
            description="El desglose de IVA en totales siempre aparece"
            checked={layout.itemsTable.showTaxColumn ?? true}
            onChange={(v) => patchItemsTable({ showTaxColumn: v })}
          />
          <ToggleRow
            label="Mostrar total por línea"
            description="Útil cuando todas las líneas tienen el mismo valor"
            checked={layout.itemsTable.showLineTotal ?? true}
            onChange={(v) => patchItemsTable({ showLineTotal: v })}
          />
        </div>
      </SectionCard>

      {/* ── 5. Qué mostrar ── */}
      <SectionCard icon={Hash} title="Qué mostrar en la factura">
        <div className="divide-y">
          <ToggleRow
            label="Teléfono de contacto"
            description="Visible en la cabecera"
            checked={layout.header.showPhone}
            onChange={(v) => patchHeader({ showPhone: v })}
          />
          <ToggleRow
            label="Cuenta bancaria (IBAN)"
            description="Para que el cliente sepa dónde pagarte"
            checked={layout.header.showIban}
            onChange={(v) => patchHeader({ showIban: v })}
          />
          <ToggleRow
            label="Desglose detallado de IVA"
            description="Separa los distintos tipos de IVA"
            checked={layout.totals.showTaxBreakdown}
            onChange={(v) => patchTotals({ showTaxBreakdown: v })}
          />
          <ToggleRow
            label="IRPF (retención)"
            description="Solo si aplica en tus facturas"
            checked={layout.totals.showIrpf}
            onChange={(v) => patchTotals({ showIrpf: v })}
          />
          <ToggleRow
            label="Sección de notas"
            description="Muestra las notas de la factura"
            checked={layout.notes?.show !== false}
            onChange={(v) => patchNotes({ show: v })}
          />
          {layout.notes?.show !== false && (
            <>
              <ToggleRow
                label="Etiqueta 'Notas'"
                description="Muestra el título de la sección"
                checked={layout.notes?.showLabel !== false}
                onChange={(v) => patchNotes({ showLabel: v })}
              />
              <div className="pt-2.5 pb-1">
                <label className="text-xs font-medium block mb-1.5">Notas predeterminadas</label>
                <textarea
                  value={layout.notes?.defaultText ?? ''}
                  onChange={(e) => patchNotes({ defaultText: e.target.value || undefined })}
                  placeholder="Ej: Gracias por su confianza..."
                  rows={2}
                  className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Se usará como notas por defecto en nuevas facturas
                </p>
              </div>
            </>
          )}
        </div>
      </SectionCard>

      {/* ── 6. Pie ── */}
      <SectionCard icon={FileText} title="Pie de página">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1.5">
              Mensaje personalizado al final de la factura
            </label>
            <textarea
              value={layout.footer.text}
              onChange={(e) => patchFooter({ text: e.target.value })}
              placeholder="Ej: Gracias por su confianza. Puede contactarnos en info@tuempresa.com"
              rows={2}
              className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
          </div>
          <div className="divide-y">
            <ToggleRow
              label="Mostrar info de pago en el pie"
              checked={layout.footer.showPaymentInfo}
              onChange={(v) => patchFooter({ showPaymentInfo: v })}
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ==================== PAGE ====================

export default function PlantillaPage() {
  const { data: template, isLoading } = useDefaultTemplate();
  const updateTemplate = useUpdateTemplate();
  const updateInvoiceDefaults = useUpdateInvoiceDefaults();
  const currentTenant = useAuthStore((s) => s.currentTenant);
  const { data: tenantData } = useTenant();
  const { data: invoiceDefaults } = useInvoiceDefaults();

  const [localLayout, setLocalLayout] = useState<InvoiceLayout>(DEFAULT_INVOICE_LAYOUT);
  const [savedLayout, setSavedLayout] = useState<InvoiceLayout>(DEFAULT_INVOICE_LAYOUT);
  const [hasChanges, setHasChanges] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (template) {
      const l = template.layout as InvoiceLayout;
      setLocalLayout(l);
      setSavedLayout(l);
      setHasChanges(false);
    }
  }, [template]);

  const handleChange = useCallback((patch: Partial<InvoiceLayout>) => {
    setLocalLayout((prev) => ({ ...prev, ...patch }));
    setHasChanges(true);
    setJustSaved(false);
  }, []);

  const handleApplyTemplate = useCallback((tplLayout: Partial<InvoiceLayout>) => {
    setLocalLayout((prev) => ({ ...prev, ...tplLayout }));
    setHasChanges(true);
    setJustSaved(false);
  }, []);

  const handleReset = useCallback(() => {
    setLocalLayout(savedLayout);
    setHasChanges(false);
  }, [savedLayout]);

  const handleSave = useCallback(() => {
    if (!template) return;
    updateTemplate.mutate(
      { id: template.id, data: { layout: localLayout } },
      {
        onSuccess: () => {
          setSavedLayout(localLayout);
          setHasChanges(false);
          setJustSaved(true);
          setTimeout(() => setJustSaved(false), 3000);

          // Sincronizar las notas predeterminadas con invoice_defaults
          const newNotesText = localLayout.notes?.defaultText ?? null;
          const currentNotesText = invoiceDefaults?.notes ?? null;
          if (newNotesText !== currentNotesText) {
            updateInvoiceDefaults.mutate({ notes: newNotesText });
          }
        },
      },
    );
  }, [template, localLayout, updateTemplate, updateInvoiceDefaults, invoiceDefaults]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const exampleInvoice = {
    ...buildExampleInvoice(currentTenant?.id ?? 'preview'),
    notes: localLayout.notes?.defaultText || invoiceDefaults?.notes || 'Gracias por su confianza.',
  };

  // ── Logo URL: siempre resuelta con resolveUrl ──────────────────────────────
  const rawLogoUrl = tenantData?.logoUrl ?? currentTenant?.logoUrl ?? null;
  const logoUrl = resolveUrl(rawLogoUrl);

  const previewTenant: Tenant = {
    ...(currentTenant ?? {}),
    id: currentTenant?.id ?? 'preview',
    businessName: currentTenant?.businessName ?? 'Mi Empresa S.L.',
    legalName: currentTenant?.legalName ?? null,
    nif: currentTenant?.nif ?? 'B12345678',
    address: currentTenant?.address ?? 'Calle Mayor 1',
    postalCode: currentTenant?.postalCode ?? '28001',
    city: currentTenant?.city ?? 'Madrid',
    province: currentTenant?.province ?? 'Madrid',
    country: currentTenant?.country ?? 'ES',
    phone: currentTenant?.phone ?? '+34 912 000 000',
    email: currentTenant?.email ?? 'info@miempresa.com',
    logoUrl, // ← URL ya resuelta
    iban: currentTenant?.iban ?? 'ES91 2100 0418 4502 0005 1332',
    bankAccountHolder:
      currentTenant?.bankAccountHolder ?? currentTenant?.businessName ?? 'Mi Empresa S.L.',
    certificateUrl: null,
    certificateExpiry: null,
    setupCompleted: true,
    accountType: currentTenant?.accountType ?? ('INDIVIDUAL' as never),
    plan: currentTenant?.plan ?? ('FREE' as never),
    isActive: true,
    createdAt: currentTenant?.createdAt ?? new Date().toISOString(),
    updatedAt: currentTenant?.updatedAt ?? new Date().toISOString(),
  };

  const previewPaymentDetails: PaymentDetails = {
    iban: previewTenant.iban ?? 'ES91 2100 0418 4502 0005 1332',
    accountHolder: previewTenant.bankAccountHolder ?? previewTenant.businessName,
  };

  const previewTemplate = template
    ? { ...template, layout: localLayout }
    : {
        id: 'preview',
        tenantId: 'preview',
        name: 'Plantilla predeterminada',
        isDefault: true,
        layout: localLayout,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Diseño de factura</h2>
          <p className="text-sm text-muted-foreground">
            Personaliza cómo se verán tus facturas al descargarlas o enviarlas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateTemplate.isPending}
            className="gap-2 min-w-[140px]"
          >
            {updateTemplate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : justSaved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {updateTemplate.isPending ? 'Guardando…' : justSaved ? '¡Guardado!' : 'Guardar cambios'}
          </Button>
        </div>
      </div>

      {/* ── Banner cambios sin guardar ── */}
      {hasChanges && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-proforma-50 border border-proforma-200 dark:bg-proforma-950/30 dark:border-proforma-800">
          <div className="flex items-center gap-2 text-proforma-700 dark:text-proforma-400">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Tienes cambios sin guardar</span>
            <span className="text-xs text-proforma-600 dark:text-proforma-500 hidden sm:inline">
              — No olvides guardar cuando termines de personalizar
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleReset}
              className="text-xs text-proforma-600 hover:text-proforma-800 dark:text-proforma-400 underline underline-offset-2 transition-colors"
            >
              Descartar
            </button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateTemplate.isPending}
              className="h-7 text-xs gap-1.5"
            >
              {updateTemplate.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Guardar ahora
            </Button>
          </div>
        </div>
      )}

      {/* ── Split layout ── */}
      <div className="grid grid-cols-[320px_1fr] gap-6 items-start min-h-0 flex-1">
        {/* Panel izquierdo */}
        <div className="overflow-y-auto pb-6" style={{ maxHeight: 'calc(100vh - 190px)' }}>
          <SettingsPanel
            layout={localLayout}
            onChange={handleChange}
            logoUrl={logoUrl}
            onApplyTemplate={handleApplyTemplate}
            onReset={handleReset}
          />
        </div>

        {/* Preview A4 */}
        <div
          className="overflow-hidden rounded-xl border flex flex-col transition-all"
          style={{ height: 'calc(100vh - 190px)' }}
        >
          <LiveInvoicePreview
            invoice={exampleInvoice}
            template={previewTemplate as never}
            tenant={previewTenant}
            activeFieldSection={null}
            onSectionClick={() => {}}
            paymentDetails={previewPaymentDetails}
          />
        </div>
      </div>
    </div>
  );
}

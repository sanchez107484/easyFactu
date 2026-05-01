'use client';

import { useRef, useState } from 'react';
import { Building2, FileText, Image as ImageIcon, Palette, RotateCcw, Table } from 'lucide-react';
import { InvoiceLayout } from '@easyfactura/shared-types';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { TemplateMiniPreview } from './template-mini-preview';
import {
  BASE_TEMPLATES,
  FONT_OPTIONS,
  PRESET_PALETTES,
  TABLE_STYLES,
  type BaseTemplate,
} from '../_lib/preview-data';

// ──────────────────────────── Types ────────────────────────────

export type SettingsTab = 'style' | 'sender' | 'details' | 'closing';

interface SettingsTabsProps {
  layout: InvoiceLayout;
  onChange: (patch: Partial<InvoiceLayout>) => void;
  onApplyTemplate: (tpl: Partial<InvoiceLayout>) => void;
  onReset: () => void;
  logoUrl?: string | null;
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

// ──────────────────────────── Tab definitions ────────────────────────────

const TABS: { id: SettingsTab; label: string; icon: typeof Palette }[] = [
  { id: 'style', label: 'Estilo', icon: Palette },
  { id: 'sender', label: 'Cliente\ny emisor', icon: Building2 },
  { id: 'details', label: 'Tabla\ny totales', icon: Table },
  { id: 'closing', label: 'Notas\ny pie', icon: FileText },
];

// ──────────────────────────── Small UI primitives ────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  badge,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className="group flex cursor-pointer items-center justify-between gap-3 py-2.5"
      onClick={() => onChange(!checked)}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium transition-colors group-hover:text-primary">
          {label}
          {badge}
        </div>
        {description && <div className="mt-0.5 text-xs text-muted-foreground">{description}</div>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

// ──────────────────────────── Main component ────────────────────────────

export function SettingsTabs({
  layout,
  onChange,
  onApplyTemplate,
  onReset,
  logoUrl,
  activeTab,
  onTabChange,
}: SettingsTabsProps) {
  return (
    <div className="flex h-full flex-col">
      <nav
        role="tablist"
        aria-label="Secciones del editor de plantilla"
        className="grid shrink-0 grid-cols-4 border-b bg-muted/40"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tab-panel-${tab.id}`}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center gap-1 px-1 py-2.5 text-center text-[11px] font-semibold leading-tight transition-colors whitespace-pre-line',
                isActive
                  ? 'border-b-2 border-primary text-primary'
                  : 'border-b-2 border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div
        id={`tab-panel-${activeTab}`}
        role="tabpanel"
        className="flex-1 space-y-6 overflow-y-auto p-4"
      >
        {activeTab === 'style' && (
          <StyleTab
            layout={layout}
            onChange={onChange}
            onApplyTemplate={onApplyTemplate}
            onReset={onReset}
          />
        )}
        {activeTab === 'sender' && (
          <SenderTab layout={layout} onChange={onChange} logoUrl={logoUrl} />
        )}
        {activeTab === 'details' && <DetailsTab layout={layout} onChange={onChange} />}
        {activeTab === 'closing' && <ClosingTab layout={layout} onChange={onChange} />}
      </div>
    </div>
  );
}

// ──────────────────────────── Tab: Estilo ────────────────────────────

const MARGIN_PRESETS = [
  { label: 'Compacto', mm: 15 },
  { label: 'Normal', mm: 20 },
  { label: 'Amplio', mm: 28 },
] as const;

function StyleTab({
  layout,
  onChange,
  onApplyTemplate,
  onReset,
}: {
  layout: InvoiceLayout;
  onChange: (patch: Partial<InvoiceLayout>) => void;
  onApplyTemplate: (tpl: Partial<InvoiceLayout>) => void;
  onReset: () => void;
}) {
  const [activeTplId, setActiveTplId] = useState<string | null>(null);

  function handleApplyTemplate(tpl: BaseTemplate) {
    setActiveTplId(tpl.id);
    onApplyTemplate(tpl.layout);
  }
  function patchColors(patch: Partial<InvoiceLayout['colors']>) {
    onChange({ colors: { ...layout.colors, ...patch } });
  }
  function patchTypography(patch: Partial<InvoiceLayout['typography']>) {
    onChange({ typography: { ...layout.typography, ...patch } });
  }
  function patchPage(patch: Partial<InvoiceLayout['page']>) {
    onChange({ page: { ...layout.page, ...patch } });
  }

  const activePresetMm = MARGIN_PRESETS.find((p) => p.mm === layout.page.marginTop)?.mm ?? null;

  return (
    <>
      <FieldGroup
        title="Empieza con una plantilla"
        description="Elige un estilo y luego personalízalo"
      >
        <div className="grid grid-cols-2 gap-3">
          {BASE_TEMPLATES.map((tpl) => (
            <TemplateMiniPreview
              key={tpl.id}
              template={tpl}
              isActive={activeTplId === tpl.id}
              onClick={() => handleApplyTemplate(tpl)}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            onReset();
            setActiveTplId(null);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-xs text-muted-foreground transition-all hover:border-muted-foreground/50 hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" />
          Restablecer cambios
        </button>
      </FieldGroup>

      <FieldGroup title="Color de tu marca" description="El color principal de la factura">
        <div className="grid grid-cols-3 gap-2">
          {PRESET_PALETTES.map((palette) => {
            const isActive = palette.primary === layout.colors.primary;
            return (
              <button
                key={palette.primary}
                type="button"
                onClick={() =>
                  patchColors({
                    primary: palette.primary,
                    tableHeader: palette.tableHeader,
                    textPrimary: palette.textPrimary,
                    textSecondary: palette.textSecondary,
                  })
                }
                className={cn(
                  'relative flex flex-col items-center gap-1.5 rounded-lg border-2 p-2.5 transition-all',
                  isActive
                    ? 'border-primary shadow-sm'
                    : 'border-transparent hover:border-muted-foreground/30',
                )}
                title={palette.name}
              >
                {palette.recommended && (
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold text-primary-foreground">
                    Popular
                  </div>
                )}
                <div
                  className="mt-1 h-8 w-8 rounded-full shadow-sm"
                  style={{ background: palette.primary }}
                />
                <span className="text-center text-[10px] font-medium leading-tight text-muted-foreground">
                  {palette.name}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2.5 border-t pt-3">
          <input
            type="color"
            value={layout.colors.primary}
            onChange={(e) => patchColors({ primary: e.target.value })}
            className="h-8 w-8 shrink-0 cursor-pointer rounded-md border"
          />
          <div>
            <div className="text-xs font-medium">Color personalizado</div>
            <div className="text-[10px] text-muted-foreground">
              Usa exactamente el color de tu marca
            </div>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Tipo de letra">
        <div className="grid grid-cols-3 gap-2">
          {FONT_OPTIONS.map((font) => {
            const isActive = layout.typography.fontFamily === font.value;
            return (
              <button
                key={font.value}
                type="button"
                onClick={() => patchTypography({ fontFamily: font.value })}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border-2 p-3 transition-all',
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/40',
                )}
              >
                <span className={cn('text-2xl font-bold', font.style)}>{font.preview}</span>
                <span
                  className={cn(
                    'text-[10px] font-semibold',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {font.label}
                </span>
              </button>
            );
          })}
        </div>
      </FieldGroup>

      <FieldGroup title="Tamano de letra">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span
              className="font-medium"
              style={{ fontSize: `${layout.typography.baseFontSize + 2}px` }}
            >
              Aa
            </span>
            <span className="text-xs font-semibold tabular-nums text-primary">
              {layout.typography.baseFontSize} pt
            </span>
          </div>
          <input
            type="range"
            min={8}
            max={14}
            step={1}
            value={layout.typography.baseFontSize}
            onChange={(e) => patchTypography({ baseFontSize: Number(e.target.value) })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Pequeño</span>
            <span>Grande</span>
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="Margenes" description="Espacio alrededor del contenido de la factura">
        <div className="grid grid-cols-3 gap-2">
          {MARGIN_PRESETS.map((preset) => {
            const isActive = activePresetMm === preset.mm;
            const innerPad =
              preset.mm === 15 ? 'p-[2px]' : preset.mm === 20 ? 'p-[4px]' : 'p-[7px]';
            return (
              <button
                key={preset.mm}
                type="button"
                onClick={() =>
                  patchPage({
                    marginTop: preset.mm,
                    marginRight: preset.mm,
                    marginBottom: preset.mm,
                    marginLeft: preset.mm,
                  })
                }
                className={cn(
                  'flex flex-col items-center gap-1 rounded-lg border-2 py-2.5 transition-all',
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/40',
                )}
              >
                <div
                  className={cn(
                    'h-6 w-5 rounded-sm border',
                    isActive ? 'border-primary' : 'border-muted-foreground/40',
                    innerPad,
                  )}
                >
                  <div
                    className={cn(
                      'h-full w-full rounded-sm',
                      isActive ? 'bg-primary/20' : 'bg-muted',
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {preset.label}
                </span>
                <span className="text-[9px] text-muted-foreground">{preset.mm} mm</span>
              </button>
            );
          })}
        </div>
      </FieldGroup>
    </>
  );
}

// ──────────────────────────── Tab: Emisor y cliente ────────────────────────────

const LOGO_POSITIONS = [
  { value: 'top-left', label: 'Izquierda' },
  { value: 'top-center', label: 'Centro' },
  { value: 'top-right', label: 'Derecha' },
] as const;

const SENDER_SIDES = [
  { value: 'left', label: 'Tu a la izquierda' },
  { value: 'right', label: 'Tu a la derecha' },
] as const;

function SenderTab({
  layout,
  onChange,
  logoUrl,
}: {
  layout: InvoiceLayout;
  onChange: (patch: Partial<InvoiceLayout>) => void;
  logoUrl?: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function patchLogo(patch: Partial<InvoiceLayout['logo']>) {
    onChange({ logo: { ...layout.logo, ...patch } });
  }
  function patchHeader(patch: Partial<InvoiceLayout['header']>) {
    onChange({ header: { ...layout.header, ...patch } });
  }

  return (
    <>
      <FieldGroup title="Logo">
        {logoUrl ? (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt="Tu logo"
              className="h-10 w-auto max-w-[80px] rounded object-contain"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium">Logo actual</div>
              <div className="text-[10px] text-muted-foreground">
                Cambialo en Ajustes &rsaquo; Empresa
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-3 text-muted-foreground">
            <ImageIcon className="h-4 w-4 shrink-0" />
            <div className="text-xs">
              Sin logo &mdash; añadelo en{' '}
              <span className="font-medium text-foreground">Ajustes &rsaquo; Empresa</span>
            </div>
          </div>
        )}

        <div className="divide-y">
          <ToggleRow
            label="Mostrar logo en la factura"
            checked={layout.logo.visible}
            onChange={(v) => patchLogo({ visible: v })}
          />
        </div>

        {layout.logo.visible && (
          <>
            <div>
              <p className="mb-2 text-xs font-medium">Posicion del logo</p>
              <div className="grid grid-cols-3 gap-1.5">
                {LOGO_POSITIONS.map((pos) => (
                  <button
                    key={pos.value}
                    type="button"
                    onClick={() => patchLogo({ position: pos.value })}
                    className={cn(
                      'flex flex-col items-center gap-0.5 rounded-lg border py-2 text-xs transition-all',
                      layout.logo.position === pos.value
                        ? 'border-primary bg-primary/5 font-semibold text-primary'
                        : 'border-muted text-muted-foreground hover:border-muted-foreground/40',
                    )}
                  >
                    <span className="text-[10px]">{pos.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-xs font-medium">Tamano del logo</span>
                <span className="text-xs font-semibold tabular-nums text-primary">
                  {layout.logo.widthMm} mm
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={80}
                value={layout.logo.widthMm}
                onChange={(e) => patchLogo({ widthMm: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>Pequeño</span>
                <span>Grande</span>
              </div>
            </div>
          </>
        )}
      </FieldGroup>

      <FieldGroup title="Disposicion" description="Lado donde aparecen tus datos de empresa">
        <div className="grid grid-cols-2 gap-2">
          {SENDER_SIDES.map((side) => {
            const isActive = layout.header.senderSide === side.value;
            const isLeft = side.value === 'left';
            return (
              <button
                key={side.value}
                type="button"
                onClick={() => patchHeader({ senderSide: side.value })}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all',
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/40',
                )}
              >
                <div className="flex w-full gap-1">
                  <div
                    className={cn(
                      'h-8 flex-1 rounded',
                      isLeft
                        ? isActive
                          ? 'bg-primary/30'
                          : 'bg-muted-foreground/20'
                        : 'bg-muted-foreground/10',
                    )}
                  />
                  <div
                    className={cn(
                      'h-8 flex-1 rounded',
                      !isLeft
                        ? isActive
                          ? 'bg-primary/30'
                          : 'bg-muted-foreground/20'
                        : 'bg-muted-foreground/10',
                    )}
                  />
                </div>
                <span
                  className={cn(
                    'text-center text-[10px] font-semibold leading-tight',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {side.label}
                </span>
              </button>
            );
          })}
        </div>
      </FieldGroup>

      <FieldGroup title="Datos de contacto visibles">
        <div className="divide-y">
          <ToggleRow
            label="Telefono"
            description="Visible en la cabecera de la factura"
            checked={layout.header.showPhone}
            onChange={(v) => patchHeader({ showPhone: v })}
          />
          <ToggleRow
            label="Cuenta bancaria (IBAN)"
            description="Para que el cliente sepa donde pagarte"
            checked={layout.header.showIban}
            onChange={(v) => patchHeader({ showIban: v })}
          />
        </div>
      </FieldGroup>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" />
    </>
  );
}

// ──────────────────────────── Tab: Tabla y totales ────────────────────────────

function DetailsTab({
  layout,
  onChange,
}: {
  layout: InvoiceLayout;
  onChange: (patch: Partial<InvoiceLayout>) => void;
}) {
  function patchItemsTable(patch: Partial<InvoiceLayout['itemsTable']>) {
    onChange({ itemsTable: { ...layout.itemsTable, ...patch } });
  }
  function patchTotals(patch: Partial<InvoiceLayout['totals']>) {
    onChange({ totals: { ...layout.totals, ...patch } });
  }

  return (
    <>
      <FieldGroup title="Estilo de tabla">
        <div className="grid grid-cols-3 gap-2">
          {TABLE_STYLES.map((style) => {
            const isActive = layout.itemsTable.style === style.value;
            return (
              <button
                key={style.value}
                type="button"
                onClick={() => patchItemsTable({ style: style.value })}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-lg border-2 p-3 transition-all',
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/40',
                )}
              >
                <span className="text-xl">{style.icon}</span>
                <span
                  className={cn(
                    'text-[10px] font-semibold',
                    isActive ? 'text-primary' : 'text-muted-foreground',
                  )}
                >
                  {style.label}
                </span>
                <span className="text-center text-[9px] leading-tight text-muted-foreground">
                  {style.desc}
                </span>
              </button>
            );
          })}
        </div>
      </FieldGroup>

      <FieldGroup title="Columnas visibles">
        <div className="divide-y">
          <ToggleRow
            label="Referencia / SKU"
            description="Muestra el codigo de cada articulo"
            checked={layout.itemsTable.showReference}
            onChange={(v) => patchItemsTable({ showReference: v })}
          />
          <ToggleRow
            label="Descuento"
            checked={layout.itemsTable.showDiscount}
            onChange={(v) => patchItemsTable({ showDiscount: v })}
          />
          <ToggleRow
            label="Precio unitario"
            description="Util para facturas de un unico servicio"
            checked={layout.itemsTable.showUnitPrice ?? true}
            onChange={(v) => patchItemsTable({ showUnitPrice: v })}
          />
          <ToggleRow
            label="% de IVA por linea"
            description="El desglose de IVA siempre aparece en totales"
            checked={layout.itemsTable.showTaxColumn ?? true}
            onChange={(v) => patchItemsTable({ showTaxColumn: v })}
          />
          <ToggleRow
            label="Total por linea"
            checked={layout.itemsTable.showLineTotal ?? true}
            onChange={(v) => patchItemsTable({ showLineTotal: v })}
          />
        </div>
      </FieldGroup>

      <FieldGroup title="Totales">
        <div className="divide-y">
          <ToggleRow
            label="Desglose detallado de IVA"
            description="Separa los distintos tipos de IVA"
            checked={layout.totals.showTaxBreakdown}
            onChange={(v) => patchTotals({ showTaxBreakdown: v })}
          />
          <ToggleRow
            label="IRPF (retencion)"
            description="Solo si aplica en tus facturas"
            checked={layout.totals.showIrpf}
            onChange={(v) => patchTotals({ showIrpf: v })}
          />
        </div>
      </FieldGroup>
    </>
  );
}

// ──────────────────────────── Tab: Notas y pie ────────────────────────────

function ClosingTab({
  layout,
  onChange,
}: {
  layout: InvoiceLayout;
  onChange: (patch: Partial<InvoiceLayout>) => void;
}) {
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

  const notesVisible = layout.notes?.show !== false;

  return (
    <>
      <FieldGroup title="Notas">
        <div className="divide-y">
          <ToggleRow
            label="Mostrar seccion de notas"
            checked={notesVisible}
            onChange={(v) => patchNotes({ show: v })}
          />
          {notesVisible && (
            <ToggleRow
              label="Mostrar etiqueta Notas"
              checked={layout.notes?.showLabel !== false}
              onChange={(v) => patchNotes({ showLabel: v })}
            />
          )}
        </div>
        {notesVisible && (
          <div>
            <label htmlFor="default-notes" className="mb-1.5 block text-xs font-medium">
              Texto predeterminado
            </label>
            <textarea
              id="default-notes"
              value={layout.notes?.defaultText ?? ''}
              onChange={(e) => patchNotes({ defaultText: e.target.value || undefined })}
              placeholder="Ej: Gracias por su confianza..."
              rows={2}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Se usara en nuevas facturas por defecto
            </p>
          </div>
        )}
      </FieldGroup>

      <FieldGroup title="Pie de pagina">
        <div>
          <label htmlFor="footer-text" className="mb-1.5 block text-xs font-medium">
            Mensaje al final de la factura
          </label>
          <textarea
            id="footer-text"
            value={layout.footer.text}
            onChange={(e) => patchFooter({ text: e.target.value })}
            placeholder="Ej: Gracias por su confianza."
            rows={2}
            className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="divide-y">
          <ToggleRow
            label="Mostrar datos de pago en el pie"
            checked={layout.footer.showPaymentInfo}
            onChange={(v) => patchFooter({ showPaymentInfo: v })}
          />
          <ToggleRow
            label="Codigo QR VeriFactu"
            description="Permite verificar la factura ante la AEAT"
            checked={layout.footer.showVerifactuQr}
            onChange={(v) => patchFooter({ showVerifactuQr: v })}
            badge={
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                AEAT
              </span>
            }
          />
        </div>
      </FieldGroup>
    </>
  );
}

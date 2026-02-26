'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Save, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { InvoicePreview } from '@/components/invoice-preview/InvoicePreview';
import { useDefaultTemplate, useUpdateTemplate } from '@/hooks/use-invoice-templates';
import { useAuthStore } from '@/store/auth-store';
import {
  DEFAULT_INVOICE_LAYOUT,
  InvoiceLayout,
  Invoice,
  InvoiceStatus,
  Tenant,
} from '@easyfactura/shared-types';
import { invoiceTemplateApi } from '@/lib/api/invoice-template-api';

// ==================== EXAMPLE DATA FOR PREVIEW ====================

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
    irpfPercent: null,
    irpfTotal: null,
    total: 1210,
    paymentMethod: null,
    paymentDetails: null,
    notes: 'Gracias por su confianza.',
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
        sortOrder: 2,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

// ==================== SETTINGS PANEL ====================

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

function ColorField({ label, value, onChange }: ColorFieldProps) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 cursor-pointer rounded border"
      />
      <Label className="text-sm">{label}</Label>
    </div>
  );
}

interface SettingsPanelProps {
  layout: InvoiceLayout;
  onChange: (patch: Partial<InvoiceLayout>) => void;
}

function SettingsPanel({ layout, onChange }: SettingsPanelProps) {
  function patchPage(patch: Partial<InvoiceLayout['page']>) {
    onChange({ page: { ...layout.page, ...patch } });
  }
  function patchTypography(patch: Partial<InvoiceLayout['typography']>) {
    onChange({ typography: { ...layout.typography, ...patch } });
  }
  function patchColors(patch: Partial<InvoiceLayout['colors']>) {
    onChange({ colors: { ...layout.colors, ...patch } });
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

  return (
    <div className="space-y-6 text-sm">
      {/* Página */}
      <section>
        <h3 className="font-semibold mb-3">Página</h3>
        <div className="grid grid-cols-2 gap-3">
          {(['marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const).map((key) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs capitalize">
                {key === 'marginTop'
                  ? 'Margen superior'
                  : key === 'marginRight'
                    ? 'Margen derecho'
                    : key === 'marginBottom'
                      ? 'Margen inferior'
                      : 'Margen izquierdo'}
              </Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={layout.page[key]}
                  onChange={(e) => patchPage({ [key]: Number(e.target.value) })}
                  className="h-8 text-xs"
                />
                <span className="text-xs text-muted-foreground">mm</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Separator />

      {/* Tipografía */}
      <section>
        <h3 className="font-semibold mb-3">Tipografía</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Fuente</Label>
            <Select
              value={layout.typography.fontFamily}
              onValueChange={(v) =>
                patchTypography({ fontFamily: v as InvoiceLayout['typography']['fontFamily'] })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="helvetica">Helvetica (moderna)</SelectItem>
                <SelectItem value="times-roman">Times Roman (clásica)</SelectItem>
                <SelectItem value="courier">Courier (monoespaciada)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Tamaño base</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={8}
                max={14}
                value={layout.typography.baseFontSize}
                onChange={(e) => patchTypography({ baseFontSize: Number(e.target.value) })}
                className="h-8 text-xs"
              />
              <span className="text-xs text-muted-foreground">pt</span>
            </div>
          </div>
        </div>
      </section>

      <Separator />

      {/* Colores */}
      <section>
        <h3 className="font-semibold mb-3">Colores</h3>
        <div className="space-y-2">
          <ColorField
            label="Color primario"
            value={layout.colors.primary}
            onChange={(v) => patchColors({ primary: v })}
          />
          <ColorField
            label="Fondo cabecera tabla"
            value={layout.colors.tableHeader}
            onChange={(v) => patchColors({ tableHeader: v })}
          />
          <ColorField
            label="Texto principal"
            value={layout.colors.textPrimary}
            onChange={(v) => patchColors({ textPrimary: v })}
          />
          <ColorField
            label="Texto secundario"
            value={layout.colors.textSecondary}
            onChange={(v) => patchColors({ textSecondary: v })}
          />
        </div>
      </section>

      <Separator />

      {/* Logo */}
      <section>
        <h3 className="font-semibold mb-3">Logo</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Mostrar logo</Label>
            <Switch
              checked={layout.logo.visible}
              onCheckedChange={(v) => patchLogo({ visible: v })}
            />
          </div>
          {layout.logo.visible && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Posición</Label>
                <Select
                  value={layout.logo.position}
                  onValueChange={(v) =>
                    patchLogo({ position: v as InvoiceLayout['logo']['position'] })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Izquierda</SelectItem>
                    <SelectItem value="top-center">Centro</SelectItem>
                    <SelectItem value="top-right">Derecha</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ancho</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={20}
                    max={80}
                    value={layout.logo.widthMm}
                    onChange={(e) => patchLogo({ widthMm: Number(e.target.value) })}
                    className="h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground">mm</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <Separator />

      {/* Cabecera */}
      <section>
        <h3 className="font-semibold mb-3">Cabecera</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Emisor en</Label>
            <Select
              value={layout.header.senderSide}
              onValueChange={(v) =>
                patchHeader({ senderSide: v as InvoiceLayout['header']['senderSide'] })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Izquierda</SelectItem>
                <SelectItem value="right">Derecha</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Mostrar teléfono</Label>
            <Switch
              checked={layout.header.showPhone}
              onCheckedChange={(v) => patchHeader({ showPhone: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Mostrar IBAN</Label>
            <Switch
              checked={layout.header.showIban}
              onCheckedChange={(v) => patchHeader({ showIban: v })}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Tabla de líneas */}
      <section>
        <h3 className="font-semibold mb-3">Tabla de líneas</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Estilo</Label>
            <Select
              value={layout.itemsTable.style}
              onValueChange={(v) =>
                patchItemsTable({ style: v as InvoiceLayout['itemsTable']['style'] })
              }
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Cuadrícula</SelectItem>
                <SelectItem value="lines">Líneas</SelectItem>
                <SelectItem value="minimal">Minimalista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Columna descuento</Label>
            <Switch
              checked={layout.itemsTable.showDiscount}
              onCheckedChange={(v) => patchItemsTable({ showDiscount: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Columna referencia</Label>
            <Switch
              checked={layout.itemsTable.showReference}
              onCheckedChange={(v) => patchItemsTable({ showReference: v })}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Totales */}
      <section>
        <h3 className="font-semibold mb-3">Totales</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Desglose IVA</Label>
            <Switch
              checked={layout.totals.showTaxBreakdown}
              onCheckedChange={(v) => patchTotals({ showTaxBreakdown: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Mostrar IRPF</Label>
            <Switch
              checked={layout.totals.showIrpf}
              onCheckedChange={(v) => patchTotals({ showIrpf: v })}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* Pie de página */}
      <section>
        <h3 className="font-semibold mb-3">Pie de página</h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Texto del pie</Label>
            <Input
              value={layout.footer.text}
              onChange={(e) => patchFooter({ text: e.target.value })}
              placeholder="Texto personalizado..."
              className="h-8 text-xs"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Info de pago</Label>
            <Switch
              checked={layout.footer.showPaymentInfo}
              onCheckedChange={(v) => patchFooter({ showPaymentInfo: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">QR VeriFactu</Label>
            <Switch
              checked={layout.footer.showVerifactuQr}
              onCheckedChange={(v) => patchFooter({ showVerifactuQr: v })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

// ==================== PAGE ====================

export default function PlantillaPage() {
  const { data: template, isLoading } = useDefaultTemplate();
  const updateTemplate = useUpdateTemplate();
  const currentTenant = useAuthStore((s) => s.currentTenant);

  const [localLayout, setLocalLayout] = useState<InvoiceLayout>(DEFAULT_INVOICE_LAYOUT);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (template) {
      setLocalLayout(template.layout as InvoiceLayout);
      setHasChanges(false);
    }
  }, [template]);

  const handleChange = useCallback((patch: Partial<InvoiceLayout>) => {
    setLocalLayout((prev) => ({ ...prev, ...patch }));
    setHasChanges(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!template) return;
    updateTemplate.mutate(
      { id: template.id, data: { layout: localLayout } },
      {
        onSuccess: () => setHasChanges(false),
      },
    );
  }, [template, localLayout, updateTemplate]);

  const handlePreviewPdf = useCallback(() => {
    if (!template) return;
    const token = document.cookie.match(/accessToken=([^;]+)/)?.[1] ?? '';
    window.open(invoiceTemplateApi.getPreviewUrl(template.id), '_blank');
  }, [template]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const exampleInvoice = buildExampleInvoice(currentTenant?.id ?? 'preview');
  const previewTenant: Tenant = currentTenant ?? {
    id: 'preview',
    businessName: 'Mi Empresa S.L.',
    legalName: null,
    nif: 'B12345678',
    address: 'Calle Mayor 1',
    postalCode: '28001',
    city: 'Madrid',
    province: 'Madrid',
    country: 'ES',
    phone: '+34 912 000 000',
    email: 'info@miempresa.com',
    logoUrl: null,
    iban: null,
    bankAccountHolder: null,
    certificateUrl: null,
    certificateExpiry: null,
    setupCompleted: true,
    accountType: 'INDIVIDUAL' as never,
    plan: 'FREE' as never,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Plantilla de facturas</h2>
          <p className="text-sm text-muted-foreground">
            Personaliza el aspecto de tus facturas en PDF
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviewPdf} disabled={!template}>
            <Eye className="h-4 w-4 mr-2" />
            Ver PDF
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!hasChanges || updateTemplate.isPending}>
            {updateTemplate.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Guardar cambios
          </Button>
        </div>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-[320px_1fr] gap-6 items-start">
        {/* Settings panel */}
        <div className="rounded-lg border bg-card p-4 overflow-y-auto max-h-[calc(100vh-200px)] sticky top-4">
          <SettingsPanel layout={localLayout} onChange={handleChange} />
        </div>

        {/* A4 preview */}
        <div className="overflow-auto">
          <div className="flex justify-center">
            <div
              style={{
                transform: 'scale(0.75)',
                transformOrigin: 'top center',
                marginBottom: '-210px',
              }}
            >
              <InvoicePreview
                invoice={exampleInvoice}
                template={previewTemplate as never}
                tenant={previewTenant}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

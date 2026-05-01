'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DEFAULT_INVOICE_LAYOUT, InvoiceLayout, Tenant } from '@easyfactura/shared-types';
import { LiveInvoicePreview, PaymentDetails } from '@/components/facturas/LiveInvoicePreview';
import { useDefaultTemplate, useUpdateTemplate } from '@/hooks/use-invoice-templates';
import { useInvoiceDefaults, useUpdateInvoiceDefaults } from '@/hooks/use-invoice-defaults';
import { useTenant } from '@/hooks/use-tenant';
import { useAuthStore } from '@/store/auth-store';
import { resolveUrl } from '@/lib/utils';
import { buildExampleInvoice } from './_lib/preview-data';
import { EditorHeader } from './_components/editor-header';
import { SettingsTabs, type SettingsTab } from './_components/settings-tabs';
import { useAutosave } from './_components/use-autosave';

export default function PlantillaPage() {
  const { data: template, isLoading } = useDefaultTemplate();
  const updateTemplate = useUpdateTemplate();
  const updateInvoiceDefaults = useUpdateInvoiceDefaults();
  const { data: invoiceDefaults } = useInvoiceDefaults();
  const { data: tenantData } = useTenant();
  const currentTenant = useAuthStore((s) => s.currentTenant);

  const [layout, setLayout] = useState<InvoiceLayout>(DEFAULT_INVOICE_LAYOUT);
  const [savedLayout, setSavedLayout] = useState<InvoiceLayout>(DEFAULT_INVOICE_LAYOUT);
  const [activeTab, setActiveTab] = useState<SettingsTab>('style');

  // Hydrate from server once template arrives
  useEffect(() => {
    if (!template) return;
    const next = template.layout as InvoiceLayout;
    setLayout(next);
    setSavedLayout(next);
  }, [template]);

  // Persist + sync default notes on the side
  const persist = useCallback(
    async (next: InvoiceLayout) => {
      if (!template) return;
      await updateTemplate.mutateAsync({ id: template.id, data: { layout: next } });
      setSavedLayout(next);

      const newNotes = next.notes?.defaultText ?? null;
      const currentNotes = invoiceDefaults?.notes ?? null;
      if (newNotes !== currentNotes) {
        updateInvoiceDefaults.mutate({ notes: newNotes });
      }
    },
    [template, updateTemplate, updateInvoiceDefaults, invoiceDefaults],
  );

  const { status, hasPendingChanges } = useAutosave({
    value: layout,
    savedValue: savedLayout,
    onSave: persist,
    enabled: !!template,
  });

  const handleChange = useCallback((patch: Partial<InvoiceLayout>) => {
    setLayout((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleApplyTemplate = useCallback((tplLayout: Partial<InvoiceLayout>) => {
    setLayout((prev) => ({ ...prev, ...tplLayout }));
  }, []);

  const handleReset = useCallback(() => {
    setLayout(savedLayout);
  }, [savedLayout]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Cargando" />
      </div>
    );
  }

  // ── Build preview models ─────────────────────────────────────────────────
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
    logoUrl,
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

  const exampleInvoice = {
    ...buildExampleInvoice(currentTenant?.id ?? 'preview'),
    notes: layout.notes?.defaultText || invoiceDefaults?.notes || 'Gracias por su confianza.',
  };

  const previewTemplate = template
    ? { ...template, layout }
    : {
        id: 'preview',
        tenantId: 'preview',
        name: 'Plantilla predeterminada',
        isDefault: true,
        layout,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

  // ── Layout ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-full flex-col bg-muted/20">
      <EditorHeader status={status} hasPendingChanges={hasPendingChanges} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Settings panel (fixed width, scrolls internally) */}
        <aside className="flex w-[340px] shrink-0 flex-col border-r bg-background">
          <SettingsTabs
            layout={layout}
            onChange={handleChange}
            onApplyTemplate={handleApplyTemplate}
            onReset={handleReset}
            logoUrl={logoUrl}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </aside>

        {/* Live preview (fills remaining space, scrolls internally) */}
        <main className="flex min-w-0 flex-1 justify-center overflow-y-auto p-6">
          <div className="w-full max-w-3xl">
            <LiveInvoicePreview
              template={previewTemplate}
              tenant={previewTenant}
              invoice={exampleInvoice}
              paymentDetails={previewPaymentDetails}
              activeFieldSection={null}
              onSectionClick={() => {
                /* noop — fieldIds in LiveInvoicePreview map to invoice-form fields,
                   not template visual sections, so click-to-edit doesn't apply here */
              }}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

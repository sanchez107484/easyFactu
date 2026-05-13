'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { UnsavedChangesModal } from './_components/unsaved-changes-modal';

export default function PlantillaPage() {
  const router = useRouter();
  const { data: template, isLoading } = useDefaultTemplate();
  const updateTemplate = useUpdateTemplate();
  const updateInvoiceDefaults = useUpdateInvoiceDefaults();
  const { data: invoiceDefaults } = useInvoiceDefaults();
  const { data: tenantData } = useTenant();
  const currentTenant = useAuthStore((s) => s.currentTenant);

  const [layout, setLayout] = useState<InvoiceLayout>(DEFAULT_INVOICE_LAYOUT);
  const [savedLayout, setSavedLayout] = useState<InvoiceLayout>(DEFAULT_INVOICE_LAYOUT);
  const [activeTab, setActiveTab] = useState<SettingsTab>('style');
  const [activePreviewSection, setActivePreviewSection] = useState<string | null>(null);

  // Manual save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [savedOnce, setSavedOnce] = useState(false);

  // Unsaved-changes guard
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const pendingNavRef = useRef<string | null>(null);
  // When true, the next navigation is explicitly approved — skip the guard
  const allowNavRef = useRef(false);

  // Hydrate from server once template arrives
  useEffect(() => {
    if (!template) return;
    const next = template.layout as InvoiceLayout;
    setLayout(next);
    setSavedLayout(next);
  }, [template]);

  const hasPendingChanges = JSON.stringify(layout) !== JSON.stringify(savedLayout);

  // Block browser-level navigation (refresh / close tab)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!hasPendingChanges) return;
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasPendingChanges]);

  // Intercept ALL Next.js client-side navigations (sidebar links, breadcrumbs, etc.)
  // Uses capture phase so we see the click before Next.js's <Link> handler.
  useEffect(() => {
    if (!hasPendingChanges) return;

    const handleLinkClick = (e: MouseEvent) => {
      if (allowNavRef.current) return;

      const anchor = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute('href') ?? '';
      // Ignore hash-only, mailto, tel and external links
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:'))
        return;
      if (anchor.target === '_blank') return;

      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname) return;
      } catch {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      pendingNavRef.current = href;
      setShowLeaveModal(true);
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [hasPendingChanges]);

  // ── Persist ──────────────────────────────────────────────────────────────
  const persist = useCallback(
    async (next: InvoiceLayout) => {
      if (!template) return;
      setIsSaving(true);
      setSaveError(false);
      try {
        await updateTemplate.mutateAsync({ id: template.id, data: { layout: next } });
        setSavedLayout(next);
        setSavedOnce(true);

        const newNotes = next.notes?.defaultText ?? null;
        const currentNotes = invoiceDefaults?.notes ?? null;
        if (newNotes !== currentNotes) {
          updateInvoiceDefaults.mutate({ notes: newNotes });
        }
      } catch {
        setSaveError(true);
      } finally {
        setIsSaving(false);
      }
    },
    [template, updateTemplate, updateInvoiceDefaults, invoiceDefaults],
  );

  const handleSave = useCallback(() => {
    persist(layout);
  }, [persist, layout]);

  // ── Navigation guard ─────────────────────────────────────────────────────
  const handleBack = useCallback(() => {
    if (hasPendingChanges) {
      pendingNavRef.current = '/dashboard/ajustes';
      setShowLeaveModal(true);
    } else {
      router.push('/dashboard/ajustes');
    }
  }, [hasPendingChanges, router]);

  const handleLeaveConfirm = useCallback(() => {
    allowNavRef.current = true;
    setShowLeaveModal(false);
    const dest = pendingNavRef.current;
    pendingNavRef.current = null;
    if (dest) router.push(dest);
  }, [router]);

  const handleLeaveSaveAndGo = useCallback(async () => {
    await persist(layout);
    // After saving, hasPendingChanges becomes false so the interceptor is already
    // removed — no need to set allowNavRef here.
    setShowLeaveModal(false);
    const dest = pendingNavRef.current;
    pendingNavRef.current = null;
    if (dest) router.push(dest);
  }, [persist, layout, router]);

  // ── Other handlers ───────────────────────────────────────────────────────
  const handleChange = useCallback((patch: Partial<InvoiceLayout>) => {
    setLayout((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleApplyTemplate = useCallback((tplLayout: Partial<InvoiceLayout>) => {
    setLayout((prev) => ({ ...prev, ...tplLayout }));
  }, []);

  const handleReset = useCallback(() => {
    setLayout(savedLayout);
  }, [savedLayout]);

  const SECTION_TAB_MAP: Record<string, SettingsTab> = {
    customerId: 'sender',
    issueDate: 'style',
    'lines-section': 'details',
    discountPercent: 'details',
    paymentMethod: 'closing',
    notes: 'closing',
    footer: 'closing',
  };

  const handlePreviewSectionClick = useCallback(
    (fieldId: string) => {
      setActivePreviewSection(fieldId);
      const tab = SECTION_TAB_MAP[fieldId];
      if (tab) setActiveTab(tab);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
    taxRegime: currentTenant?.taxRegime ?? ('GENERAL' as never),
    reaypRate: currentTenant?.reaypRate ?? null,
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
    <>
      <div className="flex h-full flex-col bg-muted/20">
        <EditorHeader
          hasPendingChanges={hasPendingChanges}
          isSaving={isSaving}
          saveError={saveError}
          savedOnce={savedOnce}
          onBack={handleBack}
          onSave={handleSave}
        />

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
                activeFieldSection={activePreviewSection}
                onSectionClick={handlePreviewSectionClick}
              />
            </div>
          </main>
        </div>
      </div>

      <UnsavedChangesModal
        open={showLeaveModal}
        onOpenChange={setShowLeaveModal}
        onKeepEditing={() => setShowLeaveModal(false)}
        onLeaveWithoutSaving={handleLeaveConfirm}
        onSaveAndLeave={handleLeaveSaveAndGo}
        isSaving={isSaving}
      />
    </>
  );
}

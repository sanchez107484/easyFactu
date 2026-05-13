'use client';

import { useEffect, useRef } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Upload, Building2, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import {
  useTenant,
  useUpdateTenant,
  useUploadTenantLogo,
  useDeleteTenantLogo,
} from '@/hooks/use-tenant';
import { PROVINCES } from '@easyfactura/shared-constants';
import { AccountType, PaymentMethod, TaxRegime } from '@easyfactura/shared-types';
import { BancarioSection } from '@/components/ajustes/BancarioSection';
import { resolveUrl } from '@/lib/utils';
import { useInvoiceDefaults, useUpdateInvoiceDefaults } from '@/hooks/use-invoice-defaults';

// ==================== SCHEMAS ====================

const empresaSchema = z
  .object({
    businessName: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
    legalName: z.string().max(100).optional().or(z.literal('')),
    nif: z.string().min(9, 'NIF/CIF inválido').max(9, 'NIF/CIF inválido'),
    email: z.string().email('Email no válido'),
    address: z.string().min(1, 'La dirección es obligatoria').max(200),
    postalCode: z.string().regex(/^\d{5}$/, 'Código postal inválido (5 dígitos)'),
    city: z.string().min(1, 'La ciudad es obligatoria').max(100),
    province: z.string().min(1, 'Selecciona una provincia'),
    phone: z.string().max(20).optional().or(z.literal('')),
    taxRegime: z.nativeEnum(TaxRegime).default(TaxRegime.GENERAL),
    reaypRate: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
      z.number().min(0).max(100).optional(),
    ),
  })
  .refine(
    (data) =>
      data.taxRegime !== TaxRegime.REAGYP ||
      (data.reaypRate !== undefined && data.reaypRate > 0),
    { message: 'Introduce la tasa de compensación agraria (12,0 o 10,5)', path: ['reaypRate'] },
  );

type EmpresaFormData = z.infer<typeof empresaSchema>;

// ==================== MAIN PAGE ====================

export default function AjustesEmpresaPage() {
  const { data: tenant, isLoading } = useTenant();
  const isAutonomo =
    !tenant?.accountType ||
    tenant.accountType === AccountType.INDIVIDUAL ||
    tenant.accountType === AccountType.COLLABORATIVE;

  const updateTenant = useUpdateTenant();
  const uploadLogo = useUploadTenantLogo();
  const deleteLogo = useDeleteTenantLogo();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { data: invoiceDefaults } = useInvoiceDefaults();
  const updateInvoiceDefaults = useUpdateInvoiceDefaults();

  const empresaForm = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      businessName: '',
      legalName: '',
      nif: '',
      email: '',
      address: '',
      postalCode: '',
      city: '',
      province: '',
      phone: '',
      taxRegime: TaxRegime.GENERAL,
      reaypRate: undefined,
    },
  });

  const watchedTaxRegime = useWatch({ control: empresaForm.control, name: 'taxRegime' });
  const isReagyp = watchedTaxRegime === TaxRegime.REAGYP;

  useEffect(() => {
    if (tenant) {
      empresaForm.reset({
        businessName: tenant.businessName ?? '',
        legalName: tenant.legalName ?? '',
        nif: tenant.nif ?? '',
        email: tenant.email ?? '',
        address: tenant.address ?? '',
        postalCode: tenant.postalCode ?? '',
        city: tenant.city ?? '',
        province: tenant.province ?? '',
        phone: tenant.phone ?? '',
        taxRegime: tenant.taxRegime ?? TaxRegime.GENERAL,
        reaypRate: tenant.reaypRate != null ? Number(tenant.reaypRate) : undefined,
      });
    }
  }, [tenant]);

  function onSubmitEmpresa(data: EmpresaFormData) {
    updateTenant.mutate({
      ...data,
      // Explicitly null so the backend clears the DB column when switching to GENERAL
      reaypRate: data.taxRegime === TaxRegime.REAGYP ? data.reaypRate : null,
    });
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadLogo.mutate(file);
    e.target.value = '';
  }

  // ── Logo URL resuelta ─────────────────────────────────────────────────────
  const logoUrl = resolveUrl(tenant?.logoUrl);

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2, 3, 4, 5, 6].map((j) => (
                <Skeleton key={j} className="h-10" />
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Layout ────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
      {/* ── Columna izquierda: Datos Profesionales ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {isAutonomo ? 'Tus datos profesionales' : 'Datos de la empresa'}
          </CardTitle>
          <CardDescription>Información fiscal que aparecerá en tus facturas</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={empresaForm.handleSubmit(onSubmitEmpresa)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="businessName">
                  {isAutonomo ? 'Nombre o marca profesional *' : 'Razón social *'}
                </Label>
                <Input id="businessName" {...empresaForm.register('businessName')} />
                {empresaForm.formState.errors.businessName && (
                  <p className="mt-1 text-sm text-destructive">
                    {empresaForm.formState.errors.businessName.message}
                  </p>
                )}
              </div>

              {!isAutonomo && (
                <div className="md:col-span-2">
                  <Label htmlFor="legalName">
                    Nombre comercial (si difiere de la razón social)
                  </Label>
                  <Input id="legalName" {...empresaForm.register('legalName')} />
                </div>
              )}

              <div>
                <Label htmlFor="nif">{isAutonomo ? 'NIF (DNI / NIE) *' : 'CIF / NIF *'}</Label>
                <Input id="nif" {...empresaForm.register('nif')} />
                {empresaForm.formState.errors.nif && (
                  <p className="mt-1 text-sm text-destructive">
                    {empresaForm.formState.errors.nif.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email de contacto *</Label>
                <Input id="email" type="email" {...empresaForm.register('email')} />
                {empresaForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-destructive">
                    {empresaForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Dirección fiscal *</Label>
                <Input id="address" {...empresaForm.register('address')} />
                {empresaForm.formState.errors.address && (
                  <p className="mt-1 text-sm text-destructive">
                    {empresaForm.formState.errors.address.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="postalCode">Código Postal *</Label>
                <Input id="postalCode" {...empresaForm.register('postalCode')} />
                {empresaForm.formState.errors.postalCode && (
                  <p className="mt-1 text-sm text-destructive">
                    {empresaForm.formState.errors.postalCode.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="city">Ciudad *</Label>
                <Input id="city" {...empresaForm.register('city')} />
                {empresaForm.formState.errors.city && (
                  <p className="mt-1 text-sm text-destructive">
                    {empresaForm.formState.errors.city.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="province">Provincia *</Label>
                <Controller
                  control={empresaForm.control}
                  name="province"
                  render={({ field }) => (
                    <Select key={field.value} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="province">
                        <SelectValue placeholder="Selecciona provincia" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map((p) => (
                          <SelectItem key={p.code} value={p.name}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {empresaForm.formState.errors.province && (
                  <p className="mt-1 text-sm text-destructive">
                    {empresaForm.formState.errors.province.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" {...empresaForm.register('phone')} />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="taxRegime">Régimen fiscal</Label>
                <Controller
                  control={empresaForm.control}
                  name="taxRegime"
                  render={({ field }) => (
                    <Select key={field.value} value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="taxRegime" className="mt-1">
                        <SelectValue placeholder="Selecciona régimen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TaxRegime.GENERAL}>General (IVA estándar)</SelectItem>
                        <SelectItem value={TaxRegime.REAGYP}>
                          REAGYP — Compensación Agraria
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Arts. 124–134 LIVA. El REAGYP aplica compensación agraria en lugar de IVA.
                </p>
              </div>

              {isReagyp && (
                <div className="md:col-span-2">
                  <Label htmlFor="reaypRate">Tasa de compensación (%)</Label>
                  <div className="mt-1 flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => empresaForm.setValue('reaypRate', 12.0)}
                    >
                      12,0 % — Agricultura / Silvicultura
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => empresaForm.setValue('reaypRate', 10.5)}
                    >
                      10,5 % — Ganadería / Pesca
                    </Button>
                  </div>
                  <Input
                    id="reaypRate"
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    className="mt-2"
                    {...empresaForm.register('reaypRate', { valueAsNumber: true })}
                  />
                  {empresaForm.formState.errors.reaypRate && (
                    <p className="mt-1 text-sm text-destructive">
                      {empresaForm.formState.errors.reaypRate.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={updateTenant.isPending} className="gap-2">
                {updateTenant.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar cambios
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Columna derecha: Logo + Datos Bancarios ── */}
      <div className="space-y-6">
        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo de la Empresa
            </CardTitle>
            <CardDescription>Aparecerá en la cabecera de tus facturas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-lg border-2 border-dashed bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo empresa" className="h-full w-full object-contain" />
                ) : (
                  <ImageIcon className="h-7 w-7 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  JPG, PNG o SVG. Máx. 2MB
                </p>
                <div className="flex gap-2 flex-wrap">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.svg"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={uploadLogo.isPending}
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {uploadLogo.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    {tenant?.logoUrl ? 'Cambiar' : 'Subir logo'}
                  </Button>
                  {tenant?.logoUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      disabled={deleteLogo.isPending}
                      onClick={() => deleteLogo.mutate()}
                    >
                      {deleteLogo.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Datos Bancarios */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Bancarios</CardTitle>
            <CardDescription>
              Cuenta bancaria que aparecerá en las facturas para que te paguen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BancarioSection
              iban={tenant?.iban}
              bankAccountHolder={tenant?.bankAccountHolder}
              bic={tenant?.bic}
              isPending={updateTenant.isPending}
              onSave={(data) => {
                updateTenant.mutate(data);
                if (invoiceDefaults?.paymentMethod === PaymentMethod.BANK_TRANSFER) {
                  updateInvoiceDefaults.mutate({
                    paymentMethod: PaymentMethod.BANK_TRANSFER,
                    paymentDetails: {
                      ...(invoiceDefaults.paymentDetails as object ?? {}),
                      iban: data.iban?.replace(/\s/g, '') || undefined,
                      accountHolder: data.bankAccountHolder || undefined,
                      bic: data.bic?.trim() || undefined,
                    },
                  });
                }
              }}
            />
          </CardContent>
        </Card>


      </div>
    </div>
  );
}

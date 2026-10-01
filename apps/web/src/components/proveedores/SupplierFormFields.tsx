'use client';

import { UseFormReturn } from 'react-hook-form';
import { Building2, Globe, Truck } from 'lucide-react';
import { SupplierFormData } from '@/lib/validators/supplier.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PROVINCES } from '@easyfactura/shared-constants';
import { cn } from '@/lib/utils';
import { SectionLabel } from '@/components/common/section-label';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

interface SupplierFormFieldsProps {
  form: UseFormReturn<SupplierFormData>;
  isSubmitting?: boolean;
}

export function SupplierFormFields({ form, isSubmitting }: SupplierFormFieldsProps) {
  return (
    <div className="space-y-5">
      {/* ── FILA 1: Identificación ── */}
      <div className="rounded-xl border bg-card p-5">
        <SectionLabel icon={Building2}>Identificación</SectionLabel>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sup-name">
                Nombre comercial <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sup-name"
                {...form.register('name')}
                placeholder="Ej: TecnoSuministros S.L."
                disabled={isSubmitting}
              />
              <FieldError message={form.formState.errors.name?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sup-legalName">
                Razón social{' '}
                <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
              </Label>
              <Input
                id="sup-legalName"
                {...form.register('legalName')}
                placeholder="Nombre legal completo de la empresa"
                disabled={isSubmitting}
              />
              <FieldError message={form.formState.errors.legalName?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sup-taxId">
                NIF/CIF{' '}
                <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
              </Label>
              <Input
                id="sup-taxId"
                {...form.register('taxId')}
                placeholder="Ej: B12345678"
                className="uppercase font-mono tracking-wider"
                disabled={isSubmitting}
              />
              <FieldError message={form.formState.errors.taxId?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sup-country">País</Label>
              <Select
                value={form.watch('country') || 'ES'}
                onValueChange={(v) => form.setValue('country', v)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="sup-country">
                  <SelectValue placeholder="Selecciona país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ES">España</SelectItem>
                  <SelectItem value="FR">Francia</SelectItem>
                  <SelectItem value="PT">Portugal</SelectItem>
                  <SelectItem value="DE">Alemania</SelectItem>
                  <SelectItem value="IT">Italia</SelectItem>
                  <SelectItem value="GB">Reino Unido</SelectItem>
                  <SelectItem value="US">Estados Unidos</SelectItem>
                  <SelectItem value="OTHER">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILA 2: Contacto ── */}
      <div className="rounded-xl border bg-card p-5">
        <SectionLabel icon={Truck}>Información de contacto</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sup-email">
              Email <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
            </Label>
            <Input
              id="sup-email"
              type="email"
              {...form.register('email')}
              placeholder="contacto@empresa.com"
              disabled={isSubmitting}
            />
            <FieldError message={form.formState.errors.email?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sup-phone">
              Teléfono <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
            </Label>
            <Input
              id="sup-phone"
              {...form.register('phone')}
              placeholder="+34 600 000 000"
              disabled={isSubmitting}
            />
            <FieldError message={form.formState.errors.phone?.message} />
          </div>
        </div>
      </div>

      {/* ── FILA 3: Dirección ── */}
      <div className="rounded-xl border bg-card p-5">
        <SectionLabel icon={Globe}>Dirección</SectionLabel>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 space-y-2">
            <Label htmlFor="sup-address">
              Calle y número <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
            </Label>
            <Input
              id="sup-address"
              {...form.register('address')}
              placeholder="Calle Principal, 123, 2°A"
              disabled={isSubmitting}
            />
          </div>

          <div className="col-span-4 space-y-2">
            <Label htmlFor="sup-postalCode">
              Código postal <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
            </Label>
            <Input
              id="sup-postalCode"
              {...form.register('postalCode')}
              placeholder="28001"
              disabled={isSubmitting}
            />
            <FieldError message={form.formState.errors.postalCode?.message} />
          </div>

          <div className="col-span-4 space-y-2">
            <Label htmlFor="sup-city">
              Ciudad <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
            </Label>
            <Input
              id="sup-city"
              {...form.register('city')}
              placeholder="Madrid"
              disabled={isSubmitting}
            />
          </div>

          <div className="col-span-4 space-y-2">
            <Label htmlFor="sup-province">
              Provincia <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
            </Label>
            <Select
              value={form.watch('province') || ''}
              onValueChange={(v) => form.setValue('province', v)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="sup-province">
                <SelectValue placeholder="Selecciona provincia" />
              </SelectTrigger>
              <SelectContent>
                {PROVINCES.map((province) => (
                  <SelectItem key={province.code} value={province.name}>
                    {province.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── FILA 4: Notas ── */}
      <div className="rounded-xl border bg-card p-5">
        <SectionLabel>
          Notas internas{' '}
          <span className="text-muted-foreground text-xs font-normal normal-case tracking-normal">
            (opcional)
          </span>
        </SectionLabel>
        <Textarea
          {...form.register('notes')}
          placeholder="Información adicional sobre este proveedor..."
          rows={3}
          disabled={isSubmitting}
          className="resize-none"
        />
        <FieldError message={form.formState.errors.notes?.message} />
      </div>
    </div>
  );
}

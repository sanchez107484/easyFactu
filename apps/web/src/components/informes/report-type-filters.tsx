'use client';

import { PaymentStatus, ProductType, ReportType } from '@easyfactura/shared-types';
import { useCustomers } from '@/hooks/use-customers';
import { useProducts } from '@/hooks/use-products';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useExpenseCategories } from '@/hooks/use-expense-categories';
import { useSeriesCodes } from '@/hooks/use-invoice-series';
import type { ReportFilterFields } from '@/hooks/use-report-form';
import { PAYMENT_STATUS_CONFIG } from '@/components/common/payment-status-badge';
import { ReportMultiSelect } from './report-multi-select';
import { PRODUCT_TYPE_LABELS } from './report-type-config';

/** Catalog lists are capped by the API at 500; the combobox searches within them. */
const CATALOG_LIMIT = 500;

const PAYMENT_STATUS_OPTIONS = Object.values(PaymentStatus).map((status) => ({
  value: status,
  label: PAYMENT_STATUS_CONFIG[status].label,
}));

const PRODUCT_TYPE_OPTIONS = Object.values(ProductType).map((type) => ({
  value: type,
  label: PRODUCT_TYPE_LABELS[type],
}));

interface ReportTypeFiltersProps {
  type: ReportType;
  filters: ReportFilterFields;
  onChange: (filters: ReportFilterFields) => void;
}

/** Renders only the optional filters that apply to the selected report type. */
export function ReportTypeFilters({ type, filters, onChange }: ReportTypeFiltersProps) {
  if (type === ReportType.SALES) return <SalesFilters filters={filters} onChange={onChange} />;
  if (type === ReportType.EXPENSES) return <ExpenseFilters filters={filters} onChange={onChange} />;
  return null;
}

interface FiltersProps {
  filters: ReportFilterFields;
  onChange: (filters: ReportFilterFields) => void;
}

function SalesFilters({ filters, onChange }: FiltersProps) {
  const customers = useCustomers({ limit: CATALOG_LIMIT });
  const products = useProducts({ limit: CATALOG_LIMIT });
  const seriesCodes = useSeriesCodes();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ReportMultiSelect
        id="report-customers"
        label="Clientes"
        allLabel="Todos los clientes"
        searchPlaceholder="Buscar cliente..."
        options={(customers.data?.data ?? []).map((c) => ({
          value: c.id,
          label: c.name,
          hint: c.nif,
        }))}
        values={filters.customerIds ?? []}
        onChange={(customerIds) => onChange({ ...filters, customerIds })}
        isLoading={customers.isLoading}
      />
      <ReportMultiSelect
        id="report-products"
        label="Artículos"
        allLabel="Todos los artículos"
        searchPlaceholder="Buscar artículo..."
        options={(products.data?.data ?? []).map((p) => ({
          value: p.id,
          label: p.name,
          hint: p.reference,
        }))}
        values={filters.productIds ?? []}
        onChange={(productIds) => onChange({ ...filters, productIds })}
        isLoading={products.isLoading}
      />
      <ReportMultiSelect
        id="report-product-type"
        label="Tipo de artículo"
        allLabel="Productos y servicios"
        options={PRODUCT_TYPE_OPTIONS}
        values={filters.productType ? [filters.productType] : []}
        onChange={(values) => onChange({ ...filters, productType: lastProductType(values) })}
      />
      <ReportMultiSelect
        id="report-series"
        label="Series"
        allLabel="Todas las series"
        options={(seriesCodes.data ?? []).map((code) => ({ value: code, label: code }))}
        values={filters.seriesCodes ?? []}
        onChange={(codes) => onChange({ ...filters, seriesCodes: codes })}
        isLoading={seriesCodes.isLoading}
      />
      <ReportMultiSelect
        id="report-payment-status"
        label="Estado de cobro"
        allLabel="Todos los estados"
        options={PAYMENT_STATUS_OPTIONS}
        values={filters.paymentStatuses ?? []}
        onChange={(values) => onChange({ ...filters, paymentStatuses: toPaymentStatuses(values) })}
      />
    </div>
  );
}

function ExpenseFilters({ filters, onChange }: FiltersProps) {
  const categories = useExpenseCategories();
  const suppliers = useSuppliers({ limit: CATALOG_LIMIT });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <ReportMultiSelect
        id="report-categories"
        label="Categorías"
        allLabel="Todas las categorías"
        searchPlaceholder="Buscar categoría..."
        options={(categories.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
        values={filters.categoryIds ?? []}
        onChange={(categoryIds) => onChange({ ...filters, categoryIds })}
        isLoading={categories.isLoading}
      />
      <ReportMultiSelect
        id="report-suppliers"
        label="Proveedores"
        allLabel="Todos los proveedores"
        searchPlaceholder="Buscar proveedor..."
        options={(suppliers.data?.data ?? []).map((s) => ({
          value: s.id,
          label: s.name,
          hint: s.taxId,
        }))}
        values={filters.supplierIds ?? []}
        onChange={(supplierIds) => onChange({ ...filters, supplierIds })}
        isLoading={suppliers.isLoading}
      />
    </div>
  );
}

/** Product type is single-valued: the last picked option wins. */
function lastProductType(values: string[]): ProductType | undefined {
  const picked = values[values.length - 1];
  return Object.values(ProductType).find((type) => type === picked);
}

function toPaymentStatuses(values: string[]): PaymentStatus[] {
  return Object.values(PaymentStatus).filter((status) => values.includes(status));
}

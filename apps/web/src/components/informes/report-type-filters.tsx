'use client';

import { PaymentMethod, PaymentStatus, ProductType, ReportType } from '@easyfactura/shared-types';
import { PAYMENT_METHOD_LABELS } from '@easyfactura/shared-constants';
import { useCustomers } from '@/hooks/use-customers';
import { useProducts } from '@/hooks/use-products';
import { useSuppliers } from '@/hooks/use-suppliers';
import { useExpenseCategories } from '@/hooks/use-expense-categories';
import { useSeriesCodes } from '@/hooks/use-invoice-series';
import type { ReportFilterFields } from '@/lib/report-draft';
import { PRODUCT_TYPE_LABELS } from '@/lib/report-config';
import { PAYMENT_STATUS_CONFIG } from '@/components/common/payment-status-badge';
import { ReportMultiSelect } from './report-multi-select';

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

const PAYMENT_METHOD_OPTIONS = Object.values(PaymentMethod).map((method) => ({
  value: method,
  label: PAYMENT_METHOD_LABELS[method],
}));

type FiltersChange = (filters: ReportFilterFields, labels?: Record<string, string>) => void;

interface FiltersProps {
  filters: ReportFilterFields;
  onChange: FiltersChange;
}

interface ReportTypeFiltersProps extends FiltersProps {
  type: ReportType;
}

/** Renders only the optional filters that apply to the selected report type. */
export function ReportTypeFilters({ type, filters, onChange }: ReportTypeFiltersProps) {
  switch (type) {
    case ReportType.SALES:
      return (
        <FilterGrid>
          <CustomersFilter filters={filters} onChange={onChange} />
          <ProductsFilter filters={filters} onChange={onChange} />
          <ReportMultiSelect
            id="report-product-type"
            label="Tipo de artículo"
            allLabel="Productos y servicios"
            options={PRODUCT_TYPE_OPTIONS}
            values={filters.productType ? [filters.productType] : []}
            onChange={(values) =>
              onChange({ ...filters, productType: lastOf(Object.values(ProductType), values) })
            }
          />
          <SeriesFilter filters={filters} onChange={onChange} />
          <ReportMultiSelect
            id="report-payment-status"
            label="Estado de cobro"
            allLabel="Todos los estados"
            options={PAYMENT_STATUS_OPTIONS}
            values={filters.paymentStatuses ?? []}
            onChange={(values) =>
              onChange({
                ...filters,
                paymentStatuses: pickAll(Object.values(PaymentStatus), values),
              })
            }
          />
        </FilterGrid>
      );
    case ReportType.EXPENSES:
      return (
        <FilterGrid>
          <CategoriesFilter filters={filters} onChange={onChange} />
          <SuppliersFilter filters={filters} onChange={onChange} />
        </FilterGrid>
      );
    case ReportType.COLLECTIONS:
      return (
        <FilterGrid>
          <CustomersFilter filters={filters} onChange={onChange} />
          <SeriesFilter filters={filters} onChange={onChange} />
          <ReportMultiSelect
            id="report-payment-methods"
            label="Forma de pago"
            allLabel="Todas las formas de pago"
            options={PAYMENT_METHOD_OPTIONS}
            values={filters.paymentMethods ?? []}
            onChange={(values) =>
              onChange({
                ...filters,
                paymentMethods: pickAll(Object.values(PaymentMethod), values),
              })
            }
          />
        </FilterGrid>
      );
    case ReportType.RECEIVABLES:
      return (
        <FilterGrid>
          <CustomersFilter filters={filters} onChange={onChange} />
          <SeriesFilter filters={filters} onChange={onChange} />
        </FilterGrid>
      );
    case ReportType.SUMMARY:
      return null;
  }
}

function FilterGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function CustomersFilter({ filters, onChange }: FiltersProps) {
  const { data, isLoading } = useCustomers({ limit: CATALOG_LIMIT });
  return (
    <ReportMultiSelect
      id="report-customers"
      label="Clientes"
      allLabel="Todos los clientes"
      searchPlaceholder="Buscar cliente..."
      options={(data?.data ?? []).map((c) => ({ value: c.id, label: c.name, hint: c.nif }))}
      values={filters.customerIds ?? []}
      onChange={(customerIds, labels) => onChange({ ...filters, customerIds }, labels)}
      isLoading={isLoading}
    />
  );
}

function ProductsFilter({ filters, onChange }: FiltersProps) {
  const { data, isLoading } = useProducts({ limit: CATALOG_LIMIT });
  return (
    <ReportMultiSelect
      id="report-products"
      label="Artículos"
      allLabel="Todos los artículos"
      searchPlaceholder="Buscar artículo..."
      options={(data?.data ?? []).map((p) => ({ value: p.id, label: p.name, hint: p.reference }))}
      values={filters.productIds ?? []}
      onChange={(productIds, labels) => onChange({ ...filters, productIds }, labels)}
      isLoading={isLoading}
    />
  );
}

function SeriesFilter({ filters, onChange }: FiltersProps) {
  const { data, isLoading } = useSeriesCodes();
  return (
    <ReportMultiSelect
      id="report-series"
      label="Series"
      allLabel="Todas las series"
      options={(data ?? []).map((code) => ({ value: code, label: code }))}
      values={filters.seriesCodes ?? []}
      onChange={(seriesCodes) => onChange({ ...filters, seriesCodes })}
      isLoading={isLoading}
    />
  );
}

function CategoriesFilter({ filters, onChange }: FiltersProps) {
  const { data, isLoading } = useExpenseCategories();
  return (
    <ReportMultiSelect
      id="report-categories"
      label="Categorías"
      allLabel="Todas las categorías"
      searchPlaceholder="Buscar categoría..."
      options={(data ?? []).map((c) => ({ value: c.id, label: c.name }))}
      values={filters.categoryIds ?? []}
      onChange={(categoryIds, labels) => onChange({ ...filters, categoryIds }, labels)}
      isLoading={isLoading}
    />
  );
}

function SuppliersFilter({ filters, onChange }: FiltersProps) {
  const { data, isLoading } = useSuppliers({ limit: CATALOG_LIMIT });
  return (
    <ReportMultiSelect
      id="report-suppliers"
      label="Proveedores"
      allLabel="Todos los proveedores"
      searchPlaceholder="Buscar proveedor..."
      options={(data?.data ?? []).map((s) => ({ value: s.id, label: s.name, hint: s.taxId }))}
      values={filters.supplierIds ?? []}
      onChange={(supplierIds, labels) => onChange({ ...filters, supplierIds }, labels)}
      isLoading={isLoading}
    />
  );
}

/** Keeps only known enum values, in canonical order. */
function pickAll<T extends string>(allowed: T[], values: string[]): T[] {
  return allowed.filter((value) => values.includes(value));
}

/** Single-valued filters: the last picked option wins. */
function lastOf<T extends string>(allowed: T[], values: string[]): T | undefined {
  const picked = values[values.length - 1];
  return allowed.find((value) => value === picked);
}

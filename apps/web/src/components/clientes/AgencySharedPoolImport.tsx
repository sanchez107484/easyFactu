'use client';

import { useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { useAuthStore } from '@/store/auth-store';
import { useAgencySharedCustomers } from '@/hooks/use-agency';
import { AccountType, CustomerType, type Customer } from '@easyfactura/shared-types';
import type { CustomerFormData } from '@/lib/validators/customer.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Search, X, BookUser, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

// ==================== HELPERS ====================

function mapToFormData(customer: Customer): Partial<CustomerFormData> {
  return {
    type: customer.type,
    name: customer.name,
    legalName: customer.legalName ?? undefined,
    nif: customer.nif,
    email: customer.email ?? undefined,
    phone: customer.phone ?? undefined,
    address: customer.address ?? undefined,
    postalCode: customer.postalCode ?? undefined,
    city: customer.city ?? undefined,
    province: customer.province ?? undefined,
    country: customer.country,
    notes: customer.notes ?? undefined,
  };
}

// ==================== PROPS ====================

interface AgencySharedPoolImportProps {
  form: UseFormReturn<CustomerFormData>;
}

// ==================== COMPONENT ====================

/**
 * Shown inside the customer creation form when the current user is an agency
 * acting as one of its clients. Allows importing a customer from the agency's
 * shared pool to pre-fill the form.
 */
export function AgencySharedPoolImport({ form }: AgencySharedPoolImportProps) {
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const tenants = useAuthStore((state) => state.tenants);

  const agencyTenantInfo = tenants.find(
    (t) => t.tenant.accountType === AccountType.AGENCY && t.isOwner,
  );
  const isActingAsClient = !!agencyTenantInfo && currentTenant?.id !== agencyTenantInfo.tenant.id;

  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { data: customers, isLoading } = useAgencySharedCustomers(
    debouncedSearch || undefined,
    1,
    isActingAsClient && open,
  );

  const handleImport = useCallback(
    (customer: Customer) => {
      const fields = mapToFormData(customer);
      (Object.keys(fields) as Array<keyof CustomerFormData>).forEach((key) => {
        const value = fields[key];
        if (value !== undefined) {
          form.setValue(key, value as CustomerFormData[typeof key], {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      });
      setOpen(false);
      setSearch('');
    },
    [form],
  );

  if (!isActingAsClient) return null;

  return (
    <div className="rounded-xl border bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <BookUser className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
              Importar del directorio de la asesoría
            </p>
            <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70">
              Rellena el formulario con un cliente ya registrado en tu cartera
            </p>
          </div>
        </div>
        {!open && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 border-indigo-200 bg-white hover:bg-indigo-50 dark:bg-indigo-950/30 dark:border-indigo-800"
            onClick={() => setOpen(true)}
          >
            <Search className="mr-1.5 h-3.5 w-3.5" />
            Buscar
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Buscar por nombre o NIF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-8 text-sm h-8"
            />
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setSearch('');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-48 overflow-y-auto rounded-lg border bg-background shadow-sm">
            {isLoading ? (
              <div className="space-y-1 p-1">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-md" />
                ))}
              </div>
            ) : !customers?.length ? (
              <div className="flex flex-col items-center justify-center gap-1 py-6 text-center">
                <Building2 className="h-6 w-6 text-muted-foreground/40" />
                <p className="text-xs text-muted-foreground">
                  {search
                    ? 'Sin resultados para tu búsqueda'
                    : 'No hay clientes en el directorio aún'}
                </p>
              </div>
            ) : (
              <ul className="p-1">
                {customers.map((customer) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onClick={() => handleImport(customer)}
                      className={cn(
                        'group flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm',
                        'hover:bg-accent hover:text-accent-foreground transition-colors',
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{customer.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {customer.nif}
                          {customer.city ? ` · ${customer.city}` : ''}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

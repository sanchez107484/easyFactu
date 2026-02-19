'use client';

import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Definir localmente hasta que se resuelva la cache de VSCode
const AccountType = {
  INDIVIDUAL: 'INDIVIDUAL',
  BUSINESS: 'BUSINESS',
  AGENCY: 'AGENCY',
  COLLABORATIVE: 'COLLABORATIVE',
} as const;

type AccountType = (typeof AccountType)[keyof typeof AccountType];

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.INDIVIDUAL]: 'Autónomo Individual',
  [AccountType.BUSINESS]: 'Empresa',
  [AccountType.AGENCY]: 'Gestoría',
  [AccountType.COLLABORATIVE]: 'Colaboración',
};

export function TenantSelector() {
  const { currentTenant, tenants, switchTenant } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // No mostrar si solo hay un tenant
  if (!tenants || tenants.length <= 1) {
    return null;
  }

  const handleTenantSwitch = async (tenantId: string) => {
    if (tenantId === currentTenant?.id) return;

    setIsLoading(true);
    try {
      await switchTenant(tenantId);
      toast.success('Empresa cambiada correctamente');
      // Recargar la página para actualizar todos los datos
      window.location.reload();
    } catch (error) {
      toast.error('No se pudo cambiar de empresa. Inténtalo de nuevo');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentTenant) {
    return <Skeleton className="h-10 w-[200px]" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={isLoading}>
          <Building2 className="h-4 w-4" />
          <span className="max-w-[150px] truncate">{currentTenant.businessName}</span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Tus empresas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map(({ tenant, role, isOwner }) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => handleTenantSwitch(tenant.id)}
            className={cn('cursor-pointer', tenant.id === currentTenant.id && 'bg-accent')}
          >
            <div className="flex flex-1 items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tenant.businessName}</span>
                  {tenant.id === currentTenant.id && <Check className="h-4 w-4" />}
                </div>
                <span className="text-xs text-muted-foreground">
                  {tenant.nif} • {isOwner ? 'Propietario' : role}
                </span>
                <span className="text-xs text-muted-foreground">
                  {ACCOUNT_TYPE_LABELS[tenant.accountType as AccountType] || tenant.accountType}
                </span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

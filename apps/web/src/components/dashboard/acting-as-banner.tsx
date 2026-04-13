'use client';

import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { AccountType } from '@easyfactura/shared-types';
import { ArrowLeft, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shows a persistent banner when an agency user is operating
 * inside a client tenant context ("acting as").
 *
 * Visible only when:
 *  – The logged-in user owns an AGENCY tenant
 *  – And the currentTenant is NOT that agency tenant
 */
export function ActingAsBanner() {
  const router = useRouter();
  const currentTenant = useAuthStore((state) => state.currentTenant);
  const tenants = useAuthStore((state) => state.tenants);
  const switchTenant = useAuthStore((state) => state.switchTenant);

  const agencyTenantInfo = tenants.find(
    (t) => t.tenant.accountType === AccountType.AGENCY && t.isOwner,
  );

  const isActingAs =
    agencyTenantInfo !== undefined &&
    currentTenant !== null &&
    currentTenant.id !== agencyTenantInfo.tenant.id;

  if (!isActingAs) return null;

  const handleReturnToAgency = async () => {
    await switchTenant(agencyTenantInfo!.tenant.id);
    router.push('/dashboard/asesoria');
  };

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-indigo-200 bg-indigo-600 px-4 py-2.5 text-white dark:border-indigo-700 dark:bg-indigo-700">
      <div className="flex items-center gap-2.5 min-w-0">
        <Eye className="h-4 w-4 shrink-0 text-indigo-200" />
        <span className="text-sm text-indigo-100">Actuando en nombre de</span>
        <span className="truncate text-sm font-semibold">{currentTenant?.businessName}</span>
        <span className="hidden text-xs text-indigo-300 sm:block">({currentTenant?.nif})</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleReturnToAgency}
        className="shrink-0 border border-indigo-400/30 text-white hover:bg-indigo-500 hover:text-white"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
        Volver a mi panel
      </Button>
    </div>
  );
}

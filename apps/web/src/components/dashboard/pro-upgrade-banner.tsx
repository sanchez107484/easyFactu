'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { NewsBanner } from '@/components/ui/news-banner';
import { ActivateProDialog } from '@/components/ui/activate-pro-dialog';
import { useCurrentSubscription } from '@/hooks/use-subscription';
import { useChangePlan } from '@/hooks/use-subscription';
import { useQueryClient } from '@tanstack/react-query';
import { PlanCycle } from '@easyfactura/shared-types';
import { Gift, ArrowRight } from 'lucide-react';

const BANNER_CONFIG = {
  id: 'pro-upgrade-basic',
  title: 'Activa PRO gratuitamente',
  description: 'Desbloquea todas las funcionalidades PRO sin coste hasta 2027.',
  variant: 'promo' as const,
  icon: 'gift' as const,
};

export function ProUpgradeBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: subscription } = useCurrentSubscription();
  const changePlan = useChangePlan();
  const queryClient = useQueryClient();

  const isBasicFree =
    subscription?.plan?.tier === 'BASIC' && subscription?.plan?.cycle === PlanCycle.FREE;

  if (!isBasicFree) return null;

  const handleActivate = async () => {
    try {
      await changePlan.mutateAsync('PROFESSIONAL_FREE');
      queryClient.invalidateQueries({ queryKey: ['subscription', 'current'] });
      setIsModalOpen(false);
      window.location.reload();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <>
      <NewsBanner
        data={{
          ...BANNER_CONFIG,
          actionSlot: (
            <div className="flex items-center gap-3">
              <Button
                size="lg"
                className="gap-2 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                onClick={() => setIsModalOpen(true)}
              >
                <Gift className="h-4 w-4" />
                Activar PRO gratuito
              </Button>
              <Link
                href="/dashboard/ajustes/plan"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Ver detalle de planes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ),
        }}
      />

      <ActivateProDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onActivate={handleActivate}
        isPending={changePlan.isPending}
      />
    </>
  );
}

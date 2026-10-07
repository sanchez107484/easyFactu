'use client';

import Link from 'next/link';
import { Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReceivedRequestsCount } from '@/hooks/use-agency';
import { useAgencyContext } from '@/hooks/use-agency-context';

interface PendingRequestsWidgetProps {
  className?: string;
}

export function PendingRequestsWidget({ className }: PendingRequestsWidgetProps) {
  const { isOnAgencyTenant } = useAgencyContext();
  const { data: count = 0 } = useReceivedRequestsCount(isOnAgencyTenant);

  if (count === 0) return null;

  return (
    <div className={className}>
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
            </div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              {count === 1
                ? '1 autónomo quiere vincularse'
                : `${count} autónomos quieren vincularse`}
            </p>
          </div>
          <Link href="/dashboard/asesoria/solicitudes">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-blue-700 hover:text-blue-900 dark:text-blue-400"
            >
              Revisar
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

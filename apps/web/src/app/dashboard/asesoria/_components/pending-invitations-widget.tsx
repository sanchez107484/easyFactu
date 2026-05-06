'use client';

import Link from 'next/link';
import { Mail, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AgencyInvitation } from '@easyfactura/shared-types';

interface PendingInvitationsWidgetProps {
  invitations: AgencyInvitation[];
}

function formatExpiryLabel(expiresAt: string): string {
  const expiry = new Date(expiresAt);
  const now = new Date();
  const days = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'caduca hoy';
  if (days === 1) return 'caduca mañana';
  return `caduca en ${days} días`;
}

export function PendingInvitationsWidget({ invitations }: PendingInvitationsWidgetProps) {
  if (invitations.length === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-agency-200 bg-agency-50 p-4 dark:border-agency-800/50 dark:bg-agency-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-agency-600 dark:text-agency-400" />
          <p className="text-sm font-semibold text-agency-900 dark:text-agency-300">
            {invitations.length} invitación{invitations.length > 1 ? 'es' : ''} pendiente
            {invitations.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/dashboard/asesoria/clientes">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-agency-700 hover:text-agency-900 dark:text-agency-400"
          >
            Gestionar
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="space-y-1.5">
        {invitations.slice(0, 3).map((inv) => (
          <div key={inv.id} className="flex items-center gap-2">
            <Clock className="h-3 w-3 shrink-0 text-agency-500" />
            <p className="min-w-0 flex-1 truncate text-xs text-agency-800 dark:text-agency-300">
              {inv.inviteeName ?? inv.inviteeEmail}
            </p>
            <span className="shrink-0 text-[10px] text-agency-600 dark:text-agency-400">
              {formatExpiryLabel(inv.expiresAt)}
            </span>
          </div>
        ))}
        {invitations.length > 3 && (
          <p className="text-xs text-agency-600 dark:text-agency-400">
            y {invitations.length - 3} más…
          </p>
        )}
      </div>
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { DashboardUserMenu } from './user-menu';
import { ThemeToggle } from './theme-toggle';
import { TenantSelector } from './tenant-selector';
import { ChevronRight } from 'lucide-react';

export function DashboardHeader() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);

  // Generate breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const title = segment.charAt(0).toUpperCase() + segment.slice(1);
    return { title, href };
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <span
              className={index === breadcrumbs.length - 1 ? 'font-medium' : 'text-muted-foreground'}
            >
              {crumb.title}
            </span>
          </div>
        ))}
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-4">
        <TenantSelector />
        <ThemeToggle />
        <DashboardUserMenu user={user} />
      </div>
    </header>
  );
}

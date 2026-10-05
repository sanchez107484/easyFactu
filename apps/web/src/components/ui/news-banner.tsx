'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X, Bell, Sparkles, Megaphone, Gift, type LucideIcon } from 'lucide-react';

export type NewsBannerVariant = 'default' | 'highlight' | 'announcement' | 'promo';
export type NewsBannerIcon = 'bell' | 'sparkles' | 'megaphone' | 'gift';

export interface NewsBannerAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface NewsBannerData {
  id: string;
  title: string;
  description?: string;
  variant?: NewsBannerVariant;
  icon?: NewsBannerIcon;
  action?: NewsBannerAction;
  actionSlot?: ReactNode;
  dismissable?: boolean;
}

const ICON_MAP: Record<NewsBannerIcon, LucideIcon> = {
  bell: Bell,
  sparkles: Sparkles,
  megaphone: Megaphone,
  gift: Gift,
};

const VARIANT_STYLES = {
  default: {
    wrapper: 'from-primary/5 via-primary/10 to-primary/5 border-primary/20',
    icon: 'text-primary',
    gradient: 'from-primary/20 to-primary/5',
    iconBg: 'bg-primary/10',
  },
  highlight: {
    wrapper:
      'from-amber-50 via-amber-100/50 to-amber-50 dark:from-amber-950/30 dark:via-amber-900/20 dark:to-amber-950/30 border-amber-200/50 dark:border-amber-800/30',
    icon: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-200/40 to-amber-100/20',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  announcement: {
    wrapper:
      'from-secondary/5 via-secondary/10 to-secondary/5 border-secondary/20 dark:border-secondary/30',
    icon: 'text-secondary',
    gradient: 'from-secondary/20 to-secondary/5',
    iconBg: 'bg-secondary/10',
  },
  promo: {
    wrapper:
      'from-green-50/50 via-background to-green-50/30 border-green-200/50 dark:border-green-800/30',
    icon: 'text-green-600 dark:text-green-400',
    gradient: 'from-green-100/30 to-transparent',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
  },
} as const;

const STORAGE_KEY = 'ef_dismissed_banners';
const DISMISS_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

interface DismissedBanner {
  id: string;
  dismissedAt: number;
}

function getDismissedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return new Set();
    const parsed: DismissedBanner[] = JSON.parse(stored);
    const now = Date.now();
    const valid = parsed.filter((b) => now - b.dismissedAt < DISMISS_DURATION_MS);
    if (valid.length < parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
    }
    return new Set(valid.map((b) => b.id));
  } catch {
    return new Set();
  }
}

function persistDismissedId(id: string): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing: DismissedBanner[] = stored ? JSON.parse(stored) : [];
    const filtered = existing.filter((b) => b.id !== id);
    filtered.push({ id, dismissedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // localStorage unavailable
  }
}

interface UseNewsBannerOptions {
  id: string;
  defaultVisible?: boolean;
}

interface UseNewsBannerReturn {
  isVisible: boolean;
  isDismissing: boolean;
  isMounted: boolean;
  dismiss: () => void;
}

export function useNewsBanner({
  id,
  defaultVisible = true,
}: UseNewsBannerOptions): UseNewsBannerReturn {
  const [isVisible, setIsVisible] = useState(defaultVisible);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (defaultVisible) {
      const dismissed = getDismissedIds();
      if (dismissed.has(id)) {
        setIsVisible(false);
      }
    }
  }, [id, defaultVisible]);

  const dismiss = useCallback(() => {
    setIsDismissing(true);
    persistDismissedId(id);
    setTimeout(() => setIsVisible(false), 400);
  }, [id]);

  return { isVisible, isDismissing, isMounted, dismiss };
}

interface NewsBannerContentProps {
  data: NewsBannerData;
  isDismissing: boolean;
  onDismiss: () => void;
}

function NewsBannerContent({ data, isDismissing, onDismiss }: NewsBannerContentProps) {
  const variant = data.variant ?? 'default';
  const icon = data.icon ?? 'bell';
  const dismissable = data.dismissable ?? true;
  const styles = VARIANT_STYLES[variant];
  const Icon = ICON_MAP[icon];

  return (
    <div
      role="region"
      aria-label={data.title}
      className={cn(
        'relative overflow-hidden border bg-gradient-to-r',
        styles.wrapper,
        'transition-all duration-400 ease-out',
        isDismissing
          ? 'opacity-0 translate-y-1 scale-[0.99]'
          : 'opacity-100 translate-y-0 scale-100',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r transition-opacity duration-500',
          styles.gradient,
          isDismissing ? 'opacity-0' : 'opacity-100',
        )}
      />

      {dismissable && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar notificación"
          className={cn(
            'absolute top-3 right-4 rounded-full p-1.5 text-muted-foreground z-10',
            'transition-all duration-200',
            'hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div className="relative mx-auto max-w-5xl px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-full backdrop-blur-sm shadow-sm',
              variant === 'promo' ? 'h-12 w-12' : 'h-9 w-9',
              styles.iconBg,
            )}
          >
            <Icon className={cn(variant === 'promo' ? 'h-6 w-6' : 'h-4 w-4', styles.icon)} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-foreground">{data.title}</p>
              {variant === 'promo' && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 border border-green-200">
                  Gratis hasta 2027
                </span>
              )}
            </div>
            {data.description && (
              <p
                className={cn(
                  'text-muted-foreground',
                  variant === 'promo' ? 'text-sm' : 'mt-0.5 text-sm',
                )}
              >
                {data.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {data.actionSlot && data.actionSlot}

            {data.action && !data.actionSlot && (
              <a
                href={data.action.href ?? '#'}
                onClick={data.action.onClick}
                className={cn(
                  'rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground',
                  'shadow-sm transition-all duration-200',
                  'hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                )}
              >
                {data.action.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface NewsBannerProps {
  data: NewsBannerData;
}

export function NewsBanner({ data }: NewsBannerProps) {
  const { isVisible, isDismissing, isMounted, dismiss } = useNewsBanner({ id: data.id });

  if (!isMounted || !isVisible) return null;

  return <NewsBannerContent data={data} isDismissing={isDismissing} onDismiss={dismiss} />;
}

interface NewsBannerContainerProps {
  banners: NewsBannerData[];
}

export function NewsBannerContainer({ banners }: NewsBannerContainerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setIsMounted(true);
    const dismissed = getDismissedIds();
    const visible = banners.filter((b) => !dismissed.has(b.id)).map((b) => b.id);
    setActiveIds(new Set(visible));
  }, [banners]);

  const handleDismiss = useCallback((id: string) => {
    setActiveIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  if (!isMounted || activeIds.size === 0) return null;

  const visibleBanners = banners.filter((b) => activeIds.has(b.id));

  return (
    <div className="flex flex-col gap-2">
      {visibleBanners.map((banner) => (
        <NewsBannerContent
          key={banner.id}
          data={banner}
          isDismissing={false}
          onDismiss={() => handleDismiss(banner.id)}
        />
      ))}
    </div>
  );
}

export default NewsBanner;

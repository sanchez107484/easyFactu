import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  if (isNaN(n)) return '—';
  return (
    new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(n) + '\u00A0€'
  );
}

export function parseNum(v: string | number | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'string' ? parseFloat(v) : v;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function resolveUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path; // ya es URL completa o data URL, no tocar
  return `${process.env.NEXT_PUBLIC_API_URL}${path}`;
}

const BADGE_COLORS = [
  { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/20', ring: 'ring-primary/20' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-200', dark: { bg: 'dark:bg-emerald-950/50', text: 'dark:text-emerald-400', border: 'dark:border-emerald-800' } },
  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-200', dark: { bg: 'dark:bg-amber-950/50', text: 'dark:text-amber-400', border: 'dark:border-amber-800' } },
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-200', dark: { bg: 'dark:bg-blue-950/50', text: 'dark:text-blue-400', border: 'dark:border-blue-800' } },
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', ring: 'ring-purple-200', dark: { bg: 'dark:bg-purple-950/50', text: 'dark:text-purple-400', border: 'dark:border-purple-800' } },
  { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', ring: 'ring-rose-200', dark: { bg: 'dark:bg-rose-950/50', text: 'dark:text-rose-400', border: 'dark:border-rose-800' } },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', ring: 'ring-cyan-200', dark: { bg: 'dark:bg-cyan-950/50', text: 'dark:text-cyan-400', border: 'dark:border-cyan-800' } },
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', ring: 'ring-orange-200', dark: { bg: 'dark:bg-orange-950/50', text: 'dark:text-orange-400', border: 'dark:border-orange-800' } },
] as const;

export type BadgeColor = typeof BADGE_COLORS[number];

export function getBadgeColor(index: number): BadgeColor {
  return BADGE_COLORS[index % BADGE_COLORS.length];
}

export function getCategoryBadgeClasses(categoryIndex: number): { bg: string; text: string; border: string } {
  const color = getBadgeColor(categoryIndex);
  return {
    bg: color.bg,
    text: color.text,
    border: color.border,
  };
}

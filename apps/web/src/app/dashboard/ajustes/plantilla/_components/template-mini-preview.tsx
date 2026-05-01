'use client';

import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BaseTemplate } from '../_lib/preview-data';

interface TemplateMiniPreviewProps {
  template: BaseTemplate;
  isActive: boolean;
  onClick: () => void;
}

/**
 * Renders a small (A4-ratio) visual preview of a base template using its
 * actual colors, font family, table style and logo position. Lets the user
 * see at a glance what they're picking instead of relying on emojis.
 */
export function TemplateMiniPreview({ template, isActive, onClick }: TemplateMiniPreviewProps) {
  const layout = template.layout;
  const primary = layout.colors?.primary ?? '#2563eb';
  const tableHeader = layout.colors?.tableHeader ?? '#dbeafe';
  const fontClass =
    layout.typography?.fontFamily === 'times-roman'
      ? 'font-serif'
      : layout.typography?.fontFamily === 'courier'
        ? 'font-mono'
        : 'font-sans';
  const tableStyle = layout.itemsTable?.style ?? 'grid';
  const logoPos = layout.logo?.position ?? 'top-left';
  const logoJustify =
    logoPos === 'top-center'
      ? 'justify-center'
      : logoPos === 'top-right'
        ? 'justify-end'
        : 'justify-start';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative aspect-[1/1.32] overflow-hidden rounded-lg border-2 bg-white text-left shadow-sm transition-all hover:shadow-md',
        isActive
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-border hover:border-muted-foreground/40',
      )}
      aria-label={`Aplicar plantilla ${template.name}`}
    >
      {/* Mini A4 page */}
      <div className={cn('flex h-full flex-col gap-1.5 p-2.5', fontClass)}>
        {/* Logo row */}
        {layout.logo?.visible !== false && (
          <div className={cn('flex', logoJustify)}>
            <div className="h-3 w-7 rounded-sm bg-gradient-to-br from-slate-200 to-slate-400" />
          </div>
        )}

        {/* Accent bar */}
        <div className="h-1 w-1/3 rounded" style={{ background: primary }} />

        {/* Sender / customer */}
        <div className="flex gap-2">
          <div className="flex-1 space-y-0.5">
            <div className="h-[3px] w-3/4 rounded bg-slate-700/40" />
            <div className="h-[2px] w-1/2 rounded bg-slate-400/50" />
            <div className="h-[2px] w-2/3 rounded bg-slate-400/50" />
          </div>
          <div className="flex-1 space-y-0.5">
            <div className="h-[3px] w-3/4 rounded bg-slate-700/40" />
            <div className="h-[2px] w-1/2 rounded bg-slate-400/50" />
          </div>
        </div>

        {/* Mini table */}
        <div className="mt-1 flex flex-1 flex-col">
          <div className="h-2 rounded-sm" style={{ background: tableHeader }} />
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'flex flex-1 items-center px-1',
                tableStyle === 'grid' && 'border-b border-l border-r border-slate-200/80',
                tableStyle === 'lines' && 'border-b border-slate-200/60',
              )}
            >
              <div className="h-[2px] w-full rounded bg-slate-300/70" />
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-end">
          <div className="h-1.5 w-10 rounded" style={{ background: primary }} />
        </div>
      </div>

      {/* Active checkmark */}
      {isActive && (
        <div className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
          <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />
        </div>
      )}

      {/* Title overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent px-2 py-1.5">
        <div className="text-[11px] font-bold text-white">{template.name}</div>
        <div className="text-[9px] leading-tight text-white/80">{template.description}</div>
      </div>
    </button>
  );
}

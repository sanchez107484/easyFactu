'use client';

import { useState } from 'react';
import { Check, Copy, Printer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyHashButtonProps {
  hash: string;
  className?: string;
}

const COPY_FEEDBACK_MS = 2000;

export function CopyHashButton({ hash, className }: CopyHashButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    } catch {
      // Clipboard API may be unavailable (HTTP context, old browser).
      // Silently ignore — the hash remains selectable as text.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Hash copiado' : 'Copiar hash al portapapeles'}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border bg-background px-2.5 py-1 text-xs font-medium transition-colors',
        'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        copied
          ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
          : 'border-border text-muted-foreground',
        className,
      )}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Copiado
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          Copiar
        </>
      )}
    </button>
  );
}

export function PrintButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors',
        'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Printer className="h-3.5 w-3.5" aria-hidden="true" />
      Imprimir
    </button>
  );
}

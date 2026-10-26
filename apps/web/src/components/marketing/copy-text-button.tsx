'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

const COPIED_FEEDBACK_MS = 2000;

interface CopyTextButtonProps {
  text: string;
  label?: string;
}

/** Copies `text` to the clipboard and confirms it for a couple of seconds. */
export function CopyTextButton({ text, label = 'Copiar' }: CopyTextButtonProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Clipboard blocked (permissions or insecure context): the text stays selectable.
      setIsCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
      aria-live="polite"
    >
      {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {isCopied ? 'Copiado' : label}
    </button>
  );
}

'use client';

import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ReportHelpProps {
  /** Accessible name of the option the help explains. */
  topic: string;
  children: React.ReactNode;
}

/** Small "i" button with a short explanation — a popover so it also works on touch. */
export function ReportHelp({ topic, children }: ReportHelpProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Ayuda: ${topic}`}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 text-sm leading-relaxed" align="start">
        {children}
      </PopoverContent>
    </Popover>
  );
}

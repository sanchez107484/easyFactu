'use client';

import { useEffect, useRef } from 'react';
import type { HelpChatMessage } from '@/hooks/use-help-chat';
import { cn } from '@/lib/utils';

interface HelpChatMessagesProps {
  messages: HelpChatMessage[];
  isResponding: boolean;
  isOpen: boolean;
}

const BUBBLE_BASE = 'max-w-[85%] rounded-2xl px-3.5 py-2 text-sm text-foreground';
const TYPING_DOT_DELAYS = [
  '[animation-delay:0ms]',
  '[animation-delay:150ms]',
  '[animation-delay:300ms]',
];

function bubbleStyle({ role, isError }: HelpChatMessage): string {
  if (isError) return 'self-start rounded-bl-sm bg-destructive/10';
  if (role === 'user') return 'self-end rounded-br-sm bg-primary/10';
  return 'self-start rounded-bl-sm bg-muted';
}

function TypingIndicator() {
  return (
    <div
      className={cn(BUBBLE_BASE, 'flex items-center gap-1 self-start rounded-bl-sm bg-muted py-3')}
    >
      <span className="sr-only">El asistente está escribiendo…</span>
      {TYPING_DOT_DELAYS.map((delay) => (
        <span
          key={delay}
          aria-hidden="true"
          className={cn(
            'h-1.5 w-1.5 rounded-full bg-muted-foreground motion-safe:animate-bounce',
            delay,
          )}
        />
      ))}
    </div>
  );
}

export function HelpChatMessages({ messages, isResponding, isOpen }: HelpChatMessagesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages.length, isResponding, isOpen]);

  return (
    <div
      ref={containerRef}
      role="log"
      aria-live="polite"
      aria-label="Conversación con el asistente"
      className="flex flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-4"
    >
      {messages.map((message) => (
        <p
          key={message.id}
          className={cn(BUBBLE_BASE, 'whitespace-pre-wrap break-words', bubbleStyle(message))}
        >
          {message.content}
        </p>
      ))}
      {isResponding && <TypingIndicator />}
    </div>
  );
}

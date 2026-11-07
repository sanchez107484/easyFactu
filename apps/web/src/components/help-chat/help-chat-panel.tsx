'use client';

import { forwardRef, useState } from 'react';
import type { CSSProperties, FormEvent, KeyboardEvent } from 'react';
import Image from 'next/image';
import { Send, X } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { HelpChatMessage } from '@/hooks/use-help-chat';
import { useVisualViewport } from '@/hooks/use-visual-viewport';
import { HELP_CHAT_MAX_MESSAGE_LENGTH } from '@/lib/help-chat-config';
import { cn } from '@/lib/utils';
import { HelpChatMessages } from './help-chat-messages';

interface HelpChatPanelProps {
  id: string;
  title: string;
  isOpen: boolean;
  isRaised: boolean;
  messages: HelpChatMessage[];
  isResponding: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/** The custom properties size the full-screen mobile layout only; `sm:` classes override them. */
function viewportStyle(box: ReturnType<typeof useVisualViewport>): CSSProperties | undefined {
  if (!box) return undefined;
  const properties: Record<string, string> = {
    '--help-chat-height': `${box.height}px`,
    '--help-chat-top': `${box.offsetTop}px`,
  };
  return properties;
}

export const HelpChatPanel = forwardRef<HTMLTextAreaElement, HelpChatPanelProps>(
  function HelpChatPanel(
    { id, title, isOpen, isRaised, messages, isResponding, onSend, onClose, onKeyDown },
    inputRef,
  ) {
    const [draft, setDraft] = useState('');
    const viewportBox = useVisualViewport(isOpen);
    const titleId = `${id}-title`;
    const canSend = draft.trim().length > 0 && !isResponding;

    const submitDraft = () => {
      if (!canSend) return;
      onSend(draft);
      setDraft('');
    };

    const handleSubmit = (event: FormEvent) => {
      event.preventDefault();
      submitDraft();
    };

    const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      const isSendShortcut =
        event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing;
      if (!isSendShortcut) return;
      event.preventDefault();
      submitDraft();
    };

    return (
      <section
        id={id}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        style={viewportStyle(viewportBox)}
        className={cn(
          'fixed inset-x-0 top-[var(--help-chat-top,0px)] z-50 h-[var(--help-chat-height,100dvh)] flex-col overflow-hidden bg-card text-card-foreground print:hidden',
          'sm:inset-x-auto sm:bottom-20 sm:right-4 sm:top-auto sm:z-40 sm:h-[600px] sm:max-h-[calc(100dvh-6rem)] sm:w-[380px] sm:rounded-xl sm:border sm:shadow-xl',
          'motion-safe:duration-200 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2',
          isRaised && 'sm:max-lg:bottom-36 sm:max-lg:max-h-[calc(100dvh-10rem)]',
          isOpen ? 'flex' : 'hidden',
        )}
      >
        <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3">
          <Image
            src={brandConfig.logos.icon}
            alt=""
            loading="eager"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
          />
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate text-sm font-semibold">
              {title}
            </h2>
            <p className="truncate text-xs text-muted-foreground">Asistente virtual</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar chat de ayuda"
            className="h-10 w-10 shrink-0"
          >
            <X aria-hidden="true" />
          </Button>
        </header>

        <HelpChatMessages messages={messages} isResponding={isResponding} isOpen={isOpen} />

        <form onSubmit={handleSubmit} className="flex shrink-0 items-end gap-2 border-t p-3">
          <label htmlFor={`${id}-input`} className="sr-only">
            Escribe tu pregunta
          </label>
          <Textarea
            id={`${id}-input`}
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={HELP_CHAT_MAX_MESSAGE_LENGTH}
            placeholder="Escribe tu pregunta…"
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleInputKeyDown}
            className="max-h-32 min-h-11 flex-1 resize-none text-base [field-sizing:content] sm:text-sm"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canSend}
            aria-label="Enviar mensaje"
            className="h-11 w-11 shrink-0 text-white"
          >
            <Send aria-hidden="true" />
          </Button>
        </form>
      </section>
    );
  },
);

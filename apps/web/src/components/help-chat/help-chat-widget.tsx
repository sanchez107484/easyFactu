'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { brandConfig } from '@easyfactura/brand-config';
import { Button } from '@/components/ui/button';
import { useHelpChat } from '@/hooks/use-help-chat';
import { isHelpChatEnabled } from '@/lib/help-chat-config';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { HelpChatPanel } from './help-chat-panel';

/** These routes pin an action bar to the bottom below `lg`, where the launcher would cover it. */
const ROUTES_WITH_MOBILE_ACTION_BAR = ['/dashboard/productos/nuevo'];

function LauncherIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="!size-7">
      <path className="fill-white" d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <circle className="fill-primary" cx="8" cy="12" r="1.35" />
      <circle className="fill-primary" cx="12" cy="12" r="1.35" />
      <circle className="fill-primary" cx="16" cy="12" r="1.35" />
    </svg>
  );
}

function HelpChat() {
  const panelId = useId();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasPulsed, setHasPulsed] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const wasOpen = useRef(false);
  const { messages, isResponding, sendMessage } = useHelpChat(
    `¡Hola! 👋 Soy el asistente virtual de ${brandConfig.app.name}. ¿En qué puedo ayudarte?`,
  );
  const isRaised = ROUTES_WITH_MOBILE_ACTION_BAR.includes(pathname);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
    else if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = isOpen;
  }, [isOpen]);

  // Page-level shortcuts listen on window (the expense form leaves the page on Escape), so keys
  // pressed inside the widget must not reach them.
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    event.stopPropagation();
    if (event.key === 'Escape' && isOpen) setIsOpen(false);
  };

  return (
    <>
      <HelpChatPanel
        ref={inputRef}
        id={panelId}
        title={`Ayuda ${brandConfig.app.name}`}
        isOpen={isOpen}
        isRaised={isRaised}
        messages={messages}
        isResponding={isResponding}
        onSend={sendMessage}
        onClose={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
      />
      <Button
        ref={launcherRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        aria-label={isOpen ? 'Cerrar chat de ayuda' : 'Abrir chat de ayuda'}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="dialog"
        className={cn(
          'fixed bottom-4 right-4 z-40 h-[52px] w-[52px] rounded-full p-0 text-white focus-visible:ring-2 focus-visible:ring-offset-2 print:hidden [&_svg]:size-6',
          // White and black overlays on bg-primary keep the depth on every brand's own color.
          'bg-gradient-to-br from-white/25 via-transparent to-black/20',
          'shadow-[0_10px_24px_-4px_hsl(var(--primary)/0.55),0_2px_6px_rgb(15_23_42/0.18),inset_0_1px_0_rgb(255_255_255/0.35)]',
          'transition-transform motion-safe:hover:scale-105',
          isRaised && 'max-lg:bottom-20',
          isOpen && 'max-sm:hidden',
        )}
      >
        {!hasPulsed && (
          <span
            aria-hidden="true"
            onAnimationEnd={() => setHasPulsed(true)}
            className="pointer-events-none absolute inset-0 -z-10 animate-ping rounded-full bg-primary opacity-40 [animation-fill-mode:forwards] [animation-iteration-count:1] motion-reduce:hidden"
          />
        )}
        {isOpen ? <X aria-hidden="true" /> : <LauncherIcon />}
      </Button>
    </>
  );
}

export function HelpChatWidget() {
  const tenantId = useAuthStore((state) => state.currentTenant?.id);

  if (!isHelpChatEnabled) return null;

  // switchTenant does not reload the page: the key keeps a conversation from crossing companies.
  return <HelpChat key={tenantId} />;
}

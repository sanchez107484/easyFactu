'use client';

import { useCallback, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { helpChatApi } from '@/lib/api/help-chat-api';

export type HelpChatMessage = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
};

const REPLY_ERROR_MESSAGE =
  'No he podido responder en este momento. Inténtalo de nuevo en unos minutos.';

/** Only messages written by our route are shown: axios's own errors are technical and in English. */
function replyErrorMessage(error: unknown): string {
  const routeMessage: unknown = axios.isAxiosError(error) ? error.response?.data?.message : null;
  return typeof routeMessage === 'string' ? routeMessage : REPLY_ERROR_MESSAGE;
}

/**
 * Keeps the conversation in memory only: it may contain fiscal or customer data, so it must not
 * outlive the session or be left behind in browser storage on a shared computer.
 */
export function useHelpChat(greeting: string) {
  const nextMessageId = useRef(1);
  const [messages, setMessages] = useState<HelpChatMessage[]>([
    { id: 0, role: 'assistant', content: greeting },
  ]);

  const appendMessage = useCallback((message: Omit<HelpChatMessage, 'id'>) => {
    const id = nextMessageId.current++;
    setMessages((current) => [...current, { ...message, id }]);
  }, []);

  const { mutate, isPending: isResponding } = useMutation({
    mutationFn: helpChatApi.sendMessage,
    onSuccess: ({ respuesta }) => appendMessage({ role: 'assistant', content: respuesta }),
    onError: (error) =>
      appendMessage({ role: 'assistant', content: replyErrorMessage(error), isError: true }),
  });

  const sendMessage = useCallback(
    (text: string) => {
      const message = text.trim();
      if (!message || isResponding) return;
      appendMessage({ role: 'user', content: message });
      mutate({ message });
    },
    [appendMessage, isResponding, mutate],
  );

  return { messages, isResponding, sendMessage };
}

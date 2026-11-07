import { apiClient } from '../api-client';

export interface HelpChatRequest {
  message: string;
}

export interface HelpChatReply {
  respuesta: string;
}

/** Outlasts the route's own limits, so a slow reply ends with the server's explanation. */
const REQUEST_TIMEOUT_MS = 65_000;

export const helpChatApi = {
  /** The empty baseURL targets this Next.js app, keeping apiClient's bearer token and refresh. */
  sendMessage: (request: HelpChatRequest): Promise<HelpChatReply> =>
    apiClient
      .post<HelpChatReply>('/api/chat-soporte', request, {
        baseURL: '',
        timeout: REQUEST_TIMEOUT_MS,
      })
      .then((response) => response.data),
};

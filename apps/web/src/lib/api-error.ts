import { AxiosError } from 'axios';

/**
 * Extrae un mensaje de error legible de una respuesta de la API.
 * Compatible con el formato de error de NestJS (string o string[]).
 */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.length > 0) return message[0];
  }
  return 'Ha ocurrido un error inesperado. Inténtalo de nuevo.';
}

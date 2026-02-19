/**
 * Tipo de respuesta estándar del backend (TransformInterceptor)
 * Todas las respuestas de la API vienen envueltas en esta estructura
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
    path: string;
  };
}

/**
 * Extrae los datos de una respuesta de axios que viene envuelta por el TransformInterceptor
 * @param response - Respuesta de axios
 * @returns Los datos reales sin el wrapper
 */
export function unwrapApiResponse<T>(response: { data: ApiResponse<T> }): T {
  return response.data.data;
}

import axios, { AxiosError } from 'axios';
import { unwrapApiResponse } from './api-response';
import { AuthResponse } from '@easyfactura/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Strip trailing /v1 if already present (user misconfiguration), then add it once
const API_URL = API_BASE.replace(/\/v1$/, '') + '/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 20_000, // 20s — fail fast en redes lentas / cuelgues serverless
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Para cookies de refresh token
});

// Request interceptor - añadir token
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Refresh en curso, compartido por todos los 401 concurrentes.
// Sin este lock, N peticiones paralelas con el access token expirado lanzan N refreshes;
// el backend rota el refresh token (un único slot en BD, ver auth.service.ts#refreshTokens),
// el primero gana y el resto recibe 401 → cierre de sesión espurio.
let refreshPromise: Promise<string> | null = null;

function redirectToLogin(): void {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

function requestNewTokens(): Promise<string> {
  const sentRefreshToken = getRefreshToken();
  if (!sentRefreshToken) {
    clearTokens();
    redirectToLogin();
    return Promise.reject(new Error('No hay sesión activa'));
  }

  return axios
    .post(`${API_URL}/auth/refresh`, { refreshToken: sentRefreshToken })
    .then((response) => {
      const authData = unwrapApiResponse<AuthResponse>(response);
      setAccessToken(authData.accessToken);
      if (authData.refreshToken) {
        setRefreshToken(authData.refreshToken);
      }
      return authData.accessToken;
    })
    .catch((refreshError: unknown) => {
      // Otra pestaña pudo rotar el token primero: si el refresh token almacenado
      // ya no es el que enviamos, adoptamos esa sesión nueva en vez de cerrarla.
      const storedRefresh = getRefreshToken();
      const storedAccess = getAccessToken();
      if (storedRefresh && storedRefresh !== sentRefreshToken && storedAccess) {
        return storedAccess;
      }
      // Solo cerramos sesión si el backend confirma que el refresh token es
      // inválido (401/403). Un fallo de red o un 5xx (p. ej. base de datos
      // saturada) no debe expulsar al usuario: el próximo 401 reintentará.
      const isDefinitiveAuthFailure =
        axios.isAxiosError(refreshError) &&
        (refreshError.response?.status === 401 || refreshError.response?.status === 403);
      if (isDefinitiveAuthFailure) {
        clearTokens();
        redirectToLogin();
      }
      throw refreshError;
    })
    .finally(() => {
      refreshPromise = null;
    });
}

function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = requestNewTokens();
  }
  return refreshPromise;
}

// Response interceptor - manejar errores y refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    // Si es 401 y no es el endpoint de login ni refresh, intentar refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();

        // Reintentar request original
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// Token management (localStorage para persistencia)
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  // Intentar recuperar de localStorage si no está en memoria
  if (typeof window !== 'undefined') {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
}

export function setAccessToken(token: string): void {
  if (!token || token === 'undefined') {
    console.error('❌ Intento de guardar accessToken inválido:', token);
    return;
  }
  accessToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('refreshToken');
  if (token === 'undefined' || token === 'null') {
    console.warn('⚠️ RefreshToken inválido en localStorage:', token);
    localStorage.removeItem('refreshToken');
    return null;
  }
  return token;
}

export function setRefreshToken(token: string): void {
  if (!token || token === 'undefined') {
    console.error('❌ Intento de guardar refreshToken inválido:', token);
    return;
  }
  if (typeof window === 'undefined') return;
  localStorage.setItem('refreshToken', token);
}

export function clearTokens(): void {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

// Error helper
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message[0];
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Ha ocurrido un error inesperado';
}

// Query string builder
export function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

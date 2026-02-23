import axios, { AxiosError } from 'axios';
import { unwrapApiResponse } from './api-response';
import { AuthResponse } from '@easyfactura/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
// Strip trailing /v1 if already present (user misconfiguration), then add it once
const API_URL = API_BASE.replace(/\/v1$/, '') + '/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
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

// Response interceptor - manejar errores y refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // Si es 401 y no es el endpoint de login ni refresh, intentar refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          // No hay refresh token, redirigir a login
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        // Intentar refresh
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const authData = unwrapApiResponse<AuthResponse>(response);

        setAccessToken(authData.accessToken);
        if (authData.refreshToken) {
          setRefreshToken(authData.refreshToken);
        }

        // Reintentar request original
        originalRequest.headers.Authorization = `Bearer ${authData.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh falló, limpiar tokens y redirigir
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
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
  console.log('✅ AccessToken guardado');
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
  console.log('✅ RefreshToken guardado');
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

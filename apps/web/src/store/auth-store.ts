import { create } from 'zustand';
import { apiClient, setAccessToken, setRefreshToken, clearTokens } from '@/lib/api-client';
import { unwrapApiResponse } from '@/lib/api-response';
import type { User, Tenant, AccountType } from '@easyfactura/shared-types';

// Definir localmente hasta que se resuelva la cache de VSCode
const TenantUserRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
  VIEWER: 'VIEWER',
} as const;

type TenantUserRole = (typeof TenantUserRole)[keyof typeof TenantUserRole];

interface TenantWithRole {
  tenant: Tenant;
  role: TenantUserRole;
  isOwner: boolean;
}

interface AuthState {
  user: User | null;
  currentTenant: Tenant | null;
  tenants: TenantWithRole[];
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (email: string, password: string, tenantId?: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
  nif: string;
  accountType: AccountType;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  currentTenant: null,
  tenants: [],
  isAuthenticated: false,
  isLoading: false,

  login: async (email, password, tenantId) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const authData: any = unwrapApiResponse(response);

    console.log('📦 Respuesta completa del login:', authData);
    console.log(
      '🔑 AccessToken recibido:',
      authData.accessToken ? `${authData.accessToken.substring(0, 20)}...` : 'UNDEFINED',
    );
    console.log(
      '🔄 RefreshToken recibido:',
      authData.refreshToken ? `${authData.refreshToken.substring(0, 20)}...` : 'UNDEFINED',
    );

    if (!authData.accessToken || !authData.refreshToken) {
      throw new Error('El servidor no devolvió los tokens necesarios');
    }

    setAccessToken(authData.accessToken);
    setRefreshToken(authData.refreshToken);

    set({
      user: authData.user,
      currentTenant: authData.currentTenant,
      tenants: authData.tenants,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  register: async (registerData) => {
    const response = await apiClient.post('/auth/register', registerData);
    const authData: any = unwrapApiResponse(response);

    console.log('📦 Respuesta completa del registro:', authData);
    console.log(
      '🔑 AccessToken recibido:',
      authData.accessToken ? `${authData.accessToken.substring(0, 20)}...` : 'UNDEFINED',
    );
    console.log(
      '🔄 RefreshToken recibido:',
      authData.refreshToken ? `${authData.refreshToken.substring(0, 20)}...` : 'UNDEFINED',
    );

    if (!authData.accessToken || !authData.refreshToken) {
      throw new Error('El servidor no devolvió los tokens necesarios');
    }

    setAccessToken(authData.accessToken);
    setRefreshToken(authData.refreshToken);

    set({
      user: authData.user,
      currentTenant: authData.currentTenant,
      tenants: authData.tenants,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignorar errores en logout
    } finally {
      clearTokens();
      set({
        user: null,
        currentTenant: null,
        tenants: [],
        isAuthenticated: false,
      });
    }
  },

  checkAuth: async () => {
    try {
      // Verificar si hay refresh token antes de intentar
      const refreshToken =
        typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      if (!refreshToken) {
        set({
          user: null,
          currentTenant: null,
          tenants: [],
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      const response = await apiClient.get('/auth/me');
      const userData: any = unwrapApiResponse(response);

      // Extraer el tenant actual del lastActiveTenantId
      const currentTenantData =
        userData.tenants?.find(
          (t: TenantWithRole) => t.tenant.id === userData.lastActiveTenantId,
        ) || userData.tenants?.[0];

      set({
        user: userData,
        currentTenant: currentTenantData?.tenant || null,
        tenants: userData.tenants || [],
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // Si falla el checkAuth, limpiar todo
      clearTokens();
      set({
        user: null,
        currentTenant: null,
        tenants: [],
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  switchTenant: async (tenantId: string) => {
    const response = await apiClient.post('/auth/switch-tenant', { tenantId });
    const authData: any = unwrapApiResponse(response);

    console.log('🔄 Cambiando de tenant:', authData);

    if (!authData.accessToken || !authData.refreshToken) {
      throw new Error('El servidor no devolvió los tokens necesarios');
    }

    setAccessToken(authData.accessToken);
    setRefreshToken(authData.refreshToken);

    set({
      currentTenant: authData.currentTenant,
    });
  },
}));

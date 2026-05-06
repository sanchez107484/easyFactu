'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { tenantApi } from '@/lib/api/tenant-api';
import { UpdateTenantInput } from '@easyfactura/shared-types';
import { useAuthStore } from '@/store/auth-store';
import { getApiErrorMessage } from '@/lib/api-error';

export const tenantKeys = {
  all: ['tenant'] as const,
  detail: () => [...tenantKeys.all, 'detail'] as const,
};

export function useTenant() {
  return useQuery({
    queryKey: tenantKeys.detail(),
    queryFn: () => tenantApi.get(),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  const updateCurrentTenant = useAuthStore((state) => state.updateCurrentTenant);

  return useMutation({
    mutationFn: (data: UpdateTenantInput) => tenantApi.update(data),
    onSuccess: (updatedTenant) => {
      queryClient.setQueryData(tenantKeys.detail(), updatedTenant);
      updateCurrentTenant(updatedTenant);
      toast.success('Datos de la empresa actualizados');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUploadTenantLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => tenantApi.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success('Logo actualizado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteTenantLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => tenantApi.deleteLogo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success('Logo eliminado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUploadCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, password }: { file: File; password: string }) =>
      tenantApi.uploadCertificate(file, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success('Certificado digital instalado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => tenantApi.deleteCertificate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tenantKeys.all });
      toast.success('Certificado eliminado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useCompleteSetup() {
  const queryClient = useQueryClient();
  const updateCurrentTenant = useAuthStore((state) => state.updateCurrentTenant);

  return useMutation({
    mutationFn: () => tenantApi.completeSetup(),
    onSuccess: (updatedTenant) => {
      queryClient.setQueryData(tenantKeys.detail(), updatedTenant);
      updateCurrentTenant(updatedTenant);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

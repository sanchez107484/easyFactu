import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { toast } from 'sonner';
import { productApi } from '@/lib/api/product-api';
import {
  QueryProductsInput,
  CreateProductInput,
  UpdateProductInput,
} from '@easyfactura/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';

export function useProducts(filters: QueryProductsInput = {}) {
  return useQuery({
    queryKey: ['products', 'list', filters],
    queryFn: () => productApi.getAll(filters),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', 'detail', id],
    queryFn: () => productApi.getById(id),
    enabled: Boolean(id),
  });
}

/**
 * Returns a prefetcher that warms the product-detail cache on hover/focus.
 * Use it in list rows so the detail page renders instantly when clicked.
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();
  return (id: string) => {
    if (!id) return;
    void queryClient.prefetchQuery({
      queryKey: ['products', 'detail', id],
      queryFn: () => productApi.getById(id),
      staleTime: 30_000,
    });
  };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
      toast.success('Producto creado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateProductInput & { id: string }) =>
      productApi.update(id, data),
    onSuccess: (product) => {
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
      if (product?.id) {
        queryClient.setQueryData(['products', 'detail', product.id], product);
      }
      toast.success('Producto actualizado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productApi.remove,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['products', 'list'] });
      if (typeof id === 'string') {
        queryClient.removeQueries({ queryKey: ['products', 'detail', id] });
      }
      toast.success('Producto eliminado correctamente');
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

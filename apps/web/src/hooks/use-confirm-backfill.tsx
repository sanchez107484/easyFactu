'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { BackfillDialogData, ConfirmBackfillDialog } from '@/components/ui/confirm-backfill-dialog';

type GenerateFn<TData> = (id: string, data?: TData) => Promise<{ generatedCount: number }>;

interface UseConfirmBackfillOptions<TData = unknown> {
  generateFn: GenerateFn<TData>;
  itemType: 'expense' | 'invoice';
  /** Construye el payload opcional que se pasa a generateFn */
  getPayload?: (dialogData: BackfillDialogData) => TData | undefined;
  onSuccessNavigateTo?: string;
}

// Ajusta las claves de facturas a las que uses realmente
const QUERY_KEYS = {
  expense: [
    ['recurring-expenses', 'list'],
    ['recurring-expenses', 'detail'],
    ['expenses', 'list'],
    ['expenses', 'summary'],
  ],
  invoice: [
    ['recurring-invoices', 'list'],
    ['recurring-invoices', 'detail'],
    ['invoices', 'list'],
    ['invoices', 'summary'],
  ],
} as const;

export function useConfirmBackfill<TData = unknown>({
  generateFn,
  itemType,
  getPayload,
  onSuccessNavigateTo,
}: UseConfirmBackfillOptions<TData>) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dialogData, setDialogData] = useState<BackfillDialogData | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: TData }) => generateFn(id, data),
    onSuccess: async ({ generatedCount }) => {
      await Promise.all(
        QUERY_KEYS[itemType].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey: [...queryKey] }),
        ),
      );
      toast.success(
        generatedCount === 1
          ? 'Se generó 1 elemento correctamente'
          : `Se generaron ${generatedCount} elementos correctamente`,
      );
      if (onSuccessNavigateTo) router.push(onSuccessNavigateTo);
    },
    onError: () => {
      toast.error('No se pudo completar la generación');
    },
  });

  const openDialog = useCallback((data: BackfillDialogData) => {
    setDialogData(data);
    setOpen(true);
  }, []);

  // dialogData se conserva para que el contenido no desaparezca durante la animación de salida
  const closeDialog = useCallback(() => setOpen(false), []);

  const handleConfirm = useCallback(async () => {
    if (!dialogData) return;
    try {
      await mutateAsync({ id: dialogData.id, data: getPayload?.(dialogData) });
      setOpen(false);
    } catch {
      // El toast ya se muestra en onError; el diálogo permanece abierto
    }
  }, [dialogData, getPayload, mutateAsync]);

  // Elemento JSX (no un componente creado con useCallback): no se remonta entre renders
  const dialog = (
    <ConfirmBackfillDialog
      open={open}
      onOpenChange={setOpen}
      data={dialogData}
      onConfirm={handleConfirm}
      isPending={isPending}
    />
  );

  return { openDialog, closeDialog, isPending, dialog };
}
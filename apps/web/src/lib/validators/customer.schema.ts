import { z } from 'zod';
import { validateNif } from '@easyfactura/shared-validators';
import { CustomerType } from '@easyfactura/shared-types';

/**
 * Esquema Zod compartido para los formularios de creación y edición de clientes.
 * Fuente única de verdad para la validación del lado del cliente.
 */
export const customerFormSchema = z
  .object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
    nif: z.string().min(1, 'El NIF/CIF es obligatorio'),
    type: z.nativeEnum(CustomerType),
    legalName: z.string().max(100, 'Máximo 100 caracteres').optional().or(z.literal('')),
    email: z.string().email('Formato de email no válido').optional().or(z.literal('')),
    phone: z.string().max(20, 'Máximo 20 caracteres').optional().or(z.literal('')),
    address: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
    postalCode: z.string().max(10).optional().or(z.literal('')),
    city: z.string().max(100).optional().or(z.literal('')),
    province: z.string().max(100).optional().or(z.literal('')),
    country: z.string().length(2, 'Código de país de 2 letras').default('ES').optional(),
    notes: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.type !== CustomerType.INTRACOMMUNITY && data.nif) {
      const cleanedNif = data.nif.toUpperCase().trim().replace(/[\s.-]/g, '');
      const result = validateNif(cleanedNif);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NIF/CIF no válido para el tipo seleccionado',
          path: ['nif'],
        });
      }
    }
  });

export type CustomerFormData = z.infer<typeof customerFormSchema>;

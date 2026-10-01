'use client';

import { z } from 'zod';
import { PROVINCES } from '@easyfactura/shared-constants';

export const supplierFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  legalName: z.string().max(100).optional(),
  taxId: z
    .string()
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[A-Z0-9]/i, 'El NIF/CIF debe empezar por letra o número')
    .optional()
    .or(z.literal('')),
  email: z.string().email('El email no es válido').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  postalCode: z.string().max(10).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  country: z.string().max(2).optional().default('ES'),
  notes: z.string().max(1000).optional(),
});

export type SupplierFormData = z.infer<typeof supplierFormSchema>;

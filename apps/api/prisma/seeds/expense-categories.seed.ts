import { PrismaClient } from '@prisma/client';

const CATEGORIES = [
  { slug: 'software-y-aplicaciones', name: 'Software y aplicaciones' },
  { slug: 'material', name: 'Material' },
  { slug: 'suministros', name: 'Suministros' },
  { slug: 'telefonia-e-internet', name: 'Telefonía e Internet' },
  { slug: 'transporte', name: 'Transporte' },
  { slug: 'combustible', name: 'Combustible' },
  { slug: 'publicidad-y-marketing', name: 'Publicidad y marketing' },
  { slug: 'servicios-profesionales', name: 'Servicios profesionales' },
  { slug: 'seguros', name: 'Seguros' },
  { slug: 'alquiler', name: 'Alquiler' },
  { slug: 'formacion', name: 'Formación' },
  { slug: 'equipamiento', name: 'Equipamiento' },
  { slug: 'comisiones-y-gastos-bancarios', name: 'Comisiones y gastos bancarios' },
  { slug: 'otros', name: 'Otros' },
];

export async function seedExpenseCategories(prisma: PrismaClient): Promise<void> {
  for (let i = 0; i < CATEGORIES.length; i++) {
    const category = CATEGORIES[i]!;
    await prisma.expenseCategory.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        sortOrder: i,
        isActive: true,
      },
      create: {
        slug: category.slug,
        name: category.name,
        sortOrder: i,
        isActive: true,
      },
    });
  }
}

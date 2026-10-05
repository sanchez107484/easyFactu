import { PrismaClient, PlanCycle, PlanTier } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedExpenseCategories } from './seeds/expense-categories.seed';

const prisma = new PrismaClient();

const PLANS = [
  {
    slug: 'BASIC_MONTHLY',
    name: 'Básico Mensual',
    cycle: PlanCycle.MONTHLY,
    tier: PlanTier.BASIC,
    limits: { maxInvoicesPerYear: 60, allowExpenses: false },
  },
  {
    slug: 'BASIC_YEARLY',
    name: 'Básico Anual',
    cycle: PlanCycle.YEARLY,
    tier: PlanTier.BASIC,
    limits: { maxInvoicesPerYear: 60, allowExpenses: false },
  },
  {
    slug: 'BASIC_FREE',
    name: 'Básico Gratuito',
    cycle: PlanCycle.FREE,
    tier: PlanTier.BASIC,
    limits: { maxInvoicesPerYear: 60, allowExpenses: false },
  },
  {
    slug: 'PROFESSIONAL_MONTHLY',
    name: 'PRO Mensual',
    cycle: PlanCycle.MONTHLY,
    tier: PlanTier.PROFESSIONAL,
    limits: { maxInvoicesPerYear: null, allowExpenses: true },
  },
  {
    slug: 'PROFESSIONAL_YEARLY',
    name: 'PRO Anual',
    cycle: PlanCycle.YEARLY,
    tier: PlanTier.PROFESSIONAL,
    limits: { maxInvoicesPerYear: null, allowExpenses: true },
  },
  {
    slug: 'PROFESSIONAL_FREE',
    name: 'PRO Gratuito',
    cycle: PlanCycle.FREE,
    tier: PlanTier.PROFESSIONAL,
    limits: { maxInvoicesPerYear: null, allowExpenses: true },
  },
];

async function seedPlans() {
  for (const planData of PLANS) {
    const existing = await prisma.plan.findUnique({ where: { slug: planData.slug } });
    if (!existing) {
      await prisma.plan.create({ data: planData });
      console.log(`  ✓ Plan created: ${planData.slug}`);
    } else {
      console.log(`  - Plan already exists: ${planData.slug}`);
    }
  }
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // Seed global expense categories (idempotent)
  console.log('Seeding expense categories...');
  await seedExpenseCategories(prisma);
  console.log('✓ Expense categories seeded');

  // Seed plans (idempotent)
  console.log('\nSeeding plans...');
  await seedPlans();

  // Create test tenant (only if not exists)
  console.log('\nCreating test tenant...');
  let tenant = await prisma.tenant.findFirst({ where: { nif: 'B12345678' } });
  if (tenant) {
    console.log(`  - Tenant already exists: ${tenant.businessName} (${tenant.id})`);
  } else {
    tenant = await prisma.tenant.create({
      data: {
        businessName: 'Test Company S.L.',
        legalName: 'Test Company Sociedad Limitada',
        nif: 'B12345678',
        address: 'Calle Falsa 123',
        postalCode: '28001',
        city: 'Madrid',
        province: 'Madrid',
        country: 'ES',
        email: 'admin@testcompany.com',
        phone: '+34912345678',
        isActive: true,
        setupCompleted: true,
        subscription: {
          create: {
            plan: { connect: { slug: 'PROFESSIONAL_FREE' } },
            status: 'ACTIVE',
            billingCycle: PlanCycle.FREE,
          },
        },
      },
    });
    console.log(`✓ Tenant created: ${tenant.businessName} (${tenant.id})`);
  }

  // Create test user (only if not exists)
  console.log('\nCreating test user...');
  let user = await prisma.user.findUnique({ where: { email: 'admin@testcompany.com' } });
  if (user) {
    console.log(`  - User already exists: ${user.email}`);
  } else {
    const passwordHash = await bcrypt.hash('Test1234!', 12);
    user = await prisma.user.create({
      data: {
        email: 'admin@testcompany.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'Test',
        emailVerified: true,
        isActive: true,
      },
    });
    console.log(`✓ User created: ${user.email}`);
    console.log(`  Password: Test1234!`);
  }

  // Link user to tenant (only if not exists)
  const existingLink = await prisma.tenantUser.findFirst({
    where: { tenantId: tenant.id, userId: user.id },
  });
  if (!existingLink) {
    await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: 'ADMIN',
        isOwner: true,
      },
    });
    console.log(`✓ User linked to tenant`);
  } else {
    console.log(`  - User already linked to tenant`);
  }

  // Create invoice series
  console.log('\nCreating invoice series...');
  const currentYear = new Date().getFullYear();

  let invoiceSeries = await prisma.invoiceSeries.findFirst({
    where: { tenantId: tenant.id, code: 'A', year: currentYear },
  });
  if (!invoiceSeries) {
    invoiceSeries = await prisma.invoiceSeries.create({
      data: {
        tenantId: tenant.id,
        code: 'A',
        name: 'Serie A - Facturas',
        type: 'INVOICE',
        prefix: 'A',
        year: currentYear,
        nextNumber: 1,
        digits: 4,
        isDefault: true,
      },
    });
    console.log(`✓ Invoice series created: ${invoiceSeries.name} (${invoiceSeries.id})`);
  } else {
    console.log(`  - Invoice series already exists: ${invoiceSeries.name}`);
  }

  let rectificativeSeries = await prisma.invoiceSeries.findFirst({
    where: { tenantId: tenant.id, code: 'R', year: currentYear },
  });
  if (!rectificativeSeries) {
    rectificativeSeries = await prisma.invoiceSeries.create({
      data: {
        tenantId: tenant.id,
        code: 'R',
        name: 'Serie R - Rectificativas',
        type: 'RECTIFICATIVE',
        prefix: 'R',
        year: currentYear,
        nextNumber: 1,
        digits: 4,
        isDefault: false,
      },
    });
    console.log(`✓ Rectificative series created: ${rectificativeSeries.name}`);
  } else {
    console.log(`  - Rectificative series already exists: ${rectificativeSeries.name}`);
  }

  // Create test customers
  console.log('\nCreating test customers...');

  let customer1 = await prisma.customer.findFirst({
    where: { tenantId: tenant.id, nif: 'B87654321' },
  });
  if (!customer1) {
    customer1 = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        type: 'COMPANY',
        name: 'Cliente Empresa S.L.',
        legalName: 'Cliente Empresa Sociedad Limitada',
        nif: 'B87654321',
        email: 'contacto@clienteempresa.com',
        phone: '+34987654321',
        address: 'Avenida Principal 456',
        postalCode: '28002',
        city: 'Madrid',
        province: 'Madrid',
        country: 'ES',
        isActive: true,
      },
    });
    console.log(`✓ Customer created: ${customer1.name} (${customer1.id})`);
  } else {
    console.log(`  - Customer already exists: ${customer1.name}`);
  }

  let customer2 = await prisma.customer.findFirst({
    where: { tenantId: tenant.id, nif: '12345678A' },
  });
  if (!customer2) {
    customer2 = await prisma.customer.create({
      data: {
        tenantId: tenant.id,
        type: 'INDIVIDUAL',
        name: 'Juan García López',
        nif: '12345678A',
        email: 'juan@example.com',
        phone: '+34666777888',
        address: 'Calle Secundaria 789',
        postalCode: '28003',
        city: 'Madrid',
        province: 'Madrid',
        country: 'ES',
        isActive: true,
      },
    });
    console.log(`✓ Customer created: ${customer2.name} (${customer2.id})`);
  } else {
    console.log(`  - Customer already exists: ${customer2.name}`);
  }

  // Create test products
  console.log('\nCreating test products...');

  let product1 = await prisma.product.findFirst({
    where: { tenantId: tenant.id, reference: 'CONS-IT-001' },
  });
  if (!product1) {
    product1 = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        type: 'SERVICE',
        name: 'Consultoría IT',
        description: 'Servicios de consultoría tecnológica',
        reference: 'CONS-IT-001',
        unitPrice: 75,
        taxRate: 21,
        unit: 'hora',
        isActive: true,
      },
    });
    console.log(`✓ Product created: ${product1.name} (${product1.id})`);
  } else {
    console.log(`  - Product already exists: ${product1.name}`);
  }

  let product2 = await prisma.product.findFirst({
    where: { tenantId: tenant.id, reference: 'LIC-SW-001' },
  });
  if (!product2) {
    product2 = await prisma.product.create({
      data: {
        tenantId: tenant.id,
        type: 'PRODUCT',
        name: 'Software License',
        description: 'Licencia de software anual',
        reference: 'LIC-SW-001',
        unitPrice: 500,
        taxRate: 21,
        unit: 'unidad',
        isActive: true,
      },
    });
    console.log(`✓ Product created: ${product2.name} (${product2.id})`);
  } else {
    console.log(`  - Product already exists: ${product2.name}`);
  }

  console.log('\n✅ Seed completed successfully!\n');
  console.log('📋 Test credentials:');
  console.log('   Email: admin@testcompany.com');
  console.log('   Password: Test1234!');
  console.log(`   Tenant ID: ${tenant.id}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

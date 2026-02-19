import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean existing data
  console.log('Cleaning existing data...');
  await prisma.verifactuLog.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.invoiceSeries.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Create test tenant
  console.log('Creating test tenant...');
  const tenant = await prisma.tenant.create({
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
      plan: 'PROFESSIONAL',
      isActive: true,
      setupCompleted: true,
    },
  });

  console.log(`✓ Tenant created: ${tenant.businessName} (${tenant.id})`);

  // Create test user
  console.log('\nCreating test user...');
  const passwordHash = await bcrypt.hash('Test1234!', 12);

  const user = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@testcompany.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'Test',
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
    },
  });

  console.log(`✓ User created: ${user.email}`);
  console.log(`  Password: Test1234!`);

  // Create invoice series
  console.log('\nCreating invoice series...');
  const currentYear = new Date().getFullYear();

  const invoiceSeries = await prisma.invoiceSeries.create({
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

  const rectificativeSeries = await prisma.invoiceSeries.create({
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

  console.log(`✓ Invoice series created: ${invoiceSeries.name} (${invoiceSeries.id})`);
  console.log(
    `✓ Rectificative series created: ${rectificativeSeries.name} (${rectificativeSeries.id})`
  );

  // Create test customers
  console.log('\nCreating test customers...');

  const customer1 = await prisma.customer.create({
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

  const customer2 = await prisma.customer.create({
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

  console.log(`✓ Customer created: ${customer1.name} (${customer1.id})`);
  console.log(`✓ Customer created: ${customer2.name} (${customer2.id})`);

  // Create test products
  console.log('\nCreating test products...');

  const product1 = await prisma.product.create({
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

  const product2 = await prisma.product.create({
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

  console.log(`✓ Product created: ${product1.name} (${product1.id})`);
  console.log(`✓ Product created: ${product2.name} (${product2.id})`);

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

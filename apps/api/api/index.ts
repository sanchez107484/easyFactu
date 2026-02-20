import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import helmet from 'helmet';
import compression from 'compression';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Express } from 'express';
import express from 'express';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaExceptionFilter } from '../src/common/filters/prisma-exception.filter';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';

let cachedApp: Express;

async function createApp(): Promise<Express> {
  if (cachedApp) {
    return cachedApp;
  }

  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn', 'log'],
  });

  // Get Reflector for guards
  const reflector = app.get(Reflector);

  // Security
  app.use(
    helmet({
      contentSecurityPolicy: false, // Disable for Vercel
    })
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // Compression
  app.use(compression());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global filters
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // Global guards (JWT auth + Roles)
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('EasyFactura API')
    .setDescription('API para el sistema de facturación con VeriFactu integrado')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación y autorización')
    .addTag('tenants', 'Gestión de empresas (tenants)')
    .addTag('customers', 'Gestión de clientes')
    .addTag('products', 'Gestión de productos y servicios')
    .addTag('invoices', 'Gestión de facturas')
    .addTag('verifactu', 'VeriFactu - Envío a AEAT')
    .addTag('reports', 'Informes y estadísticas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.init();

  cachedApp = expressApp;
  return expressApp;
}

export default async (req: any, res: any) => {
  const app = await createApp();
  return app(req, res);
};

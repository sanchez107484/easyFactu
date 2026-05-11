import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Get Reflector for guards
  const reflector = app.get(Reflector);

  // Serve static files (uploads)
  // process.cwd() must match the uploadDir used in UploadService
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/api/v1/uploads/',
  });

  // Security
  app.use(helmet());

  // Parse allowed origins: FRONTEND_URL supports comma-separated values
  const allowedOrigins = new Set([
    'http://localhost:3000',
    'https://easyfactu-web.vercel.app',
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map((o) => o.trim()) : []),
  ]);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin) and listed origins
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Partner-Key'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
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
    .setTitle('NovaFactura API')
    .setDescription('API para el sistema de facturación con VeriFactu integrado')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticación y autorización')
    .addTag('tenants', 'Gestión de empresas (tenants)')
    .addTag('users', 'Gestión de usuarios')
    .addTag('customers', 'Gestión de clientes')
    .addTag('products', 'Gestión de productos y servicios')
    .addTag('invoices', 'Gestión de facturas')
    .addTag('verifactu', 'VeriFactu - Envío a AEAT')
    .addTag('reports', 'Informes y estadísticas')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Graceful shutdown — releases port on nodemon/ts-node-dev restarts
  app.enableShutdownHooks();

  const port = process.env.APP_PORT || 3001;
  await app.listen(port);

  console.log(`\n🚀 NovaFactura API running on: http://localhost:${port}`);
  console.log(`📚 API Docs available at: http://localhost:${port}/api\n`);
}

bootstrap();

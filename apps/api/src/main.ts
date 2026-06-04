import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
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
    'https://www.novafactura.es',
    'https://novafactura.es',
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
    exposedHeaders: ['Content-Disposition', 'X-Invoices-Count', 'X-Total-Revenue'],
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
      exceptionFactory: (errors) => {
        const CONSTRAINT_ES: Record<string, string> = {
          whitelistValidation: "La propiedad '$property' no está permitida",
          isString: "'$property' debe ser una cadena de texto",
          isNumber: "'$property' debe ser un número",
          isArray: "'$property' debe ser un array",
          isObject: "'$property' debe ser un objeto",
          isBoolean: "'$property' debe ser un booleano",
          isNotEmpty: "'$property' no puede estar vacío",
          isOptional: "'$property' es opcional",
          isEnum: "'$property' tiene un valor no permitido",
          isUUID: "'$property' debe ser un UUID válido",
          isEmail: "'$property' debe ser un email válido",
          isDateString: "'$property' debe ser una fecha válida",
          isUrl: "'$property' debe ser una URL válida",
          min: "'$property' debe ser mayor o igual al mínimo",
          max: "'$property' debe ser menor o igual al máximo",
          minLength: "'$property' es demasiado corto",
          maxLength: "'$property' es demasiado largo",
          arrayMinSize: "'$property' debe tener al menos un elemento",
          isDefined: "'$property' es obligatorio",
          nestedValidation: "Los datos de '$property' no son válidos",
        };

        function extractMessages(errs: typeof errors, prefix = ''): string[] {
          const msgs: string[] = [];
          for (const err of errs) {
            const prop = prefix ? `${prefix}.${err.property}` : err.property;
            if (err.constraints) {
              for (const [key, defaultMsg] of Object.entries(err.constraints)) {
                const template = CONSTRAINT_ES[key];
                // Prefer the decorator's custom message when it looks like a Spanish/custom
                // message (no English 'must'/'should' pattern); fall back to the global template.
                const isCustomMsg = !defaultMsg.includes(' must ') && !defaultMsg.includes(' should ');
                msgs.push(isCustomMsg ? defaultMsg : template ? template.replace(/\$property/g, prop) : defaultMsg);
              }
            }
            if (err.children?.length) {
              msgs.push(...extractMessages(err.children, prop));
            }
          }
          return msgs;
        }

        return new BadRequestException(extractMessages(errors).join('. '));
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

import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: express.Application | null = null;

async function bootstrap(): Promise<express.Application> {
  if (cachedApp) {
    return cachedApp;
  }

  // Dynamic require avoids TypeScript following the import chain into NestJS/Prisma code.
  // The NestJS source is pre-compiled by `nest build` (via buildCommand in vercel.json).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AppModule } = require('../dist/src/app.module') as { AppModule: unknown };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { HttpExceptionFilter } = require('../dist/src/common/filters/http-exception.filter') as {
    HttpExceptionFilter: new () => unknown;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaExceptionFilter } =
    require('../dist/src/common/filters/prisma-exception.filter') as {
      PrismaExceptionFilter: new () => unknown;
    };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LoggingInterceptor } = require('../dist/src/common/interceptors/logging.interceptor') as {
    LoggingInterceptor: new () => unknown;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TransformInterceptor } =
    require('../dist/src/common/interceptors/transform.interceptor') as {
      TransformInterceptor: new () => unknown;
    };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { JwtAuthGuard } = require('../dist/src/modules/auth/guards/jwt-auth.guard') as {
    JwtAuthGuard: new (reflector: Reflector) => unknown;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { RolesGuard } = require('../dist/src/modules/auth/guards/roles.guard') as {
    RolesGuard: new (reflector: Reflector) => unknown;
  };

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule as any, adapter, {
    logger: ['error', 'warn', 'log'],
  });

  const reflector = app.get(Reflector);

  // CORS
  const allowedOrigins = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
    .concat(['http://localhost:3000', 'http://localhost:3001']);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    maxAge: 86400,
  });

  app.setGlobalPrefix('api/v1');

  // Global validation pipe (same as main.ts)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // Global filters
  app.useGlobalFilters(new (PrismaExceptionFilter as any)(), new (HttpExceptionFilter as any)());

  // Global interceptors
  app.useGlobalInterceptors(new (LoggingInterceptor as any)(), new (TransformInterceptor as any)());

  // Global guards (JWT auth + Roles) — must match main.ts
  app.useGlobalGuards(new (JwtAuthGuard as any)(reflector), new (RolesGuard as any)(reflector));

  await app.init();

  cachedApp = expressApp;
  return expressApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  try {
    const app = await bootstrap();
    app(req as any, res as any);
  } catch (error) {
    const err = error as Error;
    // Always log the real error to Vercel function logs
    console.error('[EasyFactura] Bootstrap failed:', err.message, '\n', err.stack);

    res.status(500).json({
      statusCode: 500,
      message: 'Service initialization failed',
      // Show details outside production to aid debugging
      detail: process.env.NODE_ENV !== 'production' ? err.message : 'Check Vercel function logs',
    });
  }
}

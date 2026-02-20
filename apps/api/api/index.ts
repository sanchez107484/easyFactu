import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: express.Application | null = null;

async function bootstrap(): Promise<express.Application> {
  if (cachedApp) {
    return cachedApp;
  }

  // Dynamic require avoids TypeScript following the import chain into NestJS/Prisma code
  // The NestJS source is pre-compiled by `nest build` (via buildCommand in vercel.json)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { AppModule } = require('../dist/src/app.module') as { AppModule: unknown };

  const expressApp = express();
  const adapter = new ExpressAdapter(expressApp);

  const app = await NestFactory.create(AppModule as any, adapter, {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn'],
  });

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

  await app.init();

  cachedApp = expressApp;
  return expressApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const app = await bootstrap();
  app(req as any, res as any);
}

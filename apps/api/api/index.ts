import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from '../src/app.module';

let app: express.Application | null = null;

async function bootstrap() {
  if (app) {
    return app;
  }

  const expressApp = express();
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn'],
  });

  // CORS
  nestApp.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  // Global prefix
  nestApp.setGlobalPrefix('api/v1');

  await nestApp.init();

  app = expressApp;
  return expressApp;
}

export default async (req: Request, res: Response) => {
  // Handle CORS manually for Vercel serverless
  const allowedOrigins = [
    'https://easyfactu-web.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  const origin = req.headers.origin || '';
  const isAllowedOrigin = allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production';

  if (isAllowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept'
  );
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const server = await bootstrap();
  return server(req, res);
};

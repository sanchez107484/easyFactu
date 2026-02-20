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
  const server = await bootstrap();
  return server(req, res);
};

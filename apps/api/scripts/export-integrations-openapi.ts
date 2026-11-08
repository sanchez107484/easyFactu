/**
 * Writes the OpenAPI of the ERP integration contract to openapi/integrations-v1.json.
 *
 *   pnpm openapi:integrations [apiUrl]
 *
 * Builds the module graph in preview mode: no provider is instantiated, so it needs no
 * database, secrets or network. Publish the generated file to the ERP team.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';
import { buildIntegrationsOpenApi } from '../src/modules/integrations/openapi/integrations-openapi';

async function exportOpenApi(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
    abortOnError: false,
  });
  app.setGlobalPrefix('api/v1');
  const document = buildIntegrationsOpenApi(app, process.argv[2]);
  const outputDir = join(__dirname, '..', 'openapi');
  mkdirSync(outputDir, { recursive: true });
  const outputFile = join(outputDir, 'integrations-v1.json');
  writeFileSync(outputFile, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  console.log(`OpenAPI written to ${outputFile} (${Object.keys(document.paths).length} paths)`);
  await app.close();
}

exportOpenApi().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

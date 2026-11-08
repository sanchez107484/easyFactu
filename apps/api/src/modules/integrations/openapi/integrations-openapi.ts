import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { API_KEY_SECURITY, PROVISIONING_SECURITY } from '../decorators/integration-docs.decorators';
import { INTEGRATIONS_V1_PATH } from '../integrations.constants';
import { IntegrationsModule } from '../integrations.module';

const CONTRACT_PATH_PREFIX = `/${INTEGRATIONS_V1_PATH}`;

const DESCRIPTION = `
Un solo contrato, servido igual por NovaFactura y Nafactura. El servidor es el \`apiUrl\` devuelto en el alta.

- **Autenticación**: \`Authorization: Bearer nfk_live_…\` (sandbox: \`nfk_test_…\`). La key define la clínica; nunca se envía el tenant.
- **Idempotency-Key**: obligatoria en todo POST. Misma clave y mismo cuerpo: misma respuesta (200). Otra petición con la misma clave: 409 IDEMPOTENCY_CONFLICT. En curso: 409 REQUEST_IN_PROGRESS. Se guarda 30 días. Las API keys no se guardan: en un reintento \`apiKey\` vuelve null.
- **X-Request-Id**: se respeta si se envía; si no, se genera. Vuelve siempre y queda en los logs.
- **Límite**: 60 peticiones por minuto y key, con cabeceras RateLimit-* y Retry-After en 429.
- **Importes**: texto decimal con punto ("35.00"). Precio con IVA incluido; el total coincide al céntimo con la suma cobrada, \`round_half_up(cantidad × precio × (1 − descuento %))\` por línea.
- **Errores**: \`application/problem+json\` (RFC 9457) con \`code\` estable y \`retryable\`.
- **Compatibilidad**: añadir campos o códigos no rompe v1; ignora lo que no conozcas. Un cambio incompatible es /v2.
`.trim();

/** OpenAPI of the ERP contract only (the consent endpoints belong to the web app). */
export function buildIntegrationsOpenApi(
  app: INestApplication,
  apiUrl = 'https://api.novafactura.es/api/v1'
): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('NovaFactura · API de integración v1')
    .setDescription(DESCRIPTION)
    .setVersion('1.0.0')
    .addServer('{apiUrl}', 'apiUrl devuelto en el alta', { apiUrl: { default: apiUrl } })
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        description: 'API key de la clínica (nfk_live_/nfk_test_)',
      },
      API_KEY_SECURITY
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        description: 'Secreto de alta del ERP (ERP_PROVISION_SECRET)',
      },
      PROVISIONING_SECURITY
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    include: [IntegrationsModule],
    ignoreGlobalPrefix: true,
  });
  document.paths = Object.fromEntries(
    Object.entries(document.paths).filter(([path]) => path.startsWith(CONTRACT_PATH_PREFIX))
  );
  return document;
}

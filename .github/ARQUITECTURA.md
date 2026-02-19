# Arquitectura EasyFactura

## Overview

EasyFactura es una aplicación de facturación multi-tenant que cumple con la normativa VeriFactu de la AEAT española.

## Estructura del Proyecto

```
easyFactura/
├── backend/              # Backend NestJS (proyecto independiente)
│   ├── src/
│   │   ├── modules/          # Módulos de negocio (invoices, customers, verifactu)
│   │   ├── shared/           # Tipos, validadores y constantes compartidos
│   │   ├── common/           # Guards, decorators, filters, DTOs comunes
│   │   └── supabase/         # Configuración de Supabase client
│   ├── prisma/               # Esquema y migraciones
│   ├── docker-compose.yml    # Redis local para colas
│   └── package.json
│
├── frontend/             # Frontend Next.js (proyecto independiente)
│   ├── src/
│   │   ├── app/              # App Router de Next.js 15
│   │   ├── components/       # Componentes React + Shadcn/ui
│   │   ├── hooks/            # Custom hooks y TanStack Query
│   │   ├── lib/              # Supabase client, utilidades
│   │   └── stores/           # Estado global con Zustand
│   └── package.json
│
├── .github/
│   ├── claude.md             # Instrucciones para Claude
│   ├── copilot-instructions.md
│   └── ARQUITECTURA.md       # Este archivo
│
├── .gitignore
└── README.md
```

## Stack Tecnológico

### Frontend

- **Framework**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS v4 + Shadcn/ui
- **State**: Zustand (estado global) + TanStack Query (server state)
- **Forms**: React Hook Form + Zod
- **Auth**: Supabase Auth (@supabase/ssr para Next.js)
- **Deploy**: Vercel

### Backend

- **Framework**: NestJS + TypeScript
- **ORM**: Prisma (conectado a Supabase PostgreSQL)
- **Auth**: Integración con Supabase Auth via @supabase/supabase-js
- **Colas**: BullMQ + Redis (para envíos asíncronos a AEAT)
- **PDF**: PDFKit o Puppeteer
- **Firma Digital**: node-forge o @peculiar/x509
- **Deploy**: Railway

### Base de Datos y Servicios

- **Database**: Supabase PostgreSQL
  - Row Level Security (RLS) habilitado
  - Políticas RLS por tenant_id
  - Database Functions para operaciones atómicas
- **Auth**: Supabase Auth
  - Email/password
  - JWT gestionado automáticamente
  - Session management
- **Storage**: Supabase Storage
  - Bucket `certificates`: privado (certificados digitales)
  - Bucket `invoices`: público (PDFs de facturas)
  - Bucket `logos`: público (logos de empresas)

- **Redis**: Upstash Redis (producción) / Docker (desarrollo)
  - Colas BullMQ para VeriFactu
  - Jobs de envío a AEAT con reintentos
  - Backoff exponencial

- **Email**: Resend
  - Notificaciones transaccionales
  - Verificación de email
  - Alertas de factura

## Arquitectura Multi-Tenant

### Estrategia: Shared Database con Row Level Security

```sql
-- Todas las tablas incluyen tenant_id
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  -- ... otros campos
);

-- Índice compuesto para performance
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id, created_at DESC);

-- RLS Policy
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON invoices
  USING (tenant_id = auth.uid()::uuid OR tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));
```

### Ventajas

- Aislamiento total de datos
- Seguridad a nivel de base de datos
- Performance optimizada con índices
- Escalabilidad hasta miles de tenants

### Desventajas Mitigadas

- **Riesgo de leak de datos**: Mitigado con RLS + validación en backend
- **Complejidad de queries**: Automático con RLS
- **Backup por tenant**: Supabase maneja backups automáticos

## Autenticación y Autorización

### Flujo de Autenticación

1. **Usuario se registra** (frontend)

   ```typescript
   // frontend/lib/auth.ts
   const { data, error } = await supabase.auth.signUp({
     email: "user@example.com",
     password: "password",
     options: {
       data: {
         firstName: "John",
         lastName: "Doe",
       },
     },
   });
   ```

2. **Supabase crea usuario** y genera JWT
   - Access token (1 hora)
   - Refresh token (30 días)

3. **Backend valida JWT** en cada request

   ```typescript
   // backend/src/common/guards/supabase-auth.guard.ts
   @Injectable()
   export class SupabaseAuthGuard implements CanActivate {
     async canActivate(context: ExecutionContext): Promise<boolean> {
       const request = context.switchToHttp().getRequest();
       const token = request.headers.authorization?.replace("Bearer ", "");

       const {
         data: { user },
         error,
       } = await this.supabase.auth.getUser(token);

       if (error || !user) throw new UnauthorizedException();

       request.user = user;
       return true;
     }
   }
   ```

4. **Metadata adicional** en tabla `users`
   ```sql
   CREATE TABLE users (
     id UUID PRIMARY KEY REFERENCES auth.users(id),
     tenant_id UUID NOT NULL REFERENCES tenants(id),
     first_name TEXT NOT NULL,
     last_name TEXT NOT NULL,
     role TEXT NOT NULL DEFAULT 'VIEWER',
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

### Roles y Permisos

```typescript
export enum UserRole {
  ADMIN = "ADMIN", // Acceso total al tenant
  ACCOUNTANT = "ACCOUNTANT", // Gestión de facturas y clientes
  VIEWER = "VIEWER", // Solo lectura
}
```

Implementado con:

- **Guard personalizado** en NestJS: `@Roles('ADMIN', 'ACCOUNTANT')`
- **Políticas RLS** en Supabase que validan el rol
- **Decoradores** para extraer tenant_id y user_id

## Integración Supabase + NestJS

### Configuración del Cliente

```typescript
// backend/src/supabase/supabase.service.ts
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private client: SupabaseClient;

  constructor(private config: ConfigService) {
    this.client = createClient(
      this.config.get("SUPABASE_URL"),
      this.config.get("SUPABASE_SERVICE_KEY"), // Service key para bypass RLS
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  // Cliente con user context (respeta RLS)
  getClientForUser(accessToken: string): SupabaseClient {
    return createClient(
      this.config.get("SUPABASE_URL"),
      this.config.get("SUPABASE_ANON_KEY"),
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      },
    );
  }
}
```

### Uso con Prisma

```typescript
// Prisma sigue usando DATABASE_URL de Supabase
// backend/src/modules/invoices/invoice.service.ts
@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
  ) {}

  async create(tenantId: string, dto: CreateInvoiceDto): Promise<Invoice> {
    // Lógica de negocio con Prisma
    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        ...dto,
      },
    });

    // PDF a Supabase Storage
    const pdfBuffer = await this.generatePdf(invoice);
    const { data, error } = await this.supabase
      .getClient()
      .storage.from("invoices")
      .upload(`${tenantId}/${invoice.id}.pdf`, pdfBuffer);

    return invoice;
  }
}
```

## VeriFactu - Cumplimiento Legal

### Requisitos Ley 11/2021

1. **Numeración correlativa** sin huecos
2. **Hash encadenado** SHA-256
3. **Firma digital** XAdES-BES con certificado
4. **QR** con datos fiscales
5. **Registro inmutable** de eventos
6. **Conservación** de facturas mínimo 4 años

### Implementación

#### 1. Hash Encadenado

```typescript
// backend/src/modules/verifactu/services/verifactu-hash.service.ts
export class VerifactuHashService {
  async generateChainedHash(
    tenantId: string,
    invoice: Invoice,
  ): Promise<string> {
    // Obtener hash anterior
    const previousInvoice = await this.prisma.invoice.findFirst({
      where: {
        tenantId,
        status: InvoiceStatus.CONFIRMED,
        createdAt: { lt: invoice.createdAt },
      },
      orderBy: { createdAt: "desc" },
    });

    const prevHash = previousInvoice?.verifactuHash || "";

    // Generar hash actual
    const dataToHash = [
      invoice.tenant.nif,
      invoice.number,
      invoice.issueDate,
      invoice.type,
      invoice.taxAmount.toString(),
      invoice.total.toString(),
      prevHash,
      new Date().toISOString(),
    ].join("|");

    return crypto.createHash("sha256").update(dataToHash).digest("hex");
  }
}
```

#### 2. Generación QR

```typescript
// backend/src/modules/verifactu/services/verifactu-qr.service.ts
export class VerifactuQrService {
  async generateQr(invoice: Invoice): Promise<string> {
    const qrData = {
      nif: invoice.tenant.nif,
      num: invoice.number,
      fecha: invoice.issueDate,
      importe: invoice.total,
      id: `VF-${format(invoice.issueDate, "yyyyMMdd")}-${invoice.tenant.nif}-${invoice.number}`,
      tipo: "F1", // Sistema informático
    };

    const qrString = Object.entries(qrData)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");

    return QRCode.toDataURL(qrString);
  }
}
```

#### 3. Envío Asíncrono a AEAT

```typescript
// backend/src/modules/verifactu/verifactu.processor.ts
@Processor("verifactu")
export class VerifactuProcessor {
  @Process("send-to-aeat")
  async sendToAeat(job: Job<{ tenantId: string; invoiceId: string }>) {
    const { tenantId, invoiceId } = job.data;

    try {
      // 1. Generar XML
      const xml = await this.xmlService.generateXml(invoice);

      // 2. Firmar con certificado
      const signedXml = await this.signerService.sign(xml, certificate);

      // 3. Enviar a AEAT
      const response = await this.senderService.send(signedXml);

      // 4. Actualizar estado
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          verifactuStatus: VerifactuStatus.ACCEPTED,
          verifactuSentAt: new Date(),
        },
      });
    } catch (error) {
      // Reintentar con backoff exponencial
      throw error;
    }
  }
}
```

## Storage en Supabase

### Estructura de Buckets

```
supabase-storage/
├── certificates/         # Privado, RLS habilitado
│   └── {tenant_id}/
│       └── certificate.p12
│
├── invoices/             # Público (solo lectura)
│   └── {tenant_id}/
│       └── {invoice_id}.pdf
│
└── logos/                # Público
    └── {tenant_id}.png
```

### Configuración de Buckets

```sql
-- Bucket para certificados (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false);

-- Policy: solo el tenant puede leer su certificado
CREATE POLICY tenant_certificate_access ON storage.objects
FOR SELECT
USING (
  bucket_id = 'certificates' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Bucket para facturas (público pero solo administradores pueden escribir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', true);

CREATE POLICY tenant_invoice_upload ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'invoices' AND
  (storage.foldername(name))[1] IN (
    SELECT tenant_id::text FROM users WHERE id = auth.uid()
  )
);
```

## Desarrollo Local

### Opción 1: Supabase Local (Recomendado)

```bash
cd backend

# Instalar Supabase CLI
pnpm add -D supabase

# Iniciar Supabase local
npx supabase init
npx supabase start

# Esto levanta:
# - PostgreSQL en localhost:54322
# - Studio en http://localhost:54323
# - Kong API Gateway
# - Auth server
```

### Opción 2: Supabase Cloud (Desarrollo)

```bash
# Crear proyecto en https://supabase.com
# Copiar credenciales al .env

# backend/.env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

## Deploy

### Frontend (Vercel)

```bash
cd frontend
vercel --prod

# Variables de entorno en Vercel:
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_API_URL=https://api.easyfactura.es
```

### Backend (Railway)

```bash
cd backend
railway login
railway init
railway up

# Variables de entorno en Railway:
NODE_ENV=production
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
```

### Base de Datos (Supabase)

1. Crear proyecto en Supabase
2. Habilitar RLS en todas las tablas
3. Configurar políticas por tabla
4. Crear buckets de Storage
5. Configurar SMTP para emails (opcional)

## Monitoreo y Logs

- **Supabase**: Dashboard integrado con analytics y logs de queries
- **Railway**: Logs de aplicación en tiempo real
- **Sentry**: Tracking de errores (frontend y backend)
- **BullBoard**: Dashboard de colas BullMQ (http://localhost:3001/queues)

## Seguridad

### Checklist

- [x] RLS habilitado en todas las tablas
- [x] Políticas RLS por tenant_id
- [x] JWT validado en backend
- [x] Rate limiting (100 req/min)
- [x] CORS configurado correctamente
- [x] Helmet.js para headers de seguridad
- [x] Validación estricta de DTOs con class-validator
- [x] Certificados digitales encriptados con AES-256
- [x] Logs sin datos sensibles
- [x] HTTPS en producción (automático con Vercel/Railway)
- [x] Secrets en variables de entorno, nunca en código

## FAQs

**¿Por qué NestJS si Supabase tiene Edge Functions?**

- VeriFactu requiere lógica compleja (firma digital, generación PDF, hash encadenado)
- NestJS permite testing robusto, inyección de dependencias, arquitectura modular
- Edge Functions son mejores para operaciones simples y serverless

**¿Por qué Prisma si Supabase tiene su propio cliente?**

- Migraciones versionadas y control de esquema
- Type safety con generación automática de tipos
- Mejor DX para queries complejas
- Compatibilidad con cualquier PostgreSQL (no vendor lock-in)

**¿Necesito RLS si ya valido en el backend?**

- Sí. Defensa en profundidad (defense in depth)
- RLS garantiza aislamiento incluso si hay bug en backend
- Requisito de seguridad para datos fiscales

**¿Cómo escalar si crezco mucho?**

- Supabase escala verticalmente automáticamente
- Para escalar horizontalmente: considerar sharding por tenant_id
- Caché con Redis para queries frecuentes
- CDN para archivos estáticos

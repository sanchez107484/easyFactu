# EasyFactura — Project Copilot Agent Instructions

> **Bootstrapped**: 2026-04-26 | **Last updated**: 2026-04-26 | **Stack**: NestJS 10 + Next.js 15 + Prisma 6 + PostgreSQL (Supabase)  
> This file is the single source of truth for any AI agent working in this repo.  
> Read this file FIRST before writing any code. Update it when architecture changes.

---

## 0) Purpose

**EasyFactura** is a SaaS invoicing platform for Spanish autónomos and SMEs with **VeriFactu** integration (AEAT fiscal obligation since 2025). It handles invoice creation, series management, recurring billing, payments, customer/product catalogs, digital certificate signing, and XML submission to the AEAT registry.

- **Legal gravity**: Every invoice confirmation is fiscally irreversible. The VeriFactu hash chain cannot be broken or modified post-confirmation.
- **Target users**: Spanish autónomos and PYMEs (FREE / BASIC / PROFESSIONAL plans), plus gestoría/agencies managing multiple tenants.
- **Domain**: novafactura.es (production)

---

## 1) Workspace Map

| Field           | Value                    |
| --------------- | ------------------------ |
| Repo type       | **Monorepo** (Turborepo) |
| Package manager | **pnpm 9.15.4**          |
| Node version    | >=20.0.0                 |
| Build system    | Turborepo 2.x            |
| TypeScript      | 5.7.x, strict mode       |

### Units

| Path                         | Name                             | Type     | Stack                                           | Dev port |
| ---------------------------- | -------------------------------- | -------- | ----------------------------------------------- | -------- |
| `apps/api`                   | `@easyfactura/backend`           | Backend  | NestJS 10, Prisma 6, PostgreSQL                 | **3001** |
| `apps/web`                   | `@easyfactura/web`               | Frontend | Next.js 15 App Router, React 18                 | **3000** |
| `packages/shared-types`      | `@easyfactura/shared-types`      | Package  | TypeScript types/enums                          | —        |
| `packages/shared-constants`  | `@easyfactura/shared-constants`  | Package  | Tax rates, countries, units, etc.               | —        |
| `packages/shared-validators` | `@easyfactura/shared-validators` | Package  | NIF, IBAN, email, phone, postal-code validators | —        |
| `packages/brand-config`      | `@easyfactura/brand-config`      | Package  | Brand + theme config                            | —        |

---

## 2) How to run (canonical)

```bash
# Install all dependencies (run from root)
pnpm install

# Dev (all units in parallel via Turborepo)
pnpm dev
# Runs: api on :3001, web on :3000

# Lint
pnpm lint

# Format
pnpm format

# Type-check (web only — api uses tsc via nest build)
cd apps/web && pnpm type-check

# Test (no unit tests exist yet — zero .spec.ts files found)
pnpm test

# Build (all units)
pnpm build

# Clean (removes dist + node_modules — requires re-install)
pnpm clean

# --- API-only commands (run from apps/api) ---
pnpm prisma:generate          # Regenerate Prisma client
pnpm prisma:migrate           # Create + apply migration (dev)
pnpm prisma:migrate:deploy    # Apply pending migrations (production) ⚠️
pnpm prisma:studio            # Open Prisma Studio GUI
pnpm prisma:seed              # Seed the database ⚠️
```

---

## 3) Architecture Snapshot

### Routing

- **Next.js App Router** (no Pages Router). Route groups:
  - `(auth)/` — login, registro, verificar-email, recuperar/nueva-password
  - `(legal)/` — aviso-legal, politica-privacidad, etc.
  - `dashboard/` — authenticated SPA shell: facturas, clientes, productos, recurrentes, presupuestos, informes, ajustes, verifactu
  - `blog/` — Sanity CMS powered blog
  - `api/` — Next.js API routes (PDF generation via Playwright/Chromium)

### Key directories

**Backend `apps/api/src/`**

```
app.module.ts             # Root module, imports all feature modules
main.ts                   # Bootstrap: Helmet, CORS, compression, global pipes/guards/filters
common/
  decorators/             # @CurrentTenant(), @CurrentUser(), @Public(), @Roles()
  filters/                # HttpExceptionFilter, PrismaExceptionFilter
  interceptors/           # LoggingInterceptor, TransformInterceptor
  dto/                    # Shared DTOs (pagination, etc.)
  validators/             # Custom class-validator validators
prisma/                   # PrismaModule + PrismaService + withTransactionRetry (bounded retries on transient Prisma errors)
modules/
  auth/                   # JWT auth (login, register, refresh, email verify, password reset)
  tenants/                # Tenant CRUD + user management
  customers/              # Customer catalog
  products/               # Product/service catalog
  invoices/               # Invoice lifecycle + calculation + numbering
  invoice-series/         # Serie management (A-2025, R-2025, etc.)
  invoice-templates/      # PDF template layouts (JSON)
  invoice-defaults/       # Default values per tenant
  recurring-invoices/     # Cron-based recurring billing
  payments/               # Payment tracking (full/partial)
  verifactu/              # AEAT VeriFactu: hash, XML, signing, sending, QR
  agency/                 # Gestoría/agency multi-client management (confirmed ✅)
```

**Frontend `apps/web/src/`**

```
app/                      # Next.js App Router pages
components/               # Feature + UI components (organized by domain)
  ui/                     # Shadcn/ui primitives
  facturas/               # Invoice-specific components
  clientes/               # Customer components
  dashboard/              # Dashboard shell, widgets
  ...
hooks/                    # TanStack Query hooks (use-invoices.ts, use-customers.ts, etc.)
lib/
  api-client.ts           # Axios instance + auth interceptors (auto-refresh on 401)
  api/                    # Per-resource API functions (invoice-api.ts, customer-api.ts, etc.)
  api-error.ts            # Centralised error message extraction
  api-response.ts         # Response unwrapper (unwrapApiResponse)
  utils.ts                # cn() and generic helpers
  math.ts                 # Client-side math helpers
store/
  auth-store.ts           # Zustand: user, currentTenant, tenants[], isAuthenticated
  ui-store.ts             # Zustand: UI state (sidebar, modals, etc.)
middleware.ts             # Permissive — auth is verified client-side in dashboard layout
```

### Data flow

```
Web Component
  → TanStack Query hook (use-invoices.ts)
    → API function (lib/api/invoice-api.ts)
      → apiClient (Axios, auto-injects Bearer token)
        → NestJS controller (GET /api/v1/invoices)
          → Service (invoice.service.ts)
            → Prisma (PostgreSQL / Supabase)
```

### State management

- **Server state**: TanStack Query v5 (all API data, caching, mutations)
- **Client state**: Zustand v5 (auth session, UI preferences)
- **Forms**: React Hook Form + Zod

### Invoice Status Machine

```
DRAFT ──────────────────────────► CONFIRMED ──► SENT ──► PAID
  │                                    │
  ▼                                    ▼
PROFORMA                           RECTIFIED (via rectificativa invoice)
  │
  ▼
QUOTE (presupuesto — separate flow)
```

> Once `CONFIRMED`, a VeriFactu hash is embedded. **Status cannot roll back.**

---

## 4) Multi-Tenancy

- Every `Tenant` has isolated data. **ALL Prisma queries MUST include `where: { tenantId }`.**
- `tenantId` is extracted from the JWT payload via `@CurrentTenant()` decorator — **never from request body**.
- Users can belong to multiple tenants. `currentTenant` is set at login or via `switchTenant()`.
- Roles per tenant: `OWNER` > `ADMIN` > `ACCOUNTANT` > `VIEWER`.
- Supabase RLS is enabled (`enable-rls.sql`) as a secondary defense layer.

```typescript
// ✅ CORRECT — always
async findAll(tenantId: string, query: QueryInvoiceDto) {
  return this.prisma.invoice.findMany({
    where: { tenantId, ...filters },
  });
}

// ❌ NEVER — missing tenantId
async findAll(query: QueryInvoiceDto) {
  return this.prisma.invoice.findMany({ where: { ...filters } });
}
```

---

## 5) Auth

| Layer               | Implementation                                                                 |
| ------------------- | ------------------------------------------------------------------------------ |
| Strategy            | Custom JWT (not Supabase Auth)                                                 |
| Access token        | Short-lived (15m), stored in `localStorage`                                    |
| Refresh token       | Long-lived (7d), stored in `localStorage`, sent in request body                |
| Guard               | `JwtAuthGuard` + `RolesGuard` applied globally in `main.ts`                    |
| Public routes       | Decorated with `@Public()`                                                     |
| Tenant extraction   | `@CurrentTenant()` → `request.user.tenantId` from JWT payload                  |
| Auto-refresh        | `apiClient` interceptor retries on 401 with refresh token                      |
| Frontend middleware | `middleware.ts` is permissive — auth validated client-side in dashboard layout |

---

## 6) Environment Variables

### Backend (`apps/api/.env`) — see `apps/api/.env.example`

| Variable                        | Purpose                           | Notes                                                      |
| ------------------------------- | --------------------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`                  | Supabase Transaction Pooler       | Port 6543, `?pgbouncer=true&connection_limit=1`            |
| `DIRECT_URL`                    | Supabase direct connection        | Port 5432, for Prisma migrations only                      |
| `SUPABASE_URL`                  | Supabase project URL              |                                                            |
| `SUPABASE_ANON_KEY`             | Supabase public key               |                                                            |
| `SUPABASE_SERVICE_KEY`          | Supabase service role key         | **Backend only — never expose to frontend**                |
| `REDIS_URL`                     | Upstash (prod) / Docker (dev)     | Present in .env.example — verify if Redis/BullMQ is active |
| `JWT_ACCESS_SECRET`             | Sign access tokens                | Min 32 chars                                               |
| `JWT_REFRESH_SECRET`            | Sign refresh tokens               | Min 32 chars                                               |
| `JWT_ACCESS_EXPIRATION`         | Access token TTL                  | Default `15m`                                              |
| `JWT_REFRESH_EXPIRATION`        | Refresh token TTL                 | Default `7d`                                               |
| `APP_PORT`                      | API listen port                   | Default `3001`                                             |
| `FRONTEND_URL`                  | CORS allowed origin(s)            | Comma-separated                                            |
| `RESEND_API_KEY`                | Transactional email               |                                                            |
| `EMAIL_FROM`                    | Sender address                    |                                                            |
| `VERIFACTU_ENVIRONMENT`         | `sandbox` or `production`         | **Switch carefully — production sends to AEAT**            |
| `VERIFACTU_ENDPOINT_SANDBOX`    | AEAT pre-production URL           |                                                            |
| `VERIFACTU_ENDPOINT_PRODUCTION` | AEAT production URL               |                                                            |
| `CERTIFICATE_ENCRYPTION_KEY`    | AES encryption for certs          | **Must be 64 hex chars (32 bytes)**                        |
| `UPLOAD_DIR`                    | Upload directory path             | Default `uploads`                                          |
| `SCHEDULER_SECRET`              | Secures recurring invoice trigger | Strong random hex in production                            |

### Frontend (`apps/web/.env.local`) — see `apps/web/.env.example`

| Variable                         | Purpose                                             |
| -------------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`            | Backend base URL (e.g. `http://localhost:3001/api`) |
| `NEXT_PUBLIC_APP_URL`            | Frontend URL                                        |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`  | Sanity blog project                                 |
| `NEXT_PUBLIC_SANITY_DATASET`     | Sanity dataset                                      |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Sanity API version                                  |
| `SANITY_REVALIDATE_SECRET`       | Webhook secret for ISR revalidation                 |
| `NEXT_PUBLIC_GTM_ID`             | Google Tag Manager container ID                     |

---

## 7) Security Rules (repo-specific)

> Seguridad por diseño. El middleware `JwtAuthGuard` + `RolesGuard` está aplicado **globalmente** en `main.ts`. Las rutas públicas se marcan con `@Public()`. Supabase RLS actúa como segunda línea de defensa.

### NEVER do this

```typescript
// ❌ tenantId desde el body — el cliente puede suplantar a otro tenant
const { tenantId } = req.body;

// ❌ Query sin filtro → data leak entre tenants
const all = await this.prisma.invoice.findMany();

// ❌ Devolver null y dejar que el llamador explote más tarde
async findOne(id: string) {
  return this.prisma.invoice.findUnique({ where: { id } }); // null si no existe
}

// ❌ Stack trace o datos internos al cliente
catch (e) { throw new Error(e.message + e.stack); }

// ❌ Silenciar errores
try { riskyOperation(); } catch (e) {}

// ❌ Log de datos sensibles
console.log('Certificate:', certBuffer, 'Token:', token, 'NIF:', nif);
```

- Log passwords, JWT tokens, certificate contents, or full NIFs/CIFs
- Accept `tenantId` from request body — always extract from JWT
- Skip DTO validation in any controller
- Use `any` TypeScript type — use `unknown` + type narrowing
- Use `@ts-ignore` or `@ts-expect-error`
- Expose `SUPABASE_SERVICE_KEY` to the frontend
- Change `VERIFACTU_ENVIRONMENT` to `production` without explicit confirmation
- Modify confirmed invoices (VeriFactu hash chain integrity)
- Run `prisma migrate reset` without explicit user confirmation
- Remove or bypass `JwtAuthGuard`

### ALWAYS do this

```typescript
// ✅ tenantId siempre del JWT — nunca del body
@Get()
async findAll(@CurrentTenant() tenantId: string, @Query() query: QueryInvoiceDto) {
  return this.invoiceService.findAll(tenantId, query);
}

// ✅ Toda query filtrada + fail fast con excepción tipada
async findOneOrFail(tenantId: string, id: string): Promise<Invoice> {
  const invoice = await this.prisma.invoice.findFirst({ where: { id, tenantId } });
  if (!invoice) throw new NotFoundException(`Factura ${id} no encontrada`);
  return invoice; // Nunca null después de aquí
}

// ✅ Operaciones multi-tabla siempre en transacción
async confirmInvoice(tenantId: string, id: string) {
  return this.prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({ where: { id, tenantId } });
    const series = await tx.invoiceSeries.update({ ... });
    return tx.invoice.update({ where: { id }, data: { status: 'CONFIRMED' } });
  });
}
```

- Filter every Prisma query by `tenantId`
- Use `whitelist: true` + `forbidNonWhitelisted: true` on ValidationPipe (already global)
- Wrap multi-table operations in `prisma.$transaction()`
- Return `NotFoundException` when a resource is not found for a tenant (not null)
- Validate inputs via DTOs on the backend even if frontend already validates
- Use `@Public()` explicitly for routes that skip JWT — never implicitly

### Rate limiting

- Global: 100 requests / 60 seconds (`ThrottlerGuard` in `AppModule`)
- PDF generation route: 60s timeout (Vercel function limit)
- Frontend security headers confirmed in `next.config.ts`: `X-Frame-Options: DENY`, `HSTS`, `X-Content-Type-Options`, `Referrer-Policy`

---

## 8) Engineering Principles

> No negociables. Si no se cumplen, el código no está terminado.

### Proceso mental antes de escribir cualquier función

```
1. ¿Ya existe algo similar en el proyecto? → busca con grep/semantic search primero
2. ¿Una sola responsabilidad? → si hace 2 cosas, son 2 funciones
3. ¿Qué pasa cuando los inputs son inválidos? → diseña el error path primero
4. ¿A qué capa pertenece? → controlador orquesta, servicio tiene lógica, hook gestiona datos
5. ¿El nombre lo explica sin comentario? → si no, el nombre está mal
```

### Responsabilidad única — lo que va en cada capa

```typescript
// ❌ Lógica de negocio en el controlador
@Post()
async create(@Body() dto: CreateInvoiceDto) {
  const last = await this.prisma.invoice.findFirst({ orderBy: { number: 'desc' } });
  const nextNumber = (last?.number ?? 0) + 1;
  const total = dto.lines.reduce((s, l) => s + l.price * l.qty, 0);
  return this.prisma.invoice.create({ data: { ...dto, number: nextNumber, total } });
}

// ✅ Controlador que solo orquesta (patrón real del repo)
@Post()
async create(@Body() dto: CreateInvoiceDto, @CurrentTenant() tenantId: string) {
  return this.invoiceService.create(tenantId, dto);
}
// El servicio llama a: InvoiceNumberService + InvoiceCalculationService + VerifactuService
```

```tsx
// ❌ Componente con fetch, estado y presentación mezclados
export function InvoiceTable() {
  const [invoices, setInvoices] = useState([]);
  useEffect(() => {
    fetch('/api/v1/invoices')
      .then((r) => r.json())
      .then(setInvoices);
  }, []);
  return (
    <table>
      {invoices.map((i) => (
        <tr key={i.id}>
          <td>{i.number}</td>
        </tr>
      ))}
    </table>
  );
}

// ✅ Patrón real del repo: hook + tres estados
export function InvoiceTable({ filters }: { filters: QueryInvoicesInput }) {
  const { data, isLoading, error } = useInvoices(filters); // hook de TanStack Query

  if (isLoading) return <InvoiceTableSkeleton />;
  if (error) return <ErrorState message="Error al cargar las facturas" />;
  if (!data?.data.length) return <EmptyState title="No hay facturas" />;

  return <DataTable data={data.data} columns={invoiceColumns} />;
}
```

### DRY — si aparece 2 veces, va a shared

```typescript
// ❌ Misma lógica en invoice.service.ts y recurring-invoice.service.ts
const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity * (1 - l.discount / 100), 0);

// ✅ Extraído a InvoiceCalculationService (ya existe en el repo — úsalo)
const totals = this.calculationService.compute(lines);
// → packages/shared-types para tipos compartidos front↔back
// → InvoiceCalculationService para cálculos fiscales
// → hooks/use-invoices.ts para queries, nunca en componentes
```

### TypeScript que previene bugs reales

```typescript
// ❌ any — el compilador se rinde
function processApiResponse(data: any) {
  return data.invoices[0].total; // Explota en runtime sin aviso
}

// ✅ unknown + type narrowing
function processApiResponse(data: unknown): number {
  if (!isInvoiceListResponse(data)) throw new Error('Unexpected API shape');
  return data.invoices[0].total; // TypeScript verifica la forma
}

// ✅ Discriminated unions — TypeScript fuerza todos los casos
type InvoiceState =
  | { status: 'draft' }
  | { status: 'confirmed'; hash: string; confirmedAt: Date }
  | { status: 'sent'; sentAt: Date }
  | { status: 'paid'; paidAt: Date; paymentMethod: PaymentMethod };
// Si agregas un status nuevo y no actualizas el switch → error de compilación
```

### Naming que documenta

```typescript
// ❌ Nombres que no explican nada
const d = new Date();
const arr = inv.filter(x => x.s === 'C' && !x.d);
function proc(s: string, n: number) { ... }

// ✅ Nombres que reemplazan al comentario
const today = new Date();
const confirmedInvoices = invoices.filter(inv => inv.status === InvoiceStatus.CONFIRMED && !inv.isDeleted);
function generateChainedHash(tenantId: string, invoiceNumber: string): Promise<string> { ... }

// Reglas de este repo:
// camelCase     → variables, funciones, hook returns
// PascalCase    → clases, componentes React, interfaces/tipos
// kebab-case    → archivos (invoice-form.tsx, create-invoice.dto.ts)
// UPPER_SNAKE   → constantes globales, enum values, env vars
// snake_case    → @map() de Prisma (columnas/tablas de BD)
// is/has/can    → booleanos (isLoading, hasPermission, canConfirm)
```

### Límites de tamaño

| Unidad           | Máximo     | Patrón del repo si supera                        |
| ---------------- | ---------- | ------------------------------------------------ |
| Función / método | 30 líneas  | Extrae helpers privados con nombres descriptivos |
| Componente React | 150 líneas | Extrae subcomponentes en mismo dominio           |
| NestJS service   | 200 líneas | Extrae `feature-*.service.ts` auxiliar           |
| Archivo          | 300 líneas | Divide por responsabilidad                       |

> Si un bloque dentro de una función necesita comentario para explicar qué hace, ese bloque es una función separada.

---

## 9) VeriFactu (AEAT) — critical domain

- **Module**: `apps/api/src/modules/verifactu/` — 6 specialized services:
  - `VerifactuHashService` — SHA-256 chained hash generation
  - `VerifactuXmlService` — AEAT XML schema generation
  - `VerifactuSignerService` — digital certificate signing (PKCS12 via node-forge)
  - `VerifactuSenderService` — HTTPS submission to AEAT endpoint
  - `VerifactuQrService` — QR code generation for invoices
  - `VerifactuService` — orchestrates the above
- Invoice confirmation triggers hash generation + (optionally) AEAT submission
- `VERIFACTU_ENVIRONMENT=sandbox` → AEAT pre-production; `production` → real submission
- Certificates are encrypted at rest using `CERTIFICATE_ENCRYPTION_KEY`
- Certificate files stored in `uploads/certificates/` (private, never publicly accessible)
- **Hash chain is irreversible** — once an invoice is confirmed, it anchors future invoices

---

## 10) Coding Conventions (repo-specific)

### Language split

| What                                                                    | Language                              |
| ----------------------------------------------------------------------- | ------------------------------------- |
| Source code, variable/function names, comments                          | English                               |
| UI text (buttons, labels, messages, placeholders, errors shown to user) | Spanish                               |
| Commits                                                                 | English — Conventional Commits format |

### TypeScript

- Strict mode enabled (`tsconfig.json` at root and per unit)
- No `any`, no `as` casts without justification, no `@ts-ignore`
- Shared types live in `packages/shared-types` — always use them across the API/web boundary
- Enums from `shared-types` are the source of truth — don't redefine locally

### Naming

```
camelCase        → variables, functions, hook returns
PascalCase       → classes, React components, TypeScript interfaces/types
kebab-case       → file names (invoice-form.tsx, create-invoice.dto.ts)
UPPER_SNAKE_CASE → constants, enum values, env vars
snake_case       → Prisma @map() (database columns/tables)
```

### File structure

- One component per file (small internal sub-components allowed)
- Named exports preferred over default exports
- Import order: 1) external packages, 2) internal absolute (`@/`), 3) internal relative

### Backend module anatomy

```
modules/feature/
├── feature.module.ts
├── feature.controller.ts      ← orchestrate only: receive → validate → call service → return
├── feature.service.ts         ← business logic
├── feature-*.service.ts       ← auxiliary services when main exceeds ~200 lines
└── dto/
    ├── create-feature.dto.ts
    ├── update-feature.dto.ts
    └── query-feature.dto.ts
```

### Size limits

- Function: 30 lines max → extract helpers
- React component: 150 lines max → extract sub-components
- NestJS service: 200 lines max → extract auxiliary service

---

## 11) Performance Rules (repo-specific)

### Objetivos (Core Web Vitals)

- **LCP** < 2.5s | **INP** < 200ms | **CLS** < 0.1 | **TTFB** < 800ms
- Lighthouse CI corre diariamente (`.github/workflows/lighthouse-ci.yml`) — no romper la baseline

### Frontend

```tsx
// ❌ fetch en useEffect — sin caché, sin loading state, waterfall
useEffect(() => {
  fetch('/api/v1/invoices').then(r => r.json()).then(setInvoices);
}, []);

// ✅ TanStack Query — caché 30s, deduplicación, loading/error automáticos (patrón real del repo)
const { data, isLoading, error } = useInvoices(filters); // staleTime: 30_000

// ❌ Importar toda la librería → bundle grande
import * as Icons from 'lucide-react';

// ✅ next.config.ts ya tiene optimizePackageImports para lucide-react — tree-shaking automático
import { FileText, Trash2, Eye } from 'lucide-react';

// ❌ <img> sin dimensiones → CLS
<img src={invoice.logoUrl} />

// ✅ Next.js Image con dimensiones — dominios configurados en next.config.ts
<Image src={invoice.logoUrl} width={120} height={40} alt="Logo" />
```

### Backend

```typescript
// ❌ SELECT * con includes masivos → demasiados datos en red + memoria
const invoices = await this.prisma.invoice.findMany({
  where: { tenantId },
  include: { customer: true, lines: true, payments: true, tenant: true },
});

// ✅ Solo los campos necesarios + paginación
const invoices = await this.prisma.invoice.findMany({
  where: { tenantId },
  select: {
    id: true,
    number: true,
    issueDate: true,
    total: true,
    status: true,
    customer: { select: { name: true, nif: true } },
  },
  orderBy: { issueDate: 'desc' },
  take: limit,
  skip: (page - 1) * limit,
});

// ❌ N+1: query por cada factura (100 facturas = 101 queries)
for (const inv of invoices) {
  inv.customer = await this.prisma.customer.findUnique({ where: { id: inv.customerId } });
}

// ✅ Eager loading: una sola query con JOIN
const invoices = await this.prisma.invoice.findMany({
  where: { tenantId },
  include: { customer: { select: { name: true } } }, // JOIN eficiente
});
```

- **Prisma**: always use `select` in list queries (never fetch all columns)
- **Prisma**: paginate all lists — never return unbounded arrays
- **TanStack Query**: `queryKey` factory pattern already implemented in `invoiceKeys` — use it
- **PDF generation**: Playwright/Chromium route has 60s timeout — never call synchronously from other operations
- **VeriFactu operations**: XML build + certificate signing + AEAT HTTP run synchronously — critical bottleneck for production load (see Open Questions §14)

---

## 12) Deployment

| Unit       | Platform            | Config                                           |
| ---------- | ------------------- | ------------------------------------------------ |
| `apps/api` | Vercel (serverless) | `apps/api/vercel.json` — maxDuration 30s, 1024MB |
| `apps/web` | Vercel              | `apps/web/vercel.json` — PDF route: 60s, 1024MB  |

- API build command (Vercel): `pnpm run vercel:build` — builds shared packages first, then generates Prisma client, then NestJS
- Web build command (Vercel): `turbo build --filter=@easyfactura/web`
- Database: **Supabase PostgreSQL** (Transaction Pooler for serverless, Direct URL for migrations)
- Email: **Resend**
- CMS: **Sanity** (blog)
- Static file serving: NestJS serves `uploads/` at `/api/v1/uploads/`

---

## 13) Safe Command Execution Policy

### Freely allowed

```bash
pnpm dev
pnpm lint
pnpm format
pnpm build
pnpm type-check
pnpm prisma:generate
pnpm prisma:studio
```

### Require explicit user confirmation before running

```bash
pnpm prisma:migrate          # Creates and applies a new migration in dev DB
pnpm prisma:migrate:deploy   # Deploys migrations to production DB ⚠️
pnpm prisma:seed             # Seeds/overwrites DB data ⚠️
pnpm clean                   # Deletes node_modules and dist ⚠️
# Any direct psql / SQL execution against production
# Any change to VERIFACTU_ENVIRONMENT=production
# Any file deletion in uploads/certificates/
```

---

## 14) Pre-commit Checklist

Antes de dar cualquier tarea por terminada — verificar punto a punto:

**Código limpio**

- [ ] Funciones ≤ 30 líneas, componentes ≤ 150, servicios ≤ 200
- [ ] Sin código duplicado — extraído a `InvoiceCalculationService`, hook compartido, o `packages/shared-*`
- [ ] Nombres que explican la intención sin necesitar comentario
- [ ] Sin `any`, `@ts-ignore`, ni `as Type` injustificado

**Seguridad**

- [ ] `tenantId` extraído de `@CurrentTenant()`, no del body
- [ ] Toda query de Prisma tiene `where: { tenantId }`
- [ ] Sin datos sensibles en logs (tokens, certs, NIFs completos)
- [ ] Inputs validados con DTOs + `class-validator` en el backend

**Performance**

- [ ] Listados paginados — backend devuelve `{ data, meta: { total, page, limit } }`
- [ ] Queries con `select` específico — no `include` masivo
- [ ] Imágenes con `<Image>` de Next.js (dominios en `next.config.ts`)
- [ ] Sin fetches en cascada que puedan ser `Promise.all`

**Frontend**

- [ ] Los tres estados presentes: `isLoading` → skeleton, `error` → ErrorState, vacío → EmptyState
- [ ] Datos del servidor via TanStack Query hook — no `useState` + `useEffect` + `fetch`
- [ ] Lógica de negocio en hooks o en el backend — no en componentes

**Consistencia**

- [ ] Código sigue el estilo del repo (named exports, kebab-case archivos, camelCase vars)
- [ ] `.env.example` actualizado si se añadieron variables
- [ ] Tipos en `packages/shared-types` sincronizados si cambió la API
- [ ] `AGENTS.md` actualizado si cambió la arquitectura

---

## 15) Open Questions / TODO

1. **Redis/BullMQ**: `REDIS_URL` is in `.env.example` but no `bullmq` package in `apps/api/package.json`. Confirmed: queue is **planned but not implemented**. VeriFactu operations (XML, sign, send) run synchronously — critical bottleneck for production scale.
2. **Testing**: Only 1 spec file found (`packages/shared-validators/src/nif-validator.spec.ts`). Zero tests for `InvoiceCalculationService`, `VerifactuHashService`, `InvoiceNumberService` — all have direct fiscal/legal impact.
3. **Refresh token storage**: Both tokens in `localStorage` (confirmed in `api-client.ts`). XSS risk. Known trade-off or pending improvement?
4. **Frontend middleware**: `middleware.ts` is permissive — auth validated client-side in dashboard layout (confirmed). Server-side validation at middleware level would improve security posture.
5. **Certificate exposure**: `uploads/certificates/` served by NestJS static assets at `/api/v1/uploads/`. Confirm route prefix does NOT publicly expose certificate files.
6. **Plan enforcement**: `Plan` enum (FREE/BASIC/PROFESSIONAL) in Prisma schema — no plan-gating logic found in controllers/services. Implemented or pending?
7. **Email verification**: `emailVerified` on User model. Is verification enforced (blocks login until verified)?
8. **CI pipeline**: Only `lighthouse-ci.yml` (daily audit). No build/lint/test CI on PRs — a broken build could go undetected.
9. **Sanity revalidation**: Sanity CMS configured for blog. Is ISR revalidation webhook active in production?
10. **Presupuestos → Factura**: `QUOTE` status + `presupuestos/` route exist. Is quote-to-invoice conversion implemented?

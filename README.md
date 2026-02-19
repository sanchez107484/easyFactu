# EasyFactura

Facturación inteligente para autónomos y PYMEs con VeriFactu integrado.

## 🚀 Stack Tecnológico

### Frontend

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS v4** + Shadcn/ui
- **TanStack Query** (data fetching)
- **React Hook Form** + Zod (formularios)
- **Zustand** (estado global)

### Backend

- **NestJS** + TypeScript
- **Supabase** (PostgreSQL + Auth + Storage + Realtime)
- **Redis** (BullMQ para colas de VeriFactu)

### Infraestructura

- **Vercel** (frontend)
- **Railway** (backend NestJS)
- **Supabase Cloud** (base de datos, autenticación, almacenamiento)
- **Upstash** (Redis para colas)
- **Resend** (emails transaccionales)

## 📦 Estructura del Proyecto (Monorepo)

```
easyFactura/
├── apps/
│   ├── api/                  # Backend NestJS
│   │   ├── src/
│   │   │   ├── modules/          # Módulos de negocio
│   │   │   ├── common/           # Utilitarios comunes
│   │   │   └── prisma/           # Configuración de Prisma
│   │   ├── prisma/               # Esquema y migraciones
│   │   └── package.json
│   │
│   └── web/                  # Frontend Next.js 15 (en desarrollo)
│       └── package.json
│
├── packages/                 # Código compartido entre apps
│   ├── shared-types/         # Tipos TypeScript compartidos
│   ├── shared-validators/    # Validadores (NIF, IBAN, postal codes)
│   ├── shared-constants/     # Constantes de negocio (IVA, provincias, etc.)
│   └── brand-config/         # Configuración de marca (white-label)
│
├── brand.config.ts           # Configuración centralizada de marca
├── turbo.json                # Configuración de Turborepo
├── pnpm-workspace.yaml       # Definición del workspace
├── package.json              # Scripts del monorepo
└── README.md
```

> **Nota:** Este proyecto usa **Turborepo** con **pnpm workspaces** para gestionar el monorepo. Las aplicaciones en `apps/` consumen paquetes compartidos desde `packages/`.

## 🛠️ Requisitos Previos

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Cuenta de Supabase** (para desarrollo y producción)
- **Docker** (opcional, solo para Redis local)

## 🏁 Inicio Rápido

### 1. Instalar dependencias del monorepo

```bash
# Desde la raíz del proyecto
pnpm install
```

### 2. Configurar Backend (apps/api)

```bash
# Configurar variables de entorno
cd apps/api
cp .env.example .env

# Configurar Supabase
# 1. Crea un proyecto en https://supabase.com
# 2. Copia SUPABASE_URL y SUPABASE_SERVICE_KEY al .env
# 3. Copia DATABASE_URL desde Supabase Settings > Database

# Ejecutar migraciones en Supabase
pnpm prisma migrate deploy
# O usar db push para desarrollo
pnpm prisma db push

# Generar el cliente de Prisma
pnpm prisma generate
```

### 3. Iniciar desarrollo

```bash
# Desde la raíz del proyecto, inicia todas las apps
pnpm dev

# O inicia solo el backend
pnpm dev --filter=@easyfactura/backend
```

Backend disponible en: http://localhost:3001  
Documentación API: http://localhost:3001/api

Frontend (cuando esté desarrollado): http://localhost:3000

## 📝 Scripts Disponibles (Monorepo)

```bash
# Desde la raíz del proyecto
pnpm dev              # Iniciar todas las apps en modo desarrollo
pnpm build            # Build de todas las apps
pnpm lint             # Linter en todas las apps
pnpm format           # Formatear código en todo el proyecto
pnpm clean            # Limpiar builds y node_modules

# Filtrar por app específica
pnpm dev --filter=@easyfactura/backend
pnpm build --filter=@easyfactura/web
pnpm lint --filter=@easyfactura/shared-types

# Scripts específicos del backend
cd apps/api
pnpm prisma:generate  # Generar cliente de Prisma
pnpm prisma:migrate   # Crear y aplicar migración
pnpm prisma:studio    # Interfaz visual de la BD
pnpm prisma:seed      # Poblar BD con datos de prueba
```

## 📦 Paquetes Compartidos

El monorepo incluye 4 paquetes compartidos en `packages/`:

- **@easyfactura/shared-types**: Interfaces y tipos TypeScript compartidos
- **@easyfactura/shared-validators**: Validadores de NIF, IBAN, códigos postales
- **@easyfactura/shared-constants**: Constantes de negocio (IVA, provincias, métodos de pago)
- **@easyfactura/brand-config**: Configuración de marca y helpers

pnpm test # Tests
pnpm clean # Limpiar builds y node_modules

```

## 🎨 Branding / White Label

Toda la configuración visual (colores, logos, textos de marca) está centralizada en `brand.config.ts`.

Para crear un producto con otra marca:
1. Duplica `brand.config.ts`
2. Modifica los valores (nombre, colores, textos)
3. Reemplaza los archivos en `apps/web/public/brand/`

## 🏗️ Arquitectura

### Multi-tenant
- Base de datos compartida con `tenant_id`
- **Row Level Security (RLS) en Supabase**
- Aislamiento total de datos entre tenants
- Políticas RLS por tabla para garantizar separación

### Autenticación
- **Supabase Auth** (email/password)
- JWT gestionado por Supabase
- Session management automático
- Integración con NestJS via @supabase/supabase-js

### VeriFactu (AEAT)
- Hash SHA-256 encadenado
- Firma digital XAdES con certificado
- Envío asíncrono vía BullMQ
- Reintentos automáticos con backoff exponencial

## 📚 Documentación

- [Guía de Desarrollo](./docs/desarrollo.md)
- [API Documentation](http://localhost:3001/api) (en desarrollo)
- [Convenciones de Código](./.github/copilot-instructions.md)

## 🔒 Seguridad

- Bcrypt para passwords (salt rounds: 12)
- Rate limiting (100 req/min)
- CORS configurado
- Helmet.js para headers de seguridad
- Validación estricta de inputs
- Certificados digitales encriptados con AES-256

## 📄 Licencia

Propietario - © 2026 EasyFactura

## 🤝 Contribuir

Este es un proyecto propietario. Por favor contacta con el equipo antes de contribuir.
```

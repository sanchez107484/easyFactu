# CLAUDE.md — Instrucciones del Proyecto FacturaApp

## ROL

Eres el desarrollador principal senior de FacturaApp, un SaaS de facturación para autónomos y PYMEs en España con integración VeriFactu (Ley Antifraude 11/2021). Cada línea de código tiene consecuencias fiscales y legales reales. Multas de hasta 50.000€/ejercicio si el software no cumple.

## STACK

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + Shadcn/ui
- **Backend**: NestJS + Supabase (Auth, PostgreSQL, Storage, Row Level Security)
- **Estructura**: Proyectos independientes (backend/ y frontend/)
- **UI**: React Hook Form + Zod, TanStack Query + Table, Zustand, Recharts, Sonner
- **Deploy**: Vercel (frontend), Railway (backend NestJS), Supabase Cloud (base de datos)

## REGLAS ABSOLUTAS

1. NUNCA uses `any` en TypeScript. Usa `unknown` + type narrowing.
2. NUNCA hardcodees nombre de la app, colores ni logos. Todo desde `brand.config.ts`.
3. NUNCA confíes en datos del frontend. Valida todo en Supabase (RLS + Edge Functions).
4. SIEMPRE filtra por `tenant_id` en TODAS las queries y políticas RLS.
5. NUNCA permitas borrar ni modificar una factura confirmada. Solo rectificativas.
6. NUNCA loguees datos sensibles (passwords, certificados, NIFs completos).
7. Funciones > 30 líneas → divídelas. Componentes > 150 líneas → extrae subcomponentes.
8. Si repites código 2+ veces → abstráelo.
9. Genera código COMPLETO y funcional, no fragmentos parciales.
10. Cada archivo nuevo debe incluir TODOS sus imports.

## CONVENCIONES

- Código: inglés. UI visible al usuario: español.
- Variables/funciones: camelCase. Clases/componentes: PascalCase. Archivos: kebab-case.
- Tablas BD: snake_case. Enums: UPPER_SNAKE_CASE.
- Commits: Conventional Commits (feat:, fix:, refactor:, chore:).
- Componentes React: funcionales con tipado explícito de props.
- Siempre manejar estados: loading (skeleton), error (mensaje + retry), empty (CTA).
- Tailwind exclusivamente para estilos. No CSS modules, no styled-components.
- Formularios: React Hook Form + Zod siempre. Mensajes de error en español.

## SUPABASE ESPECÍFICO

- **Auth**: Supabase Auth con email/password. Integrado en NestJS con @supabase/supabase-js.
- **RLS**: TODAS las tablas con RLS habilitado. Política por defecto: denegar todo.
- **Database**: PostgreSQL gestionado por Supabase. Usar Prisma como ORM con Supabase connection string.
- **Storage**: Buckets privados para certificados digitales, público para logos y PDFs de facturas.
- **Realtime**: Solo para notificaciones de estado VeriFactu (opcional).
- **Database Functions**: Para operaciones atómicas críticas (numeración correlativa, hash encadenado).
- **Backend NestJS**: Maneja la lógica de negocio compleja (VeriFactu, generación PDF, cálculos).

## VERIFACTU - REQUISITOS LEGALES

- Cada factura confirmada genera: hash SHA-256 encadenado, QR con datos fiscales, registro inalterable.
- Hash = SHA256(NIF_emisor + NumFactura + FechaExpedicion + TipoFactura + CuotaTotal + ImporteTotal + Huella_anterior + FechaHoraGeneracion).
- QR debe contener: NIF emisor, Nº factura, Fecha, Importe total, IDRegistro, Tipo sistema.
- Texto obligatorio en factura: "Factura generada mediante sistema Verifactu conforme a la Ley 11/2021".
- Numeración correlativa sin saltos. Prohibido borrar facturas. Prohibido modificar sin rectificativa.
- Registro de eventos inalterable por cada operación.
- Formato IDRegistro: VF-{YYYYMMDD}-{NIF}-{NUMERO}.

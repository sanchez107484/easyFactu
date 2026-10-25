# Historias de usuario — Fase 4 (Automatización de gastos, banca y fiscalidad)

| ID    | Historia                                              | Plan mínimo   | Depende de | Prioridad |
| ----- | ----------------------------------------------------- | ------------- | ---------- | --------- |
| HU-01 | [Lector automático de gastos con IA (OCR)](HU-01-lector-ocr-gastos-ia.md) | PROFESSIONAL | Módulo de gastos (hecho) | 1 |
| HU-02 | [Conexión bancaria y conciliación](HU-02-conexion-bancaria-conciliacion.md) | PROFESSIONAL | HU-01 recomendable (más gastos con justificante) | 2 |
| HU-03 | [Calendario fiscal y alertas del autónomo](HU-03-calendario-fiscal-alertas.md) | BASIC (alertas) / PROFESSIONAL (checklist completo) | Gastos + facturas (hecho); usa datos de HU-01/HU-02 si existen | 3 |

## Cómo debe usarlas un agente de IA

1. Leer **`AGENTS.md`** completo antes que la HU. Las reglas de allí (tenantId del JWT, `select` en listados, límites de tamaño, idioma, sin `any`) **no se repiten** en cada HU pero son obligatorias.
2. Leer la HU entera, incluida la sección **"Decisiones abiertas"**. Si una decisión marcada como `BLOQUEANTE` no está resuelta, **preguntar al usuario antes de escribir código** de esa parte.
3. Implementar **por fases** en el orden de la sección "Plan de implementación". Cada fase debe compilar (`pnpm build`), pasar lint y tests antes de empezar la siguiente.
4. Las migraciones de Prisma (`pnpm prisma:migrate`) requieren confirmación explícita del usuario (AGENTS.md §13).
5. Al terminar, recorrer la **Definition of Done** de la HU y el checklist de `AGENTS.md` §14, y actualizar `AGENTS.md` (mapa de módulos, variables de entorno, crons).

## Convenciones comunes a las tres HU

- **Código, nombres y comentarios**: inglés. **Textos de UI y mensajes de error**: español.
- **Endpoints**: prefijo global `/api/v1`. Escritura protegida con `@RequirePlan(...)` + `@Roles(OWNER, ADMIN, ACCOUNTANT)`; lectura abierta a cualquier rol autenticado del tenant salvo que la HU diga otra cosa.
- **Crons**: siguen el patrón existente `POST /api/v1/<módulo>/trigger-scheduler` con `@Public()` + `SchedulerSecretGuard` y se registran en `apps/api/vercel.json` → `crons`. Recordar `maxDuration: 30s` de Vercel: todo job debe procesar en lotes acotados y ser **idempotente** y **reanudable**.
- **Importes**: `Decimal(12,2)`, redondeo half-up `Math.round(v * 100) / 100` (igual que `ExpensesCalculationService`).
- **Tipos compartidos** front↔back en `packages/shared-types`; constantes (p. ej. calendario de modelos) en `packages/shared-constants`.
- **Tests**: seguir el patrón `apps/api/test/*.security.spec.ts` (aislamiento entre tenants, roles, plan) + tests unitarios de la lógica pura.

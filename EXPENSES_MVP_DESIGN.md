# Diseño Técnico — Módulo de Gastos (MVP)

> **Proyecto**: NaFactura / EasyFactura  
> **Ámbito**: Backend + Frontend  
> **Plan objetivo**: PROFESSIONAL  
> **Documento generado**: 2026-08-20  
> **Estado**: Fase 1 en curso

---

## 1. Decisiones de producto cerradas

| Tema | Decisión |
|------|----------|
| **Downgrade PRO → FREE** | Solo lectura. El usuario puede ver el listado y detalle de gastos históricos, pero no crear, editar ni eliminar. |
| **Fechas futuras** | Permitidas (gastos previstos/planificados). |
| **Límite inferior de fecha** | No anterior a 10 años desde la fecha actual. |
| **Base imponible = 0** | No permitida, salvo caso de negocio explícito posterior. |
| **Decimales** | 2 decimales (centimales), igual que facturas. |
| **Redondeo** | `Math.round(value * 100) / 100` (half-up), igual que `InvoiceCalculationService`. |
| **Borrado** | Hard delete para gastos y proveedores. |
| **Proveedores** | Módulo independiente (`Supplier`), aunque se copian patrones de `Customer`. |
| **Categorías** | Globales a todas las empresas, seed con clave estable (`slug`). No editables por el usuario en el MVP. |
| **Tipo de IVA** | Se elige independientemente en cada gasto; no está ligado a la categoría. |
| **Adjuntos** | Nueva tabla `ExpenseAttachment` propia del módulo (no se reutiliza la entidad de logo/certificado). |

---

## 2. Arquitectura objetivo

### 2.1 Nuevos módulos backend

```
apps/api/src/modules/
├── expenses/
│   ├── expenses.module.ts
│   ├── expenses.controller.ts
│   ├── expenses.service.ts
│   ├── expenses-calculation.service.ts
│   ├── dto/
│   │   ├── create-expense.dto.ts
│   │   ├── update-expense.dto.ts
│   │   ├── query-expense.dto.ts
│   │   └── expense-summary.dto.ts
│   └── guards/
│       └── expenses-plan.guard.ts
├── suppliers/
│   ├── suppliers.module.ts
│   ├── suppliers.controller.ts
│   ├── suppliers.service.ts
│   └── dto/
│       ├── create-supplier.dto.ts
│       ├── update-supplier.dto.ts
│       └── query-supplier.dto.ts
├── expense-categories/
│   ├── expense-categories.module.ts
│   ├── expense-categories.controller.ts
│   ├── expense-categories.service.ts
│   └── dto/
│       └── query-expense-category.dto.ts
└── expense-attachments/
    ├── expense-attachments.module.ts
    ├── expense-attachments.controller.ts
    ├── expense-attachments.service.ts
    └── dto/
        └── upload-expense-attachment.dto.ts
```

### 2.2 Plan gating

No existe un mecanismo de control de planes en el backend actualmente. Se creará un sistema mínimo y reusable:

- `PlanGuard`: guard de NestJS que lee `request.user.tenantId`, consulta el `plan` del tenant y permite/deniega según el plan requerido.
- `@RequirePlan(Plan.PROFESSIONAL)`: decorador que marca controladores/métodos.
- `GuardsModule`: módulo compartido que provee y exporta `PlanGuard` para los módulos que lo necesitan.
- Para el módulo de Gastos se aplicará `@RequirePlan(Plan.PROFESSIONAL)` a nivel de controlador. El downgrade PRO → FREE con acceso solo lectura se implementará en una fase posterior.

> **Nota de seguridad**: el guard consulta el plan desde la base de datos en cada petición para evitar cache desactualizada. El JWT no incluye el plan.

### 2.3 Cálculo de importes

Se crea `ExpensesCalculationService` que replica la lógica de redondeo de `InvoiceCalculationService` pero simplificada:

```
vatAmount   = round2(baseAmount * vatRate / 100)
totalAmount = round2(baseAmount + vatAmount)
```

El backend recalcula siempre; los campos `vatAmount` y `totalAmount` no se aceptan del cliente.

---

## 3. Modelo de datos (Prisma)

### 3.1 Nuevos modelos

```prisma
model ExpenseCategory {
  id          String   @id @default(uuid())
  slug        String   @unique
  name        String
  sortOrder   Int      @default(0) @map("sort_order")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  expenses    Expense[]

  @@index([isActive, sortOrder])
  @@map("expense_categories")
}

model Supplier {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")
  name        String
  legalName   String?  @map("legal_name")
  taxId       String?  @map("tax_id")
  email       String?
  phone       String?
  address     String?
  postalCode  String?  @map("postal_code")
  city        String?
  province    String?
  country     String   @default("ES")
  notes       String?  @db.Text
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  expenses    Expense[]

  @@index([tenantId])
  @@index([tenantId, isActive])
  @@index([name(ops: raw("gin_trgm_ops"))], type: Gin, map: "suppliers_name_trgm_idx")
  @@index([taxId(ops: raw("gin_trgm_ops"))], type: Gin, map: "suppliers_tax_id_trgm_idx")
  @@map("suppliers")
}

model Expense {
  id              String   @id @default(uuid())
  tenantId        String   @map("tenant_id")
  date            DateTime @db.Date
  description     String
  categoryId      String   @map("category_id")
  supplierId      String?  @map("supplier_id")
  clientId        String?  @map("client_id")
  baseAmount      Decimal  @map("base_amount") @db.Decimal(12, 2)
  vatRate         Decimal  @map("vat_rate") @db.Decimal(5, 2)
  vatAmount       Decimal  @map("vat_amount") @db.Decimal(12, 2)
  totalAmount     Decimal  @map("total_amount") @db.Decimal(12, 2)
  notes           String?  @db.Text
  attachmentId    String?  @map("attachment_id")
  createdByUserId String?  @map("created_by_user_id")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  tenant          Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  category        ExpenseCategory  @relation(fields: [categoryId], references: [id])
  supplier        Supplier?        @relation(fields: [supplierId], references: [id], onDelete: SetNull)
  client          Customer?        @relation(fields: [clientId], references: [id], onDelete: SetNull)
  attachment      ExpenseAttachment? @relation(fields: [attachmentId], references: [id], onDelete: SetNull)
  createdByUser   User?            @relation("ExpenseCreatedBy", fields: [createdByUserId], references: [id], onDelete: SetNull)

  @@index([tenantId])
  @@index([tenantId, date])
  @@index([tenantId, categoryId])
  @@index([tenantId, supplierId])
  @@index([tenantId, clientId])
  @@index([tenantId, date, categoryId, supplierId, clientId])
  @@index([description(ops: raw("gin_trgm_ops"))], type: Gin, map: "expenses_description_trgm_idx")
  @@map("expenses")
}

model ExpenseAttachment {
  id          String   @id @default(uuid())
  tenantId    String   @map("tenant_id")
  expenseId   String?  @map("expense_id")
  fileName    String   @map("file_name")
  mimeType    String   @map("mime_type")
  size        Int
  storageKey  String   @unique @map("storage_key")
  createdAt   DateTime @default(now()) @map("created_at")

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  expense     Expense?

  @@index([tenantId])
  @@index([expenseId])
  @@map("expense_attachments")
}
```

### 3.2 Cambios en modelos existentes

- `Tenant`: añadir relaciones `suppliers`, `expenses`, `expenseAttachments`.
- `Customer`: añadir relación `expenses`.
- `User`: añadir relación `expensesCreated`.

### 3.3 Seed de categorías

Archivo `apps/api/prisma/seeds/expense-categories.seed.ts`. Se ejecuta como parte de `prisma:seed` o como migración idempotente.

Categorías iniciales (slug → nombre):

```
software-y-aplicaciones     → Software y aplicaciones
material                      → Material
suministros                   → Suministros
telefonia-e-internet          → Telefonía e Internet
transporte                    → Transporte
combustible                   → Combustible
publicidad-y-marketing        → Publicidad y marketing
servicios-profesionales       → Servicios profesionales
seguros                       → Seguros
alquiler                      → Alquiler
formacion                     → Formación
equipamiento                  → Equipamiento
comisiones-y-gastos-bancarios → Comisiones y gastos bancarios
otros                         → Otros
```

El seed usa `upsert` por `slug` para ser idempotente.

---

## 4. API endpoints (Fase 1)

### 4.1 Expenses

| Método | Ruta | Descripción | Plan |
|--------|------|-------------|------|
| POST | `/api/v1/expenses` | Crear gasto | PRO |
| GET | `/api/v1/expenses` | Listar gastos | PRO (lectura) |
| GET | `/api/v1/expenses/:id` | Obtener gasto | PRO (lectura) |
| PUT | `/api/v1/expenses/:id` | Editar gasto | PRO |
| DELETE | `/api/v1/expenses/:id` | Eliminar gasto | PRO |
| GET | `/api/v1/expenses/summary` | Resumen mes/año | PRO (lectura) |

### 4.2 Suppliers

| Método | Ruta | Descripción | Plan |
|--------|------|-------------|------|
| POST | `/api/v1/suppliers` | Crear proveedor | PRO |
| GET | `/api/v1/suppliers` | Listar proveedores | PRO |
| GET | `/api/v1/suppliers/:id` | Obtener proveedor | PRO |
| PUT | `/api/v1/suppliers/:id` | Editar proveedor | PRO |
| DELETE | `/api/v1/suppliers/:id` | Eliminar proveedor | PRO |

### 4.3 Expense Categories

| Método | Ruta | Descripción | Plan |
|--------|------|-------------|------|
| GET | `/api/v1/expense-categories` | Listar categorías | PRO (lectura) |

### 4.4 Expense Attachments (Fase 3)

| Método | Ruta | Descripción | Plan |
|--------|------|-------------|------|
| POST | `/api/v1/expense-attachments` | Subir adjunto | PRO |
| GET | `/api/v1/expense-attachments/:id` | Descargar adjunto | PRO (lectura) |
| DELETE | `/api/v1/expense-attachments/:id` | Eliminar adjunto | PRO |

---

## 5. Seguridad

### 5.1 Principios aplicados

- `tenantId` siempre desde `@CurrentTenant()` (JWT), nunca desde body/query/params.
- Toda query Prisma filtra por `tenantId`.
- Para `supplierId` y `clientId` se verifica explícitamente que pertenezcan al tenant antes de guardar.
- Respuesta ante recurso ajeno: `404 Not Found` (no 403), para evitar enumeración de IDs.
- Plan gating en backend con guard dedicado; no basta con ocultar el menú en frontend.

### 5.2 Plan gating

```typescript
@RequirePlan(Plan.PROFESSIONAL)
@Controller('expenses')
export class ExpensesController { ... }
```

El `PlanGuard`:

1. Lee el plan actual del tenant desde Prisma.
2. Compara con el plan requerido.
3. Si no cumple → `403 Forbidden` con mensaje claro.

### 5.3 Roles

- `VIEWER` no puede crear/editar/eliminar aunque el plan sea PRO.
- Se combina `PlanGuard` + `RolesGuard` en los endpoints de escritura.

---

## 6. Validaciones de negocio

### 6.1 Expense

- `date`: obligatorio, no anterior a 10 años, no futuro más allá de 10 años (límite razonable).
- `description`: obligatorio, mínimo 2 caracteres, máximo 255.
- `categoryId`: obligatorio, UUID válido.
- `baseAmount`: obligatorio, > 0, máximo 999_999_999.99, 2 decimales.
- `vatRate`: obligatorio, ≥ 0, soportado por el sistema (validar contra lista blanca).
- `supplierId`: opcional, debe existir y pertenecer al tenant.
- `clientId`: opcional, debe existir y pertenecer al tenant.
- `notes`: opcional, máximo 2000 caracteres.

### 6.2 Supplier

- `name`: obligatorio, mínimo 2 caracteres, máximo 100.
- `taxId`: opcional; si se envía, validar formato según país (para España usar `IsValidNif`).
- `email`: opcional, email válido.
- `phone`: opcional, máximo 20 caracteres.
- `country`: por defecto `ES`, código ISO 2.

### 6.3 VAT rates soportados

Se reutiliza la misma lista de tipos de IVA usada en facturas (21%, 10%, 4%, 0%). Se valida en backend.

---

## 7. Plan de implementación

### Fase 1 — Backend core (actual)

1. Añadir modelos Prisma y generar migración.
2. Implementar `PlanGuard` y `@RequirePlan()`.
3. Crear módulo `expense-categories` con seed idempotente.
4. Crear módulo `suppliers` (CRUD + búsqueda).
5. Crear módulo `expenses`:
   - `ExpensesCalculationService`
   - CRUD con validaciones
   - Filtros/búsqueda
   - Resumen mes/año
   - Seguridad multi-tenant
6. Registrar módulos en `AppModule`.
7. Generar Prisma client y verificar build.

### Fase 2 — Frontend core

1. Añadir ítem "Gastos" en navegación (solo PRO).
2. Página listado de gastos con filtros y resumen.
3. Página/Modal crear/editar gasto.
4. Empty states y estados de carga/error.

### Fase 3 — Funcionalidades avanzadas

1. Adjuntos: subida, descarga, eliminación.
2. Creación inline de proveedor desde el formulario de gasto.
3. Filtros avanzados (periodo personalizado, categoría, proveedor, cliente, búsqueda).

### Fase 4 — Tests de seguridad

1. Tests anti-IDOR.
2. Tests de plan gating.
3. Tests de cálculo de importes.
4. Tests de validaciones.

---

## 8. Tests de seguridad obligatorios

- [ ] Usuario FREE no puede usar ningún endpoint de Gastos/Proveedores/Categorías.
- [ ] Usuario PRO puede usar todos los endpoints previstos.
- [ ] Empresa A no puede leer, editar ni eliminar gastos de Empresa B.
- [ ] Empresa A no puede asociar proveedores o clientes de Empresa B a un gasto propio.
- [ ] Manipulación manual de `id` devuelve 404, nunca datos ajenos ni 500.
- [ ] Los totales (`vatAmount`, `totalAmount`) se recalculan siempre en backend.
- [ ] Los documentos adjuntos de una empresa no son accesibles por otra.
- [ ] Downgrade PRO → FREE con gastos ya creados: solo lectura.

---

## 9. Notas técnicas

- Los tipos compartidos (`Expense`, `Supplier`, `ExpenseCategory`, etc.) se añadirán a `packages/shared-types` para uso front/back.
- Los DTOs de entrada se mantienen en `apps/api` siguiendo el patrón actual.
- El cálculo de totales se hace con `Decimal` de Prisma para precisión; la lógica de redondeo usa `Math.round(value * 100) / 100`.
- Los adjuntos se almacenan inicialmente en el filesystem bajo `uploads/expenses/` con `storageKey` único; en Fase 3 se evaluará si se migra a base de datos (data URL) siguiendo el patrón de logo/certificado.

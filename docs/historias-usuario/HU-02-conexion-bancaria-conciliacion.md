# HU-02 — Conexión bancaria y conciliación automática

| Campo          | Valor |
| -------------- | ----- |
| Épica          | Automatización de gastos y cobros |
| Plan mínimo    | `PROFESSIONAL` |
| Módulos nuevos | `apps/api/src/modules/banking/` (conexiones, sincronización, conciliación) |
| Reutiliza      | `expenses`, `payments` (`PaymentService.createPayment`), `invoices`, `suppliers`, `customers`, `expense-documents` (HU-01), cifrado de `tenants/upload.service.ts`, `SchedulerSecretGuard`, `EmailService` |
| Estimación     | XL (4 fases) |

---

## 1. Historia

> **Como** autónomo o pyme con plan PRO,
> **quiero** conectar mis cuentas bancarias en modo **solo lectura** y que la plataforma compare cada movimiento con mis gastos y facturas,
> **para** que me proponga los emparejamientos (p. ej. cargo de 30,25 € del día 5 ↔ ticket de gasolina de 30,25 € de esa semana), los confirme con un clic y sepa en todo momento qué gastos están justificados, qué facturas están cobradas y qué movimientos me falta justificar.

### Valor de negocio
- Cierra el ciclo "documento ↔ dinero real": gastos justificados, facturas marcadas como cobradas sin registrar pagos a mano.
- Alimenta HU-03 ("te faltan X gastos por justificar antes del 20 de abril").

---

## 2. Estado actual del repo

| Pieza | Ubicación | Uso en esta HU |
| --- | --- | --- |
| `Payment` + `PaymentService.createPayment(tenantId, invoiceId, dto)` | `modules/payments/payment.service.ts` | Al conciliar un **ingreso** con una factura se registra el cobro **llamando a este método** (ya actualiza `amountPaid`/`paymentStatus` en transacción). No duplicar esa lógica |
| `Invoice.total`, `amountPaid`, `paymentStatus`, `dueDate`, `number`, `customerSnapshotNif` | `schema.prisma` | Candidatas a cobro: `status ∈ {CONFIRMED, SENT}` y `paymentStatus ≠ PAID` |
| `Expense.totalAmount`, `date`, `supplierId`, `attachmentId` | `schema.prisma` | Candidatos a cargo |
| `Supplier.taxId/name`, `Customer` (nombre, NIF, IBAN si existe) | `schema.prisma` | Señales de emparejamiento |
| Cifrado AES | `modules/tenants/upload.service.ts` (certificados) | Patrón para cifrar tokens del proveedor bancario |
| `validateIban`, `formatIban` | `packages/shared-validators` | |
| Índices trigram (`pg_trgm`) | ya habilitados | Similitud de nombres |
| Cron Vercel | `vercel.json` + `SchedulerSecretGuard` | Sincronización diaria |

> **Facturas confirmadas**: registrar un `Payment` **no** modifica la factura fiscalmente (no toca hash ni líneas) y ya está permitido hoy. La conciliación **nunca** debe modificar otros campos de una factura confirmada.

---

## 3. Alcance

### Dentro
1. Conectar cuentas vía **agregador PSD2 (AIS, solo lectura)** compatible con bancos de España y UE.
2. Sincronización de saldos y movimientos (inicial hasta 90 días hacia atrás + diaria + manual).
3. Motor de **propuestas de emparejamiento** con puntuación explicable.
4. Confirmar / rechazar propuestas, emparejar manualmente, deshacer, ignorar movimientos.
5. Desde un movimiento sin justificar: **crear gasto** precargado o **subir justificante** (enlaza con HU-01).
6. Gestión del consentimiento (caducidad ~180 días), renovación y desconexión.
7. Aviso por email de consentimiento a punto de caducar y de errores de sincronización.

### Fuera
- Iniciar pagos (PIS) o cualquier operación que mueva dinero. **Prohibido** solicitar scopes de pagos.
- Importación de extractos Norma 43/CSV (posible HU futura; el diseño debe permitir añadir otra "fuente" de movimientos).
- Conciliación automática sin confirmación humana (se deja preparada pero **desactivada**).
- Emparejar 1 movimiento con varios documentos (N:1) y 1 documento con varios movimientos (1:N): el **modelo lo soporta**, la UI del MVP solo hace 1:1. Ver D4.

---

## 4. Decisiones abiertas

| # | Decisión | Recomendación | Bloqueante |
| - | --- | --- | --- |
| D1 | Agregador bancario | Implementar detrás de un **puerto** `BankDataProvider`. Candidatos: **Enable Banking**, **Tink**, **GoCardless Bank Account Data** (ex-Nordigen; *verificar si admite nuevos clientes*), Salt Edge. Elegir según precio por conexión, cobertura de bancos españoles (Santander, BBVA, CaixaBank, Sabadell, Bankinter, ING, Unicaja, Kutxabank, cajas rurales) y límites de llamadas por día | **Sí** |
| D2 | Licencia/regulación | Usar el agregador como **AISP regulado** (somos su cliente/agente); no registrarnos como AISP propio. Confirmar con el proveedor y reflejarlo en términos y privacidad | **Sí** antes de producción |
| D3 | ¿Se conservan movimientos tras desconectar? | Sí: los movimientos ya conciliados forman parte del historial contable. Ofrecer además "Eliminar movimientos de esta cuenta" (OWNER) | No |
| D4 | Pagos agrupados (una transferencia que paga 3 facturas) | MVP 1:1. Fase 4: selección múltiple en UI con `Σ importes = importe del movimiento` | No |
| D5 | Acceso de asesorías (agency) | Pueden **ver y conciliar**, **no** pueden conectar ni desconectar bancos (el consentimiento PSD2 lo da el titular) | No |
| D6 | Tolerancia de importe | Exacta al céntimo por defecto. Tolerancia configurable ±1 % solo para gastos en divisa (fuera del MVP) | No |

---

## 5. Modelo de datos (Prisma)

```prisma
enum BankConnectionStatus {
  PENDING_AUTH   // redirigido al banco, sin completar
  ACTIVE
  EXPIRING       // consentimiento caduca en ≤ 14 días
  EXPIRED
  ERROR          // fallos de sincronización repetidos
  REVOKED        // desconectado por el usuario
}

enum BankTransactionStatus { BOOKED PENDING }

enum ReconciliationStatus {
  UNMATCHED
  SUGGESTED
  MATCHED
  IGNORED
}

enum ReconciliationTargetType { EXPENSE INVOICE }

enum ReconciliationMatchStatus { SUGGESTED CONFIRMED REJECTED }

enum IgnoreReason {
  OWN_TRANSFER      // traspaso entre cuentas propias
  TAX_PAYMENT       // pago de impuestos (303, 130…)
  SOCIAL_SECURITY   // cuota de autónomos
  PAYROLL
  LOAN
  PERSONAL
  OTHER
}

model BankConnection {
  id                   String               @id @default(uuid())
  tenantId             String               @map("tenant_id")
  provider             String               // 'enablebanking' | 'tink' | ...
  providerConnectionId String               @map("provider_connection_id") // requisition/session/consent id
  institutionId        String               @map("institution_id")
  institutionName      String               @map("institution_name")
  institutionLogoUrl   String?              @map("institution_logo_url")
  status               BankConnectionStatus @default(PENDING_AUTH)
  encryptedTokens      String?              @map("encrypted_tokens") // AES-256-GCM, nunca en claro
  consentExpiresAt     DateTime?            @map("consent_expires_at")
  lastSyncedAt         DateTime?            @map("last_synced_at")
  lastSyncError        String?              @map("last_sync_error")   // saneado
  consecutiveFailures  Int                  @default(0) @map("consecutive_failures")
  expiryNotifiedAt     DateTime?            @map("expiry_notified_at")
  createdByUserId      String               @map("created_by_user_id")
  createdAt            DateTime             @default(now()) @map("created_at")
  updatedAt            DateTime             @updatedAt @map("updated_at")

  tenant   Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  accounts BankAccount[]

  @@unique([provider, providerConnectionId])
  @@index([tenantId, status])
  @@index([status, lastSyncedAt])
  @@map("bank_connections")
}

model BankAccount {
  id                String    @id @default(uuid())
  tenantId          String    @map("tenant_id")
  connectionId      String    @map("connection_id")
  providerAccountId String    @map("provider_account_id")
  ibanMasked        String?   @map("iban_masked")   // ES12 **** **** **** **** 3456
  ibanHash          String?   @map("iban_hash")     // SHA-256 del IBAN normalizado (para detectar traspasos propios)
  displayName       String    @map("display_name")
  ownerName         String?   @map("owner_name")
  currency          String    @default("EUR")
  balance           Decimal?  @db.Decimal(14, 2)
  balanceAt         DateTime? @map("balance_at")
  isActive          Boolean   @default(true) @map("is_active")   // el usuario puede excluir una cuenta
  syncedFrom        DateTime? @map("synced_from") @db.Date
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")

  tenant       Tenant            @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  connection   BankConnection    @relation(fields: [connectionId], references: [id], onDelete: Cascade)
  transactions BankTransaction[]

  @@unique([connectionId, providerAccountId])
  @@index([tenantId])
  @@index([tenantId, ibanHash])
  @@map("bank_accounts")
}

model BankTransaction {
  id                    String                @id @default(uuid())
  tenantId              String                @map("tenant_id")
  accountId             String                @map("account_id")
  providerTransactionId String                @map("provider_transaction_id")
  dedupeKey             String                @map("dedupe_key") // ver §6.3
  status                BankTransactionStatus
  bookingDate           DateTime              @map("booking_date") @db.Date
  valueDate             DateTime?             @map("value_date") @db.Date
  amount                Decimal               @db.Decimal(14, 2) // con signo: <0 cargo, >0 abono
  currency              String                @default("EUR")
  description           String                // remittance info normalizada (≤ 500)
  counterpartyName      String?               @map("counterparty_name")
  counterpartyIbanMasked String?              @map("counterparty_iban_masked")
  counterpartyIbanHash  String?               @map("counterparty_iban_hash")
  rawCategory           String?               @map("raw_category") // si el proveedor la da
  reconciliationStatus  ReconciliationStatus  @default(UNMATCHED) @map("reconciliation_status")
  ignoreReason          IgnoreReason?         @map("ignore_reason")
  ignoredByUserId       String?               @map("ignored_by_user_id")
  matchingRunAt         DateTime?             @map("matching_run_at")
  createdAt             DateTime              @default(now()) @map("created_at")
  updatedAt             DateTime              @updatedAt @map("updated_at")

  tenant  Tenant                @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  account BankAccount           @relation(fields: [accountId], references: [id], onDelete: Cascade)
  matches ReconciliationMatch[]

  @@unique([accountId, dedupeKey])
  @@index([tenantId, reconciliationStatus, bookingDate(sort: Desc)])
  @@index([tenantId, bookingDate])
  @@index([tenantId, amount])
  @@index([description(ops: raw("gin_trgm_ops"))], map: "bank_transactions_description_trgm_idx", type: Gin)
  @@map("bank_transactions")
}

model ReconciliationMatch {
  id                String                    @id @default(uuid())
  tenantId          String                    @map("tenant_id")
  transactionId     String                    @map("transaction_id")
  targetType        ReconciliationTargetType  @map("target_type")
  expenseId         String?                   @map("expense_id")
  invoiceId         String?                   @map("invoice_id")
  paymentId         String?                   @unique @map("payment_id") // Payment creado al confirmar contra factura
  amount            Decimal                   @db.Decimal(14, 2)          // parte del movimiento asignada (soporte N:1 futuro)
  score             Int                                                   // 0..100
  scoreReasons      Json                      @map("score_reasons")       // MatchReason[]
  status            ReconciliationMatchStatus @default(SUGGESTED)
  isManual          Boolean                   @default(false) @map("is_manual")
  decidedByUserId   String?                   @map("decided_by_user_id")
  decidedAt         DateTime?                 @map("decided_at")
  createdAt         DateTime                  @default(now()) @map("created_at")

  tenant      Tenant          @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  transaction BankTransaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  expense     Expense?        @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  invoice     Invoice?        @relation(fields: [invoiceId], references: [id])

  @@unique([transactionId, targetType, expenseId, invoiceId])
  @@index([tenantId, status])
  @@index([tenantId, expenseId])
  @@index([tenantId, invoiceId])
  @@map("reconciliation_matches")
}
```

**Restricciones adicionales** (en migración SQL a mano, Prisma no las expresa):
- `CHECK ((target_type = 'EXPENSE' AND expense_id IS NOT NULL AND invoice_id IS NULL) OR (target_type = 'INVOICE' AND invoice_id IS NOT NULL AND expense_id IS NULL))`.
- Índice único parcial: un gasto solo puede tener **un** match `CONFIRMED`: `CREATE UNIQUE INDEX ... ON reconciliation_matches (expense_id) WHERE status = 'CONFIRMED'`.
- Activar RLS en las tablas nuevas (añadir a `enable-rls.sql`).

Estado derivado (no columnas nuevas en `Expense`): un gasto está **justificado** si tiene un match `CONFIRMED`. Exponerlo como `isReconciled` en `GET /expenses` (subquery/`_count` con `select`, sin N+1).

Tipos compartidos (`packages/shared-types`): enums anteriores + `MatchReason { code: 'AMOUNT_EXACT' | 'DATE_PROXIMITY' | 'NAME_SIMILARITY' | 'INVOICE_NUMBER_IN_TEXT' | 'TAX_ID_IN_TEXT' | 'IBAN_MATCH' | 'PREVIOUS_PATTERN'; points: number; detail: string }`.

---

## 6. Backend

### 6.1 Estructura

```
modules/banking/
├── banking.module.ts
├── bank-connections.controller.ts
├── bank-transactions.controller.ts
├── reconciliation.controller.ts
├── banking-scheduler.controller.ts          # trigger-scheduler (cron)
├── bank-connections.service.ts              # alta, callback, renovación, baja
├── bank-sync.service.ts                     # sincroniza cuentas, saldos, movimientos
├── bank-transaction-normalizer.service.ts   # proveedor → modelo interno, dedupeKey
├── reconciliation-candidates.service.ts     # busca candidatos (queries acotadas)
├── reconciliation-scoring.service.ts        # función pura de puntuación
├── reconciliation.service.ts                # confirmar / rechazar / deshacer / manual / ignorar
├── bank-token-crypto.service.ts             # AES-256-GCM con BANK_TOKEN_ENCRYPTION_KEY
├── providers/
│   ├── bank-data-provider.port.ts           # interfaz + tipos neutros
│   ├── <elegido>.adapter.ts
│   └── fake-bank.adapter.ts                 # datos de prueba para dev/tests (BANKING_PROVIDER=fake)
└── dto/ …
```

`BankDataProvider` (puerto):
```ts
listInstitutions(country: 'ES' | string): Promise<Institution[]>
createAuthorization(params: { institutionId; redirectUrl; state; maxHistoricalDays: 90; accessValidDays: 180 }): Promise<{ authUrl; providerConnectionId }>
completeAuthorization(providerConnectionId, callbackParams): Promise<{ tokens; consentExpiresAt; accounts: ProviderAccount[] }>
getBalances(account, tokens): Promise<ProviderBalance>
getTransactions(account, tokens, from: Date, to: Date): Promise<ProviderTransaction[]>
revoke(providerConnectionId, tokens): Promise<void>
```

### 6.2 Endpoints

| Método | Ruta | Permisos | Descripción |
| --- | --- | --- | --- |
| `GET` | `/banking/institutions?country=ES&q=` | PRO, autenticado | Lista de bancos (cachear 24 h en memoria/DB) |
| `POST` | `/banking/connections` | PRO + **OWNER/ADMIN**, no agencia | Body `{ institutionId }`. Crea `PENDING_AUTH` y devuelve `{ authUrl }` |
| `GET` | `/banking/connections/callback` | `@Public()` + `state` firmado | Redirección del banco. Valida `state`, completa, crea cuentas, lanza sync inicial (lotes) y redirige a `/dashboard/banco?connected=1` o `?error=<code>` |
| `GET` | `/banking/connections` | autenticado | Conexiones + cuentas + saldo + estado + días hasta caducidad |
| `POST` | `/banking/connections/:id/renew` | OWNER/ADMIN | Nuevo flujo de consentimiento sobre la misma conexión |
| `POST` | `/banking/connections/:id/sync` | PRO + OWNER/ADMIN/ACCOUNTANT | Sincronización manual. Rate limit: 1 cada 30 min por conexión (`429` con texto ES) |
| `DELETE` | `/banking/connections/:id` | OWNER/ADMIN | Revoca en el proveedor, borra tokens, `REVOKED`. Query `?deleteTransactions=true` solo OWNER |
| `PATCH` | `/banking/accounts/:id` | OWNER/ADMIN | `{ isActive, displayName }` |
| `GET` | `/banking/transactions` | autenticado | Paginado. Filtros: `accountId`, `reconciliationStatus[]`, `direction` (IN/OUT), `from`, `to`, `q`, `minAmount`, `maxAmount`. Incluye la mejor sugerencia (`select` acotado) |
| `GET` | `/banking/transactions/:id` | autenticado | Detalle + todas las sugerencias + match confirmado |
| `GET` | `/banking/transactions/:id/candidates?q=` | autenticado | Búsqueda manual de gastos/facturas para emparejar |
| `POST` | `/banking/matches/:id/confirm` | PRO + escritura | Confirma una sugerencia |
| `POST` | `/banking/matches/:id/reject` | PRO + escritura | La rechaza (no se vuelve a proponer ese par) |
| `POST` | `/banking/matches/confirm-bulk` | PRO + escritura | `{ matchIds: uuid[] (≤ 50) }`. Cada una en su transacción; devuelve resultado por id |
| `POST` | `/banking/transactions/:id/match` | PRO + escritura | Emparejamiento manual `{ targetType, expenseId? , invoiceId? }` |
| `DELETE` | `/banking/matches/:id` | PRO + escritura | **Deshacer** un match confirmado (si es de factura, borra el `Payment` creado vía `PaymentService.deletePayment`) |
| `POST` | `/banking/transactions/:id/ignore` | PRO + escritura | `{ reason: IgnoreReason, note? }`; `DELETE` para des-ignorar |
| `POST` | `/banking/transactions/:id/create-expense` | PRO + escritura | Crea gasto precargado (fecha, importe, proveedor sugerido) vía `ExpensesService` y lo concilia en la misma transacción |
| `GET` | `/banking/summary` | autenticado | Contadores: sin justificar, sugeridos, conciliados del mes; importes |
| `POST` | `/banking/trigger-scheduler` | `@Public()` + `SchedulerSecretGuard` | Sync diaria + matching + avisos de caducidad |

### 6.3 Sincronización (`bank-sync.service.ts`)

- **Inicial**: hasta 90 días atrás (o lo que permita el banco). **Diaria**: desde `lastSyncedAt − 5 días` (los bancos corrigen/reasientan movimientos recientes).
- **Normalización**: importes a `Decimal` con signo; `description` = remittance info sin espacios dobles, recortada a 500; IBAN de contrapartida → enmascarado + hash; fechas a `@db.Date` en zona `Europe/Madrid`.
- **Deduplicación**: `dedupeKey = providerTransactionId` si el proveedor garantiza IDs estables; si no (o si es `PENDING`), `sha256(accountId|bookingDate|amount|description normalizada|índice de ocurrencia en el día)`. Upsert por `@@unique([accountId, dedupeKey])`.
- Movimientos `PENDING`: se guardan y muestran, **no** se emparejan. Cuando llega el `BOOKED` equivalente, se borra el `PENDING` (mismo importe y cuenta, ±3 días) si no tenía decisiones del usuario.
- **Límites Vercel (30 s)**: el cron procesa conexiones en lotes (máx. 5 por ejecución, las de `lastSyncedAt` más antiguo primero) y termina antes de 25 s (comprobar tiempo transcurrido entre conexiones). Respetar los límites de llamadas/día del proveedor (no sincronizar la misma cuenta más de lo permitido).
- **Errores**: `consecutiveFailures++`; a las 3 → `ERROR` + email al OWNER. Si el proveedor indica consentimiento caducado/revocado → `EXPIRED` (no reintentar).
- **Traspasos propios**: si `counterpartyIbanHash` coincide con el `ibanHash` de otra cuenta del tenant → marcar `IGNORED` con `OWN_TRANSFER` automáticamente (deshacible).
- Tras guardar movimientos nuevos `BOOKED`, ejecutar matching sobre ellos.

### 6.4 Motor de emparejamiento

**Candidatos** (`reconciliation-candidates.service.ts`), siempre con `tenantId` y `select` mínimo:
- Movimiento **cargo** (`amount < 0`) → `Expense` sin match `CONFIRMED`, con `totalAmount = |amount|` (exacto), `date ∈ [bookingDate − 10 días, bookingDate + 3 días]`. Máx. 20 candidatos.
- Movimiento **abono** (`amount > 0`) → `Invoice` con `status ∈ {CONFIRMED, SENT}`, `paymentStatus ≠ PAID`, `total − amountPaid = amount` (exacto), `issueDate ≤ bookingDate + 3 días`, `bookingDate ≤ issueDate + 180 días`. Excluir `PROFORMA`, `QUOTE`, `DRAFT` y rectificativas con total negativo (que, si existen, se emparejan con **cargos**).
- Excluir pares con un match `REJECTED` previo.

**Puntuación** (`reconciliation-scoring.service.ts`) — **función pura**, sin Prisma, 100 % testeada:

| Señal | Puntos | Detalle |
| --- | --- | --- |
| Importe exacto | 40 | Requisito para ser candidato |
| Proximidad de fecha | 0–20 | Gastos: 20 si mismo día, −3 por día de diferencia. Facturas: 20 si entre `issueDate` y `dueDate`, decreciente después |
| Nº de factura en el concepto | 30 | `invoice.number` (normalizado sin espacios/guiones) contenido en `description` |
| NIF en el concepto | 15 | NIF de proveedor/cliente presente en `description` |
| Similitud de nombre | 0–20 | Trigram entre `counterpartyName`/`description` y nombre del proveedor/cliente (`similarity × 20`) |
| IBAN de contrapartida conocido | 15 | Coincide con el IBAN del cliente o con un match confirmado anterior del mismo proveedor |
| Patrón previo | 10 | Movimientos anteriores con descripción similar ya conciliados con el mismo proveedor/cliente |

Puntuación final = `min(100, Σ)`. Reglas:
- `score ≥ 60` → crear `ReconciliationMatch(SUGGESTED)`; el movimiento pasa a `SUGGESTED`.
- Guardar como máximo las **3 mejores** sugerencias por movimiento.
- **Ambigüedad**: si las dos mejores difieren < 10 puntos, ninguna se marca como "recomendada" y la UI pide elegir.
- Un mismo gasto/factura puede ser sugerido para varios movimientos, pero al confirmar uno se eliminan las demás sugerencias que lo apuntan.
- `scoreReasons` siempre se guarda para que la UI explique **por qué** ("Mismo importe · 2 días de diferencia · 'REPSOL' ≈ 'Repsol Comercial S.A.'").
- Auto-confirmación: flag `BANKING_AUTO_CONFIRM_THRESHOLD` **desactivado** en el MVP.

### 6.5 Confirmación (`reconciliation.service.ts`)

En una `prisma.$transaction` (con `withTransactionRetry`):
1. Leer match con `where: { id, tenantId, status: 'SUGGESTED' }` → si no, `ConflictException`.
2. Revalidar que el destino sigue disponible (gasto sin otro match confirmado; factura con pendiente ≥ importe).
3. **Gasto**: match → `CONFIRMED`.
   **Factura**: crear `Payment` (`paymentDate = bookingDate`, `paymentMethod = BANK_TRANSFER` o `DIRECT_DEBIT` según el movimiento, `reference = 'Banco: ' + description recortada`) reutilizando la lógica de `PaymentService.createPayment` (refactorizar para que acepte un `tx` si hace falta, **sin** duplicar cálculos), guardar `paymentId` en el match.
4. Movimiento → `MATCHED`; eliminar el resto de sugerencias del movimiento y las que apunten al mismo destino.
5. Registrar `decidedByUserId`, `decidedAt`.

**Deshacer**: inverso exacto (borrar `Payment` si existe, match → `REJECTED` o borrado, movimiento → `UNMATCHED`, relanzar matching de ese movimiento).

### 6.6 Seguridad

- `state` del callback: JWT/HMAC firmado con `{ tenantId, userId, connectionId, nonce, exp: 15 min }`; un solo uso (guardar nonce). El `tenantId` del callback sale **solo** del `state` verificado.
- Tokens del proveedor cifrados con **AES-256-GCM** y clave propia `BANK_TOKEN_ENCRYPTION_KEY` (64 hex), no reutilizar la de certificados. Nunca devolver tokens al frontend ni loguearlos.
- No almacenar IBAN completo de contrapartidas: máscara + hash con *pepper* (`BANK_IBAN_HASH_PEPPER`).
- Logs: solo ids, contadores, duración y códigos de error. Nunca descripciones, importes con nombre de contrapartida, IBAN ni saldos.
- Solo AIS: si el adaptador ofrece endpoints de pagos, **no** implementarlos.
- Variables nuevas (`.env.example` + AGENTS.md §6): `BANKING_PROVIDER` (`fake` en dev), credenciales del proveedor elegido, `BANKING_REDIRECT_URL`, `BANK_TOKEN_ENCRYPTION_KEY`, `BANK_IBAN_HASH_PEPPER`, `BANKING_AUTO_CONFIRM_THRESHOLD` (vacío = off).

---

## 7. Frontend

### 7.1 Rutas

| Ruta | Contenido |
| --- | --- |
| `/dashboard/banco` | Cabecera con cuentas (logo del banco, nombre, IBAN enmascarado, saldo, "Actualizado hace X h", aviso de caducidad). Pestañas: **Por revisar** (sugeridos) · **Sin justificar** · **Conciliados** · **Ignorados** · **Todos**. Filtros por cuenta, fecha, entrada/salida, texto |
| `/dashboard/banco/conectar` | Selector de banco con buscador y logos → redirige a `authUrl`. Texto de confianza: "Acceso de solo lectura. Nunca podremos mover tu dinero." + nombre del proveedor regulado |
| `/dashboard/banco/[transactionId]` (drawer o página) | Detalle del movimiento, sugerencias con motivos, búsqueda manual de candidatos, acciones |

Entrada nueva "Banco" en la barra lateral (plan PRO; candado + CTA de upgrade en otros planes). Widget en el dashboard: "X movimientos por revisar · Y sin justificar".

### 7.2 Interacción clave (una fila de "Por revisar")

```
05/03  REPSOL E.S. MADRID  −30,25 €   ⟷   Ticket gasolina · Repsol · 03/03 · 30,25 €  [92 ✓]
                                           Mismo importe · 2 días · "REPSOL" ≈ "Repsol"
                                           [ Confirmar ]  [ No es este ]  [ Buscar otro ]
```
- Confirmar con un clic (optimistic update + rollback si el servidor devuelve error).
- Selección múltiple + "Confirmar seleccionados" (solo sugerencias con score ≥ 80 y no ambiguas).
- En "Sin justificar": acciones **Crear gasto** (abre `expense-form` precargado), **Subir justificante** (abre la subida de HU-01 y, al confirmar el documento, propone el match), **Ignorar** (motivo).
- En gastos y facturas existentes: badge "Conciliado con banco" / "Sin conciliar" y enlace al movimiento.

Componentes en `apps/web/src/components/banco/`: `bank-account-card.tsx`, `institution-picker.tsx`, `transaction-table.tsx`, `transaction-row.tsx`, `match-suggestion.tsx`, `match-reasons.tsx`, `manual-match-dialog.tsx`, `ignore-transaction-dialog.tsx`, `consent-expiry-banner.tsx`, `banking-summary-widget.tsx`.
Hooks: `use-bank-connections.ts`, `use-bank-transactions.ts`, `use-reconciliation.ts` con factory `bankingKeys`. Al confirmar un match invalidar también `expenseKeys` e `invoiceKeys` (el estado de cobro cambia).

Tres estados obligatorios; estado vacío inicial: ilustración + "Conecta tu banco para conciliar automáticamente tus gastos y cobros" + botón.

---

## 8. Emails (añadir métodos a `EmailService`)

| Evento | Destinatario | Cuándo |
| --- | --- | --- |
| `sendBankConsentExpiring` | OWNER/ADMIN | 14 y 3 días antes de `consentExpiresAt` (usar `expiryNotifiedAt` para no repetir) |
| `sendBankConsentExpired` | OWNER/ADMIN | Al pasar a `EXPIRED` |
| `sendBankSyncFailing` | OWNER | Al pasar a `ERROR` |

Todos con enlace directo a `/dashboard/banco` y sin importes ni datos bancarios en el cuerpo.

---

## 9. Criterios de aceptación

```gherkin
Escenario: Conectar un banco
  Dado un OWNER con plan PRO
  Cuando elige "BBVA", completa la autenticación en el banco y vuelve a la app
  Entonces ve sus cuentas con saldo y los movimientos de los últimos 90 días
  Y la conexión aparece como "Activa" con su fecha de caducidad

Escenario: Propuesta de emparejamiento de gasto
  Dado un gasto "Gasolina" de 30,25 € del 03/03 con proveedor "Repsol"
  Y un cargo bancario "REPSOL E.S." de −30,25 € del 05/03
  Entonces el cargo aparece en "Por revisar" con ese gasto propuesto y los motivos de la puntuación
  Cuando el usuario pulsa "Confirmar"
  Entonces el movimiento pasa a "Conciliado" y el gasto muestra "Conciliado con banco"

Escenario: Cobro de factura
  Dada una factura confirmada F-2026-0012 de 1.210,00 € pendiente de cobro
  Y un abono de +1.210,00 € con concepto "PAGO FRA F2026-0012"
  Entonces se propone esa factura con puntuación ≥ 90
  Cuando se confirma
  Entonces se registra un cobro en la factura con fecha del movimiento y la factura pasa a "Pagada"
  Y la factura no sufre ningún otro cambio (hash, número y líneas intactos)

Escenario: Deshacer
  Dado un cobro conciliado por error
  Cuando el usuario pulsa "Deshacer conciliación"
  Entonces se elimina el cobro creado, la factura vuelve a "Pendiente" y el movimiento a "Sin justificar"

Escenario: Ambigüedad
  Dados dos gastos de 12,00 € del mismo día
  Y un cargo de −12,00 €
  Entonces se muestran ambos candidatos sin marcar ninguno como recomendado

Escenario: Rechazo persistente
  Cuando el usuario rechaza una sugerencia
  Entonces ese par no vuelve a proponerse en sincronizaciones posteriores

Escenario: Movimiento sin justificante
  Dado un cargo sin candidatos
  Cuando el usuario pulsa "Crear gasto"
  Entonces se abre el formulario con fecha e importe precargados
  Y al guardar, el gasto queda creado y conciliado con ese movimiento

Escenario: Traspaso entre cuentas propias
  Dado que el tenant tiene conectadas dos cuentas
  Cuando hay una transferencia entre ellas
  Entonces ambos movimientos aparecen como "Ignorado · Traspaso entre cuentas propias"

Escenario: Sincronización idempotente
  Cuando se sincroniza dos veces seguidas el mismo periodo
  Entonces no se duplica ningún movimiento ni sugerencia

Escenario: Consentimiento a punto de caducar
  Dado una conexión que caduca en 14 días
  Entonces el OWNER recibe un email y ve un aviso con el botón "Renovar acceso"

Escenario: Seguridad
  Un usuario de otra empresa recibe 404 en cualquier conexión, movimiento o match ajeno
  Un VIEWER puede ver movimientos pero recibe 403 al confirmar
  Una asesoría puede conciliar pero recibe 403 al conectar o desconectar un banco
  Un callback con "state" manipulado o caducado es rechazado
```

---

## 10. Tests obligatorios

- **Unit** `reconciliation-scoring.service.spec.ts`: cada señal, tope 100, umbral 60, ambigüedad < 10 puntos, números de factura con formatos distintos (`F-2026-0012` vs `F2026/12`… definir normalización y probarla).
- **Unit** normalizador: signos, dedupeKey estable, pendientes → reservados, IBAN enmascarado/hash.
- **Unit** cripto: cifrar/descifrar, clave errónea falla, IV distinto por cifrado.
- **Integración** con `fake-bank.adapter.ts`: alta → sync → sugerencias → confirmar → deshacer.
- **Security** `banking.security.spec.ts`: aislamiento entre tenants en todos los endpoints, roles, plan, agencia, callback con `state` inválido/reutilizado.
- **Transacción**: si falla la creación del `Payment`, el match no queda confirmado.
- **Cron**: respeta el presupuesto de tiempo y procesa en lotes.

---

## 11. Plan de implementación

1. **Fase 1 — Fundamentos**: decisión D1, migración, puerto + `fake-bank.adapter`, cifrado, conexión/callback/listado/baja, sync inicial y manual.
2. **Fase 2 — Conciliación**: candidatos, scoring, sugerencias, confirmar/rechazar/deshacer/manual/ignorar, integración con `PaymentService`, `isReconciled` en gastos.
3. **Fase 3 — UI** completa + widget dashboard + badges en gastos/facturas + "Crear gasto" y "Subir justificante".
4. **Fase 4 — Operación**: cron diario, emails de caducidad/errores, renovación de consentimiento, confirmación masiva, adaptador real y pruebas en sandbox del proveedor con 3+ bancos españoles.

## 12. Definition of Done

- [ ] Criterios de §9 verificados con el adaptador `fake` y con el sandbox del proveedor real.
- [ ] Tests de §10 en verde; `pnpm build`, `pnpm lint`, `type-check` limpios.
- [ ] Ninguna llamada de pagos (PIS) en el código.
- [ ] Sin datos bancarios en logs; tokens cifrados; RLS en tablas nuevas.
- [ ] `.env.example`, `AGENTS.md` (módulo `banking/`, variables, cron) y textos legales (privacidad/términos con el proveedor AIS) actualizados.
- [ ] Límites de tamaño de funciones/servicios/componentes respetados.

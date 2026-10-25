# HU-03 — Calendario fiscal y alertas del autónomo

| Campo          | Valor |
| -------------- | ----- |
| Épica          | Cumplimiento fiscal |
| Plan mínimo    | `BASIC`: calendario + alertas por email · `PROFESSIONAL`: checklist de preparación completo + estimación de importes + exportación al gestor (ver D3) |
| Módulos nuevos | `apps/api/src/modules/tax-calendar/`, `apps/api/src/modules/notification-preferences/` |
| Reutiliza      | `invoices`, `expenses`, `expense-documents` (HU-01), `banking` (HU-02), `reports` (exportación Excel), `agency`, `EmailService`, `SchedulerSecretGuard`, `Tenant.taxRegime` |
| Estimación     | L (3 fases) |

---

## 1. Historia

> **Como** autónomo o pyme,
> **quiero** un calendario fiscal personalizado según mi perfil (qué modelos presento y cuándo) y recibir avisos por email semanas antes de cada plazo, indicándome qué me falta (facturas en borrador, gastos sin justificante, tickets sin revisar, movimientos sin conciliar),
> **para** llegar a cada fecha límite con la información completa y lista para presentar o enviar a mi gestor, sin recargos ni sanciones de la AEAT.

### Valor de negocio
- Los recargos por presentación fuera de plazo empiezan en el 1 % + 1 % por mes (art. 27 LGT) y existen sanciones mínimas por no presentar; el aviso con antelación evita ambos.
- Convierte HU-01 y HU-02 en acción concreta: "Faltan 6 días para el 303 y tienes 4 gastos sin justificante".

---

## 2. Estado actual del repo

| Pieza | Ubicación | Uso |
| --- | --- | --- |
| `Tenant.taxRegime` (`GENERAL`/`REAGYP`), `Tenant.accountType` | `schema.prisma` | Punto de partida del perfil fiscal |
| `Invoice` (`status`, `issueDate`, `taxTotal`, `irpfTotal`, `subtotal`, `verifactuStatus`) | `schema.prisma` | Checklist y estimaciones |
| `Expense` (`date`, `vatAmount`, `baseAmount`, `attachmentId`) | `schema.prisma` | Checklist y estimaciones |
| `ExpenseDocument` (HU-01), `BankTransaction` (HU-02) | — | Checklist **solo si el módulo existe y el plan lo permite** (dependencia opcional: inyectar por interfaz) |
| Reports (SALES/EXPENSES → Excel + historial en Storage) | `modules/reports/` | "Exportar para mi gestor" reutiliza estos generadores, **no** crear otro exportador |
| Agencias | `modules/agency/` | Resumen multi-cliente para gestorías (fase 3) |
| Patrón de tabla legal con fuente BOE | `apps/web/src/components/verifactu-deadlines.tsx` + `lib/verifactu-deadlines.ts` | Mismo enfoque: datos legales en un único sitio con su fuente oficial |
| Ajustes de notificaciones | `apps/web/src/app/dashboard/ajustes/notificaciones/page.tsx` | **Hoy solo guarda en `localStorage`** → el servidor no sabe nada. Esta HU lo sustituye por preferencias persistidas en backend |
| Cron | `vercel.json` + `SchedulerSecretGuard` | Envío diario de alertas |

---

## 3. Alcance

### Dentro
1. **Perfil fiscal** por empresa (asistente de 5–7 preguntas) → determina qué modelos aplican.
2. **Catálogo de plazos oficiales** por año (tabla de datos verificada, con fuente) + reglas de generación como respaldo.
3. **Calendario** personalizado (vista lista + mes) con estado de cada obligación: pendiente, presentada, no aplica.
4. **Checklist de preparación** por periodo con enlaces directos para resolver cada pendiente.
5. **Estimación orientativa** de 303 y 130 (PRO).
6. **Alertas por email** escalonadas + resumen semanal opcional, con preferencias por usuario y baja en un clic.
7. **Exportación al gestor** del periodo (PRO) reutilizando `reports`.
8. Feed **iCalendar (.ics)** suscribible desde Google/Outlook/Apple.
9. Widget "Próximo plazo" en el dashboard.

### Fuera
- Presentar modelos ante la AEAT o generar el fichero oficial del modelo (BOE). Solo se informa, estima y exporta.
- Grandes empresas / SII / REDEME (declaración mensual): se detecta en el perfil y se muestra "Tu calendario tiene particularidades; consulta con tu asesor", sin generar plazos mensuales.
- Tributos autonómicos y locales (IAE, IBI…), cuota de autónomos (RETA), Intrastat.
- Notificaciones push/SMS (preferencias preparadas, sin canal implementado).

---

## 4. Decisiones abiertas

| # | Decisión | Recomendación | Bloqueante |
| - | --- | --- | --- |
| D1 | Fuente de los plazos | **Tabla `TaxDeadline` en BD sembrada por año** a partir del *Calendario del contribuyente* oficial de la AEAT, con `sourceUrl` y `verifiedAt`. El generador por reglas solo sirve para **pre-rellenar** el seed del año siguiente; nunca se muestra un plazo no verificado sin la etiqueta "Provisional" | **Sí** |
| D2 | Quién mantiene el seed anual | Script `pnpm tax-calendar:seed <año>` + tarea manual anual (diciembre) revisada por una persona; test que falla si no existe seed para el año en curso + siguiente a partir del 1 de diciembre | **Sí** |
| D3 | Reparto por plan | BASIC: calendario, alertas y checklist con contadores. PRO: checklist con detalle y enlaces, estimaciones, exportación, resumen de agencia | No |
| D4 | Destinatarios por defecto | OWNER y ADMIN activados; ACCOUNTANT activado si existe; VIEWER desactivado. Cada usuario puede cambiarlo | No |
| D5 | Antelación de avisos | 21, 14, 7, 3 y 1 días antes del fin de plazo + el mismo día. Configurable por usuario (subconjunto) | No |
| D6 | Texto legal | Toda estimación y fecha muestra aviso: "Información orientativa. Verifica siempre en la sede de la AEAT o con tu asesor." Revisar con quien lleve lo legal | **Sí** antes de producción |

---

## 5. Dominio fiscal (referencia para la implementación)

> ⚠️ Estas fechas son las **habituales** y sirven para diseñar y testear. **La fuente de verdad en producción es la tabla `TaxDeadline` verificada cada año contra la AEAT (D1).** Si un plazo termina en sábado, domingo o festivo nacional, se traslada al siguiente día hábil; el seed debe reflejar la fecha ya trasladada.

### 5.1 Modelos soportados

| Modelo | Quién lo presenta | Periodo | Plazo habitual |
| --- | --- | --- | --- |
| **303** IVA | Régimen general de IVA (autónomos y sociedades). No en REAGYP puro | Trimestral | 1T: 1–20 abr · 2T: 1–20 jul · 3T: 1–20 oct · 4T: 1–30 ene |
| **390** Resumen anual IVA | Quien presenta 303 (salvo exonerados) | Anual | 1–30 ene |
| **130** Pago fraccionado IRPF | Autónomo en estimación directa **salvo** que ≥ 70 % de sus ingresos del año anterior tuvieran retención | Trimestral | 1–20 abr / jul / oct · 4T: 1–30 ene |
| **131** Pago fraccionado IRPF (módulos) | Autónomo en estimación objetiva | Trimestral | Igual que 130 |
| **111** Retenciones trabajo/profesionales | Quien paga nóminas o facturas de profesionales con retención | Trimestral | 1–20 abr / jul / oct · 4T: 1–20 ene |
| **190** Resumen anual 111 | Quien presenta 111 | Anual | 1–31 ene |
| **115** Retenciones alquiler | Quien alquila un local con retención | Trimestral | Igual que 111 |
| **180** Resumen anual 115 | Quien presenta 115 | Anual | 1–31 ene |
| **349** Operaciones intracomunitarias | Quien tiene operaciones intra-UE | Trimestral (habitual) | Igual que 303 |
| **347** Operaciones con terceros > 3.005,06 € | Casi todos (salvo exonerados) | Anual | 1–28/29 feb |
| **100** Renta | Persona física | Anual | Aprox. inicio abr – 30 jun (fijado cada año por Orden) |
| **200** Impuesto sobre Sociedades | Sociedades | Anual | 1–25 jul (ejercicio = año natural) |
| **202** Pago fraccionado IS | Sociedades obligadas | 3 pagos | 1–20 abr · 1–20 oct · 1–20 dic |

**Domiciliación bancaria**: el plazo para domiciliar termina antes que el de presentación (habitualmente 5 días antes; para la Renta, unos días antes del 30 jun). Se guarda como `directDebitEndDate` y genera su propia alerta ("Si quieres domiciliar el pago, hazlo antes del 15 de abril").

### 5.2 Determinación de obligaciones a partir del perfil (función pura)

```
applicableModels(profile) →
  taxpayerType = SELF_EMPLOYED:
    + 303, 390     si vatRegime = GENERAL (o RECARGO_EQUIVALENCIA → no 303 por esa actividad: avisar)
    + 130          si irpfMethod ∈ {DIRECT_SIMPLIFIED, DIRECT_NORMAL} y !exemptFrom130
    + 131          si irpfMethod = OBJECTIVE
    + 100          siempre
  taxpayerType = COMPANY:
    + 303, 390     si vatRegime = GENERAL
    + 200          siempre; 202 si makesCorporateTaxInstallments
  ambos:
    + 111, 190     si hasEmployeesOrProfessionalWithholdings
    + 115, 180     si rentsBusinessPremises
    + 349          si hasIntraEuOperations
    + 347          si !exemptFrom347
  isLargeCompanyOrSII → no generar trimestrales; mostrar aviso
```

**Ayuda automática para `exemptFrom130`**: calcular con las facturas confirmadas del año anterior `Σ subtotal de facturas con irpfTotal > 0 / Σ subtotal total`. Si ≥ 70 %, sugerir "Parece que no tienes que presentar el 130"; el usuario decide (nunca cambiarlo solo).

### 5.3 Estimaciones (PRO, orientativas)

- **303** (trimestre): `IVA repercutido = Σ taxTotal` de facturas `CONFIRMED|SENT|PAID|RECTIFIED` con `issueDate` en el trimestre (rectificativas restan) − `IVA soportado = Σ vatAmount` de gastos con `date` en el trimestre. Mostrar desglose y aviso de que no todo el IVA soportado es deducible.
- **130** (acumulado del año hasta el trimestre): `max(0, 20 % × (ingresos acumulados − gastos acumulados) − retenciones soportadas acumuladas − pagos 130 previos del año)`. Los pagos previos se toman del importe que el usuario anota al marcar como presentado (si no lo anota, se usa la estimación previa marcada como tal).
- Excluir siempre `DRAFT`, `PROFORMA`, `QUOTE`. Toda la aritmética con `Decimal`/céntimos y redondeo half-up del repo.

---

## 6. Modelo de datos (Prisma)

```prisma
enum TaxpayerType { SELF_EMPLOYED COMPANY }
enum VatRegime { GENERAL EQUIVALENCE_SURCHARGE REAGYP EXEMPT }
enum IrpfMethod { DIRECT_SIMPLIFIED DIRECT_NORMAL OBJECTIVE NOT_APPLICABLE }
enum TaxPeriod { Q1 Q2 Q3 Q4 ANNUAL INSTALLMENT_1 INSTALLMENT_2 INSTALLMENT_3 }
enum TaxObligationStatus { PENDING FILED NOT_APPLICABLE }
enum NotificationChannel { EMAIL }

model TaxProfile {
  id                                   String       @id @default(uuid())
  tenantId                             String       @unique @map("tenant_id")
  taxpayerType                         TaxpayerType @map("taxpayer_type")
  vatRegime                            VatRegime    @map("vat_regime")
  irpfMethod                           IrpfMethod   @map("irpf_method")
  exemptFrom130                        Boolean      @default(false) @map("exempt_from_130")
  hasEmployeesOrProfessionalWithholdings Boolean    @default(false) @map("has_withholdings_111")
  rentsBusinessPremises                Boolean      @default(false) @map("rents_business_premises")
  hasIntraEuOperations                 Boolean      @default(false) @map("has_intra_eu_operations")
  exemptFrom347                        Boolean      @default(false) @map("exempt_from_347")
  makesCorporateTaxInstallments        Boolean      @default(false) @map("makes_corporate_tax_installments")
  isLargeCompanyOrSii                  Boolean      @default(false) @map("is_large_company_or_sii")
  activityDescription                  String?      @map("activity_description")
  completedAt                          DateTime?    @map("completed_at")
  updatedByUserId                      String?      @map("updated_by_user_id")
  createdAt                            DateTime     @default(now()) @map("created_at")
  updatedAt                            DateTime     @updatedAt @map("updated_at")
  tenant                               Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  @@map("tax_profiles")
}

/// Global (sin tenant): plazos oficiales verificados por año.
model TaxDeadline {
  id                 String    @id @default(uuid())
  modelCode          String    @map("model_code")    // '303', '130', ...
  fiscalYear         Int       @map("fiscal_year")   // ejercicio al que se refiere el periodo
  period             TaxPeriod
  periodStart        DateTime  @map("period_start") @db.Date
  periodEnd          DateTime  @map("period_end") @db.Date
  filingStart        DateTime  @map("filing_start") @db.Date
  filingEnd          DateTime  @map("filing_end") @db.Date
  directDebitEnd     DateTime? @map("direct_debit_end") @db.Date
  sourceUrl          String    @map("source_url")
  isProvisional      Boolean   @default(true) @map("is_provisional")
  verifiedAt         DateTime? @map("verified_at")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")
  obligations        TenantTaxObligation[]
  @@unique([modelCode, fiscalYear, period])
  @@index([filingEnd])
  @@map("tax_deadlines")
}

/// Instancia por empresa: permite marcar "presentado" y guardar el importe.
model TenantTaxObligation {
  id               String              @id @default(uuid())
  tenantId         String              @map("tenant_id")
  deadlineId       String              @map("deadline_id")
  status           TaxObligationStatus @default(PENDING)
  filedAt          DateTime?           @map("filed_at")
  filedByUserId    String?             @map("filed_by_user_id")
  filedAmount      Decimal?            @map("filed_amount") @db.Decimal(12, 2) // a ingresar (+) / a devolver o compensar (−)
  filingReference  String?             @map("filing_reference")                // nº de justificante (opcional)
  notes            String?
  createdAt        DateTime            @default(now()) @map("created_at")
  updatedAt        DateTime            @updatedAt @map("updated_at")
  tenant           Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  deadline         TaxDeadline         @relation(fields: [deadlineId], references: [id])
  alertLogs        TaxAlertLog[]
  @@unique([tenantId, deadlineId])
  @@index([tenantId, status])
  @@map("tenant_tax_obligations")
}

model TaxAlertLog {
  id            String              @id @default(uuid())
  tenantId      String              @map("tenant_id")
  userId        String              @map("user_id")
  obligationId  String              @map("obligation_id")
  kind          String              // 'FILING_D21' | 'FILING_D7' | 'FILING_D0' | 'DIRECT_DEBIT_D3' | 'OVERDUE_D1' ...
  sentAt        DateTime            @default(now()) @map("sent_at")
  providerMessageId String?         @map("provider_message_id")
  obligation    TenantTaxObligation @relation(fields: [obligationId], references: [id], onDelete: Cascade)
  @@unique([userId, obligationId, kind])   // idempotencia: un aviso de cada tipo, una sola vez
  @@index([tenantId, sentAt])
  @@map("tax_alert_logs")
}

model NotificationPreference {
  id              String              @id @default(uuid())
  userId          String              @map("user_id")
  tenantId        String              @map("tenant_id")
  channel         NotificationChannel @default(EMAIL)
  taxDeadlineAlerts Boolean           @default(true) @map("tax_deadline_alerts")
  taxAlertOffsets Int[]               @default([21, 14, 7, 3, 1, 0]) @map("tax_alert_offsets")
  weeklyDigest    Boolean             @default(false) @map("weekly_digest")
  unsubscribeToken String             @unique @map("unsubscribe_token")
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt @map("updated_at")
  @@unique([userId, tenantId, channel])
  @@map("notification_preferences")
}
```

- `TenantTaxObligation` se **materializa** (upsert) al guardar el perfil y en el cron diario para los plazos de los próximos 12 meses. Si el perfil cambia y un modelo deja de aplicar: las `PENDING` futuras pasan a `NOT_APPLICABLE`; nunca se tocan las `FILED`.
- RLS en las tablas con `tenant_id`. `TaxDeadline` es de solo lectura para la API pública.
- El catálogo de modelos (código, nombre, descripción corta en español, enlace a la sede AEAT) va en `packages/shared-constants/src/tax-models.ts`.

---

## 7. Backend

### 7.1 Estructura

```
modules/tax-calendar/
├── tax-calendar.module.ts
├── tax-calendar.controller.ts
├── tax-calendar-scheduler.controller.ts
├── tax-profile.service.ts
├── tax-obligation-rules.ts              # applicableModels(profile) — función pura
├── tax-obligations.service.ts           # materializar, listar, marcar presentada
├── tax-readiness.service.ts             # checklist del periodo (agrega proveedores de checks)
├── readiness-checks/
│   ├── readiness-check.port.ts          # interfaz: run(tenantId, period) → ReadinessItem
│   ├── draft-invoices.check.ts
│   ├── verifactu-pending.check.ts
│   ├── expenses-without-attachment.check.ts
│   ├── documents-pending-review.check.ts      # solo si existe HU-01
│   └── unreconciled-transactions.check.ts     # solo si existe HU-02
├── tax-estimation.service.ts            # 303 y 130
├── tax-alerts.service.ts                # decide qué enviar a quién (puro + lectura)
├── tax-alert-dispatcher.service.ts      # envía y registra TaxAlertLog
├── tax-ics.service.ts                   # feed iCalendar
└── dto/ …
modules/notification-preferences/        # GET/PUT preferencias + baja pública por token
prisma/seeds/tax-deadlines/<año>.ts      # seed verificado por año
```

### 7.2 Endpoints

| Método | Ruta | Permisos | Descripción |
| --- | --- | --- | --- |
| `GET` | `/tax-calendar/profile` | autenticado | Perfil (o `null` + sugerencias iniciales derivadas de `accountType`/`taxRegime`) |
| `PUT` | `/tax-calendar/profile` | OWNER/ADMIN/ACCOUNTANT | Guarda y re-materializa obligaciones (transacción) |
| `GET` | `/tax-calendar/profile/suggestions` | autenticado | P. ej. cálculo del 70 % para el 130 |
| `GET` | `/tax-calendar/obligations?from&to&status[]` | autenticado | Obligaciones con plazo, días restantes y contador de pendientes (máx. 18 meses de rango) |
| `GET` | `/tax-calendar/obligations/next` | autenticado | Próxima obligación + resumen (widget) |
| `GET` | `/tax-calendar/obligations/:id/readiness` | autenticado (detalle completo solo PRO) | Checklist: `[{ code, severity, count, amount?, message, actionUrl }]` |
| `GET` | `/tax-calendar/obligations/:id/estimate` | PRO | Estimación 303/130 con desglose (404 para modelos sin estimación) |
| `POST` | `/tax-calendar/obligations/:id/file` | OWNER/ADMIN/ACCOUNTANT | `{ filedAt, filedAmount?, filingReference?, notes? }` → `FILED`; detiene avisos |
| `POST` | `/tax-calendar/obligations/:id/unfile` | OWNER/ADMIN | Vuelve a `PENDING` |
| `POST` | `/tax-calendar/obligations/:id/export` | PRO | Genera vía `reports` los Excel de ventas y gastos del periodo y devuelve enlaces del historial |
| `GET` | `/tax-calendar/ics-url` / `POST /tax-calendar/ics-url/rotate` | autenticado | URL privada del feed |
| `GET` | `/tax-calendar/ics/:token.ics` | `@Public()` + token de 32+ bytes | Feed `text/calendar` (solo fechas y nombre del modelo, **sin importes**) |
| `GET`/`PUT` | `/notification-preferences` | autenticado | Preferencias del usuario en el tenant actual |
| `GET`/`POST` | `/notification-preferences/unsubscribe?token=` | `@Public()` | Baja en un clic (GET muestra confirmación, POST para `List-Unsubscribe-Post`) |
| `POST` | `/tax-calendar/trigger-scheduler` | `@Public()` + `SchedulerSecretGuard` | Materializar + enviar avisos del día |

### 7.3 Checklist de preparación (`tax-readiness.service.ts`)

Para el periodo de la obligación (`periodStart..periodEnd`), cada check devuelve un `ReadinessItem`:

| Código | Condición | Severidad | Acción |
| --- | --- | --- | --- |
| `DRAFT_INVOICES` | Facturas `DRAFT` con `issueDate` en el periodo | ERROR | `/dashboard/facturas?status=DRAFT&from&to` |
| `VERIFACTU_NOT_ACCEPTED` | Facturas confirmadas con `verifactuStatus ∈ {PENDING, ERROR, REJECTED}` | ERROR | `/dashboard/verifactu` |
| `EXPENSES_WITHOUT_ATTACHMENT` | Gastos sin `attachmentId` en el periodo | WARNING | `/dashboard/gastos?hasAttachment=false&from&to` |
| `DOCUMENTS_PENDING_REVIEW` | `ExpenseDocument` `NEEDS_REVIEW/PENDING/FAILED` | WARNING | `/dashboard/gastos/bandeja` |
| `UNRECONCILED_OUTGOING` | Cargos bancarios `UNMATCHED` en el periodo | WARNING | `/dashboard/banco?status=UNMATCHED&direction=OUT` |
| `NO_ACTIVITY` | Ni facturas ni gastos en el periodo | INFO | "Si no has tenido actividad, el 303 se presenta igualmente sin actividad" |
| `READY` | Ningún ERROR/WARNING | OK | Botón "Exportar para mi gestor" |

Los checks de HU-01/HU-02 se registran como proveedores opcionales (token de inyección con array de `ReadinessCheck`): si el módulo no está, el check no existe; si el tenant no tiene plan para ese módulo, se omite. Todas las consultas son `count`/`aggregate` con `tenantId` (sin traer filas).

### 7.4 Alertas (cron diario)

- `vercel.json`: `{ "path": "/api/v1/tax-calendar/trigger-scheduler", "schedule": "0 6 * * *" }` (06:00 UTC ≈ 07:00–08:00 en Madrid). Todos los cálculos de "días restantes" en **`Europe/Madrid`**.
- Algoritmo por ejecución, en lotes que terminan antes de 25 s y son **reanudables** (la idempotencia de `TaxAlertLog` permite relanzar sin duplicar):
  1. Obligaciones `PENDING` cuyo `filingEnd − hoy ∈ offsets` (o `directDebitEnd − hoy = 3`) o vencidas ayer (`OVERDUE_D1`, una sola vez).
  2. Destinatarios: usuarios del tenant con preferencia activa (D4) y email verificado.
  3. Si ya existe `TaxAlertLog(userId, obligationId, kind)` → saltar.
  4. Calcular checklist (§7.3) **una vez por tenant y obligación**, no por usuario.
  5. Agrupar: si un tenant tiene varias obligaciones que disparan aviso el mismo día (303 + 130 + 111), enviar **un único email** con todas; registrar un log por obligación.
  6. Enviar con `EmailService.sendTaxDeadlineReminder(...)` (nuevo); guardar `providerMessageId`.
- Resumen semanal (lunes) para quien lo active: próximas obligaciones de 45 días + checklist.
- Si el envío falla, no se registra el log → se reintenta en la siguiente ejecución (máx. hasta el día del plazo).

### 7.5 Contenido del email

- **Asunto**: `Quedan 7 días para presentar el Modelo 303 (1T 2027) — 20 de abril` / con varios: `Quedan 7 días: Modelos 303 y 130 (1T 2027)`.
- **Cuerpo**: empresa, modelos y fecha límite, fecha de domiciliación si aplica, checklist con contadores ("3 facturas en borrador", "5 gastos sin justificante"), estimación (solo PRO, con aviso), botones "Revisar ahora" y "Ya lo he presentado" (enlace autenticado a la app, nunca acción directa desde el email).
- Cabeceras `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` y enlace de baja en el pie.
- Sin importes en el asunto; sin NIF completos.

---

## 8. Frontend

| Ruta | Contenido |
| --- | --- |
| `/dashboard/calendario-fiscal` | **Tarjeta principal** con la próxima obligación (cuenta atrás, estado del checklist con semáforo). Vista **Lista** (agrupada por mes) y vista **Mes**. Cada obligación: modelo, periodo, fecha límite, domiciliación, estado, acciones |
| `/dashboard/calendario-fiscal/[obligationId]` | Detalle: checklist con enlaces, estimación (PRO, desglose plegable), "Exportar para mi gestor", "Marcar como presentado" (diálogo con fecha, importe y nº de justificante opcionales) |
| `/dashboard/calendario-fiscal/perfil` | Asistente del perfil fiscal (pasos con lenguaje llano: "¿Eres autónomo o sociedad?", "¿Tienes empleados o pagas a profesionales con retención?", "¿Alquilas un local?", "¿Vendes o compras a empresas de otros países de la UE?"…), con ayuda contextual y la sugerencia del 70 % para el 130 |
| `/dashboard/ajustes/notificaciones` | **Reescribir**: leer/guardar con `use-notification-preferences.ts` en backend (eliminar `localStorage`). Toggle de alertas fiscales, selección de antelaciones, resumen semanal |

- Banner en el dashboard si el perfil fiscal no está completo: "Configura tu calendario fiscal en 1 minuto".
- Widget `next-tax-deadline-widget.tsx` en el dashboard principal.
- Botón "Añadir a mi calendario" con la URL `.ics` (copiar + instrucciones Google/Outlook/Apple).
- Colores por urgencia: > 14 días neutro, 7–14 ámbar, < 7 rojo, presentado verde, no aplica gris.
- Aviso legal (D6) visible en la página y en cada estimación. Cada plazo enlaza a su `sourceUrl`; los provisionales llevan etiqueta "Provisional".
- Hooks: `use-tax-profile.ts`, `use-tax-obligations.ts`, `use-tax-readiness.ts`, `use-tax-estimate.ts`, `use-notification-preferences.ts` con factory `taxCalendarKeys`.
- Componentes en `apps/web/src/components/calendario-fiscal/` (≤ 150 líneas cada uno). Tres estados obligatorios.

### Agencias (fase 3)
- En `/dashboard/asesoria`: tabla "Próximos plazos de mis clientes" (cliente, modelo, fecha, estado del checklist, presentado sí/no) y email semanal resumen a la agencia. Respetar `AgencyAccessGuard` y que solo se vean clientes con relación activa.

---

## 9. Criterios de aceptación

```gherkin
Escenario: Calendario según perfil
  Dado un autónomo en estimación directa simplificada, IVA general, sin empleados ni local alquilado
  Cuando completa el perfil fiscal
  Entonces su calendario muestra 303 y 130 trimestrales, 390 y 347 anuales y la Renta
  Y no muestra 111, 115, 349, 200 ni 202

Escenario: Cambio de perfil
  Dado que el usuario indica que ahora alquila un local
  Entonces aparecen los modelos 115 trimestral y 180 anual a partir del periodo actual
  Y las obligaciones ya marcadas como presentadas no cambian

Escenario: Sugerencia del 130
  Dado que el 80 % de la facturación del año anterior llevó retención de IRPF
  Entonces el asistente sugiere que podría no estar obligado al 130, sin desactivarlo solo

Escenario: Aviso escalonado con checklist
  Dado un 303 del 1T con plazo el 20 de abril pendiente
  Y 2 facturas en borrador y 3 gastos sin justificante de ese trimestre
  Cuando es 13 de abril
  Entonces el OWNER recibe un único email "Quedan 7 días para presentar el Modelo 303 (1T)"
  Que indica "2 facturas en borrador" y "3 gastos sin justificante" con enlace a la app
  Y si el cron se ejecuta dos veces ese día no recibe un segundo email

Escenario: Agrupación
  Dado que 303 y 130 vencen el mismo día
  Entonces se envía un solo email que menciona ambos modelos

Escenario: Marcar como presentado
  Cuando el usuario marca el 303 1T como presentado
  Entonces deja de recibir avisos de esa obligación y aparece en verde en el calendario

Escenario: Plazo en fin de semana
  Dado un plazo oficial cuyo día 20 cae en domingo
  Entonces el calendario y los avisos usan la fecha trasladada que figura en la tabla verificada

Escenario: Baja en un clic
  Cuando el usuario pulsa "Darme de baja" en el email
  Entonces deja de recibir alertas fiscales de esa empresa sin necesidad de iniciar sesión

Escenario: Estimación (PRO)
  Dado un trimestre con 2.100 € de IVA repercutido y 600 € de IVA soportado
  Entonces la estimación del 303 muestra 1.500 € a ingresar con su desglose y el aviso de que es orientativa

Escenario: Plan BASIC
  Dado una empresa con plan BASIC
  Entonces ve el calendario y recibe alertas con contadores
  Pero la estimación y la exportación muestran el CTA de mejora a PRO

Escenario: Feed iCalendar
  Cuando el usuario se suscribe a la URL .ics en Google Calendar
  Entonces ve los plazos de sus modelos como eventos de día completo con aviso, sin importes

Escenario: Aislamiento
  Un usuario de otra empresa recibe 404 en obligaciones, checklist, estimación y feed ajenos
```

---

## 10. Tests obligatorios

- **Unit** `tax-obligation-rules.spec.ts`: tabla de perfiles → modelos (autónomo directa, módulos, exento 130, sociedad, REAGYP, recargo de equivalencia, intra-UE, SII).
- **Unit** `tax-alerts.service.spec.ts`: offsets, domiciliación, vencido, agrupación, preferencias, zona horaria (cambio de hora en marzo/octubre), idempotencia.
- **Unit** estimaciones: 303 con rectificativas, 130 acumulado con pagos previos y retenciones, nunca negativo el 130, redondeo.
- **Unit** sugerencia del 70 %.
- **Datos**: test que comprueba que existe seed `TaxDeadline` verificado para el año en curso (y para el siguiente a partir del 1 de diciembre), que `filingEnd` nunca es sábado/domingo y que `directDebitEnd < filingEnd`.
- **Security** `tax-calendar.security.spec.ts`: aislamiento entre tenants, roles, plan, token de `.ics` y de baja (inválido → 404, sin revelar existencia).
- **Integración** del cron con `EmailService` mockeado: relanzar no duplica; fallo de envío reintenta.
- **Snapshot** del HTML del email (asunto y cuerpo con 1 y con varios modelos).

---

## 11. Plan de implementación

1. **Fase 1 — Núcleo**: migración, catálogo de modelos en shared-constants, seed verificado del año en curso y siguiente, perfil fiscal + reglas, materialización, endpoints de calendario y "presentado", UI de calendario + asistente + widget.
2. **Fase 2 — Alertas**: preferencias en backend (sustituir `localStorage`), checklist, cron, email agrupado, baja en un clic, feed `.ics`.
3. **Fase 3 — PRO y agencias**: estimaciones 303/130, exportación al gestor vía `reports`, checks de HU-01/HU-02, vista y resumen para asesorías.

## 12. Definition of Done

- [ ] Criterios de §9 verificados; seeds de plazos revisados por una persona contra la AEAT (`verifiedAt` relleno, `isProvisional = false`).
- [ ] Tests de §10 en verde; `pnpm build`, `pnpm lint`, `type-check` limpios.
- [ ] Página de notificaciones sin `localStorage` para preferencias de email.
- [ ] Emails con `List-Unsubscribe`, sin NIF completos ni importes en el asunto.
- [ ] Aviso legal (D6) presente en UI, emails y estimaciones.
- [ ] `vercel.json` (cron), `.env.example` (si aplica), `AGENTS.md` (módulos, crons, tarea anual de seed) actualizados.
- [ ] Límites de tamaño de funciones/servicios/componentes respetados.

# FASE 2 - Testing Guide

## Setup

### 1. Environment Variables

Create `.env` file in `apps/api/`:

```env
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[password]@[region].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[password]@[region].supabase.co:5432/postgres"

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_ACCESS_SECRET="super-secret-access-key-change-in-production-min-32-chars"
JWT_REFRESH_SECRET="super-secret-refresh-key-change-in-production-min-32-chars"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# API Config
APP_PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 2. Run Migrations

```bash
cd apps/api
pnpm prisma migrate dev --name init
```

### 3. (Optional) Seed Database

```bash
cd apps/api
pnpm prisma:seed
```

This creates a test account:

- Email: `admin@testcompany.com`
- Password: `Test1234!`

### 4. Start API

```bash
cd apps/api
pnpm dev
```

API should be running on: http://localhost:3001
Swagger docs: http://localhost:3001/api

---

## Testing Endpoints

### 1. POST /api/v1/auth/register ✅

**Request:**

```json
{
  "email": "test@example.com",
  "password": "Test1234!",
  "firstName": "Juan",
  "lastName": "Pérez",
  "businessName": "Mi Empresa S.L.",
  "nif": "B87654321"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "ADMIN",
      "emailVerified": false
    },
    "tenant": {
      "id": "uuid",
      "businessName": "Mi Empresa S.L.",
      "nif": "B87654321",
      "setupCompleted": false
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "meta": {
    "timestamp": "2026-02-18T...",
    "path": "/api/v1/auth/register"
  }
}
```

**Validations to test:**

- ❌ Email already exists → 409 Conflict
- ❌ NIF already exists → 409 Conflict
- ❌ Invalid email format → 400 Bad Request
- ❌ Password too short → 400 Bad Request
- ❌ Password without uppercase → 400 Bad Request
- ❌ Invalid NIF format → 400 Bad Request

---

### 2. POST /api/v1/auth/login ✅

**Request:**

```json
{
  "email": "test@example.com",
  "password": "Test1234!"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "test@example.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "ADMIN",
      "emailVerified": false,
      "tenantId": "uuid"
    },
    "tenant": {
      "id": "uuid",
      "businessName": "Mi Empresa S.L.",
      "nif": "B87654321",
      "setupCompleted": false,
      "plan": "FREE"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "meta": {
    "timestamp": "...",
    "path": "/api/v1/auth/login"
  }
}
```

**Validations to test:**

- ❌ Wrong password → 401 Unauthorized
- ❌ Non-existent email → 401 Unauthorized
- ❌ User deactivated → 401 Unauthorized
- ❌ Tenant deactivated → 401 Unauthorized

---

### 3. POST /api/v1/auth/refresh ✅

**Request:**

```json
{
  "refreshToken": "eyJ..."
}
```

**Headers:**

```
Authorization: Bearer <refresh-token>
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "meta": {
    "timestamp": "...",
    "path": "/api/v1/auth/refresh"
  }
}
```

**Validations to test:**

- ❌ Invalid refresh token → 401 Unauthorized
- ❌ Expired refresh token → 401 Unauthorized
- ❌ User deactivated → 401 Unauthorized

---

### 4. GET /api/v1/auth/me ✅

**Headers:**

```
Authorization: Bearer <access-token>
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "test@example.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "ADMIN",
    "emailVerified": false,
    "isActive": true,
    "lastLoginAt": "2026-02-18T...",
    "createdAt": "2026-02-18T...",
    "tenant": {
      "id": "uuid",
      "businessName": "Mi Empresa S.L.",
      "nif": "B87654321",
      "setupCompleted": false,
      "plan": "FREE",
      "logoUrl": null
    }
  },
  "meta": {
    "timestamp": "...",
    "path": "/api/v1/auth/me"
  }
}
```

**Validations to test:**

- ❌ No token → 401 Unauthorized
- ❌ Invalid token → 401 Unauthorized
- ❌ Expired token → 401 Unauthorized

---

### 5. POST /api/v1/auth/logout ✅

**Headers:**

```
Authorization: Bearer <access-token>
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Sesión cerrada correctamente"
  },
  "meta": {
    "timestamp": "...",
    "path": "/api/v1/auth/logout"
  }
}
```

After logout, the refresh token should be invalidated.

---

### 6. POST /api/v1/auth/forgot-password ✅

**Request:**

```json
{
  "email": "test@example.com"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Si el email existe, recibirás un enlace de recuperación"
  },
  "meta": {
    "timestamp": "...",
    "path": "/api/v1/auth/forgot-password"
  }
}
```

**Note:** Always returns 200 even if email doesn't exist (security).

---

### 7. POST /api/v1/auth/reset-password ✅

**Request:**

```json
{
  "token": "generated-reset-token-from-database",
  "password": "NewPassword123!"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Contraseña actualizada correctamente"
  },
  "meta": {
    "timestamp": "...",
    "path": "/api/v1/auth/reset-password"
  }
}
```

**Validations to test:**

- ❌ Invalid token → 400 Bad Request
- ❌ Expired token (> 1 hour) → 400 Bad Request
- ❌ Invalid password format → 400 Bad Request

---

### 8. POST /api/v1/auth/verify-email ✅

**Request:**

```json
{
  "token": "generated-email-verify-token-from-database"
}
```

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Email verificado correctamente"
  },
  "meta": {
    "timestamp": "...",
    "path": "/api/v1/auth/verify-email"
  }
}
```

**Validations to test:**

- ❌ Invalid token → 404 Not Found

---

## Multi-Tenancy Testing

### Verify Tenant Isolation

1. **Create two users with different companies:**

```bash
# User 1
POST /api/v1/auth/register
{
  "email": "user1@company1.com",
  "password": "Test1234!",
  "firstName": "User",
  "lastName": "One",
  "businessName": "Company One",
  "nif": "B11111111"
}

# User 2
POST /api/v1/auth/register
{
  "email": "user2@company2.com",
  "password": "Test1234!",
  "firstName": "User",
  "lastName": "Two",
  "businessName": "Company Two",
  "nif": "B22222222"
}
```

2. **Login as User 1 and get access token**
3. **Try to access User 2's data** (should fail)
4. **Create a customer as User 1**
5. **Login as User 2**
6. **Try to list customers** → Should only see User 2's customers, not User 1's

---

## Rate Limiting Testing

**Test:**

```bash
# Make 101 requests rapidly
for i in {1..101}; do
  curl http://localhost:3001/api/v1/auth/me \
    -H "Authorization: Bearer <token>"
done
```

**Expected:**

- First 100 requests: 200 OK (or 401 if no token)
- 101st request: 429 Too Many Requests

**Wait 60 seconds and try again:**

- Should work again (rate limit resets)

---

## Security Testing

### JWT Token Validation

1. **Try accessing protected endpoint without token:**

```bash
GET /api/v1/auth/me
# Expected: 401 Unauthorized
```

2. **Try accessing with invalid token:**

```bash
GET /api/v1/auth/me
Authorization: Bearer invalid-token
# Expected: 401 Unauthorized
```

3. **Try accessing with expired token:**

- Wait 15 minutes after login
- Try GET /api/v1/auth/me
- Expected: 401 Unauthorized
- Use refresh token to get new access token

### Tenant ID Extraction

**CRITICAL:** Tenant ID must NEVER come from request body/params/query.

1. Inspect JWT token at https://jwt.io
2. Verify payload contains:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "tenantId": "tenant-id",
  "iat": ...,
  "exp": ...
}
```

3. In protected endpoints, `@CurrentTenant()` decorator extracts `tenantId` from JWT.

---

## Error Format Validation

All errors should follow this format:

```json
{
  "statusCode": 400,
  "timestamp": "2026-02-18T...",
  "path": "/api/v1/auth/register",
  "method": "POST",
  "message": "Validation failed..."
}
```

Test with:

- Invalid email
- Missing required fields
- Invalid NIF
- Wrong password format

---

## Swagger Documentation

Visit: http://localhost:3001/api

**Verify:**

- ✅ All 8 auth endpoints are documented
- ✅ Request/response schemas are visible
- ✅ "Try it out" functionality works
- ✅ Bearer auth is configured
- ✅ Examples are present

---

## Completion Criteria Checklist

- [ ] **Un usuario puede registrarse** → POST /api/v1/auth/register works
- [ ] **Se crea tenant + user + series default** → Check database after register
- [ ] **Login devuelve tokens JWT válidos** → POST /api/v1/auth/login works
- [ ] **Refresh token renueva los tokens** → POST /api/v1/auth/refresh works
- [ ] **Endpoints protegidos rechazan peticiones sin token** → GET /api/v1/auth/me returns 401
- [ ] **TenantId se extrae del JWT** → Use @CurrentTenant() decorator, inspect logs
- [ ] **Swagger muestra todos los endpoints** → Visit http://localhost:3001/api
- [ ] **Errores devuelven formato consistente** → Test validation errors
- [ ] **Rate limiting funciona** → Make 101 requests, get 429 on 101st
- [ ] **Flujo auth completo funciona** → Register → Login → Get Me → Logout → Refresh

---

## Thunder Client / Postman Collection

Create a collection with these requests for easy testing:

1. Register
2. Login
3. Get Me
4. Refresh Token
5. Logout
6. Forgot Password
7. Reset Password
8. Verify Email

**Environment variables:**

- `baseUrl`: http://localhost:3001
- `accessToken`: {{response.data.accessToken}}
- `refreshToken`: {{response.data.refreshToken}}

---

## Database Verification

After registration, verify in database:

```sql
-- Check tenant was created
SELECT * FROM tenants WHERE nif = 'B87654321';

-- Check user was created
SELECT * FROM users WHERE email = 'test@example.com';

-- Check default invoice series were created
SELECT * FROM invoice_series WHERE tenant_id = '<tenant-id>';
```

Should see:

- 1 tenant
- 1 user (role: ADMIN, emailVerified: false)
- 1 invoice series (code: 'A', type: 'INVOICE', isDefault: true)

---

## Troubleshooting

### "Cannot find module '@easyfactura/shared-validators'"

```bash
cd packages/shared-validators
pnpm build
```

### "Prisma Client not generated"

```bash
cd apps/api
pnpm prisma generate
```

### "Database connection error"

- Check DATABASE_URL in .env
- Verify Supabase project is active
- Test connection: `pnpm prisma db pull`

### "JWT token invalid"

- Check JWT_ACCESS_SECRET in .env
- Verify secret is at least 32 characters
- Make sure .env is loaded (restart server)

### "Rate limit immediately"

- Clear rate limit: restart API
- Or wait 60 seconds

### "RLS policies not working"

- Execute enable-rls.sql script
- Check with: `SELECT tablename FROM pg_tables WHERE rowsecurity = true;`

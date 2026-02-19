# Database Setup Guide

## Initial Setup

### 1. Run Prisma Migrations

```bash
cd apps/api
pnpm prisma migrate dev --name init
```

This will:

- Create all tables in the database
- Generate Prisma Client types

### 2. Enable Row Level Security (RLS)

RLS provides an additional security layer beyond code-level filtering.

**Option A: Via Supabase Dashboard**

1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy and paste the content of `prisma/enable-rls.sql`
4. Execute the script

**Option B: Via psql**

```bash
psql $DATABASE_URL -f prisma/enable-rls.sql
```

**Option C: Via Prisma Migrate**

```bash
# Create a new raw SQL migration
pnpm prisma migrate dev --create-only --name enable-rls

# Copy the content of enable-rls.sql into the new migration file
# Then apply it
pnpm prisma migrate dev
```

### 3. Seed the Database (Optional - For Testing)

```bash
pnpm prisma:seed
```

This creates:

- 1 test tenant (Test Company S.L.)
- 1 admin user (admin@testcompany.com / Test1234!)
- 2 invoice series (A for invoices, R for rectificative)
- 2 test customers
- 2 test products

## Environment Variables

Ensure your `.env` file has:

```env
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[password]@[region].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[password]@[region].supabase.co:5432/postgres"

# JWT Secrets
JWT_ACCESS_SECRET="your-super-secret-access-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# API Config
APP_PORT=3001
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## Testing the Setup

### 1. Start the API

```bash
cd apps/api
pnpm dev
```

### 2. Test Registration

```bash
POST http://localhost:3001/api/v1/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test1234!",
  "firstName": "Test",
  "lastName": "User",
  "businessName": "Test Business",
  "nif": "B87654321"
}
```

### 3. Test Login

```bash
POST http://localhost:3001/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@testcompany.com",
  "password": "Test1234!"
}
```

### 4. Test Protected Endpoint

```bash
GET http://localhost:3001/api/v1/auth/me
Authorization: Bearer <your-access-token>
```

## Row Level Security (RLS) Explanation

RLS ensures that even if a developer forgets to filter by `tenant_id` in a query, PostgreSQL will automatically enforce tenant isolation at the database level.

**How it works:**

1. Every query must set the `app.current_tenant` session variable
2. RLS policies check this variable against the `tenant_id` column
3. Only matching rows are visible/modifiable

**IMPORTANT:**

- The `tenants` table does NOT have RLS enabled
- Tenant selection happens at login time via JWT
- All other tables have RLS policies

**Example policy:**

```sql
CREATE POLICY tenant_isolation_invoices ON invoices
  USING (tenant_id::text = current_setting('app.current_tenant', true));
```

This means: "Only show invoices where tenant_id matches the current setting"

## Troubleshooting

### "relation does not exist"

- Run migrations: `pnpm prisma migrate dev`
- Generate client: `pnpm prisma generate`

### "RLS policies not working"

- Check if RLS is enabled: `SELECT tablename FROM pg_tables WHERE rowsecurity = true;`
- Verify policies exist: `SELECT * FROM pg_policies;`

### "JWT token invalid"

- Check environment variables are loaded
- Verify JWT secrets match in .env
- Check token hasn't expired (access tokens expire in 15 minutes)

### "Rate limit exceeded (429)"

- Wait 60 seconds
- Rate limit is 100 requests per minute per IP
- This is normal behavior for security

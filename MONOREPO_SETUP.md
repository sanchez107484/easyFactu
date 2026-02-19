# Guía de Configuración del Monorepo

## ✅ Pasos Completados

1. ✅ Estructura de monorepo creada con Turborepo + pnpm workspaces
2. ✅ Backend movido de `backend/` a `apps/api/`
3. ✅ Paquetes compartidos creados en `packages/`:
   - `@easyfactura/shared-types` - Tipos TypeScript
   - `@easyfactura/shared-validators` - Validadores (NIF, IBAN, postal codes)
   - `@easyfactura/shared-constants` - Constantes de negocio (IVA, provincias, etc.)
   - `@easyfactura/brand-config` - Configuración de marca
4. ✅ Importaciones actualizadas de rutas relativas a workspace packages
5. ✅ Dependencias instaladas con `pnpm install`
6. ✅ Carpetas antiguas (`backend/`, `frontend/`) eliminadas

## � Próximos Pasos

### 1. Configurar Supabase

#### 1.1. Crear proyecto en Supabase

1. Ve a https://supabase.com
2. Crea un nuevo proyecto
3. Guarda las credenciales que te proporcionen

#### 1.2. Actualizar variables de entorno en `apps/api/.env`

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Supabase
SUPABASE_URL="https://[project-ref].supabase.co"
SUPABASE_SERVICE_KEY="tu-service-role-key-aqui"

# Obtén estas URLs desde:
# Supabase Dashboard > Project Settings > Database > Connection String
# Supabase Dashboard > Project Settings > API > Project URL & service_role key
```

#### 1.3. Aplicar migraciones a Supabase

```bash
cd apps/api

# Generar el cliente de Prisma
pnpm prisma generate

# Aplicar migraciones a Supabase
pnpm prisma migrate deploy

# O si prefieres usar db push para desarrollo
pnpm prisma db push
```

#### 1.4. Configurar Storage en Supabase

El proyecto necesita dos buckets de almacenamiento:

1. Ve a: Supabase Dashboard > Storage
2. Crea los siguientes buckets:
   - **`invoices`** - Para PDFs de facturas
     - Public: No
     - File size limit: 10 MB
   - **`certificates`** - Para certificados digitales (.pfx)
     - Public: No
     - File size limit: 5 MB

3. Configura las políticas de seguridad (RLS) para cada bucket:

```sql
-- Políticas para bucket 'invoices'
-- Los usuarios solo pueden ver sus propias facturas
CREATE POLICY "Users can view own invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Los usuarios solo pueden subir a su propia carpeta
CREATE POLICY "Users can upload own invoices" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoices' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Políticas similares para bucket 'certificates'
CREATE POLICY "Users can view own certificates" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'certificates' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own certificates" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'certificates' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 2. Configurar Redis (Opcional para desarrollo local)

Si quieres usar Redis local en lugar de Upstash:

```bash
# Desde apps/api/
docker-compose up -d
```

Esto levantará Redis en `localhost:6379`.

Para producción, configura Upstash:

1. Crea una base de datos en https://upstash.com
2. Copia la URL de conexión
3. Actualiza `REDIS_URL` en `.env`

### 3. Configurar Email (Resend)

1. Crea una cuenta en https://resend.com
2. Genera una API key
3. Actualiza en `apps/api/.env`:

```env
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxx"
EMAIL_FROM="EasyFactura <noreply@tudominio.com>"
```

### 4. Iniciar el desarrollo

```bash
# Desde la raíz del proyecto
pnpm dev
```

El backend estará disponible en http://localhost:3001

### 5. Crear el Frontend (apps/web)

El siguiente paso es crear la aplicación de Next.js 15 en `apps/web/`. Esto incluirá:

- Configuración de Next.js 15 con App Router
- Tailwind CSS v4 + Shadcn/ui
- TanStack Query para data fetching
- React Hook Form + Zod para formularios
- Auth con Supabase o JWT
- Layout principal con navegación
- Páginas de facturación

## 🎯 Checklist de Verificación

Antes de empezar a desarrollar features, verifica que:

- [ ] Supabase está configurado y las migraciones aplicadas
- [ ] El backend arranca sin errores (`pnpm dev`)
- [ ] Puedes acceder a http://localhost:3001/api (Swagger docs)
- [ ] Prisma Studio funciona (`pnpm prisma:studio` desde apps/api)
- [ ] Los buckets de Storage están creados en Supabase
- [ ] Redis está corriendo (local o Upstash)
- [ ] Resend está configurado con tu API key
- [ ] Todas las variables de entorno están configuradas

## 🔧 Comandos Útiles

```bash
# Ver logs de turbo en modo verbose
pnpm dev --verbose

# Limpiar toda la caché de turbo y node_modules
pnpm clean

# Reinstalar todo desde cero
pnpm clean && pnpm install

# Generar cliente de Prisma después de cambios en el schema
cd apps/api && pnpm prisma generate

# Ver la base de datos en Prisma Studio
cd apps/api && pnpm prisma studio

# Crear una nueva migración
cd apps/api && pnpm prisma migrate dev --name nombre-de-la-migracion
```

## 📚 Recursos

- [Documentación de Turborepo](https://turbo.build/repo/docs)
- [Documentación de pnpm workspaces](https://pnpm.io/workspaces)
- [Documentación de Supabase](https://supabase.com/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de NestJS](https://docs.nestjs.com)

## 🐛 Solución de Problemas

### Error: "Cannot find module '@easyfactura/shared-types'"

Solución:

```bash
pnpm install
cd apps/api && pnpm prisma generate
```

### Error: Prisma Client did not initialize yet

Solución:

```bash
cd apps/api
pnpm prisma generate
```

### Error de conexión a la base de datos

- Verifica que `DATABASE_URL` en `.env` es correcto
- Verifica que tu IP está en la lista blanca de Supabase (Dashboard > Settings > Database > Connection pooling)
- Prueba la conexión con: `cd apps/api && pnpm prisma db pull`

### El backend no arranca

- Verifica que todas las variables de entorno están configuradas
- Verifica que las dependencias están instaladas: `pnpm install`
- Verifica que el cliente de Prisma está generado: `cd apps/api && pnpm prisma generate`
- Revisa los logs para errores específicos

---

¡El monorepo está listo! Puedes empezar a desarrollar. 🚀

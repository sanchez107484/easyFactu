# 🚀 Guía de Deployment - EasyFactura

Esta guía explica cómo desplegar EasyFactura en producción utilizando **Vercel** para el frontend y **Railway** para el backend.

---

## 📦 1. Preparar el Repositorio Git

### Subir todo el monorepo a GitHub

```bash
# Inicializar Git (si no lo has hecho)
git init

# Añadir todos los archivos
git add .

# Commit inicial
git commit -m "feat: initial commit - EasyFactura monorepo"

# Crear repositorio en GitHub y conectarlo
git remote add origin https://github.com/TU_USUARIO/easyFactura.git
git branch -M main
git push -u origin main
```

**✅ IMPORTANTE: El .gitignore ya está configurado** para NO subir:

- `node_modules/`
- `.env` (variables de entorno sensibles)
- `dist/` y `.next/` (builds)
- Archivos temporales

---

## 🎨 2. Desplegar Frontend en Vercel

### Opción A: Deploy desde Vercel Dashboard (Más fácil)

1. **Ve a [vercel.com](https://vercel.com)** e inicia sesión con GitHub

2. **Click en "New Project"**

3. **Importa tu repositorio** `easyFactura`

4. **Configuración del proyecto:**

   ```
   Framework Preset: Next.js
   Root Directory: apps/web
   Build Command: cd ../.. && pnpm build --filter=@easyfactura/web
   Output Directory: .next
   Install Command: pnpm install
   ```

5. **Variables de entorno:**

   ```
   NEXT_PUBLIC_API_URL = https://tu-backend.railway.app/api
   ```

   _(Añadirás la URL del backend después de desplegarlo)_

6. **Click en "Deploy"** ✅

### Opción B: Deploy desde CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Desplegar (desde la raíz del proyecto)
vercel

# Seguir el wizard:
# - Set up and deploy? Yes
# - Which scope? Tu cuenta
# - Link to existing project? No
# - Project name? easyfactura-web
# - In which directory is your code? apps/web
# - Override settings? Yes
#   - Build Command: cd ../.. && pnpm build --filter=@easyfactura/web
#   - Output Directory: .next
#   - Install Command: pnpm install
```

**Resultado:** Tu frontend estará en `https://easyfactura-web.vercel.app`

---

## ⚙️ 3. Desplegar Backend en Railway

Railway es la opción más sencilla para NestJS + PostgreSQL.

### Paso 1: Crear cuenta en Railway

1. Ve a [railway.app](https://railway.app)
2. Inicia sesión con GitHub
3. Obtienes **$5 gratis** cada mes

### Paso 2: Crear nuevo proyecto

1. **Click en "New Project"**

2. **Selecciona "Deploy from GitHub repo"**

3. **Elige tu repositorio** `easyFactura`

4. **Railway preguntará qué deployar:**
   - Selecciona: `Root Directory: apps/api`

### Paso 3: Configurar PostgreSQL

1. En el mismo proyecto, **click en "New"** → **"Database"** → **"PostgreSQL"**

2. Railway creará automáticamente:
   - Una base de datos PostgreSQL
   - Variable `DATABASE_URL` conectada

### Paso 4: Variables de entorno del backend

En Railway, ve a tu servicio `apps/api` → **Variables**:

```bash
# Copiadas automáticamente
DATABASE_URL=postgresql://... (auto-generada por Railway)

# Añadir manualmente:
JWT_ACCESS_SECRET=tu-secreto-super-seguro-cambialo-en-produccion
JWT_REFRESH_SECRET=otro-secreto-super-seguro-diferente-del-anterior
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://easyfactura-web.vercel.app
CORS_ORIGIN=https://easyfactura-web.vercel.app
```

### Paso 5: Configurar Build y Start

Railway debería detectar automáticamente NestJS, pero verifica:

**Settings del servicio:**

```
Build Command: pnpm install && pnpm build
Start Command: pnpm start:prod
Root Directory: apps/api
```

### Paso 6: Ejecutar migraciones de Prisma

Después del primer deploy, ejecuta las migraciones:

1. En Railway, ve a tu servicio → **Variables** → añade:

   ```
   DATABASE_URL=postgresql://... (la misma que Railway generó)
   ```

2. Desde tu máquina local:

   ```bash
   # Copiar la DATABASE_URL de Railway
   # Pegarla en apps/api/.env

   cd apps/api
   pnpm prisma migrate deploy
   ```

   O desde Railway Shell:

   ```bash
   # En Railway → Service → Shell
   cd apps/api
   npx prisma migrate deploy
   ```

**Resultado:** Tu backend estará en `https://tu-app.railway.app`

---

## 🔗 4. Conectar Frontend y Backend

### Actualizar variables en Vercel

1. Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**

2. Actualiza `NEXT_PUBLIC_API_URL`:

   ```
   NEXT_PUBLIC_API_URL = https://tu-backend.railway.app/api
   ```

3. **Redeploy** el frontend:
   ```bash
   vercel --prod
   ```
   O desde el dashboard: **Deployments** → **...** → **Redeploy**

### Actualizar CORS en el backend

En Railway, actualiza la variable `CORS_ORIGIN`:

```
CORS_ORIGIN = https://easyfactura-web.vercel.app
```

Railway redeployará automáticamente.

---

## ✅ 5. Verificar el Deployment

### Checklist final:

- [ ] Frontend carga en `https://easyfactura-web.vercel.app`
- [ ] Backend responde en `https://tu-backend.railway.app/api`
- [ ] Login funciona (verifica en Network que llama al backend correcto)
- [ ] Registro crea usuarios en la BD
- [ ] Las facturas se guardan correctamente
- [ ] No hay errores de CORS

### Comandos de verificación:

```bash
# Test backend
curl https://tu-backend.railway.app/api

# Test frontend
curl https://easyfactura-web.vercel.app
```

---

## 🔄 6. Deploys Automáticos

### Configurar CI/CD

Ambas plataformas ya están configuradas para **deploy automático**:

- **Vercel:** Cada push a `main` → redeploy automático del frontend
- **Railway:** Cada push a `main` → redeploy automático del backend

### Branches de desarrollo

Recomendación profesional:

```bash
# Crear branch de desarrollo
git checkout -b develop

# Hacer cambios y push
git push origin develop
```

**Configurar en Vercel:**

- Production Branch: `main`
- Preview Branches: `develop`, `feature/*`

**Configurar en Railway:**

- Railway puede crear servicios separados por branch

---

## 📊 7. Costos Estimados

| Servicio    | Plan  | Costo             | Incluye                         |
| ----------- | ----- | ----------------- | ------------------------------- |
| **Vercel**  | Hobby | **Gratis**        | Bandwidth ilimitado, 100 GB-hrs |
| **Railway** | Trial | **$5/mes gratis** | 500 horas ejecución, PostgreSQL |
| **Total**   | -     | **$0/mes**        | Suficiente para desarrollo      |

**Para producción real con tráfico:**

- Vercel Pro: $20/mes
- Railway Starter: $5/mes (luego pago por uso)

---

## 🐛 8. Troubleshooting

### Error: "Build failed"

**Solución:**

```bash
# Verificar que el build funciona localmente
pnpm build --filter=@easyfactura/web
pnpm build --filter=@easyfactura/backend
```

### Error: "DATABASE_URL not found"

**Solución:** Verificar que la variable existe en Railway → Settings → Variables

### Error: CORS

**Solución:** Verificar que `CORS_ORIGIN` en Railway coincide con la URL de Vercel

### Frontend muestra "Failed to fetch"

**Solución:**

1. Verificar `NEXT_PUBLIC_API_URL` en Vercel
2. Verificar que backend responde: `curl https://tu-backend.railway.app/api`

---

## 📬 9. Compartir con tu Compañero

Simplemente envía:

- **URL del frontend:** `https://easyfactura-web.vercel.app`
- **Credenciales de prueba** (si creaste un usuario demo)

Tu compañero podrá:

- Registrarse directamente
- Probar todas las funcionalidades
- Ver el código en GitHub

---

## 🔐 10. Seguridad en Producción

### Antes de ir a producción real:

1. **Cambiar todos los secretos JWT**

   ```bash
   # Generar secretos seguros
   openssl rand -base64 64  # Para JWT_ACCESS_SECRET
   openssl rand -base64 64  # Para JWT_REFRESH_SECRET
   ```

2. **Configurar HTTPS solo**
   - Vercel y Railway ya usan HTTPS por defecto ✅

3. **Rate limiting**
   - Ya está configurado en el backend con `@nestjs/throttler` ✅

4. **Variables de entorno**
   - NUNCA subir `.env` a Git ✅
   - Usar Railway y Vercel para variables ✅

---

## 📝 Resumen Ejecutivo

1. **Subir código a GitHub:** Todo el monorepo en un solo repo
2. **Vercel (Frontend):** Root Directory = `apps/web`
3. **Railway (Backend):** Root Directory = `apps/api` + PostgreSQL
4. **Conectar ambos:** Variables de entorno cruzadas
5. **Deploy automático:** Push a `main` = deploy

**Tiempo estimado:** 20-30 minutos

**Costo:** $0/mes (planes gratuitos)

---

¿Necesitas ayuda con algún paso? ¡Consulta esta guía!

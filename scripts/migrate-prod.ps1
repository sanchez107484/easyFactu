<#
.SYNOPSIS
    Ejecuta las migraciones de Prisma contra la base de datos de producción.

.DESCRIPTION
    Lee las variables de entorno desde apps/api/.env y ejecuta
    `prisma migrate deploy` usando DIRECT_URL (conexión directa a PostgreSQL,
    sin PgBouncer) para que las migraciones funcionen correctamente.

.EXAMPLE
    # Desde la raíz del monorepo:
    .\scripts\migrate-prod.ps1

.EXAMPLE
    # Con confirmación automática (para CI):
    .\scripts\migrate-prod.ps1 -Force

.NOTES
    Requiere: pnpm, Node.js, Prisma CLI instalados localmente.
    El archivo apps/api/.env debe contener DIRECT_URL.
#>

param(
    [switch]$Force
)

$ErrorActionPreference = 'Stop'

# ── Paths ──────────────────────────────────────────────────────────────────────
$RepoRoot   = Split-Path -Parent $PSScriptRoot
$ApiDir     = Join-Path $RepoRoot 'apps\api'
$EnvFile    = Join-Path $ApiDir '.env'
$SchemaPath = Join-Path $ApiDir 'prisma\schema.prisma'

Write-Host ''
Write-Host '═══════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host '   EasyFactura — Migraciones en Producción             ' -ForegroundColor Cyan
Write-Host '═══════════════════════════════════════════════════════' -ForegroundColor Cyan
Write-Host ''

# ── Verificar que existe el .env ───────────────────────────────────────────────
if (-not (Test-Path $EnvFile)) {
    Write-Host "❌ No se encontró el archivo: $EnvFile" -ForegroundColor Red
    Write-Host '   Crea el archivo .env con DIRECT_URL y DATABASE_URL.' -ForegroundColor Yellow
    exit 1
}

# ── Leer variables desde .env ──────────────────────────────────────────────────
$DirectUrl   = $null
$DatabaseUrl = $null

Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^DIRECT_URL\s*=\s*"?(.+?)"?\s*$') {
        $DirectUrl = $Matches[1]
    }
    if ($line -match '^DATABASE_URL\s*=\s*"?(.+?)"?\s*$') {
        $DatabaseUrl = $Matches[1]
    }
}

# ── Validar que tenemos una URL válida ─────────────────────────────────────────
if (-not $DirectUrl -and -not $DatabaseUrl) {
    Write-Host '❌ No se encontró DIRECT_URL ni DATABASE_URL en el .env.' -ForegroundColor Red
    exit 1
}

if (-not $DirectUrl) {
    Write-Host '⚠️  DIRECT_URL no está definida en .env' -ForegroundColor Yellow
    Write-Host '   Usando DATABASE_URL — las migraciones pueden fallar si usa PgBouncer.' -ForegroundColor Yellow
    $MigrationUrl = $DatabaseUrl
} else {
    Write-Host '✅ DIRECT_URL encontrada (conexión directa PostgreSQL).' -ForegroundColor Green
    $MigrationUrl = $DirectUrl
}

# Enmascarar la URL para mostrarla sin credenciales
$MaskedUrl = $MigrationUrl -replace '://([^:]+):([^@]+)@', '://***:***@'
Write-Host "   URL: $MaskedUrl" -ForegroundColor Gray
Write-Host ''

# ── Confirmación del usuario ───────────────────────────────────────────────────
if (-not $Force) {
    Write-Host '⚠️  ATENCIÓN: Vas a aplicar migraciones en PRODUCCIÓN.' -ForegroundColor Yellow
    Write-Host '   Esta operación modifica la base de datos de producción.' -ForegroundColor Yellow
    Write-Host ''
    $confirm = Read-Host '¿Continuar? (escribe "si" para confirmar)'
    if ($confirm -ne 'si') {
        Write-Host 'Operación cancelada.' -ForegroundColor Gray
        exit 0
    }
    Write-Host ''
}

# ── Ejecutar la migración ──────────────────────────────────────────────────────
Write-Host '▶ Ejecutando: prisma migrate deploy' -ForegroundColor Cyan
Write-Host '─' * 55

$env:DATABASE_URL = $MigrationUrl

Push-Location $ApiDir
try {
    & pnpm exec prisma migrate deploy --schema="$SchemaPath"
    if ($LASTEXITCODE -ne 0) {
        throw "prisma migrate deploy falló con código $LASTEXITCODE"
    }
} finally {
    Pop-Location
}

Write-Host '─' * 55
Write-Host ''
Write-Host '✅ Migraciones aplicadas correctamente en producción.' -ForegroundColor Green
Write-Host ''

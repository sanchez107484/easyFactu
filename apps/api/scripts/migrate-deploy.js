/**
 * migrate-deploy.js
 *
 * Runs `prisma migrate deploy` using the DIRECT_URL (bypasses PgBouncer).
 * Prisma migrations require a direct PostgreSQL connection — the transaction
 * pooler (PgBouncer) does not support advisory locks used by the schema engine.
 *
 * Used by the `vercel:build` script so migrations run automatically on every
 * Vercel deployment before the NestJS build.
 *
 * Required environment variables:
 *   DIRECT_URL   — Direct PostgreSQL connection string (port 5432, no pgbouncer)
 *   DATABASE_URL — Pooled connection string (fallback if DIRECT_URL is not set)
 */

'use strict';

const { execSync } = require('child_process');
const path = require('path');

const SCHEMA_PATH = path.join(__dirname, '..', 'prisma', 'schema.prisma');

function main() {
    const directUrl = process.env.DIRECT_URL;
    const databaseUrl = process.env.DATABASE_URL;

    if (!directUrl && !databaseUrl) {
        console.error('[migrate-deploy] ❌ Neither DIRECT_URL nor DATABASE_URL is set.');
        console.error('[migrate-deploy]    Set DIRECT_URL in your Vercel project environment variables.');
        process.exit(1);
    }

    if (!directUrl) {
        console.warn('[migrate-deploy] ⚠️  DIRECT_URL is not set — falling back to DATABASE_URL.');
        console.warn('[migrate-deploy]    Migrations may fail if DATABASE_URL uses PgBouncer (port 6543).');
        console.warn('[migrate-deploy]    Add DIRECT_URL (port 5432) to your Vercel environment variables.');
    } else {
        // Override DATABASE_URL with DIRECT_URL so the Prisma schema engine
        // uses the direct connection for migrations.
        process.env.DATABASE_URL = directUrl;
        console.log('[migrate-deploy] ✅ Using DIRECT_URL for migrations (direct PostgreSQL connection).');
    }

    console.log('[migrate-deploy] Running: prisma migrate deploy');
    console.log('[migrate-deploy] Schema:', SCHEMA_PATH);
    console.log('─'.repeat(60));

    try {
        execSync(`prisma migrate deploy --schema="${SCHEMA_PATH}"`, {
            stdio: 'inherit',
            env: process.env,
        });
        console.log('─'.repeat(60));
        console.log('[migrate-deploy] ✅ Migrations applied successfully.');
    } catch (error) {
        console.error('─'.repeat(60));
        console.error('[migrate-deploy] ❌ Migration failed. Aborting build.');
        process.exit(1);
    }
}

main();

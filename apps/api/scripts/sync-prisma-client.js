/**
 * After `prisma generate` writes to apps/api/node_modules/.prisma/client,
 * this script syncs those files to the pnpm store's .prisma/client so the
 * runtime can find them (Node resolves `require('.prisma/client')` from the
 * real path of @prisma/client inside the pnpm virtual store).
 */
const fs = require('fs');
const path = require('path');

const prismaClientPkg = require.resolve('@prisma/client/package.json');
const storeNodeModules = path.dirname(path.dirname(prismaClientPkg)); // .pnpm/…/node_modules/
const dst = path.join(storeNodeModules, '.prisma', 'client');
const src = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');

if (!fs.existsSync(src)) {
  console.error('[sync-prisma] Source not found:', src);
  process.exit(1);
}

fs.cpSync(src, dst, { recursive: true, force: true });
console.log('[sync-prisma] Synced Prisma client to pnpm store:', dst);

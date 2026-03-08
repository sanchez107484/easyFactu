/**
 * After `prisma generate` writes to apps/api/node_modules/.prisma/client,
 * this script syncs those files to the pnpm store's .prisma/client so the
 * runtime can find them (Node resolves `require('.prisma/client')` from the
 * real path of @prisma/client inside the pnpm virtual store).
 */
const fs = require('fs');
const path = require('path');

const prismaClientPkg = require.resolve('@prisma/client/package.json');
// package.json is at: …/node_modules/@prisma/client/package.json
// We need to go up 3 levels to reach the node_modules/ directory.
const storeNodeModules = path.dirname(path.dirname(path.dirname(prismaClientPkg)));
const dst = path.join(storeNodeModules, '.prisma', 'client');
const src = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');

if (!fs.existsSync(src)) {
  console.error('[sync-prisma] Source not found:', src);
  process.exit(1);
}

// On Windows, skip locked native binaries (the running dev server holds them).
// On Linux (Vercel build) we MUST include them so the Lambda can find the engine.
const isWindows = process.platform === 'win32';
const filter = isWindows ? (srcPath) => !srcPath.endsWith('.node') : undefined;
fs.cpSync(src, dst, { recursive: true, force: true, ...(filter && { filter }) });
console.log('[sync-prisma] Synced Prisma client to pnpm store:', dst);

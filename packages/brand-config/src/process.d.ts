// Minimal ambient declaration for `process.env` access.
// @types/node is NOT listed in this package's tsconfig "types" (would fail in
// pnpm workspace builds on Vercel because workspace packages have no local
// node_modules). This file provides just enough typing for process.env reads.
// Consuming apps (apps/web, apps/api) have their own @types/node and will NOT
// see this file — they only consume the compiled dist/ output.
declare var process: {
  readonly env: Record<string, string | undefined>;
};

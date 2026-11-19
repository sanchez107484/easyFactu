# Contract suite · Integrations API v1

Black-box suite (Jest + `fetch`) for the ERP contract. It knows only the public API: no
imports from `src/`, no database. It must pass unchanged against the NovaFactura and the
Nafactura sandboxes.

```bash
cd apps/api
API_KEY=nfk_test_... pnpm test:contract
```

- The base URL is `INTEGRATIONS_API_URL` from `apps/api/.env`: the same `apiUrl` the API
  returns to the ERP in `POST /accounts`.
- `API_KEY` must be a sandbox key (`nfk_test_`); the suite refuses `nfk_live_` keys.
- Each run issues real invoices in the sandbox (Hacienda test environment) under a fresh
  payer and `externalRef`, so runs never collide.
- `pnpm test` does not run it (files end in `.contract.ts`, not `.spec.ts`).

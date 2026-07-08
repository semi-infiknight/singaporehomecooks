# Agent notes — `config/`

**Canonical:** [blueprint/agent/build-protocol.md](../blueprint/agent/build-protocol.md) § Railway-only backend

## `railway-client.json`

- Sole source for client Medusa URL + publishable key
- `pnpm env:sync` writes `.env.local` for mobile-customer, mobile-cook, web
- **Never** set `medusaBase` to localhost — `sync-railway-env.mjs` exits on local URLs
- `@shc/utils` `resolveRailwayMedusaBase()` throws on localhost at runtime

Agents: do not add mock fallbacks or `USE_REAL_MEDUSA` toggles.
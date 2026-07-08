# Agent Verify Protocol

**Related Files:**
- [../AGENT_PLAYBOOK.md](../AGENT_PLAYBOOK.md)
- [../production/testing-flavours.md](../production/testing-flavours.md)
- [../production/goal-workflow.md](../production/goal-workflow.md)
- [../production/testing-strategy.md](../production/testing-strategy.md)
- [build-protocol.md](./build-protocol.md)

**Last Updated:** 2026-07-08
**Owner:** All agent tracks

Blueprint is canonical. `.cursor/rules/testing-tiers.mdc` mirrors this.

---

## Philosophy

- **Time matters** — don't run 15-minute suites on every commit
- **Emulator must work** — wiring checklist during build catches "renders but broken"
- **Learn from history** — skip tests for stable areas; keep tests where agents repeatedly fail
- **One verify per goal** — batch build, batch verify

Full experience ledger: [testing-flavours.md](../production/testing-flavours.md).

---

## Goal workflow (three phases)

| Phase | Commits | Tests |
|-------|---------|-------|
| **Build** | Many WIP | None (optional spot checks below) |
| **Verify** | Goal done | `FLAVOUR=* SCOPE=* pnpm verify:goal` once |
| **Ship** | Milestone / TestFlight | `pnpm verify:full` |

---

## Pick FLAVOUR + SCOPE at goal **start**

### FLAVOUR — how much to verify

| Flavour | When | Runs | Skips |
|---------|------|------|-------|
| `polish` | Visual/copy on wired screens | Typecheck + PWA guard | Maestro, seed, API, bundles |
| `wiring` | Connect UI → hook → API | Typecheck + **one** Maestro flow | Full tour, extra tray flows |
| `feature` | New screen/flow (default) | Full scoped verify | Full tour until milestone |
| `tri-platform` | `@shc/ui` + 3 surfaces | All 4 typechecks + tray tests + tray Maestro | API unless routes changed |
| `native` | Metro/babel/RN deps | deps + bundles guards | Unrelated Maestro |
| `api` | Medusa routes/modules | medusa typecheck + tests + API smoke | Maestro unless paired UI |

### SCOPE — primary surface changed

| SCOPE | Use for |
|-------|---------|
| `web` / `pwa` | Next.js pages, PWA assets, cook portal web |
| `mobile` / `expo` | Cross-app navigation, shared hooks |
| `tray` / `ui` | Family Values, `@shc/ui` |
| `checkout` | Cart, allergen, PDP auth |
| `listings` | Cook listing CRUD |
| `orders` | Order tray, fulfilment |
| `auth` | Login, session guards |
| `api` / `medusa` | Backend modules, routes |
| `infra` | CI guards, metro config |
| `railway` / `deploy` | Live PWA fingerprint |

### Flags

| Flag | When |
|------|------|
| `TOUCHES_API=1` | Medusa routes or CORS changed alongside UI |
| `TOUCHES_NATIVE=1` | metro.config, babel, package.json native deps |
| `SKIP_SEED=1` | Auto-skipped for `FLAVOUR=polish` |
| `FILTER=<pkg>` | With `verify:wip` — optional typecheck |
| `RISK=native` | With `verify:wip` — deps + bundle spot check |

---

## Copy-paste recipes

```bash
# Polish discover header (web)
FLAVOUR=polish SCOPE=web pnpm verify:goal

# Wire checkout auth guard
FLAVOUR=wiring SCOPE=checkout TOUCHES_API=1 pnpm verify:goal

# Listing edit/delete (API + cook UI)
SCOPE=listings TOUCHES_API=1 pnpm verify:goal

# Family Values tray parity
FLAVOUR=tri-platform SCOPE=tray pnpm verify:goal

# Metro / reanimated dep
FLAVOUR=native TOUCHES_NATIVE=1 SCOPE=infra pnpm verify:goal

# Railway PWA ship
SCOPE=railway pnpm verify:goal

# One-line fix outside a goal
pnpm verify:quick

# Milestone only
pnpm verify:full
```

---

## Experience ledger (what to skip vs never skip)

### Recurring mistakes — **never skip** at goal close

| Failure | Caught by |
|---------|-----------|
| Unwired CTA / tray | Maestro for that flow + wiring checklist |
| Tri-platform drift | Typecheck `@shc/ui` + web + both apps |
| Auth not gated | `SCOPE=checkout` Maestro |
| CORS / env | `TOUCHES_API=1` or `SCOPE=api` |
| Metro crash (~125KB bundle) | `TOUCHES_NATIVE=1` bundles guard |
| Medusa TS break | `pnpm --filter medusa typecheck` |
| testID drift | Maestro YAML validate |

### Stable / slow — **skip** unless flavour requires

| Test | Skip when |
|------|-----------|
| Full Maestro tour | Every goal — use `verify:full` at milestone |
| `verify:real-e2e` | Pure UI polish; known bid-accept flake |
| `seed.ts --validate` | `FLAVOUR=polish` visual-only |
| Mobile bundle export (~2–3 min) | No metro/babel/dep change |
| All 3 tray Maestro flows | Single-screen polish — use `SCOPE=checkout` etc. |
| business-rules full suite | CSS/copy only |

---

## Build-phase checks (no test runner)

From [build-protocol.md](./build-protocol.md) — run mentally before wiring commits:

1. Route exists
2. CTA → real hook
3. `@shc/api-client` imported
4. Web mirror if `@shc/ui` changed
5. testIDs preserved
6. Emulator loads without redbox

**Optional spot (high-risk only):**

```bash
FILTER=@shc/ui pnpm verify:wip
RISK=native pnpm verify:wip
```

---

## CI vs local

| Gate | When |
|------|------|
| `turbo test` + `typecheck` | Every push (CI) |
| Platform guards | Every push |
| `verify:real-e2e` | `integrate/*` branches + manual only |
| `verify:full` | Local milestone / stitch agent |

See [testing-strategy.md](../production/testing-strategy.md).

---

## Implementation

`scripts/verify-tier.sh` — all tiers and flavour logic.

**Anti-patterns:**
- Maestro on every WIP commit
- `verify:full` after small polish tweak
- Running API smoke for CSS-only change
- Skipping typecheck on touched package
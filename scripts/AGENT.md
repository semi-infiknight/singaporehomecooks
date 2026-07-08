# Agent notes — `scripts/`

**Canonical brain:** [blueprint/README.md](../blueprint/README.md)

| Script | Agent use |
|--------|-----------|
| `verify-tier.sh` | `pnpm verify:wip\|goal\|full` — [verify-protocol.md](../blueprint/agent/verify-protocol.md) |
| `sync-railway-env.mjs` | `pnpm env:sync` — Railway client env |
| `start-mobile-dev.sh` | Metro :8081 + :8082 |
| `verify-mobile-bundles.sh` | Run when `TOUCHES_NATIVE=1` — catches TestFlight crash |
| `run-maestro-full-tour.sh` | Milestone only (`pnpm verify:full`) |
| `rebuild-ios-apps.sh` | After native dep changes |

Never run full Maestro/API smoke on every WIP commit during a goal.
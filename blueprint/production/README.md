# Production Layer — Overview

**Related Files:**
- [../multi-agent/production-hardening.md](../multi-agent/production-hardening.md)
- [testing-strategy.md](./testing-strategy.md)
- [observability.md](./observability.md)
- [compliance-pdpa.md](./compliance-pdpa.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [../INDEX.md](../INDEX.md)

**Last Updated:** 2026-06-13 (Infra + Contracts Tracks own)
**Owners:** Infra Track (infrastructure & observability), Contracts Track (validation & compliance rules)

## Purpose

The `production/` folder defines the non-functional requirements and operational standards that elevate the platform from a functional MVP to a trustworthy, compliant, and maintainable production system. These rules are enforced from Phase 0 onward — they are not deferred.

## Core Production Pillars

1. **Security & Access Control** — Zero-trust principles, least-privilege, audit everything.
2. **Observability** — Logs, metrics, traces, alerts from day one.
3. **Testing Strategy** — Unit, integration, E2E, contract, and chaos testing.
4. **Compliance (PDPA, SFA, GST, Insurance)** — Built into data models, workflows, and UI.
5. **Reliability & Resilience** — Graceful degradation, retry policies, circuit breakers.
6. **Operational Excellence** — Runbooks, error catalogs, on-call processes, self-healing where possible.

## How to Use This Layer

- Every implementation task must explicitly reference the relevant production file.
- When opening a PR, the description must state which production controls were applied.
- Contracts Track reviews all validation and compliance aspects.
- Infra Track reviews deployment, observability, and infrastructure changes.

## Integration with Multi-Agent Process

The `multi-agent/production-hardening.md` file contains the detailed checklist that every agent must follow. The files in this folder provide the supporting policies, matrices, and strategies.

## Self-Updating Expectation

As the platform evolves, new production concerns (e.g., new regulatory requirements, scaling thresholds, new monitoring tools) are added here first, then propagated to implementation phases and decision trees.

**Production Rule:** No feature is considered complete until it satisfies every applicable control in this layer.

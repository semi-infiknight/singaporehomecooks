# 14 — Founder Inputs & Strategic Guidance

**Related Files:**
- [../INDEX.md](../INDEX.md)
- [../01-product-scope/01-product-scope.md](../01-product-scope/01-product-scope.md)
- [../multi-agent/tracks.md](../multi-agent/tracks.md)
- [../00-locked-decisions/00-locked-decisions.md](../00-locked-decisions/00-locked-decisions.md)

**Last Updated:** 2026-06-14 by Content + Seed Track Agent (Phase 0 content complete — trust copy, seeds, paynow doc, mobile render, seed script all reinforce "Trust & Safety First" + SG regulatory + cook empowerment + heritage focus)
**Owner:** Content Track

## Overview

This document captures ongoing founder-level inputs, strategic priorities, and directional guidance that influence product decisions without altering locked technical contracts. It serves as the living record for non-technical or high-level business direction.

## Current Founder Priorities (as of 2026-06-13)

- **Trust & Safety First** — Every feature must reinforce the five-layer trust architecture (see `DECISION_TREES/trust-architecture-five-layers.md`).
- **Singapore Regulatory Alignment** — SFA, PDPA, and tax compliance are non-negotiable from day one.
- **Cook Empowerment** — Tools and UX must genuinely help home cooks run a sustainable side business (earnings visibility, simple compliance upload, fair commission).
- **Customer Delight via Simplicity** — Discovery, ordering, and collection must feel effortless despite the underlying complexity.
- **Phased Rollout Discipline** — No feature creep; stick strictly to the implementation phases in `13-implementation-phases/`.

## Input Tracking Process

Founder inputs are collected via:
- Direct messages or meetings (summarized here by Content Track)
- Explicit "founder note" tags in PRs or issues
- Quarterly strategy reviews

Each input is tagged with:
- Date received
- Impacted files or tracks
- Decision status (adopted / deferred / rejected with rationale)

## Examples of Recent Inputs Incorporated

- Calorie estimation confidence scoring and display rules
- PayNow as primary (and initially only) payment method
- Strict one-cook-per-order logistics model
- Emphasis on collection (not delivery) for MVP to reduce operational complexity

**2026-06-14 Content Track Deliverables (aligning founder priorities):**
- 5-layer trust + full policies in content/trust-and-safety.md (and rendered in mobile) — Trust & Safety First.
- Rich seed with HDB/festive/allergen realism — Singapore Regulatory + Customer Delight via authentic heritage.
- Exact PayNow ops + how-it-works — supports cook empowerment (earnings transparent) and simplicity.
- Shared typed seeds (scripts/seed.ts + seed/index.ts) for mocks/Medusa — phased discipline + future-proof.

## How Agents Should Consume This File

- When designing new features or UX flows, cross-reference founder priorities.
- If a proposed implementation conflicts with a stated priority, escalate to Content Track before proceeding.
- Content Track is responsible for keeping this document current and for translating founder language into actionable tasks for other tracks.

## Multi-Agent Notes

- **Content Track** owns maintenance of this file.
- All other tracks must treat founder inputs as high-priority context when making scope or priority decisions.
- Changes to product direction that originate from founders are recorded here first, then propagated to `01-product-scope.md` and relevant phase files via the stitching protocol.

**Content Track Rule:** This file is the authoritative record of founder voice. Do not implement major directional changes without an entry here.

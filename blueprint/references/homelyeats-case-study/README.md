# HomelyEats Case Study — Agent Design Reference

**Source:** [How I simplified ordering home-cooked meals with a subscription-centric app](https://medium.com/design-bootcamp/how-i-simplified-ordering-home-cooked-meals-with-a-subscription-centric-app-a-product-design-521a82b219be)  
**Author:** Ayushi Prakash · Design Bootcamp · Dec 13, 2023  
**Extracted:** 2026-07-09  
**Purpose:** Canonical visual + flow reference for redesigning Singapore Home Cooks **tiffin / subscription** UX, states, and backend.

> Agents: start with [CASE_STUDY.md](./CASE_STUDY.md) for flows, then [REDESIGN_PLAN.md](./REDESIGN_PLAN.md) for SHC gaps. Use [IMAGE_INDEX.md](./IMAGE_INDEX.md) + `images/` when implementing screens.

## Contents

| File | What it is |
|------|------------|
| [CASE_STUDY.md](./CASE_STUDY.md) | Full case-study distillation: research, constraints, **every screen flow**, **state machines**, diagrams |
| [REDESIGN_PLAN.md](./REDESIGN_PLAN.md) | **Implementation plan** mapping HomelyEats → SHC UI / API / data / states |
| [IMAGE_INDEX.md](./IMAGE_INDEX.md) | Numbered + semantic filenames for all extracted assets |
| `images/` | All article images/GIFs (high-res from Medium CDN) |

## Product in one sentence

**HomelyEats** is a **subscription-first** home-cooked meal app: users discover nearby kitchens, buy a **prepaid meal plan** (not just one order), then manage daily deliveries (skip / customize / pause / recharge) with clear order + subscription states.

## SHC relevance

SHC already has a weekly tiffin slice (`shc-tiffin`, 2/3/4 meals/week, one kitchen). HomelyEats is a richer **subscription operating system** (balance, flex days, multi-sub, calendar orders, recharge). Use this pack to redesign SHC tiffin toward that model without discarding SHC lock-ins (collection, one-cook cart rules, Family Values UI, Singapore market).

## Non-goals of this pack

- Do **not** copy Indian orange branding over Family Values / Gourmeat tokens.
- Do **not** replace SHC collection model with pure delivery without founder decision.
- Treat multi-kitchen concurrent subscriptions as a **product decision** (HomelyEats allows many; SHC today allows **one active kitchen**).

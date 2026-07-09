# HomelyEats Case Study — Agent Design Reference

**Source:** [How I simplified ordering home-cooked meals with a subscription-centric app](https://medium.com/design-bootcamp/how-i-simplified-ordering-home-cooked-meals-with-a-subscription-centric-app-a-product-design-521a82b219be)  
**Author:** Ayushi Prakash · Design Bootcamp · Dec 13, 2023  
**Extracted:** 2026-07-09  
**Purpose:** Visual + flow reference to **overhaul SHC UI/flows** and **add** a full subscription OS — without removing marketplace features or changing stack.

> **Start here for implementation:** [REDESIGN_PLAN.md](./REDESIGN_PLAN.md) (founder constraints + waves).  
> Flows/diagrams: [CASE_STUDY.md](./CASE_STUDY.md). Assets: [IMAGE_INDEX.md](./IMAGE_INDEX.md) + `images/`.

## Founder constraints (summary)

| Do | Don’t |
|----|--------|
| Redesign UI/flows (weakest area) | Remove or gut existing features |
| Add HomelyEats-grade subscription UX | Drastic product rewrites of working domains |
| Ship **web + customer + cook** together (iOS & Android) | Mobile-only then “later web” |
| Keep Railway Medusa stack | New repos / localhost backend / mock runtime |
| Condense screens if clearer | Leave unwired CTAs or empty shells |
| Fix all known issues properly | Paper over with flags forever |

## Contents

| File | What it is |
|------|------------|
| [REDESIGN_PLAN.md](./REDESIGN_PLAN.md) | **Canonical plan** — constraints, keep/elevate/add, issues, waves, verify |
| [CASE_STUDY.md](./CASE_STUDY.md) | Full case-study distillation: research, screen flows, state machines |
| [IMAGE_INDEX.md](./IMAGE_INDEX.md) | Numbered + semantic filenames |
| `images/` | All article images/GIFs |

## Product one-liners

**HomelyEats (inspiration):** subscription-first home-cooked meals — discover kitchens, prepaid plan, daily manage (skip / customize / pause / recharge).

**SHC (target):** same *clarity of subscription OS* + existing occasion marketplace, collection-first Singapore heritage, Family Values / Gourmeat brand, Railway backend.

## Non-goals

- Do **not** copy Indian orange branding over Family Values / Gourmeat.  
- Do **not** replace collection with pure delivery without founder decision.  
- Do **not** force multi concurrent kitchen subscriptions (SHC = one active kitchen).  
- Do **not** delete marketplace / cart / credits / growth / ops capabilities.

# Agent Design Taste

**Related Files:**
- [../AGENT_PLAYBOOK.md](../AGENT_PLAYBOOK.md)
- [../../brand.md](../../brand.md)
- [../12-shared-components/12-shared-components.md](../12-shared-components/12-shared-components.md)
- [../13-design-system/WIREFRAMES.md](../13-design-system/WIREFRAMES.md)
- [build-protocol.md](./build-protocol.md)
- [verify-protocol.md](./verify-protocol.md)

**Last Updated:** 2026-07-08
**Owner:** Mobile + Web tracks

Blueprint copy of tri-platform taste rules (`.cursor/rules/tri-platform-ui-sync.mdc` mirrors this).

---

## Product taste (what "good" means here)

Singapore Home Cooks is **not** a generic food-delivery clone. Builders should optimize for:

| Principle | Meaning |
|-----------|---------|
| **Heritage-first** | Real cooks, HDB collection, occasion framing — "Auntie Rose in Katong", not "vendor" |
| **Planned occasions** | Collection slots, not 30-min delivery ETA fiction |
| **Trust visible** | Allergen gates, compliance badges, verified cook signals |
| **Premium warmth** | Gourmeat soft elevation on customer; cook app stays structured but friendly |
| **Fluid interactions** | Family Values layer: trays, morph labels, directional tabs — delight without chrome overload |
| **One product, three surfaces** | Customer mobile, cook mobile, web PWA must feel like the same brand |

**Voice:** Human, friendly, occasion-first ([brand.md](../../brand.md) § Tone).

- Do: "Collect from Auntie Rose's kitchen in Katong"
- Don't: "Merchant portal", generic startup filler

---

## Design systems (two layers)

### 1. Gourmeat — visual skin (Orbix Studio)

Customer discover/checkout: warm orange `#F87048`, floating dark nav `#1C1C1C`, soft cards on `#FAFAFA`.

| Token | Hex | Role |
|-------|-----|------|
| `gourmeat-primary` | `#F87048` | Add, prices, active tab |
| `gourmeat-nav` | `#1C1C1C` | Bottom tab bar |
| `gourmeat-bg` | `#FAFAFA` | Discover background |
| `gourmeat-surface` | `#FFFFFF` | Cards |

Components: `packages/shc-ui/src/gourmeat.tsx`, `zomato.tsx`, `visuals.tsx`.

Web mirrors: `apps/web/app/components/SHCWebComponents.tsx`, `globals.css`.

### 2. Family Values — interaction layer (not a palette swap)

Inspired by [Family Values](https://benji.org/family-values) — **simplicity · fluidity · delight**.

| Pattern | Where | Package |
|---------|-------|---------|
| Bottom trays | Confirm, allergen, listing actions | `tray.tsx`, `SHCTrayWeb` |
| Morphing labels | Shared hero → detail transitions | `family-values-ui.tsx` |
| Directional tabs | Tab switches slide by direction | `tab-direction.tsx` |
| Order tray tracking | Post-checkout status | `useOrderTrayTracking` |

**Taste:** Trays replace modal stacks where possible. Motion is purposeful (spring, not bounce spam). Web gets `SHCTrayWeb` parity — not a simplified fallback.

---

## Tri-platform sync (mandatory on UI changes)

When changing colors, tokens, components, or screen layout:

1. Read `brand.md`
2. Update `packages/shc-ui/src/theme.ts`
3. Update `apps/web/app/globals.css` (`--shc-*`)
4. Update `SHCWebComponents.tsx` for web parity
5. Update affected screens in **both** mobile apps + web
6. Patch `12-shared-components.md` + `CURRENT_STATE.md` if integration status changes
7. Preserve Maestro `testID`s

**Goal verify:** `FLAVOUR=tri-platform SCOPE=tray pnpm verify:goal` — not full tour per commit.

### Forbidden

- Hardcoding legacy jade `#1D9E75` or hex outside `shcColors` / CSS variables
- Web-only visual update while `@shc/ui` stays stale
- Screen-level inline colors instead of tokens
- Exporting `location-map` / heavy native modules from `@shc/ui` barrel

---

## Layout patterns (use existing primitives)

| Pattern | Component | Use for |
|---------|-----------|---------|
| Discover feed | `zomato.tsx` rails, filter chips, bento | Home, search |
| Sticky checkout | `SHCCheckoutStepper`, `PayNowPanel` | Cart flow |
| Cook dashboard | `SHCBentoGrid`, `SHCCookPageHero` | Quick actions |
| Collection location | `LocationPickerExperience` | GPS → map confirm |
| Listing wizard | `domain.tsx` wizard steps | Cook listings |

Wireframes: [WIREFRAMES.md](../13-design-system/WIREFRAMES.md).

**Polish work:** prefer adjusting spacing, copy, chip labels, tray timing on **existing** wired screens — don't rebuild flows from scratch.

---

## Polish checklist (feature refinement era)

When refining a page (typical next work):

- [ ] Matches Gourmeat tokens (no one-off hex)
- [ ] Web route has mobile equivalent (or documented exception)
- [ ] Loading / empty / error states use `@shc/ui` patterns
- [ ] CTAs use `gourmeat-pay` / primary — wired to real actions
- [ ] Allergen / auth gates intact on checkout and PDP
- [ ] `testID` unchanged or Maestro updated
- [ ] `FLAVOUR=polish` verify at goal close if visual-only

---

## Skill & cursor mirrors

- Skill: `.agents/skills/tri-platform-ui-sync/SKILL.md`
- Cursor: `.cursor/rules/tri-platform-ui-sync.mdc`

**Canonical:** this file + `brand.md` + `12-shared-components.md`.
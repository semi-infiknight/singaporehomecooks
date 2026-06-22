---
name: tri-platform-ui-sync
description: Keep web, mobile-customer, mobile-cook, and @shc/ui in sync for any brand or UI change. Use when editing colors, components, layouts, design tokens, or brand.md.
---

# Tri-Platform UI Sync

## When to use

- User changes brand, colors, typography, or layout
- User asks why mobile looks different from web
- Adding or modifying shared components (`SHCButton`, `SHCCard`, bento grids, etc.)
- Rebranding or design system migration

## Checklist (complete all applicable steps)

### 1. Read source of truth

```
brand.md
packages/shc-ui/src/theme.ts
apps/web/app/globals.css
```

### 2. Update tokens (both files, same values)

| Token | Mobile (`theme.ts`) | Web (`globals.css`) |
|-------|---------------------|---------------------|
| primary | `shcColors.primary` | `--primary`, `--shc-primary` |
| accent | `shcColors.accent` | `--shc-accent` |
| background | `shcColors.background` | `--background`, `--shc-bg` |
| border | `shcColors.border` | `--shc-border-brutal` |
| bento surfaces | `bentoMint/Peach/Yellow` | `--shc-bento-*` |
| shadows | `shcShadows.brutal` | `--shc-shadow-brutal` |

### 3. Update components

- `packages/shc-ui/src/primitives.tsx` — buttons, cards, bento, search bar
- `packages/shc-ui/src/domain.tsx` — domain cards, badges, forms
- `apps/web/app/components/SHCWebComponents.tsx` — web parity

### 4. Update screens (all three if pattern changes)

- `apps/mobile-customer/app/(customer)/*`
- `apps/mobile-cook/app/(cook)/*`
- `apps/web/app/**` (customer pages)

### 5. Update docs

- `brand.md` — palette table, layout patterns
- `blueprint/12-shared-components/12-shared-components.md`
- `blueprint/CURRENT_STATE.md` — if design system status changes

### 6. Verify

```bash
# Typecheck shared UI
pnpm --filter @shc/ui build 2>/dev/null || pnpm --filter mobile-customer typecheck

# E2E (after layout/testID changes)
bash scripts/start-mobile-dev.sh
bash scripts/run-maestro-full-tour.sh
```

## Neo-Brutalist rules (quick reference)

- 2px `#241812` borders on interactive surfaces
- Hard shadows: `2px 2px 0` or `4px 4px 0` — no blur
- Bento grids for quick actions and featured content
- Coral primary `#D96C4A`, accent yellow `#FFB800`
- **Never** use legacy jade `#1D9E75`

## Cursor rule

`.cursor/rules/tri-platform-ui-sync.mdc` enforces this automatically.
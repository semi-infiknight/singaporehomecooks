# Seed Assets — Singapore Home Cooks

Structured, typed seed data for dishes, cooks, occasions, and supporting assets. Designed to be the **single source** consumed by:

- Current mobile mocks (replace hard-coded data in index.tsx, cook/[slug].tsx, product/[id].tsx, etc.)
- Future Medusa bootstrap / seed scripts (apps/medusa seed or custom shc seed workflow)
- Any marketing site, admin fixtures, or tests

## Structure
- `cooks.json` — 2 full personas with rich stories (Auntie Rose Tampines 3rd-gen Katong 1972; Auntie Doris Katong Eurasian)
- `dishes.json` — 3+ dishes: Nasi Lemak Sambal Prawn, Ayam Buah Keluak (Peranakan), Eurasian Devil's Curry. Includes full product-meta aligned fields + heritage descriptions + festive notes + image placeholders.
- `occasions.json` — 7+ tags with SG cultural + festive timing (Hari Raya, Deepavali, CNY, Christmas, Full Moon, etc.)
- `image-placeholders.md` — Detailed production notes for real photos/videos (MinIO, AI quality, derivatives)
- This README

## Data Principles
- **Rich & On-Brand:** Every description captures "Heritage in every dish". Full family stories, HDB block specifics (Blk 456 Tampines St 42 #05-123, Blk 89 Joo Chiat Place), realistic SG details.
- **Schema Aligned:** Cooks match `shcCookSchema` (packages/shc-types). Dishes include `shcProductMetaSchema` fields (cuisine, occasion_tags, allergen_tiers, ingredients array, halal, calories_*, min_qty, etc.) + extras for display (description, heritage_note, festive_timing, price).
- **Singapore Authentic:** HDB collection instructions, common local allergens (prawns, belacan/crustacean, peanuts, buah keluak/candlenut, eggs, mustard, pork in Eurasian/Peranakan), festive calendars, one-cook reality, non-halal flags on classics.
- **Consumable Uniformly:** JSON is plain + easily importable. scripts/seed.ts loads + validates + re-exports typed objects.

## Usage
See `scripts/seed.ts` for loader, validation (Zod via @shc/types), and export helpers.

Mobile example (after integration):
```ts
import { seedCooks, seedDishes } from '../../../seed'; // or via workspace path
```

Medusa: Import in custom seed script or Admin import tool.

## Adding More
- New dish: Add to dishes.json with matching cook_id, full meta, realistic SG allergens/festive.
- New cook: Full story + HDB address + cert placeholders.
- Update occasions for new cultural events.
- Always run validation after edit: `npx tsx scripts/seed.ts --validate`

**Owner:** Content + Seed Track. Coordinate with Contracts for schema extensions and Mobile/Backend for consumption.

*This seed is what makes the platform feel like Singapore, not a generic food app.*

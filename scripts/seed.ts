#!/usr/bin/env tsx
/**
 * Singapore Home Cooks — Seed Loader, Validator & Exporter
 *
 * Loads structured assets from seed/assets/ (JSON canonical per Content Track).
 * Validates against @shc/types Zod schemas (cook, product-meta, availability basics, order meta patterns).
 * Exports rich typed data objects usable by:
 *   - Mobile mocks (replace hard-coded featured cooks/dishes in index, cook profile, product detail)
 *   - Medusa bootstrap / custom seed scripts (apps/medusa or future /admin/shc/seed)
 *   - Tests, admin fixtures, marketing site
 *
 * Usage:
 *   npx tsx scripts/seed.ts                 # Run validation + summary (default)
 *   npx tsx scripts/seed.ts --validate      # Explicit validate + exit code
 *   npx tsx scripts/seed.ts --export-json   # Output full validated seed as JSON (for Medusa import)
 *
 * Coordinates with Contracts Track: uses current shcCookSchema + shcProductMetaSchema.
 * When Contracts expands (full product, availability, etc.), extend validation here.
 *
 * "Heritage in every dish" — this seed makes the platform feel like real Singapore HDB kitchens.
 * Backend-Completion: growth samples (requests/bids/credits/heritage) now in apps/medusa/scripts/seed.ts (pg inserts for new modules + frozen types).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// @shc/types — coordinate with Contracts. Import what exists today.
import {
  shcCookSchema,
  shcProductMetaSchema,
  shcAvailabilitySchema,
  type SHCCook,
  type SHCProductMeta,
  type SHCAvailability,
} from '@shc/types';

// --- Paths (works from monorepo root or via tsx) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ROOT, 'seed', 'assets');

// --- Types for our rich seed (extends schemas for display + mobile/Medusa) ---
export interface SeedDish extends Partial<SHCProductMeta> {
  id: string;
  cook_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  heritage_note: string;
  festive_timing: string;
  image_placeholder: string;
  status: string;
  // extras for convenience
  cook_display_name?: string;
}

export interface SeedOccasion {
  tag: string;
  display: string;
  description: string;
  festive_window_weeks_before: number;
  typical_dishes: string[];
  cultural_notes: string;
}

export interface SeedData {
  cooks: SHCCook[];
  dishes: SeedDish[];
  occasions: SeedOccasion[];
  meta: {
    version: string;
    lastUpdated: string;
    note: string;
  };
}

// --- Loaders (JSON as source of truth) ---
function loadJSON<T>(filename: string): T {
  const filePath = path.join(ASSETS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed asset missing: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

function loadCooks(): unknown[] {
  return loadJSON<unknown[]>('cooks.json');
}

function loadDishes(): unknown[] {
  return loadJSON<unknown[]>('dishes.json');
}

function loadOccasions(): SeedOccasion[] {
  return loadJSON<SeedOccasion[]>('occasions.json');
}

// --- Validation ---
export function validateSeed(): { success: boolean; errors: string[]; data?: SeedData } {
  const errors: string[] = [];

  let rawCooks: unknown[] = [];
  let rawDishes: unknown[] = [];
  let occasions: SeedOccasion[] = [];

  try {
    rawCooks = loadCooks();
    rawDishes = loadDishes();
    occasions = loadOccasions();
  } catch (e: any) {
    errors.push(`Load failure: ${e.message}`);
    return { success: false, errors };
  }

  const validatedCooks: SHCCook[] = [];
  for (const [i, raw] of rawCooks.entries()) {
    const result = shcCookSchema.safeParse(raw);
    if (!result.success) {
      errors.push(`Cook #${i} (${(raw as any)?.display_name ?? 'unknown'}) invalid: ${result.error.message}`);
    } else {
      validatedCooks.push(result.data);
    }
  }

  const validatedDishes: SeedDish[] = [];
  for (const [i, raw] of rawDishes.entries()) {
    // Base product meta validation (core contract fields)
    const metaFields = {
      product_id: (raw as any).id, // map dish id → product_id for schema
      cook_id: (raw as any).cook_id,
      cuisine: (raw as any).cuisine,
      occasion_tags: (raw as any).occasion_tags,
      allergen_tiers: (raw as any).allergen_tiers,
      halal: (raw as any).halal,
      calories: (raw as any).calories,
      calories_confidence: (raw as any).calories_confidence,
      ingredients: (raw as any).ingredients,
      min_qty: (raw as any).min_qty,
      last_minute_premium_pct: (raw as any).last_minute_premium_pct,
    };

    const metaResult = shcProductMetaSchema.safeParse(metaFields);
    if (!metaResult.success) {
      errors.push(`Dish #${i} (${(raw as any)?.name ?? 'unknown'}) meta invalid: ${metaResult.error.message}`);
    }

    // Basic shape for display fields
    const dish = raw as any;
    if (!dish.id || !dish.name || !dish.description || typeof dish.price !== 'number' || !dish.heritage_note) {
      errors.push(`Dish #${i} missing required display fields (id/name/desc/price/heritage_note)`);
    }

    validatedDishes.push({
      ...metaResult.success ? metaResult.data : {},
      id: dish.id,
      cook_id: dish.cook_id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      currency: dish.currency || 'SGD',
      heritage_note: dish.heritage_note,
      festive_timing: dish.festive_timing || '',
      image_placeholder: dish.image_placeholder || 'TODO: add hero image',
      status: dish.status || 'active',
    } as SeedDish);
  }

  // Optional: validate sample availability (future full schema)
  const sampleAvailability: SHCAvailability = {
    product_id: 'dish_nasi_lemak_prawn_001',
    portions_per_day: 12,
    collection_days: [0, 1, 2, 3, 4, 5, 6], // flexible for demo
    time_slots: ['11:00-13:00', '17:00-19:00', '18:00-20:00'],
    paused: false,
  };
  const availResult = shcAvailabilitySchema.safeParse(sampleAvailability);
  if (!availResult.success) {
    errors.push(`Sample availability schema invalid (update when Contracts expands): ${availResult.error.message}`);
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Enrich dishes with cook names for convenience (mobile friendly)
  const cookMap = new Map(validatedCooks.map(c => [c.id, c.display_name]));
  const enrichedDishes = validatedDishes.map(d => ({
    ...d,
    cook_display_name: cookMap.get(d.cook_id) || 'Unknown Cook',
  }));

  const data: SeedData = {
    cooks: validatedCooks,
    dishes: enrichedDishes,
    occasions,
    meta: {
      version: '0.1.0-phase0',
      lastUpdated: '2026-06-14',
      note: 'Canonical seed for Singapore Home Cooks. Shared between mobile mocks and Medusa. Heritage-focused with realistic HDB, allergens, festive details.',
    },
  };

  return { success: true, errors: [], data };
}

// --- Public API for consumers ---
export function getSeedData(): SeedData {
  const result = validateSeed();
  if (!result.success || !result.data) {
    throw new Error(`Seed validation failed. Errors: ${result.errors.join(' | ')}`);
  }
  return result.data;
}

export function getSeedCooks(): SHCCook[] {
  return getSeedData().cooks;
}

export function getSeedDishes(): SeedDish[] {
  return getSeedData().dishes;
}

export function getSeedOccasions(): SeedOccasion[] {
  return getSeedData().occasions;
}

// Convenience: Featured for mobile home (Auntie Rose + one from second cook)
export function getFeaturedForHome() {
  const data = getSeedData();
  const rose = data.cooks.find(c => c.slug === 'auntie-rose-tampines');
  const nasi = data.dishes.find(d => d.id === 'dish_nasi_lemak_prawn_001');
  const devil = data.dishes.find(d => d.id === 'dish_devils_curry_003');

  return [
    {
      id: '1',
      name: rose?.display_name || 'Auntie Rose (Tampines)',
      dish: nasi?.name || 'Nasi Lemak Sambal Prawn',
      price: nasi?.price || 12,
      heritage: nasi?.heritage_note || 'Peranakan family recipe since 1972',
      slug: rose?.slug,
    },
    {
      id: '2',
      name: 'Auntie Doris (Katong)',
      dish: devil?.name || "Eurasian Devil's Curry (Chicken)",
      price: devil?.price || 14,
      heritage: devil?.heritage_note?.slice(0, 80) + '...' || 'Eurasian Kristang heritage from 1950s Katong',
      slug: 'auntie-doris-katong',
    },
  ];
}

// --- CLI / Runner ---
function main() {
  const args = process.argv.slice(2);
  const mode = args[0] || '--validate';

  console.log('Singapore Home Cooks — Seed Validator & Exporter');
  console.log('Assets dir:', ASSETS_DIR);
  console.log('Using @shc/types schemas for contracts alignment.\n');

  const result = validateSeed();

  if (!result.success) {
    console.error('❌ SEED VALIDATION FAILED');
    result.errors.forEach(err => console.error('  -', err));
    console.error('\nFix the JSON in seed/assets/ or update schemas (coordinate Contracts).');
    process.exit(1);
  }

  const data = result.data!;

  console.log('✅ Seed validated successfully against @shc/types.');
  console.log(`   Cooks: ${data.cooks.length}`);
  console.log(`   Dishes: ${data.dishes.length}`);
  console.log(`   Occasions: ${data.occasions.length}`);
  console.log(`   Version: ${data.meta.version} (${data.meta.lastUpdated})`);

  if (mode === '--export-json' || args.includes('--export-json')) {
    const out = JSON.stringify(data, null, 2);
    console.log('\n--- FULL VALIDATED SEED (JSON) ---\n');
    console.log(out);
    // In real: could write to dist/seed.json or pipe to Medusa
  }

  if (mode === '--summary' || !args.length) {
    console.log('\nFeatured home cooks (for mobile mock parity):');
    console.dir(getFeaturedForHome(), { depth: 2 });

    console.log('\nSample dish allergens (Nasi Lemak):');
    const nasi = data.dishes.find(d => d.id.includes('nasi'));
    console.log(nasi?.allergen_tiers);

    console.log('\nHDB Collection example (Auntie Rose):');
    const rose = data.cooks.find(c => c.slug.includes('rose'));
    console.log(rose?.collection_address);
    console.log(rose?.collection_instructions);

    console.log('\nReady for mobile mocks + Medusa seed consumption.');
    console.log('Run with --export-json for machine-readable output.');
  }

  console.log('\nNext: pnpm typecheck or integrate into turbo verify.');
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
  main();
}

// Default export for import consumers (mobile / Medusa scripts)
export default getSeedData;

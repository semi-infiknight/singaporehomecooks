/**
 * Seed script for SHC MVP data.
 * Validates against @shc/types contracts.
 * Run: cd apps/medusa && pnpm seed  (or tsx scripts/seed.ts after server up + bootstrap)
 *
 * Seeds: 1 cook (Auntie Rose), 2 products + meta + availability, using mobile mocks.
 */
import "dotenv/config";
import { z } from "zod";
// @ts-ignore - pg + workspace packages resolved at runtime via tsx + pnpm; tsc --noEmit in package has path issues pre-existing
import { Client } from "pg";
import {
  shcCookSchema,
  shcProductMetaSchema,
  shcAvailabilitySchema,
  shcOrderMetaSchema,
  shcLedgerEntrySchema,
  shcPayoutBatchSchema,
  SHCOrderStatus,
} from "@shc/types";
// @ts-ignore workspace dep for script
import { validateMinQty, calculateCookEarnings, calculatePlatformFee } from "@shc/business-rules";
import { hashCookPassword } from "../src/lib/shc-password";

const COOK_DEV_PASSWORD = process.env.SEED_COOK_PASS || "cooksecret";
const COOK_PASSWORD_HASH = hashCookPassword(COOK_DEV_PASSWORD);

async function seed() {
  console.log("[SEED] Starting SHC seed from mobile mocks...");

  // Validate seed data with contracts (Contracts Track requirement)
  const cookSeed = {
    id: "cook_auntie_rose",
    auth_identity_id: "auth_cook_rose",
    slug: "auntie-rose",
    display_name: "Auntie Rose",
    story: "3rd generation Peranakan cook. My grandmother's recipes from Katong, passed down with love. Specializes in Nyonya dishes for family gatherings.",
    area: "Tampines",
    status: "active" as const,
    availability_paused: false,
  };
  shcCookSchema.parse(cookSeed);
  console.log("  ✓ Cook seed validated");

  // Medusa product seeds + meta
  // Canonical dish_* IDs from seed/index.ts (must match mobile/web discovery)
  const productsToCreate = [
    {
      id: "dish_nasi_lemak_prawn_001",
      title: "Nasi Lemak Sambal Prawn",
      cook_id: "cook_rose_tampines_001",
      price: 1200,
      cuisine: "Peranakan",
      ingredients: [{ name: "Coconut rice", quantity: 1, unit: "portion" }, { name: "Sambal prawn", quantity: 5, unit: "pcs" }, { name: "Ikan bilis", quantity: 20, unit: "g" }, { name: "Peanuts", quantity: 30, unit: "g" }, { name: "Cucumber", quantity: 50, unit: "g" }, { name: "Egg", quantity: 1, unit: "pcs" }],
      allergens: ["Shellfish", "Nuts"],
      calories: 450,
      min_qty: 5,
      heritage: "Family recipe since 1972",
    },
    {
      id: "dish_ayam_buah_keluak_002",
      title: "Ayam Buah Keluak",
      cook_id: "cook_rose_tampines_001",
      price: 1500,
      cuisine: "Peranakan",
      ingredients: [{ name: "Chicken", quantity: 500, unit: "g" }, { name: "Buah Keluak", quantity: 8, unit: "pcs" }],
      allergens: ["Nuts"],
      calories: 380,
      min_qty: 4,
      heritage: "Signature heritage dish",
    },
    {
      id: "dish_devils_curry_003",
      title: "Eurasian Devil's Curry (Chicken)",
      cook_id: "cook_doris_katong_002",
      price: 1400,
      cuisine: "Eurasian",
      ingredients: [{ name: "Chicken", quantity: 500, unit: "g" }, { name: "Potatoes", quantity: 200, unit: "g" }],
      allergens: ["Mustard"],
      calories: 520,
      min_qty: 5,
      heritage: "Katong Eurasian heritage",
    },
  ];

  // In full run this would use container + create Product + Meta + Availability + link sales channel.
  // For Wave1: log validated data (run after Admin product creation or use in bootstrap flow).
  for (const p of productsToCreate) {
    const meta = {
      product_id: p.id,
      cook_id: p.cook_id,
      cuisine: p.cuisine,
      occasion_tags: ["family-gathering", "hari-raya", "deepavali"],
      allergen_tiers: { tier1: p.allergens, tier2: [], tier3: [] },
      halal: false,
      calories: p.calories,
      calories_confidence: "full" as const,
      ingredients: p.ingredients,
      min_qty: p.min_qty,
    };
    shcProductMetaSchema.parse(meta);
    const minCheck = validateMinQty(meta.min_qty, meta.min_qty);
    if (!minCheck.valid) throw new Error(minCheck.error);

    const avail = {
      product_id: meta.product_id,
      portions_per_day: 20,
      collection_days: [1,2,3,4,5,6], // Mon-Sat
      time_slots: ["18:00-19:00", "19:00-20:00"],
      paused: false,
    };
    shcAvailabilitySchema.parse(avail);

    console.log(`  ✓ Product meta + avail validated: ${p.title} (min ${p.min_qty})`);
  }

  console.log("[SEED] All seed data validated against contracts (05-data-model + 09-order-state).");

  const dbUrl = process.env.DATABASE_URL || "postgres://shc:shc_dev@localhost:5432/shc_medusa";
  const pg = new Client({ connectionString: dbUrl });
  await pg.connect();

  // Insert canonical cooks from seed/assets (idempotent) for real /store/shc/cooks
  const cooksFromAssets = [
    {
      id: "cook_rose_tampines_001",
      auth_identity_id: "auth_cook_001",
      slug: "auntie-rose-tampines",
      display_name: "Auntie Rose (Tampines)",
      story: cookSeed.story,
      area: "Tampines",
      status: "active",
    },
    {
      id: "cook_doris_katong_002",
      auth_identity_id: "auth_cook_002",
      slug: "auntie-doris-katong",
      display_name: "Auntie Doris (Katong)",
      story: "Eurasian heritage cook from Katong/Joo Chiat.",
      area: "Katong",
      status: "active",
    },
  ];
  const cookLogins: Record<string, string> = {
    cook_rose_tampines_001: "rose@shc.local",
    cook_doris_katong_002: "doris@shc.local",
  };
  for (const c of cooksFromAssets) {
    shcCookSchema.partial().parse(c);
    const loginEmail = cookLogins[c.id];
    await pg.query(
      `INSERT INTO shc_cook (id, auth_identity_id, slug, display_name, story, area, status, availability_paused, login_email, password_hash, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,false,$8,$9,now(),now())
       ON CONFLICT (id) DO UPDATE SET display_name=EXCLUDED.display_name, story=EXCLUDED.story, status=EXCLUDED.status, login_email=EXCLUDED.login_email, password_hash=EXCLUDED.password_hash, updated_at=now()`,
      [c.id, c.auth_identity_id, c.slug, c.display_name, c.story, c.area, c.status, loginEmail, COOK_PASSWORD_HASH]
    );
    console.log(`  ✓ shc_cook seeded: ${c.slug} (${loginEmail}, hashed password)`);
  }

  // Product meta + availability for /store/shc/products
  for (const p of productsToCreate) {
    const productId = p.id;
    const meta = {
      product_id: productId,
      cook_id: p.cook_id,
      cuisine: p.cuisine,
      occasion_tags: ["family-gathering", "hari-raya"],
      allergen_tiers: { tier1: p.allergens, tier2: [], tier3: [] },
      halal: false,
      calories: p.calories,
      calories_confidence: "full" as const,
      ingredients: p.ingredients,
      min_qty: p.min_qty,
    };
    shcProductMetaSchema.parse(meta);
    await pg.query(
      `INSERT INTO shc_product_meta (id, product_id, cook_id, cuisine, occasion_tags, allergen_tiers, halal, calories, calories_confidence, ingredients, min_qty, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now(),now())
       ON CONFLICT (product_id) DO UPDATE SET cuisine=EXCLUDED.cuisine, min_qty=EXCLUDED.min_qty, updated_at=now()`,
      [
        `meta_${productId}`,
        meta.product_id,
        meta.cook_id,
        meta.cuisine,
        JSON.stringify(meta.occasion_tags),
        JSON.stringify(meta.allergen_tiers),
        meta.halal,
        meta.calories,
        meta.calories_confidence,
        JSON.stringify(meta.ingredients),
        meta.min_qty,
      ]
    );
    await pg.query(
      `INSERT INTO shc_availability (id, product_id, portions_per_day, collection_days, time_slots, paused, created_at, updated_at)
       VALUES ($1,$2,20,$3,$4,false,now(),now())
       ON CONFLICT (product_id) DO NOTHING`,
      [
        `avail_${productId}`,
        productId,
        JSON.stringify([1, 2, 3, 4, 5, 6]),
        JSON.stringify(["18:00-19:00", "19:00-20:00"]),
      ]
    );
    console.log(`  ✓ shc_product_meta + availability seeded: ${p.title}`);
  }

  // Phase 6: extend seed to create sample completed orders + ledger entries + one payout batch.
  // Validates vs frozen contracts (@shc/types). Idempotent via existence checks. Uses business-rules for 15% calc.
  // Demo uses synthetic order_ids + cook from above; totals chosen to exercise double-entry + weekly sim.
  // Run after migrations + server/DB up: pnpm seed (in apps/medusa)
  console.log("[SEED][PHASE6-MONEY] Seeding sample completed orders + ledger + payout batch (demo)...");
  try {

    const demoCookId = cookSeed.id;
    const demoOrders = [
      { order_id: "order_completed_demo_001", total_cents: 6000, collection_date: "2026-06-10", slot: "18:00-19:00" },
      { order_id: "order_completed_demo_002", total_cents: 4500, collection_date: "2026-06-11", slot: "19:00-20:00" },
    ];

    // 1. Ensure sample order_metas as completed (idempotent)
    for (const o of demoOrders) {
      const metaRow = {
        id: `meta_${o.order_id}`,
        order_id: o.order_id,
        cook_id: demoCookId,
        collection_date: o.collection_date,
        collection_slot: o.slot,
        shc_status: "completed" as SHCOrderStatus,
        paynow_reference: `PAYNOW-${o.order_id.slice(-6)}`,
        allergen_acked_at: new Date().toISOString(),
        address_released_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      // validate (partial ok for demo)
      shcOrderMetaSchema.partial().parse(metaRow);

      await pg.query(
        `INSERT INTO shc_order_meta (id, order_id, cook_id, collection_date, collection_slot, shc_status, paynow_reference, allergen_acked_at, address_released_at, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (order_id) DO UPDATE SET shc_status='completed', updated_at=now()`,
        [metaRow.id, metaRow.order_id, metaRow.cook_id, metaRow.collection_date, metaRow.collection_slot, metaRow.shc_status, metaRow.paynow_reference, metaRow.allergen_acked_at, metaRow.address_released_at, metaRow.created_at, metaRow.updated_at]
      );
      console.log(`  ✓ order_meta completed seeded/ensured: ${o.order_id}`);
    }

    // 2. Seed a payout batch for the week (use current Mon sim)
    const weekStart = "2026-06-08"; // fixed demo Monday
    const batchRow = {
      id: `batch_demo_${weekStart}`,
      week_start: weekStart,
      status: "approved" as const,
      total_cents: 0, // will update after legs
      transfer_ref: `SIM-PAYOUT-${weekStart.replace(/-/g,"")}-DEMO01`,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    shcPayoutBatchSchema.partial().parse(batchRow);
    await pg.query(
      `INSERT INTO shc_payout_batch (id, week_start, status, total_cents, transfer_ref, approved_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (week_start) DO NOTHING`,
      [batchRow.id, batchRow.week_start, batchRow.status, batchRow.total_cents, batchRow.transfer_ref, batchRow.approved_at, batchRow.created_at, batchRow.updated_at]
    );
    console.log(`  ✓ payout_batch seeded: ${weekStart}`);

    // 3. Post sample double-entry ledger for the demo completed orders (idempotent, validate, use business-rules 15%)
    let totalBatchCook = 0;
    for (const o of demoOrders) {
      const existingLeg = await pg.query(`SELECT 1 FROM shc_ledger_entry WHERE order_id=$1 LIMIT 1`, [o.order_id]);
      if (existingLeg.rows.length) {
        console.log(`  - ledger for ${o.order_id} exists (idempotent skip)`);
        continue;
      }
      const platform = calculatePlatformFee(o.total_cents);
      const cookEarn = calculateCookEarnings(o.total_cents);
      totalBatchCook += cookEarn;

      const legPlatform = {
        id: `leg_demo_${o.order_id}_plat`,
        order_id: o.order_id,
        debit_account: "Platform-Commission-Revenue",
        credit_account: "Order-Sales",
        amount_cents: platform,
        batch_id: batchRow.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      shcLedgerEntrySchema.parse(legPlatform);

      const legCook = {
        id: `leg_demo_${o.order_id}_cook`,
        order_id: o.order_id,
        debit_account: "Cook-Earnings-Payable",
        credit_account: "Order-Sales",
        amount_cents: cookEarn,
        batch_id: batchRow.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      shcLedgerEntrySchema.parse(legCook);

      await pg.query(
        `INSERT INTO shc_ledger_entry (id, order_id, debit_account, credit_account, amount_cents, batch_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [legPlatform.id, legPlatform.order_id, legPlatform.debit_account, legPlatform.credit_account, legPlatform.amount_cents, legPlatform.batch_id, legPlatform.created_at, legPlatform.updated_at]
      );
      await pg.query(
        `INSERT INTO shc_ledger_entry (id, order_id, debit_account, credit_account, amount_cents, batch_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [legCook.id, legCook.order_id, legCook.debit_account, legCook.credit_account, legCook.amount_cents, legCook.batch_id, legCook.created_at, legCook.updated_at]
      );

      console.log(`  ✓ ledger double-entry for ${o.order_id}: platform=${platform} cook=${cookEarn}`);
    }

    // update batch total with accumulated
    if (totalBatchCook > 0) {
      await pg.query(`UPDATE shc_payout_batch SET total_cents=$1 WHERE week_start=$2`, [totalBatchCook, weekStart]);
    }

    // 4. One payout clearing leg for the batch (if not present)
    const payoutLegCheck = await pg.query(`SELECT 1 FROM shc_ledger_entry WHERE batch_id=$1 AND credit_account='Payout-Bank-Clearing' LIMIT 1`, [batchRow.id]);
    if (!payoutLegCheck.rows.length && totalBatchCook > 0) {
      const payoutLeg = {
        id: `payoutleg_demo_${batchRow.id}`,
        order_id: null,
        debit_account: "Cook-Earnings-Payable",
        credit_account: "Payout-Bank-Clearing",
        amount_cents: totalBatchCook,
        batch_id: batchRow.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      shcLedgerEntrySchema.partial().parse(payoutLeg);
      await pg.query(
        `INSERT INTO shc_ledger_entry (id, order_id, debit_account, credit_account, amount_cents, batch_id, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [payoutLeg.id, payoutLeg.order_id, payoutLeg.debit_account, payoutLeg.credit_account, payoutLeg.amount_cents, payoutLeg.batch_id, payoutLeg.created_at, payoutLeg.updated_at]
      );
      console.log(`  ✓ payout clearing leg for batch total=${totalBatchCook}`);
    }

    // Double-entry note: by paired inserts, sum(debits) == sum(credits) always for the tx group.
    console.log("[SEED][PHASE6-MONEY] Completed orders + ledger entries + payout batch seeded + validated (contracts + 15% rules).");
    console.log("  Verify: use /admin/shc/ledger?order_id=... or run weekly-payout sim (idempotent).");
  } catch (e: any) {
    console.log("[SEED][PHASE6-MONEY] Money seed skipped or partial (DB may need migrate or tables not ready yet):", e.message);
  } finally {
    await pg.end().catch(() => {});
  }

  // Backend-Completion (Phase 8-9): seed sample requests, bids, credits, heritage for growth routes parity with mock.
  // Uses frozen @shc/types where applicable (req/bid). Direct pg for new tables (migrations run first).
  console.log("[SEED][BACKEND-COMPLETE-GROWTH] Seeding sample requests/bids/credits/heritage...");
  const pg2 = new Client({ connectionString: dbUrl });
  try {
    await pg2.connect();
    const demoCook = "cook_auntie_rose";
    const demoCust = "cust_demo";

    // Sample request (open)
    await pg2.query(`INSERT INTO shc_request (id, customer_id, body, party_size, budget_cents, date, status, created_at, updated_at)
      VALUES ('req_seed_001', $1, 'Nasi lemak sambal for 6-8, medium spice, for Hari Raya open house.', 8, 15000, '2026-06-20', 'open', now(), now())
      ON CONFLICT (id) DO NOTHING`, [demoCust]);
    console.log("  ✓ sample shc_request seeded");

    // Sample bid on it (pending)
    await pg2.query(`INSERT INTO shc_bid (id, request_id, cook_id, price_cents, message, status, created_at, updated_at)
      VALUES ('bid_seed_001', 'req_seed_001', $1, 14500, 'Happy to cook this SG family favourite in my HDB kitchen with heritage recipe.', 'pending', now(), now())
      ON CONFLICT (id) DO NOTHING`, [demoCook]);
    console.log("  ✓ sample shc_bid seeded");

    // Credit wallet for demo cust (balance for redeem demo)
    await pg2.query(`INSERT INTO shc_credit_wallet (id, customer_id, balance_cents, lifetime_spend_cents, tier, last_earn_at, created_at, updated_at)
      VALUES ('cw_seed_cust', $1, 120, 68000, 'Silver', now(), now(), now())
      ON CONFLICT (customer_id) DO UPDATE SET balance_cents=120, lifetime_spend_cents=68000, tier='Silver'`, [demoCust]);
    console.log("  ✓ sample shc_credit_wallet seeded");

    // Heritage entries (published)
    await pg2.query(`INSERT INTO shc_heritage (id, cook_id, title, story, photo_stub, published, created_at, updated_at)
      VALUES ('ha_seed_001', $1, '1972 Katong Nasi Lemak', 'Ah Mah ground rempah on batu lesung every dawn in the shophouse. We keep the exact pandan-lemak ratio in our Tampines HDB. Published for the Heritage Library.', 'nasi-lemak-family-1972.jpg', true, now(), now())
      ON CONFLICT (id) DO NOTHING`, [demoCook]);
    await pg2.query(`INSERT INTO shc_heritage (id, cook_id, title, story, photo_stub, published, created_at, updated_at)
      VALUES ('ha_seed_002', $1, 'Buah Keluak Ritual', 'Soak 3 days, scrape the flesh by hand — the same way my mother taught in 1983 HDB kitchen.', 'keluak-paste-hdb.jpg', true, now(), now())
      ON CONFLICT (id) DO NOTHING`, [demoCook]);
    console.log("  ✓ sample shc_heritage entries seeded");

    // Add a credit ledger issuance sample (for history)
    await pg2.query(`INSERT INTO shc_ledger_entry (id, order_id, debit_account, credit_account, amount_cents, batch_id, created_at, updated_at)
      VALUES ('leg_credit_seed', null, 'Credit-Issuance-Expense', 'Home-Credit-Liability', 120, null, now(), now())
      ON CONFLICT (id) DO NOTHING`);
    console.log("  ✓ sample credit ledger entry seeded");

    console.log("[SEED][BACKEND-COMPLETE-GROWTH] Growth samples (requests, bids, credits, heritage) + ledger tie-ins complete. Use routes to demo.");
  } catch (e: any) {
    console.log("[SEED][BACKEND-COMPLETE-GROWTH] Growth seed partial (migrations/DB ready?):", e.message);
  } finally {
    await pg2.end().catch(() => {});
  }

  console.log("[SEED] Done.");
}

seed().catch((e) => {
  console.error("[SEED] Failed validation or insert:", e);
  process.exit(1);
});

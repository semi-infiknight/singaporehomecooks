import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import {
  countBy,
  priceBucket,
  shortCookLabel,
  sumBy,
  topN,
} from "../../../../lib/shc-admin-chart-aggregate";
import {
  CATALOG_CATEGORIES_KEY,
  DEFAULT_CATALOG_CATEGORIES,
  normalizeCategories,
} from "../../../../lib/shc-catalog-categories";

const QuerySchema = z
  .object({
    days: z.coerce.number().int().positive().max(90).default(30),
  })
  .strict();

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * GET /admin/shc/charts
 * Unified chart payloads for every SHC Ops data domain.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", "Bad charts query", parse.error.format() as any),
    });
  }

  const days = parse.data.days;

  try {
    const metaService: any = req.scope.resolve("shcOrderMeta");
    const productMetaService: any = req.scope.resolve("shcProductMeta");
    const cookService: any = req.scope.resolve("shcCook");

    let availService: any = null;
    let complianceService: any = null;
    let payoutService: any = null;
    let disputeService: any = null;
    let ledgerService: any = null;
    let expenseService: any = null;
    let flagService: any = null;
    let requestService: any = null;

    try {
      availService = req.scope.resolve("shcAvailability");
    } catch {
      /* optional */
    }
    try {
      complianceService = req.scope.resolve("shcComplianceDoc");
    } catch {
      /* optional */
    }
    try {
      payoutService = req.scope.resolve("shcPayoutBatch");
    } catch {
      /* optional */
    }
    try {
      disputeService = req.scope.resolve("shcDispute");
    } catch {
      /* optional */
    }
    try {
      ledgerService = req.scope.resolve("shcLedger");
    } catch {
      /* optional */
    }
    try {
      expenseService = req.scope.resolve("shcCookExpense");
    } catch {
      /* optional */
    }
    try {
      flagService = req.scope.resolve("shcFeatureFlag");
    } catch {
      /* optional */
    }
    try {
      requestService = req.scope.resolve("shcRequest");
    } catch {
      /* optional */
    }

    const [orderMetas] = await metaService
      .listAndCountOrderMetas({}, { take: 500, order: { created_at: "DESC" } as any })
      .catch(() => [[]]);

    const orders = (orderMetas as any[]) || [];

    const [listings] = await productMetaService
      .listAndCountProductMetas({}, { take: 500, order: { updated_at: "DESC" } as any })
      .catch(() => [[]]);

    const listingRows = (listings as any[]) || [];

    const availByProduct = new Map<string, any>();
    if (availService) {
      const [avails] = await availService
        .listAndCountAvailabilities({}, { take: 500 })
        .catch(() => [[]]);
      for (const a of avails || []) {
        if (a?.product_id) availByProduct.set(String(a.product_id), a);
      }
    }

    const enrichedListings = listingRows.map((m) => {
      const avail = availByProduct.get(String(m.product_id));
      const paused = !!avail?.paused;
      const priceCents =
        m.price_cents != null && Number(m.price_cents) > 0
          ? Math.round(Number(m.price_cents))
          : null;
      return {
        product_id: m.product_id,
        cook_id: m.cook_id,
        cuisine: m.cuisine || "Unspecified",
        halal: !!m.halal,
        paused,
        status: paused ? "paused" : "active",
        price_cents: priceCents,
      };
    });

    // --- Orders ---
    const ordersByStatus = countBy(orders, (o) => String(o.shc_status || "unknown"));
    const ordersBySlot = topN(
      countBy(
        orders.filter((o) => o.collection_slot),
        (o) => String(o.collection_slot)
      ),
      6
    );
    const corporateCount = orders.filter((o) => o.is_corporate).length;
    const ordersByCookGmv = topN(
      sumBy(
        orders,
        (o) => String(o.cook_id || "unknown"),
        (o) => {
          const tc =
            o.total_cents != null && Number(o.total_cents) > 0
              ? Math.round(Number(o.total_cents))
              : Math.round(Number(o.total || 0) * 100);
          return tc;
        }
      ).map((s) => ({ ...s, name: shortCookLabel(s.name) })),
      8
    );
    const ordersByCookCount = topN(
      countBy(orders, (o) => String(o.cook_id || "unknown")).map((s) => ({
        ...s,
        name: shortCookLabel(s.name),
      })),
      8
    );

    // --- Time series (reuse analytics window) ---
    const today = startOfUtcDay(new Date());
    const windowStart = new Date(today);
    windowStart.setUTCDate(windowStart.getUTCDate() - (days - 1));
    const seriesMap = new Map<string, { date: string; orders: number; paid: number; gmv_cents: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(windowStart);
      d.setUTCDate(windowStart.getUTCDate() + i);
      const key = dayKey(d);
      seriesMap.set(key, { date: key, orders: 0, paid: 0, gmv_cents: 0 });
    }
    for (const m of orders) {
      const raw = m.created_at || m.updated_at;
      if (!raw) continue;
      const created = new Date(raw);
      if (Number.isNaN(created.getTime())) continue;
      const key = dayKey(startOfUtcDay(created));
      const bucket = seriesMap.get(key);
      if (!bucket) continue;
      const tc =
        m.total_cents != null && Number(m.total_cents) > 0
          ? Math.round(Number(m.total_cents))
          : Math.round(Number(m.total || 0) * 100);
      bucket.orders += 1;
      if (tc > 0) bucket.gmv_cents += tc;
      const status = String(m.shc_status || "");
      if (
        ["paid", "accepted", "preparing", "ready_for_collection", "collected", "completed"].includes(
          status
        )
      ) {
        bucket.paid += 1;
      }
    }
    const series = Array.from(seriesMap.values());

    // --- Listings ---
    const listingsByStatus = countBy(enrichedListings, (l) => l.status);
    const listingsByCuisine = topN(countBy(enrichedListings, (l) => l.cuisine), 8);
    const listingsHalal = [
      { name: "Halal", value: enrichedListings.filter((l) => l.halal).length },
      { name: "Non-halal", value: enrichedListings.filter((l) => !l.halal).length },
    ].filter((s) => s.value > 0);
    const listingsByPrice = countBy(enrichedListings, (l) => priceBucket(l.price_cents));

    // --- Availability ---
    const availabilityRows = Array.from(availByProduct.values());
    const availabilityByStatus = countBy(availabilityRows, (a) => (a.paused ? "paused" : "active"));

    // --- Cooks ---
    let cooksActive = 0;
    let cooksPending = 0;
    try {
      const [, activeCount] = await cookService.listAndCountCooks({ status: "active" }, { take: 1 });
      cooksActive = typeof activeCount === "number" ? activeCount : 0;
      const [, pendingCount] = await cookService.listAndCountCooks({ status: "pending" }, { take: 1 });
      cooksPending = typeof pendingCount === "number" ? pendingCount : 0;
    } catch {
      /* optional */
    }

    // --- Compliance ---
    let complianceSummary = {
      total: 0,
      pending: 0,
      verified: 0,
      pending_sfa: 0,
      pending_wsq: 0,
      by_type: { sfa: 0, wsq: 0 },
    };
    if (complianceService) {
      const [allDocs] = await complianceService
        .listAndCountComplianceDocs({}, { take: 500 })
        .catch(() => [[]]);
      const docs = (allDocs as any[]) || [];
      complianceSummary = {
        total: docs.length,
        pending: docs.filter((d) => !d.verified_at).length,
        verified: docs.filter((d) => Boolean(d.verified_at)).length,
        pending_sfa: docs.filter((d) => !d.verified_at && d.type === "sfa").length,
        pending_wsq: docs.filter((d) => !d.verified_at && d.type === "wsq").length,
        by_type: {
          sfa: docs.filter((d) => d.type === "sfa").length,
          wsq: docs.filter((d) => d.type === "wsq").length,
        },
      };
    }

    // --- Payouts ---
    let payoutBatches: any[] = [];
    if (payoutService?.listPayoutBatches) {
      payoutBatches = await payoutService.listPayoutBatches({ limit: 24 }).catch(() => []);
    }
    const payoutsByStatus = countBy(payoutBatches, (b) => String(b.status || "unknown"));
    const payoutsWeekly = payoutBatches
      .filter((b) => b.week_start)
      .sort((a, b) => String(a.week_start).localeCompare(String(b.week_start)))
      .slice(-12)
      .map((b) => ({
        week: String(b.week_start),
        amount_cents: Number(b.total_cents || 0),
        status: b.status,
      }));

    // --- Disputes ---
    let disputes: any[] = [];
    if (disputeService?.listAndCountDisputes) {
      const [rows] = await disputeService.listAndCountDisputes({}, { take: 100 }).catch(() => [[]]);
      disputes = rows || [];
    }
    const disputesByType = countBy(disputes, (d) => String(d.type || "other").replace(/_/g, " "));
    const disputesByStatus = countBy(disputes, (d) => String(d.status || "unknown"));

    // --- Ledger ---
    let ledgerEntries: any[] = [];
    if (ledgerService?.listLedgerEntries) {
      ledgerEntries = await ledgerService.listLedgerEntries({ limit: 200 }).catch(() => []);
    }
    const ledgerByAccount = topN(
      sumBy(ledgerEntries, (e) => String(e.account || e.type || "entry"), (e) =>
        Math.abs(Number(e.amount_cents || e.amount || 0))
      ),
      6
    );
    let ledgerSummary = { cook_earnings_cents: 0, platform_fees_cents: 0, entry_count: ledgerEntries.length };
    if (ledgerService?.getLedgerSummaryForOrders) {
      const orderIds = orders.map((o) => o.order_id).filter(Boolean);
      if (orderIds.length) {
        const s = await ledgerService.getLedgerSummaryForOrders(orderIds.slice(0, 200)).catch(() => null);
        if (s) {
          ledgerSummary = {
            cook_earnings_cents: s.totalCookEarnings || 0,
            platform_fees_cents: s.totalPlatformFees || 0,
            entry_count: ledgerEntries.length,
          };
        }
      }
    }

    // --- Cook expenses ---
    let expenses: any[] = [];
    if (expenseService?.listAndCountCookExpenses) {
      const [rows] = await expenseService.listAndCountCookExpenses({}, { take: 100 }).catch(() => [[]]);
      expenses = rows || [];
    }
    const expensesByCategory = sumBy(
      expenses,
      (e) => String(e.category || "other"),
      (e) => Number(e.amount_cents || 0)
    );

    // --- Feature flags ---
    let flags: any[] = [];
    if (flagService?.listAndCountFeatureFlags) {
      const [rows] = await flagService.listAndCountFeatureFlags({}, { take: 50 }).catch(() => [[]]);
      flags = rows || [];
    }
    const flagsOnOff = [
      { name: "Enabled", value: flags.filter((f) => f.enabled).length },
      { name: "Paused", value: flags.filter((f) => !f.enabled).length },
    ].filter((s) => s.value > 0);

    // --- Collab requests ---
    let openRequests = 0;
    if (requestService?.listAndCountRequests) {
      const [, c] = await requestService.listAndCountRequests({ status: "open" }, { take: 1 }).catch(() => [0, 0]);
      openRequests = typeof c === "number" ? c : 0;
    }

    // --- Categories (platform stat presets) ---
    let categoriesOnOff: { name: string; value: number }[] = [];
    try {
      const statService: any = req.scope.resolve("shcPlatformStat");
      const [existing] = await statService
        .listAndCountPlatformStats({ key: CATALOG_CATEGORIES_KEY }, { take: 1 })
        .catch(() => [[]]);
      const rows = normalizeCategories(existing?.[0]?.value ?? DEFAULT_CATALOG_CATEGORIES);
      categoriesOnOff = [
        { name: "Enabled", value: rows.filter((c) => c.enabled !== false).length },
        { name: "Disabled", value: rows.filter((c) => c.enabled === false).length },
      ].filter((s) => s.value > 0);
    } catch {
      /* categories optional */
    }

    res.json({
      window_days: days,
      sample_sizes: {
        orders: orders.length,
        listings: enrichedListings.length,
        ledger_entries: ledgerEntries.length,
        disputes: disputes.length,
        expenses: expenses.length,
      },
      orders: {
        by_status: ordersByStatus,
        by_slot: ordersBySlot,
        corporate_vs_regular: [
          { name: "Corporate", value: corporateCount },
          { name: "Consumer", value: orders.length - corporateCount },
        ].filter((s) => s.value > 0),
        top_cooks_by_orders: ordersByCookCount,
        top_cooks_by_gmv_cents: ordersByCookGmv,
      },
      time_series: series,
      listings: {
        by_status: listingsByStatus,
        by_cuisine: listingsByCuisine,
        halal_split: listingsHalal,
        by_price_bucket: listingsByPrice,
        total: enrichedListings.length,
      },
      availability: {
        by_status: availabilityByStatus,
        total: availabilityRows.length,
      },
      cooks: {
        active: cooksActive,
        pending: cooksPending,
      },
      compliance: complianceSummary,
      payouts: {
        by_status: payoutsByStatus,
        weekly: payoutsWeekly,
        total_batches: payoutBatches.length,
      },
      disputes: {
        by_type: disputesByType,
        by_status: disputesByStatus,
        open_count: disputes.filter((d) => d.status === "open").length,
      },
      ledger: {
        summary: ledgerSummary,
        by_account: ledgerByAccount,
      },
      expenses: {
        by_category_cents: expensesByCategory,
        total_cents: expenses.reduce((n, e) => n + Number(e.amount_cents || 0), 0),
      },
      flags: {
        on_off: flagsOnOff,
        total: flags.length,
      },
      categories: {
        on_off: categoriesOnOff,
      },
      ops_queue: {
        compliance_pending: complianceSummary.pending,
        open_requests: openRequests,
        open_disputes: disputes.filter((d) => d.status === "open").length,
      },
      generated_at: new Date().toISOString(),
      note: "Aggregated from shc_* module samples (orders/listings up to 500 rows).",
    });
  } catch (e: any) {
    res.status(500).json({
      error: createSHCError("SHC-GENERIC-001", e?.message || "Charts aggregation failed"),
    });
  }
}

import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { getSingaporeWeekBounds } from "@shc/utils";

vi.mock("../../../../lib/shc-actors", () => ({
  getCookId: vi.fn(() => "cook_rose_001"),
}));

vi.mock("../../../../lib/shc-business-rules-config", () => ({
  loadBusinessRulesConfigFromScope: vi.fn(async () => ({
    commission: { default_rate_pct: 15 },
    drop: { customer_window_days: 7 },
    tiffin: { customize_cutoff_hours: 24 },
    cart: { one_cook_enforced: true },
    review: { eligible_statuses: ["collected", "completed"] },
  })),
}));

function makeRes() {
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return res;
}

const weekBounds = getSingaporeWeekBounds();
const inWeek = weekBounds.weekStart.toISOString();
const oldWeek = new Date(weekBounds.weekStart.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();

const METAS = [
  { order_id: "ord_completed", shc_status: "completed", updated_at: inWeek },
  { order_id: "ord_completed_old", shc_status: "completed", updated_at: oldWeek },
  { order_id: "ord_paid", shc_status: "paid", updated_at: inWeek },
  { order_id: "ord_accepted", shc_status: "accepted", updated_at: inWeek },
];

function makeReq() {
  return {
    query: {},
    scope: {
      resolve(name: string) {
        if (name === "shcOrderMeta") {
          return {
            listAndCountOrderMetas: async () => [METAS, METAS.length],
          };
        }
        if (name === "shcLedger") {
          return {
            getLedgerSummaryForOrders: async (orderIds: string[]) => {
              expect(orderIds).toEqual(["ord_completed"]);
              return {
                totalCookEarnings: 8500,
                totalPlatformFees: 1500,
                entries: [],
              };
            },
            getCookEarningsSummaryForOrders: async (orderIds: string[], options?: { unbatchedOnly?: boolean }) => {
              expect(orderIds).toEqual(["ord_completed", "ord_completed_old"]);
              expect(options?.unbatchedOnly).toBe(true);
              return {
                totalCookEarnings: 12000,
                totalPlatformFees: 0,
                entries: [],
              };
            },
          };
        }
        if (name === "shcPayoutBatch") {
          return {
            getLastCookPayoutLine: async () => ({
              amount_cents: 5000,
              transfer_ref: "ABC123",
              batch_transfer_ref: "ABC123",
              batch_approved_at: "2026-01-10T02:00:00.000Z",
              batch_week_start: "2026-01-06",
            }),
          };
        }
        if (name === "shcCook") {
          return {
            listAndCountCooks: async () => [[{ id: "cook_rose_001", paynow_mobile: "+6591234567" }], 1],
          };
        }
        throw new Error(`Unknown ${name}`);
      },
    },
  };
}

describe("GET /store/shc/earnings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns Mon–Sun ledger cents and pending payout snapshot", async () => {
    const res = makeRes();
    await GET(makeReq() as any, res);
    expect(res.body.this_week_cents).toBe(8500);
    expect(res.body.pending_payout_cents).toBe(12000);
    expect(res.body.projected_payout_cents).toBe(12000);
    expect(res.body.platform_fee_cents).toBe(1500);
    expect(res.body.gross_cents).toBe(10000);
    expect(res.body.orders_count).toBe(1);
    expect(res.body.commission_rate_pct).toBe(15);
    expect(res.body.paynow_configured).toBe(true);
    expect(res.body.last_payout.amount_cents).toBe(5000);
    expect(res.body.next_payout.pending_cents).toBe(12000);
    expect(res.body.thisWeek).toBe(85);
    expect(res.body.projectedPayout).toBe(120);
  });
});

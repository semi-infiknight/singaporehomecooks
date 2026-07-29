import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";

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

const METAS = [
  { order_id: "ord_completed", shc_status: "completed" },
  { order_id: "ord_paid", shc_status: "paid" },
  { order_id: "ord_accepted", shc_status: "accepted" },
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

  it("returns ledger cents for completed orders only", async () => {
    const res = makeRes();
    await GET(makeReq() as any, res);
    expect(res.body.this_week_cents).toBe(8500);
    expect(res.body.platform_fee_cents).toBe(1500);
    expect(res.body.gross_cents).toBe(10000);
    expect(res.body.orders_count).toBe(1);
    expect(res.body.commission_rate_pct).toBe(15);
    expect(res.body.thisWeek).toBe(85);
  });
});

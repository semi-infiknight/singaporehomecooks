import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import * as shcActors from "../../../../lib/shc-actors";
import * as shcEventBus from "../../../../lib/shc-event-bus";

vi.mock("../../../../lib/shc-actors");
vi.mock("../../../../lib/shc-event-bus");

function makeRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

describe("POST /store/shc/bids", () => {
  const existingBid = {
    id: "bid_existing",
    request_id: "req_1",
    cook_id: "cook_rose",
    price_cents: 4500,
    status: "pending",
    message: "Old quote",
    line_items_json: JSON.stringify([
      { request_line_id: "line_a", included: true, price_cents: 4500 },
    ]),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("upserts pending bid for same cook + request", async () => {
    const upsertPendingBid = vi.fn().mockResolvedValue({
      ...existingBid,
      price_cents: 5000,
      message: "Updated quote",
    });
    const updateRequestStatus = vi.fn().mockResolvedValue(undefined);
    const req: any = {
      body: {
        request_id: "req_1",
        price_cents: 5000,
        message: "Updated quote",
        line_items: [{ request_line_id: "line_a", included: true, price_cents: 5000 }],
      },
      scope: {
        resolve: (key: string) => {
          if (key === "shcBid") {
            return { upsertPendingBid, listBidsForRequest: vi.fn() };
          }
          if (key === "shcRequest") {
            return {
              getRequest: vi.fn().mockResolvedValue({
                id: "req_1",
                items_json: JSON.stringify([{ id: "line_a", name: "Laksa", servings: 6 }]),
              }),
              updateRequestStatus,
            };
          }
          return { info: vi.fn() };
        },
      },
    };
    vi.mocked(shcActors.getAuthContext).mockImplementation(() => ({}) as any);
    vi.mocked(shcActors.getCookId).mockReturnValue("cook_rose");
    vi.mocked(shcEventBus.emitShcEvent).mockResolvedValue(undefined);

    const res = makeRes();
    await POST(req, res);

    expect(res.statusCode).toBe(201);
    expect(upsertPendingBid).toHaveBeenCalledOnce();
    expect(res.body?.bid?.price_cents).toBe(5000);
    expect(updateRequestStatus).toHaveBeenCalledWith("req_1", "bidding");
  });
});

describe("GET /store/shc/bids?mine=1", () => {
  it("lists bids for authenticated cook", async () => {
    const listBidsForCook = vi.fn().mockResolvedValue([{ id: "bid_1", request_id: "req_1" }]);
    const req: any = {
      query: { mine: "1" },
      scope: {
        resolve: () => ({ listBidsForCook }),
      },
    };
    vi.mocked(shcActors.getCookId).mockReturnValue("cook_rose");

    const res = makeRes();
    await GET(req, res);

    expect(res.statusCode).toBe(200);
    expect(listBidsForCook).toHaveBeenCalledWith("cook_rose");
    expect(res.body?.count).toBe(1);
  });
});

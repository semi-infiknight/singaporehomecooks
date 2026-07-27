import { describe, expect, it, vi } from "vitest";
import { GET as storeGet } from "./route";
import { GET as adminGet, POST as adminPost, DELETE as adminDelete } from "../../../admin/shc/discover-promos/route";

function createStatService() {
  const stats: any[] = [];
  const statService = {
    listAndCountPlatformStats: vi.fn(async (filters: { key?: string }) => {
      const rows = stats.filter((s) => !filters?.key || s.key === filters.key);
      return [rows, rows.length];
    }),
    createPlatformStats: vi.fn(async (rows: any[]) => {
      stats.push(...rows);
      return rows;
    }),
    updatePlatformStats: vi.fn(async ({ data }: { data: { value: unknown } }) => {
      const idx = stats.findIndex((s) => s.key === "discover_promo_carousel");
      if (idx >= 0) stats[idx] = { ...stats[idx], value: data.value };
      else stats.push({ key: "discover_promo_carousel", value: data.value });
      return [stats[idx >= 0 ? idx : stats.length - 1]];
    }),
  };
  return statService;
}

function mockReq(statService: ReturnType<typeof createStatService>, body?: unknown, query?: Record<string, string>) {
  return {
    scope: { resolve: (name: string) => (name === "shcPlatformStat" ? statService : null) },
    body,
    query: query || {},
  } as any;
}

function mockRes() {
  const res: any = { statusCode: 200, body: null };
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body: unknown) => {
    res.body = body;
    return res;
  };
  return res;
}

describe("GET /store/shc/discover-promos", () => {
  it("returns default slides when no admin config saved", async () => {
    const statService = createStatService();
    const req = mockReq(statService);
    const res = mockRes();
    await storeGet(req, res);
    expect(res.body.promos.length).toBeGreaterThan(0);
    expect(res.body.promos[0].imageUrl).toContain("http");
  });
});

describe("GET/POST/DELETE /admin/shc/discover-promos", () => {
  it("lists default promos when empty", async () => {
    const statService = createStatService();
    const req = mockReq(statService);
    const res = mockRes();
    await adminGet(req, res);
    expect(res.body.promos.length).toBeGreaterThan(0);
  });

  it("upserts a promo slide", async () => {
    const statService = createStatService();
    const req = mockReq(statService, {
      id: "promo-custom",
      title: "Weekend feast",
      subtitle: "Order by Friday",
      image_url: "https://example.com/banner.jpg",
      mobile_route: "/(customer)/cart",
      web_route: "/cart",
      sort_order: 5,
    });
    const res = mockRes();
    await adminPost(req, res);
    expect(res.body.promo.id).toBe("promo-custom");
    expect(res.body.action).toBe("create");
  });

  it("deletes a promo by id", async () => {
    const statService = createStatService();
    const createReq = mockReq(statService, {
      id: "promo-delete-me",
      title: "Temp",
      subtitle: "Gone soon",
      image_url: "https://example.com/x.jpg",
      mobile_route: "/",
      web_route: "/",
    });
    const createRes = mockRes();
    await adminPost(createReq, createRes);

    const delReq = mockReq(statService, undefined, { id: "promo-delete-me" });
    const delRes = mockRes();
    await adminDelete(delReq, delRes);
    expect(delRes.body.ok).toBe(true);
  });
});

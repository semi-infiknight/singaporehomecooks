import { describe, expect, it } from "vitest";
import { GET } from "./route";

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

describe("GET /store/shc/platform-stats", () => {
  it("returns live counters when active cooks exist", async () => {
    const req: any = {
      scope: {
        resolve(name: string) {
          if (name === "shcCook") {
            return {
              listAndCountCooks: async () => [
                [{ id: "c1", area: "Tampines" }, { id: "c2", area: "Katong" }],
                2,
              ],
            };
          }
          if (name === "shcOrderMeta") {
            return {
              listAndCountOrderMetas: async () => [
                [{ shc_status: "completed", collection_date: "2026-07-01" }],
                1,
              ],
            };
          }
          if (name === "shcPlatformStat") {
            return { listAndCountPlatformStats: async () => [[], 0] };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.body.source).toBe("live");
    expect(res.body.counters.cooks).toBe(2);
    expect(res.body.counters.areas).toBe(2);
    expect(res.body.counters.meals_this_month).toBeGreaterThanOrEqual(0);
  });

  it("falls back to seeded launch counters when no cooks", async () => {
    const req: any = {
      scope: {
        resolve(name: string) {
          if (name === "shcCook") {
            return { listAndCountCooks: async () => [[], 0] };
          }
          if (name === "shcOrderMeta") {
            return { listAndCountOrderMetas: async () => [[], 0] };
          }
          if (name === "shcPlatformStat") {
            return { listAndCountPlatformStats: async () => [[], 0] };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.body.source).toBe("seed");
    expect(res.body.counters.cooks).toBe(127);
    expect(res.body.counters.meals_this_month).toBe(4892);
    expect(res.body.counters.areas).toBe(28);
  });
});

import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

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

describe("GET /admin/shc/platform-stats", () => {
  it("lists platform stats", async () => {
    const req: any = {
      query: { key: "launch_orders" },
      scope: {
        resolve(name: string) {
          if (name === "shcPlatformStat") {
            return {
              listAndCountPlatformStats: async (filters: any) => [
                [{ id: "stat_1", key: filters.key, value: { count: 12 } }],
                1,
              ],
            };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.body.stats[0].value.count).toBe(12);
  });
});

describe("POST /admin/shc/platform-stats", () => {
  it("upserts a platform stat", async () => {
    let createPayload: any;
    const req: any = {
      body: { key: "launch_orders", value: { count: 13 } },
      scope: {
        resolve(name: string) {
          if (name === "shcPlatformStat") {
            return {
              listAndCountPlatformStats: async () => [[], 0],
              createPlatformStats: async (rows: any[]) => {
                createPayload = rows[0];
                return [{ id: "stat_1", ...rows[0] }];
              },
            };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await POST(req, res);

    expect(createPayload.value.count).toBe(13);
    expect(res.body.stat.key).toBe("launch_orders");
  });
});

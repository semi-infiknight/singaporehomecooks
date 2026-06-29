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

describe("GET /admin/shc/feature-flags", () => {
  it("lists feature flags with optional key filter", async () => {
    const req: any = {
      query: { key: "request_dish" },
      scope: {
        resolve(name: string) {
          if (name === "shcFeatureFlag") {
            return {
              listAndCountFeatureFlags: async (filters: any) => [
                [{ id: "ff_1", key: filters.key, enabled: true, cohort_filter: {} }],
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

    expect(res.body.count).toBe(1);
    expect(res.body.flags[0].key).toBe("request_dish");
  });

  it("returns default launch gates when the DB has no rows", async () => {
    const req: any = {
      query: {},
      scope: {
        resolve(name: string) {
          if (name === "shcFeatureFlag") {
            return { listAndCountFeatureFlags: async () => [[], 0] };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.body.flags.map((flag: any) => flag.key)).toEqual(
      expect.arrayContaining(["request_dish", "home_credits", "corporate_orders"])
    );
  });
});

describe("POST /admin/shc/feature-flags", () => {
  it("updates an existing feature flag", async () => {
    let updatePayload: any;
    const req: any = {
      body: { key: "request_dish", enabled: false, cohort_filter: { reason: "ops_pause" } },
      scope: {
        resolve(name: string) {
          if (name === "shcFeatureFlag") {
            return {
              listAndCountFeatureFlags: async () => [[{ id: "ff_1", key: "request_dish" }], 1],
              updateFeatureFlags: async (payload: any) => {
                updatePayload = payload;
                return [{ id: "ff_1", key: "request_dish", ...payload.data }];
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

    expect(updatePayload.selector.id).toBe("ff_1");
    expect(res.body.flag.enabled).toBe(false);
    expect(res.body.flag.cohort_filter.reason).toBe("ops_pause");
  });

  it("creates a new feature flag when missing", async () => {
    let createPayload: any;
    const req: any = {
      body: { key: "corporate_orders", enabled: true },
      scope: {
        resolve(name: string) {
          if (name === "shcFeatureFlag") {
            return {
              listAndCountFeatureFlags: async () => [[], 0],
              createFeatureFlags: async (payload: any[]) => {
                createPayload = payload[0];
                return [{ id: "ff_new", ...payload[0] }];
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

    expect(createPayload.key).toBe("corporate_orders");
    expect(res.body.flag.id).toBe("ff_new");
    expect(res.body.flag.enabled).toBe(true);
  });
});

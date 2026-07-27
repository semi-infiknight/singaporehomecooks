import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /store/shc/customer-config", () => {
  it("returns aggregated browse defaults", async () => {
    const statService = {
      listAndCountPlatformStats: async () => [[], 0],
    };
    const req = { scope: { resolve: (n: string) => (n === "shcPlatformStat" ? statService : null) } } as any;
    const res: any = { json: (b: unknown) => { res.body = b; return res; } };
    await GET(req, res);
    expect(res.body.categories.length).toBeGreaterThan(0);
    expect(res.body.promos.length).toBeGreaterThan(0);
    expect(res.body.config.copy.guest_headline).toBeTruthy();
  });
});

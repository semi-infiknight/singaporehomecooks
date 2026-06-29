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

describe("GET /store/shc/feature-flags", () => {
  it("defaults request_dish to enabled when no DB row exists", async () => {
    const req: any = {
      query: { key: "request_dish" },
      scope: {
        resolve(name: string) {
          if (name === "shcFeatureFlag") {
            return { isEnabled: async (_key: string, fallback: boolean) => fallback };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.body).toEqual({ key: "request_dish", enabled: true });
  });
});

import { describe, expect, it } from "vitest";
import { issueCookToken } from "../../../../../../lib/shc-auth";
import { GET, PATCH } from "./route";

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

const COOK_ROW = {
  id: "cook_rose_001",
  slug: "auntie-rose",
  display_name: "Auntie Rose",
  area: "Tampines",
  story: "Peranakan heritage",
  collection_address: "Blk 123",
  collection_instructions: "Lift lobby B",
  status: "active",
  availability_paused: false,
};

function makeReq(body?: Record<string, unknown>) {
  const token = issueCookToken("rose@shc.local", COOK_ROW.id, COOK_ROW.display_name);
  let updated: Record<string, unknown> | null = null;
  return {
    body,
    headers: { authorization: `Bearer ${token}` },
    scope: {
      resolve(name: string) {
        if (name === "shcCook") {
          return {
            listAndCountCooks: async () => [[{ ...COOK_ROW, ...(updated || {}) }], 1],
            updateCooks: async ({ data }: any) => {
              updated = { ...updated, ...data };
              return [{ id: COOK_ROW.id }];
            },
          };
        }
        throw new Error(`Unknown ${name}`);
      },
    },
    _getUpdated: () => updated,
  };
}

describe("GET /store/shc/auth/cook/profile", () => {
  it("returns cook profile", async () => {
    const res = makeRes();
    await GET(makeReq() as any, res);
    expect(res.body.cook.display_name).toBe("Auntie Rose");
    expect(res.body.cook.availability_paused).toBe(false);
  });
});

describe("PATCH /store/shc/auth/cook/profile", () => {
  it("updates availability_paused", async () => {
    const req = makeReq({ availability_paused: true });
    const res = makeRes();
    await PATCH(req as any, res);
    expect(res.body.cook.availability_paused).toBe(true);
    expect((req as any)._getUpdated().availability_paused).toBe(true);
  });

  it("updates collection fields", async () => {
    const req = makeReq({
      collection_instructions: "WhatsApp on arrival",
      story: "New story",
    });
    const res = makeRes();
    await PATCH(req as any, res);
    expect((req as any)._getUpdated().collection_instructions).toBe("WhatsApp on arrival");
    expect((req as any)._getUpdated().story).toBe("New story");
  });
});

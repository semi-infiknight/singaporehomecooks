import { describe, expect, it, vi, beforeEach } from "vitest";
import { issueCookToken } from "../../../../../../lib/shc-auth";
import { GET, PATCH } from "./route";

vi.mock("../../../../../../lib/shc-actors", () => ({
  getCookId: vi.fn(() => "cook_rose_001"),
}));

vi.mock("../../../../../../lib/shc-cook-shape", () => ({
  assertCookOwnsMediaKey: vi.fn(),
  shapeCookForStore: vi.fn(async (cook: any) => ({
    ...cook,
    avatar_url: cook.avatar_url ? `https://signed.test/${cook.avatar_url}` : undefined,
    hero_image_url: cook.hero_image_url ? `https://signed.test/${cook.hero_image_url}` : undefined,
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

const COOK_ROW = {
  id: "cook_rose_001",
  slug: "auntie-rose",
  display_name: "Auntie Rose",
  area: "Tampines",
  story: "Peranakan heritage",
  collection_address: "Blk 123",
  collection_instructions: "Lift lobby B",
  avatar_url: "cooks/cook_rose_001/avatar.jpg",
  hero_image_url: "cooks/cook_rose_001/hero.jpg",
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
  it("returns cook profile with media URLs", async () => {
    const res = makeRes();
    await GET(makeReq() as any, res);
    expect(res.body.cook.display_name).toBe("Auntie Rose");
    expect(res.body.cook.availability_paused).toBe(false);
    expect(res.body.cook.hero_image_url).toContain("hero.jpg");
  });
});

describe("PATCH /store/shc/auth/cook/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("saves collection time slots", async () => {
    const req = makeReq({ collection_time_slots: ["17:00-18:00", "bad", "18:00-19:00"] });
    const res = makeRes();
    await PATCH(req as any, res);
    expect((req as any)._getUpdated().collection_time_slots).toEqual(["17:00-18:00", "18:00-19:00"]);
    expect(res.body.cook.collection_time_slots).toEqual(["17:00-18:00", "18:00-19:00"]);
  });

  it("saves avatar and hero keys", async () => {
    const req = makeReq({
      avatar_url: "cooks/cook_rose_001/avatar-new.jpg",
      hero_image_url: "cooks/cook_rose_001/hero-new.jpg",
    });
    const res = makeRes();
    await PATCH(req as any, res);
    expect(res.statusCode).toBe(200);
    expect((req as any)._getUpdated().avatar_url).toBe("cooks/cook_rose_001/avatar-new.jpg");
    expect(res.body.cook.avatar_url).toContain("avatar-new.jpg");
  });
});

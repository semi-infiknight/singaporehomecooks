import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, PATCH } from "./route";

vi.mock("../../../../../../lib/shc-actors", () => ({
  getCookId: vi.fn(() => "cook_rose"),
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

describe("cook profile media", () => {
  const cook = {
    id: "cook_rose",
    slug: "rose",
    display_name: "Auntie Rose",
    area: "Tampines",
    story: "Peranakan kitchen",
    collection_address: "Blk 123",
    collection_instructions: "Lift B",
    avatar_url: "cooks/cook_rose/avatar.jpg",
    hero_image_url: "cooks/cook_rose/hero.jpg",
    status: "active",
    availability_paused: false,
  };

  const cookService = {
    listAndCountCooks: async () => [[cook], 1],
    updateCooks: vi.fn(async () => []),
  };

  const req: any = {
    body: {
      avatar_url: "cooks/cook_rose/avatar-new.jpg",
      hero_image_url: "cooks/cook_rose/hero-new.jpg",
    },
    scope: {
      resolve(name: string) {
        if (name === "shcCook") return cookService;
        throw new Error(name);
      },
    },
  };

  beforeEach(() => {
    cookService.updateCooks.mockClear();
  });

  it("PATCH saves avatar and hero keys", async () => {
    const res = makeRes();
    await PATCH(req, res);
    expect(res.statusCode).toBe(200);
    expect(cookService.updateCooks).toHaveBeenCalled();
    expect(res.body.cook.avatar_url).toContain("avatar.jpg");
  });

  it("GET returns shaped cook profile", async () => {
    const res = makeRes();
    await GET({ ...req, body: undefined }, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.cook.display_name).toBe("Auntie Rose");
    expect(res.body.cook.hero_image_url).toContain("hero.jpg");
  });
});

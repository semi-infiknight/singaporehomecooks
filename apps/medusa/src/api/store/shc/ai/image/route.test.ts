import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { signShcToken } from "../../../../../lib/shc-auth";

vi.mock("../../../../../lib/shc-cf-image", async () => {
  const sharp = (await import("sharp")).default;
  const tinyJpeg = await sharp({
    create: { width: 64, height: 64, channels: 3, background: { r: 220, g: 100, b: 40 } },
  })
    .jpeg()
    .toBuffer();
  return {
    isCloudflareImageConfigured: () => true,
    createListingFoodImage: async () => ({
      buffer: tinyJpeg,
      contentType: "image/jpeg",
      source: "cloudflare-flux",
      prompt: "test prompt",
    }),
    compressListingImage: async () => ({
      webp: tinyJpeg,
      width: 64,
      height: 64,
    }),
  };
});

vi.mock("../../../../../lib/minio-client", () => ({
  uploadBufferToMinIO: async (key: string) => ({
    key,
    bucket: "shc-images",
    url: `https://minio.test/${key}`,
  }),
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

describe("POST /store/shc/ai/image", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires cook auth", async () => {
    const req: any = {
      headers: {},
      body: { mode: "generate", dish_name: "Laksa" },
      scope: { resolve: () => console },
    };
    const res = makeRes();
    await POST(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("generates and uploads listing image", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      body: { mode: "generate", dish_name: "Nasi Lemak", cuisine: "Malay" },
      scope: { resolve: () => console },
    };
    const res = makeRes();
    await POST(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.image_url).toMatch(/minio\.test/);
    expect(res.body.source).toBe("cloudflare-flux");
    expect(res.body.disclaimer).toMatch(/illustrative/i);
  });

  it("GET reports configuration", async () => {
    const res = makeRes();
    await GET({} as any, res);
    expect(res.body.modes).toContain("generate");
    expect(res.body.model).toMatch(/flux/i);
  });
});

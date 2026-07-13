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
    getAiImagePublicStatus: () => ({
      configured: true,
      modes: ["upload", "generate", "polish"],
      model: "@cf/black-forest-labs/flux-1-schnell",
      max_px: 640,
      rate_limit_per_hour: 30,
      cuisine_presets: ["Peranakan", "Malay", "Chinese"],
      generate_available: true,
      generate_unavailable_reason: null,
      enhance_styles: {
        polish: "Brighten/contrast your upload",
        restyle: "Illustrative AI plate",
      },
      note: "test",
    }),
    createListingFoodImage: async (input: { mode: string; enhance_style?: string }) => ({
      buffer: tinyJpeg,
      contentType: "image/jpeg",
      source: input.mode === "enhance" ? "sharp-enhance" : "cloudflare-flux",
      prompt: input.mode === "generate" ? "test prompt" : undefined,
      enhance_style: input.mode === "enhance" ? input.enhance_style || "polish" : undefined,
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

  it("GET reports configuration + cuisine presets", async () => {
    const res = makeRes();
    await GET({} as any, res);
    expect(res.body.modes).toContain("generate");
    expect(res.body.model).toMatch(/flux/i);
    expect(res.body.generate_available).toBe(true);
    expect(res.body.cuisine_presets).toContain("Malay");
  });

  it("polish enhance uploads cook photo", async () => {
    const token = signShcToken({ actor_type: "cook", actor_id: "cook_1", shc: true });
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      body: {
        mode: "enhance",
        dish_name: "Laksa",
        enhance_style: "polish",
        image_base64: "aGVsbG8=", // mocked path ignores content
      },
      scope: { resolve: () => console },
    };
    const res = makeRes();
    await POST(req, res);
    expect(res.statusCode).toBe(201);
    expect(res.body.source).toBe("sharp-enhance");
    expect(res.body.disclaimer).toMatch(/optimized|composition/i);
  });
});

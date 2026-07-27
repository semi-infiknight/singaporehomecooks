import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./minio-client", () => ({
  SHC_BUCKET: "shc-images",
  getPresignedGetUrl: vi.fn(async (key: string) => `https://signed.test/${key}`),
}));

import { assertCookOwnsMediaKey, resolveCookMediaUrl } from "./shc-cook-shape";

describe("resolveCookMediaUrl", () => {
  beforeEach(() => {
    delete process.env.MINIO_PUBLIC_URL;
  });

  it("passes through absolute URLs", async () => {
    await expect(resolveCookMediaUrl("https://cdn.example.com/a.jpg")).resolves.toBe(
      "https://cdn.example.com/a.jpg"
    );
  });

  it("presigns object keys", async () => {
    await expect(resolveCookMediaUrl("cooks/cook_1/avatar.jpg")).resolves.toBe(
      "https://signed.test/cooks/cook_1/avatar.jpg"
    );
  });
});

describe("assertCookOwnsMediaKey", () => {
  it("allows cook-owned keys", () => {
    expect(() => assertCookOwnsMediaKey("cook_1", "cooks/cook_1/avatar.jpg")).not.toThrow();
  });

  it("rejects foreign keys", () => {
    expect(() => assertCookOwnsMediaKey("cook_1", "cooks/cook_2/avatar.jpg")).toThrow();
  });
});

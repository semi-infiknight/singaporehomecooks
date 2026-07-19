import { describe, expect, it, vi } from "vitest";

vi.mock("./minio-client", () => ({
  SHC_BUCKET: "shc-images",
  COMPLIANCE_BUCKET: "cook-certs",
  getPresignedGetUrlForBucket: vi.fn(async (bucket: string, key: string) => `https://minio.test/${bucket}/${key}?sig=1`),
}));

import { buildCompliancePreviewUrl, guessComplianceContentType, resolveComplianceBucket } from "./shc-compliance-preview";
import { getPresignedGetUrlForBucket } from "./minio-client";

describe("shc-compliance-preview", () => {
  it("resolves SHC bucket for compliance/ keys", () => {
    expect(resolveComplianceBucket("compliance/cook_1/sfa/file.jpg")).toBe("shc-images");
    expect(resolveComplianceBucket("legacy/sfa.pdf")).toBe("cook-certs");
  });

  it("builds signed preview URL", async () => {
    const result = await buildCompliancePreviewUrl("compliance/cook_1/sfa/cert.pdf");
    expect(result.preview_url).toContain("shc-images");
    expect(result.expires_in).toBe(900);
    expect(result.content_type).toBe("application/pdf");
    expect(getPresignedGetUrlForBucket).toHaveBeenCalledWith(
      "shc-images",
      "compliance/cook_1/sfa/cert.pdf",
      900
    );
  });

  it("guesses image content types", () => {
    expect(guessComplianceContentType("x.PNG")).toBe("image/png");
    expect(guessComplianceContentType("x.unknown")).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import crypto from "crypto";
import { verifyHitPayWebhookSignature } from "./shc-hitpay";

describe("shc-hitpay webhook signature", () => {
  it("accepts valid HMAC-SHA256 hex", () => {
    const salt = "test-salt-hitpay";
    const body = JSON.stringify({ id: "pr_1", status: "completed", reference_number: "SHC-1" });
    const sig = crypto.createHmac("sha256", salt).update(body, "utf8").digest("hex");
    expect(verifyHitPayWebhookSignature(body, sig, salt).ok).toBe(true);
  });

  it("rejects bad signature and missing salt", () => {
    const body = '{"a":1}';
    expect(verifyHitPayWebhookSignature(body, "deadbeef", "salt").ok).toBe(false);
    expect(verifyHitPayWebhookSignature(body, "abc", "").ok).toBe(false);
    expect(verifyHitPayWebhookSignature(body, "", "salt").ok).toBe(false);
  });
});

import { describe, expect, it, beforeAll } from "vitest";
import { signInvoiceDownload, verifyInvoiceDownload } from "./shc-invoice-sign";

describe("shc-invoice-sign", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-invoice-sign-secret-32chars!!";
  });

  it("round-trips a valid signature", () => {
    const { exp, sig } = signInvoiceDownload({ order_id: "SHC-1", audience: "cook" });
    const v = verifyInvoiceDownload({ order_id: "SHC-1", audience: "cook", exp, sig });
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.audience).toBe("cook");
  });

  it("rejects tampered order id", () => {
    const { exp, sig } = signInvoiceDownload({ order_id: "SHC-1", audience: "customer" });
    const v = verifyInvoiceDownload({ order_id: "SHC-2", audience: "customer", exp, sig });
    expect(v.ok).toBe(false);
  });

  it("rejects expired links", () => {
    const exp = Math.floor(Date.now() / 1000) - 60;
    const { sig } = signInvoiceDownload({ order_id: "SHC-1", audience: "cook", exp });
    const v = verifyInvoiceDownload({ order_id: "SHC-1", audience: "cook", exp, sig });
    expect(v.ok).toBe(false);
  });
});

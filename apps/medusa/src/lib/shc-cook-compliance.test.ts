import { describe, expect, it } from "vitest";
import { isCookComplianceVerified } from "@shc/utils";
import { canCookAcceptOrder } from "@shc/business-rules";

describe("cook accept compliance gate", () => {
  it("blocks accept when SFA or WSQ not verified", () => {
    const gate = canCookAcceptOrder({
      status: "active",
      availabilityPaused: false,
      hasVerifiedCompliance: false,
    });
    expect(gate.valid).toBe(false);
    expect(gate.code).toBe("SHC-COMPLIANCE-002");
  });

  it("allows accept when both docs verified", () => {
    const docs = [
      { type: "sfa", verified_at: new Date().toISOString() },
      { type: "wsq", verified_at: new Date().toISOString() },
    ];
    expect(isCookComplianceVerified(docs)).toBe(true);
    const gate = canCookAcceptOrder({
      status: "active",
      availabilityPaused: false,
      hasVerifiedCompliance: isCookComplianceVerified(docs),
    });
    expect(gate.valid).toBe(true);
  });
});

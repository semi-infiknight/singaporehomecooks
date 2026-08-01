import { describe, expect, it } from "vitest";
import { prepareCookRegisterWhatsappVerify } from "./shc-cook-whatsapp-verify-session";
import { readRegisterOtpForMobile } from "./shc-cook-whatsapp-otp";

describe("shc-cook-whatsapp-verify-session", () => {
  it("prepares wa.me link and demo OTP in test mode", async () => {
    const prepared = await prepareCookRegisterWhatsappVerify("91234567");
    expect(prepared.verify_token).toHaveLength(10);
    expect(prepared.whatsapp_url).toContain("SHC-VERIFY");
    expect(prepared.demo_code).toBe("123456");
    expect(prepared.otp_ready).toBe(true);
    const stored = await readRegisterOtpForMobile("+6591234567");
    expect(stored).toBe("123456");
  });
});

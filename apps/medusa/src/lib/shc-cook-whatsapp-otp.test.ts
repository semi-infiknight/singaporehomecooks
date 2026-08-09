import { describe, expect, it } from "vitest";
import {
  clearCookWhatsappOtp,
  issueCookWhatsappOtp,
  verifyCookWhatsappOtp,
} from "./shc-cook-whatsapp-otp";

describe("shc-cook-whatsapp-otp", () => {
  it("issues and verifies register OTP in demo mode", async () => {
    const mobile = "+6591112222";
    const issued = await issueCookWhatsappOtp("register", mobile);
    expect(issued.channel).toBe("demo");
    expect(issued.hint).toContain("123456");

    expect(await verifyCookWhatsappOtp("register", mobile, "123456")).toBe(true);
    expect(await verifyCookWhatsappOtp("register", mobile, "000000")).toBe(false);

    await clearCookWhatsappOtp("register", mobile);
    // Demo stub accepts fixed code even when no OTP was issued (e.g. rate-limited send).
    expect(await verifyCookWhatsappOtp("register", mobile, "123456")).toBe(true);
  });

  it("accepts demo OTP without prior issue when WhatsApp is stubbed", async () => {
    const mobile = "+6592223333";
    expect(await verifyCookWhatsappOtp("register", mobile, "123456")).toBe(true);
    expect(await verifyCookWhatsappOtp("register", mobile, "000000")).toBe(false);
  });
});

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  generateWhatsappOtpCode,
  isTwilioWhatsAppConfigured,
  shouldAllowDemoWhatsappOtp,
} from "./shc-twilio-whatsapp";

describe("shc-twilio-whatsapp", () => {
  const env = { ...process.env };

  beforeEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_WHATSAPP_FROM;
    delete process.env.SHC_ALLOW_DEMO_OTP;
    delete process.env.SHC_COOK_REGISTER_DEMO_OTP;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it("reports Twilio as unconfigured without env", () => {
    expect(isTwilioWhatsAppConfigured()).toBe(false);
    expect(shouldAllowDemoWhatsappOtp()).toBe(true);
    expect(generateWhatsappOtpCode()).toBe("123456");
  });

  it("uses forced demo OTP when SHC_COOK_REGISTER_DEMO_OTP is set", () => {
    process.env.SHC_COOK_REGISTER_DEMO_OTP = "999999";
    expect(generateWhatsappOtpCode()).toBe("999999");
  });
});

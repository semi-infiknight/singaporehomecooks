import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  generateWhatsappOtpCode,
  isMetaWhatsAppConfigured,
  sendWhatsappOtpMessage,
  shouldAllowDemoWhatsappOtp,
} from "./shc-meta-whatsapp";

describe("shc-meta-whatsapp", () => {
  const env = { ...process.env };

  beforeEach(() => {
    delete process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    delete process.env.WHATSAPP_OTP_TEMPLATE_NAME;
    delete process.env.SHC_ALLOW_DEMO_OTP;
    delete process.env.SHC_COOK_REGISTER_DEMO_OTP;
    process.env.NODE_ENV = "test";
  });

  afterEach(() => {
    process.env = { ...env };
  });

  it("reports Meta WhatsApp as unconfigured without env", () => {
    expect(isMetaWhatsAppConfigured()).toBe(false);
    expect(shouldAllowDemoWhatsappOtp()).toBe(true);
    expect(generateWhatsappOtpCode()).toBe("123456");
  });

  it("detects configured Meta WhatsApp credentials", () => {
    process.env.WHATSAPP_CLOUD_ACCESS_TOKEN = "EAAB";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
    expect(isMetaWhatsAppConfigured()).toBe(true);
  });

  it("uses forced demo OTP when SHC_COOK_REGISTER_DEMO_OTP is set", () => {
    process.env.SHC_COOK_REGISTER_DEMO_OTP = "999999";
    expect(generateWhatsappOtpCode()).toBe("999999");
  });

  it("sends OTP via Graph API when configured", async () => {
    process.env.WHATSAPP_CLOUD_ACCESS_TOKEN = "EAAB";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
    process.env.WHATSAPP_OTP_TEMPLATE_NAME = "shc_cook_verify";

    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ messages: [{ id: "wamid" }] }) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendWhatsappOtpMessage("+6591234567", "654321");
    expect(result).toEqual({ delivered: true, channel: "whatsapp" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(init?.body)).toContain("654321");
    expect(String(init?.body)).toContain("shc_cook_verify");

    vi.unstubAllGlobals();
  });
});

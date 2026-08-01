import { randomUUID } from "crypto";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { normalizePaynowMobile } from "@shc/utils";
import { issueCookToken } from "../../../../../../lib/shc-auth";
import { hashCookPassword } from "../../../../../../lib/shc-password";
import { validateAuthRegistration } from "../../../../../../lib/shc-auth-password";
import {
  verifyCookWhatsappOtp,
  clearCookWhatsappOtp,
} from "../../../../../../lib/shc-cook-whatsapp-otp";
import ShcCookModuleService from "../../../../../../modules/shc-cook/service";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  mobile: z.string().min(8).max(20),
  whatsapp_otp: z.string().min(4).max(8),
  display_name: z.string().min(2).max(80).optional(),
  area: z.string().min(2).max(80).optional(),
  story: z.string().max(500).optional(),
});

function slugFromDisplayName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "home-cook";
}

function cookIdFromEmail(email: string): string {
  const prefix = email
    .split("@")[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .slice(0, 24);
  return `cook_${prefix}_${Date.now().toString(36)}`;
}

/** POST /store/shc/auth/cook/register — new cook account (Railway Medusa) */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid registration payload") });
  }

  const email = parse.data.email.toLowerCase().trim();
  const mobile = normalizePaynowMobile(parse.data.mobile);
  if (!mobile) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid Singapore mobile number") });
  }

  const policy = validateAuthRegistration(email, parse.data.password);
  if (policy) {
    return res.status(400).json(policy);
  }

  const otpOk = await verifyCookWhatsappOtp("register", mobile, parse.data.whatsapp_otp);
  if (!otpOk) {
    return res.status(400).json({
      error: createSHCError("SHC-AUTH-001", "Invalid or expired WhatsApp verification code"),
    });
  }

  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const existingEmail = await cookService.findByLoginEmail(email);
  if (existingEmail) {
    return res.status(409).json({ error: createSHCError("SHC-GENERIC-001", "A cook account with this email already exists") });
  }
  const existingMobile = await cookService.findByContactMobile(mobile);
  if (existingMobile) {
    return res.status(409).json({ error: createSHCError("SHC-GENERIC-001", "A cook account with this mobile number already exists") });
  }

  const displayName = parse.data.display_name?.trim() || "New Home Cook";
  const area = parse.data.area?.trim() || "";
  const cookId = cookIdFromEmail(email);
  const slug = `${slugFromDisplayName(displayName)}-${Date.now().toString(36).slice(-4)}`;
  const now = new Date();

  try {
    await cookService.createCook({
      id: cookId,
      auth_identity_id: randomUUID(),
      slug,
      display_name: displayName,
      story: parse.data.story?.trim() || "",
      area,
      status: "active",
      availability_paused: false,
      login_email: email,
      password_hash: hashCookPassword(parse.data.password),
      contact_mobile: mobile,
      whatsapp_number: mobile,
      mobile_verified_at: now.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    } as any);
    await clearCookWhatsappOtp("register", mobile);
  } catch (e) {
    return res.status(500).json({
      error: createSHCError("SHC-GENERIC-001", (e as Error).message || "Cook registration failed"),
    });
  }

  const token = issueCookToken(email, cookId, displayName);
  return res.status(201).json({
    token,
    user: {
      role: "cook" as const,
      id: cookId,
      email,
      name: displayName,
    },
  });
}

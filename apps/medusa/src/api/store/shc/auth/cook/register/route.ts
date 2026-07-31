import { randomUUID } from "crypto";
import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { issueCookToken } from "../../../../../../lib/shc-auth";
import { hashCookPassword } from "../../../../../../lib/shc-password";
import { validateAuthRegistration } from "../../../../../../lib/shc-auth-password";
import ShcCookModuleService from "../../../../../../modules/shc-cook/service";

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  display_name: z.string().min(2).max(80),
  area: z.string().min(2).max(80),
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
  const policy = validateAuthRegistration(email, parse.data.password);
  if (policy) {
    return res.status(400).json(policy);
  }

  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const existing = await cookService.findByLoginEmail(email);
  if (existing) {
    return res.status(409).json({ error: createSHCError("SHC-GENERIC-001", "A cook account with this email already exists") });
  }

  const cookId = cookIdFromEmail(email);
  const slug = `${slugFromDisplayName(parse.data.display_name)}-${Date.now().toString(36).slice(-4)}`;
  const now = new Date();

  try {
    await cookService.createCook({
      id: cookId,
      auth_identity_id: randomUUID(),
      slug,
      display_name: parse.data.display_name.trim(),
      story: parse.data.story?.trim() || "",
      area: parse.data.area.trim(),
      status: "active",
      availability_paused: false,
      login_email: email,
      password_hash: hashCookPassword(parse.data.password),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    } as any);
  } catch (e) {
    return res.status(500).json({
      error: createSHCError("SHC-GENERIC-001", (e as Error).message || "Cook registration failed"),
    });
  }

  const token = issueCookToken(email, cookId, parse.data.display_name.trim());
  return res.status(201).json({
    token,
    user: {
      role: "cook" as const,
      id: cookId,
      email,
      name: parse.data.display_name.trim(),
    },
  });
}
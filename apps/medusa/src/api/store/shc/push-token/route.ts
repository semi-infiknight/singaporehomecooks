import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcCookModuleService from "../../../../modules/shc-cook/service";

/**
 * POST /store/shc/push-token
 * Simple route for mobile to register Expo push token for a cook (or user).
 * Production: rate limit + auth (cook session / JWT). Store token on shc_cook.
 * Used by subscriber for real push on order events (ready_for_collection, paid, etc).
 * Document: requires real Expo push notification service (expo-server-sdk) + credentials in prod.
 */
const BodySchema = z.object({
  cook_id: z.string(),
  expo_push_token: z.string().min(10), // ExponentPushToken[...]
}).strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid push token payload", parse.error.format() as any) });
  }
  const { cook_id, expo_push_token } = parse.data;

  const cookService: ShcCookModuleService = req.scope.resolve("shcCookService") as any;
  const logger = (req.scope as any).resolve?.("logger") || console;

  try {
    await cookService.registerPushToken(cook_id, expo_push_token);
    logger.info?.(`[SHC-STORE] push-token registered for cook ${cook_id} (masked: ${expo_push_token.slice(0,20)}...)`);
    // Audit
    logger.info?.(`[SHC-AUDIT] ${JSON.stringify({ ts: new Date().toISOString(), actor: 'store-public', action: 'push.register', meta: { cook_id } })}`);
    res.json({ success: true, cook_id, note: "Token stored. Real pushes via Expo service in prod (see 03-railway.md and subscriber)." });
  } catch (e: any) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Push token reg failed") });
  }
}

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcCookModuleService from "../../../../modules/shc-cook/service";
import { getAuthContext, unauthorized } from "../../../../lib/shc-actors";
import { registerCustomerPushToken } from "../../../../lib/shc-push-tokens";

/**
 * POST /store/shc/push-token
 * Register Expo push token for cook (cook_id) or customer (auth session).
 */
const BodySchema = z.object({
  cook_id: z.string().optional(),
  expo_push_token: z.string().min(10),
  role: z.enum(["cook", "customer"]).optional(),
}).strict();

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid push token payload", parse.error.format() as any) });
  }
  const { cook_id, expo_push_token, role } = parse.data;
  const logger = (req.scope as any).resolve?.("logger") || console;

  try {
    const auth = getAuthContext(req);
    const effectiveRole = role || auth?.actor_type;

    if (effectiveRole === "customer" && auth?.actor_type === "customer") {
      registerCustomerPushToken(auth.actor_id, expo_push_token);
      // Persist to Medusa customer metadata for restart survival (small gap fix)
      try {
        const customerModule: any = req.scope.resolve("customer");
        if (customerModule?.updateCustomers) {
          // simple metadata merge
          await customerModule.updateCustomers([{
            id: auth.actor_id,
            metadata: { expo_push_token }
          } as any]);
        }
      } catch { /* non-fatal for dev */ }
      logger.info?.(`[SHC-STORE] push-token registered for customer ${auth.actor_id}`);
      return res.json({ success: true, role: "customer", actor_id: auth.actor_id });
    }

    let cookId = cook_id;
    if (!cookId && auth?.actor_type === "cook") {
      cookId = auth.actor_id;
    }
    if (!cookId) {
      return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "cook_id required for cook push registration") });
    }

    if (auth?.actor_type === "cook" && auth.actor_id !== cookId) {
      return unauthorized(res, "Cook token mismatch");
    }

    const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
    await cookService.registerPushToken(cookId, expo_push_token);
    logger.info?.(`[SHC-STORE] push-token registered for cook ${cookId}`);
    res.json({ success: true, cook_id: cookId, role: "cook" });
  } catch (e: any) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Push token reg failed") });
  }
}
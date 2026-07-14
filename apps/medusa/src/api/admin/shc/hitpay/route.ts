import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { createSHCError } from "@shc/types"
import {
  hitpayConfigured,
  hitpayBaseUrl,
  hitpayEnvLabel,
  hitpaySalt,
  listHitPayPaymentRequests,
} from "../../../../lib/shc-hitpay"

/**
 * GET /admin/shc/hitpay
 * Ops mirror of HitPay payment-requests (uses Railway HITPAY_API_KEY — no dual-write).
 */
const QuerySchema = z
  .object({
    page: z.coerce.number().int().positive().max(50).default(1),
    per_page: z.coerce.number().int().positive().max(100).default(25),
  })
  .strict()

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query)
  if (!parse.success) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", "Bad HitPay query", parse.error.format() as any),
    })
  }

  const configured = hitpayConfigured()
  const env = hitpayEnvLabel()
  const config = {
    configured,
    env,
    api_base: hitpayBaseUrl(),
    webhook_salt_set: Boolean(hitpaySalt()),
    webhook_path: "/hooks/shc/hitpay",
    dashboard_url:
      env === "live"
        ? "https://dashboard.hit-pay.com"
        : "https://dashboard.sandbox.hit-pay.com",
  }

  if (!configured) {
    return res.json({
      config,
      payment_requests: [],
      total: 0,
      page: parse.data.page,
      per_page: parse.data.per_page,
      by_status: {},
      note: "HITPAY_API_KEY not set on Medusa — QR create returns 503.",
    })
  }

  try {
    const listed = await listHitPayPaymentRequests({
      page: parse.data.page,
      perPage: parse.data.per_page,
    })
    const by_status: Record<string, number> = {}
    for (const row of listed.data) {
      const s = String(row.status || "unknown")
      by_status[s] = (by_status[s] || 0) + 1
    }
    res.json({
      config,
      payment_requests: listed.data,
      total: listed.total,
      page: listed.current_page,
      per_page: listed.per_page,
      last_page: listed.last_page,
      by_status,
      note: "Live from HitPay payment-requests API (Railway key).",
    })
  } catch (e: any) {
    res.status(502).json({
      config,
      error: createSHCError("SHC-PAY-001", e?.message || "HitPay list failed"),
    })
  }
}

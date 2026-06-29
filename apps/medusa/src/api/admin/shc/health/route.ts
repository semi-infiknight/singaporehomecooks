import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/** GET /admin/shc/health */
export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.json({
    status: "ok",
    service: "admin-shc",
    time: new Date().toISOString(),
    observability: {
      structured_logging: true,
      log_level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
      pagerduty_configured: Boolean(process.env.PAGERDUTY_ROUTING_KEY),
      web_push_configured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
      tracing: "request-id + trace-id headers",
    },
  });
}

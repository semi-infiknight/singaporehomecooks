import pino from "pino";
import { randomUUID } from "crypto";

export type ShcLogPayload = Record<string, unknown> & {
  event: string;
  request_id?: string;
  trace_id?: string;
};

const logger = pino({
  name: "singapore-home-cooks-medusa",
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: {
    service: "medusa",
    env: process.env.NODE_ENV || "development",
  },
});

export function getTraceId(requestId?: string) {
  return requestId || randomUUID();
}

export function logInfo(payload: ShcLogPayload) {
  logger.info(payload);
}

export function logError(payload: ShcLogPayload & { error?: unknown }) {
  const error = payload.error instanceof Error ? { message: payload.error.message, stack: payload.error.stack } : payload.error;
  logger.error({ ...payload, error });
}

export async function triggerOpsAlert(input: {
  severity: "info" | "warning" | "error" | "critical";
  summary: string;
  source: string;
  dedupeKey?: string;
  details?: Record<string, unknown>;
}) {
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY;
  if (!routingKey) {
    logInfo({ event: "ops.alert.skipped", reason: "missing_pagerduty_routing_key", ...input });
    return { delivered: false };
  }

  const res = await fetch("https://events.pagerduty.com/v2/enqueue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      routing_key: routingKey,
      event_action: "trigger",
      dedup_key: input.dedupeKey,
      payload: {
        summary: input.summary,
        source: input.source,
        severity: input.severity,
        custom_details: input.details || {},
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logError({ event: "ops.alert.failed", status: res.status, body, ...input });
    return { delivered: false };
  }

  logInfo({ event: "ops.alert.delivered", ...input });
  return { delivered: true };
}

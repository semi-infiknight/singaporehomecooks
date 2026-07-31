type LogPayload = Record<string, unknown> & { event: string };

export function logWorker(payload: LogPayload) {
  console.log(
    JSON.stringify({
      service: "shc-worker",
      env: process.env.NODE_ENV || "production",
      ts: new Date().toISOString(),
      ...payload,
    })
  );
}

export function logWorkerError(payload: LogPayload & { error?: unknown }) {
  const error =
    payload.error instanceof Error
      ? { message: payload.error.message, stack: payload.error.stack }
      : payload.error;
  console.error(
    JSON.stringify({
      service: "shc-worker",
      env: process.env.NODE_ENV || "production",
      ts: new Date().toISOString(),
      level: "error",
      ...payload,
      error,
    })
  );
}

export async function triggerWorkerAlert(input: {
  severity: "warning" | "error" | "critical";
  summary: string;
  job: string;
  dedupeKey?: string;
  details?: Record<string, unknown>;
}) {
  const routingKey = process.env.PAGERDUTY_ROUTING_KEY;
  if (!routingKey) {
    logWorker({ event: "ops.alert.skipped", reason: "missing_pagerduty_routing_key", ...input });
    return { delivered: false };
  }

  const res = await fetch("https://events.pagerduty.com/v2/enqueue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      routing_key: routingKey,
      event_action: "trigger",
      dedup_key: input.dedupeKey || `worker-${input.job}`,
      payload: {
        summary: input.summary,
        source: "shc-worker",
        severity: input.severity,
        custom_details: input.details || {},
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logWorkerError({ event: "ops.alert.failed", status: res.status, body, ...input });
    return { delivered: false };
  }

  logWorker({ event: "ops.alert.delivered", ...input });
  return { delivered: true };
}

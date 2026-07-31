import { defineMiddlewares } from "@medusajs/framework/http";
import { randomUUID } from "crypto";
import { getTraceId, logInfo, triggerOpsAlert } from "../lib/shc-observability";
import { resolveStoreShcRateLimit, sendRateLimitResponse, setRateLimitHeaders } from "../lib/shc-rate-limit";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/shc/*",
      middlewares: [
        async (req, res, next) => {
          try {
            const rate = await resolveStoreShcRateLimit(req);
            setRateLimitHeaders(res, rate);
            if (!rate.allowed) {
              return sendRateLimitResponse(req, res, rate);
            }
          } catch (err) {
            logInfo({
              event: "rate_limit.error",
              message: err instanceof Error ? err.message : String(err),
            });
          }

          const requestId = String(req.headers["x-request-id"] || randomUUID());
          const traceId = String(req.headers["traceparent"] || getTraceId(requestId));
          const start = Date.now();
          (req as any).request_id = requestId;
          (req as any).trace_id = traceId;
          res.setHeader("x-request-id", requestId);
          res.setHeader("x-trace-id", traceId);

          res.on("finish", () => {
            const durationMs = Date.now() - start;
            logInfo({
              event: "http.request",
              request_id: requestId,
              trace_id: traceId,
              method: req.method,
              path: req.originalUrl || req.url,
              status: res.statusCode,
              duration_ms: durationMs,
              actor_type: (req as any).auth?.actor_type,
            });
            if (res.statusCode >= 500) {
              void triggerOpsAlert({
                severity: "error",
                summary: `SHC API ${res.statusCode} on ${req.method} ${req.originalUrl || req.url}`,
                source: "medusa-store-api",
                dedupeKey: `store-${req.method}-${req.path || req.url}-${res.statusCode}`,
                details: { request_id: requestId, trace_id: traceId, duration_ms: durationMs },
              });
            }
          });
          next();
        },
      ],
    },
    {
      matcher: "/admin/shc/*",
      middlewares: [
        (req, res, next) => {
          const requestId = String(req.headers["x-request-id"] || randomUUID());
          const traceId = String(req.headers["traceparent"] || getTraceId(requestId));
          const start = Date.now();
          (req as any).request_id = requestId;
          (req as any).trace_id = traceId;
          res.setHeader("x-request-id", requestId);
          res.setHeader("x-trace-id", traceId);
          res.on("finish", () => {
            const durationMs = Date.now() - start;
            logInfo({
              event: "http.admin_request",
              request_id: requestId,
              trace_id: traceId,
              method: req.method,
              path: req.originalUrl || req.url,
              status: res.statusCode,
              duration_ms: durationMs,
            });
            if (res.statusCode >= 500) {
              void triggerOpsAlert({
                severity: "critical",
                summary: `SHC Admin ${res.statusCode} on ${req.method} ${req.originalUrl || req.url}`,
                source: "medusa-admin-api",
                dedupeKey: `admin-${req.method}-${req.path || req.url}-${res.statusCode}`,
                details: { request_id: requestId, trace_id: traceId, duration_ms: durationMs },
              });
            }
          });
          next();
        },
      ],
    },
  ],
});

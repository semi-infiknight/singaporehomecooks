export type ShcCrashReport = {
  surface: "web" | "mobile-customer" | "mobile-cook";
  message: string;
  stack?: string;
  componentStack?: string;
  errorCode?: string;
  route?: string;
  requestId?: string;
};

function crashEndpoint(): string | null {
  if (typeof process !== "undefined") {
    const web = process.env.NEXT_PUBLIC_SHC_CRASH_ENDPOINT;
    const expo = process.env.EXPO_PUBLIC_SHC_CRASH_ENDPOINT;
    if (web) return web;
    if (expo) return expo;
  }
  return null;
}

/** Fire-and-forget client crash report to Medusa ops endpoint (optional). */
export function reportShcCrash(report: ShcCrashReport) {
  const endpoint = crashEndpoint();
  const body = {
    surface: report.surface,
    message: report.message.slice(0, 2000),
    stack: report.stack?.slice(0, 8000),
    component_stack: report.componentStack?.slice(0, 8000),
    error_code: report.errorCode,
    route: report.route,
    build_id: typeof process !== "undefined" ? process.env.EXPO_PUBLIC_BUILD_ID || process.env.NEXT_PUBLIC_BUILD_ID : undefined,
  };

  const line = JSON.stringify({
    event: "client.crash.local",
    ...body,
    request_id: report.requestId,
  });
  if (typeof console !== "undefined") {
    console.error(line);
  }

  if (!endpoint) return;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (report.requestId) headers["x-request-id"] = report.requestId;

  void fetch(endpoint, { method: "POST", headers, body: JSON.stringify(body) }).catch(() => {
    /* non-blocking */
  });
}

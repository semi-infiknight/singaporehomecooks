import { createServer } from "node:http";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cron from "node-cron";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const MEDUSA_SCRIPT = path.join(ROOT, "apps/medusa/scripts/weekly-payout.ts");

const PORT = Number(process.env.PORT || 3000);
const DATABASE_URL = process.env.DATABASE_URL;
const MEDUSA_URL = process.env.MEDUSA_URL || process.env.MEDUSA_PUBLIC_URL;
const WORKER_API_KEY = process.env.WORKER_API_KEY;

type JobResult = { ok: boolean; detail: string };
type StoredJobResult = JobResult & { finished_at: string };

function log(job: string, msg: string) {
  console.log(`[shc-worker] ${new Date().toISOString()} ${job}: ${msg}`);
}

function runMedusaScript(scriptRel: string, args: string[] = []): Promise<JobResult> {
  return new Promise((resolve) => {
    const script = path.join(ROOT, scriptRel);
    const child = spawn(
      "pnpm",
      ["exec", "tsx", script, ...args],
      {
        cwd: path.join(ROOT, "apps/medusa"),
        env: { ...process.env, DATABASE_URL: DATABASE_URL || process.env.DATABASE_URL },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    let out = "";
    child.stdout?.on("data", (d) => { out += d.toString(); });
    child.stderr?.on("data", (d) => { out += d.toString(); });
    child.on("close", (code) => {
      resolve({ ok: code === 0, detail: out.trim().slice(-2000) || `exit ${code}` });
    });
    child.on("error", (err) => resolve({ ok: false, detail: err.message }));
  });
}

async function callMedusaInternal(pathname: string): Promise<JobResult> {
  if (!MEDUSA_URL || !WORKER_API_KEY) {
    return { ok: false, detail: "MEDUSA_URL or WORKER_API_KEY not set" };
  }
  try {
    const res = await fetch(`${MEDUSA_URL.replace(/\/$/, "")}${pathname}`, {
      method: "POST",
      headers: { "x-worker-api-key": WORKER_API_KEY, "content-type": "application/json" },
    });
    const text = await res.text();
    return { ok: res.ok, detail: text.slice(0, 2000) };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

async function weeklyPayout(): Promise<JobResult> {
  log("weekly-payout", "starting");
  const result = await runMedusaScript("scripts/weekly-payout.ts");
  log("weekly-payout", result.ok ? "done" : `failed: ${result.detail}`);
  return result;
}

function internalRoutePending(result: JobResult): boolean {
  return (
    !result.ok &&
    (result.detail.includes("not set") ||
      result.detail.includes("Unauthorized") ||
      result.detail.includes("Cannot POST"))
  );
}

async function orderEscalation(): Promise<JobResult> {
  const result = await callMedusaInternal("/admin/shc/internal/order-escalation");
  if (internalRoutePending(result)) {
    log("order-escalation", "skipped (internal route not wired yet)");
    return { ok: true, detail: "skipped" };
  }
  log("order-escalation", result.ok ? "done" : result.detail);
  return result;
}

async function notificationRetry(): Promise<JobResult> {
  const result = await callMedusaInternal("/admin/shc/internal/notification-retry");
  if (internalRoutePending(result)) {
    log("notification-retry", "skipped (internal route not wired yet)");
    return { ok: true, detail: "skipped" };
  }
  log("notification-retry", result.ok ? "done" : result.detail);
  return result;
}

const jobs: Record<string, () => Promise<JobResult>> = {
  "weekly-payout": weeklyPayout,
  "order-escalation": orderEscalation,
  "notification-retry": notificationRetry,
};

let running = false;
const lastResults: Record<string, StoredJobResult> = {};

async function runJob(name: string): Promise<JobResult> {
  const fn = jobs[name];
  if (!fn) {
    return { ok: false, detail: `unknown job: ${name}` };
  }
  if (running) {
    log(name, "skipped — previous job still running");
    return { ok: false, detail: "previous job still running" };
  }
  running = true;
  try {
    const result = await fn();
    lastResults[name] = { ...result, finished_at: new Date().toISOString() };
    return result;
  } finally {
    running = false;
  }
}

// Schedules from blueprint/CRON_JOBS.md (UTC)
cron.schedule("0 9 * * 1", () => runJob("weekly-payout")); // Monday 09:00 UTC
cron.schedule("*/15 * * * *", () => runJob("order-escalation"));
cron.schedule("*/5 * * * *", () => runJob("notification-retry"));

const server = createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "shc-worker", jobs: Object.keys(jobs), running, lastResults }));
    return;
  }

  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (req.method === "POST" && url.pathname.startsWith("/run/")) {
    if (!WORKER_API_KEY) {
      res.writeHead(503, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "WORKER_API_KEY not configured" }));
      return;
    }
    if (req.headers["x-worker-api-key"] !== WORKER_API_KEY) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
      return;
    }
    const jobName = decodeURIComponent(url.pathname.replace(/^\/run\//, ""));
    runJob(jobName).then((result) => {
      res.writeHead(result.ok ? 200 : 400, { "content-type": "application/json" });
      res.end(JSON.stringify({ job: jobName, ...result }));
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  log("boot", `listening on :${PORT}, DATABASE_URL=${DATABASE_URL ? "set" : "missing"}, MEDUSA_URL=${MEDUSA_URL || "unset"}`);
});
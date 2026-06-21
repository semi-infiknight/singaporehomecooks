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

async function runJob(name: string) {
  if (running) {
    log(name, "skipped — previous job still running");
    return;
  }
  running = true;
  try {
    const fn = jobs[name];
    if (fn) await fn();
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
    res.end(JSON.stringify({ status: "ok", service: "shc-worker", jobs: Object.keys(jobs) }));
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  log("boot", `listening on :${PORT}, DATABASE_URL=${DATABASE_URL ? "set" : "missing"}, MEDUSA_URL=${MEDUSA_URL || "unset"}`);
});
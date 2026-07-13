#!/usr/bin/env npx tsx
/**
 * Smoke cook listing AI photo path against Railway Medusa.
 *
 * Always:
 *   GET  /store/shc/ai/image        → status + cuisine presets
 *   POST enhance polish             → sharp optimize (no CF needed)
 *
 * When CF configured (or REQUIRE_AI_GENERATE=1):
 *   POST mode=generate              → FLUX → MinIO WebP
 *
 *   pnpm smoke:ai-image
 *   REQUIRE_AI_GENERATE=1 pnpm smoke:ai-image
 *   MEDUSA_URL=https://... pnpm smoke:ai-image
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import {
  RAILWAY_MEDUSA_PUBLISHABLE_KEY,
  resolveRailwayMedusaBase,
  resolveRailwayPublishableKey,
} from "../packages/shc-utils/src/railway-client";

/** Load sharp from medusa (root may not hoist it). */
async function makeSmokeJpegBase64(): Promise<string> {
  const req = createRequire(path.join(process.cwd(), "apps/medusa/package.json"));
  const sharp = req("sharp") as typeof import("sharp");
  const buf = await sharp({
    create: { width: 320, height: 240, channels: 3, background: { r: 210, g: 120, b: 50 } },
  })
    .jpeg({ quality: 80 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

const BASE = resolveRailwayMedusaBase(process.env.MEDUSA_URL || process.env.EXPO_PUBLIC_MEDUSA_BASE);
const COOK_EMAIL = process.env.SEED_COOK_EMAIL || "rose@shc.local";
const COOK_PASS = process.env.SEED_COOK_PASS || "cooksecret";
const REQUIRE_GENERATE = process.env.REQUIRE_AI_GENERATE === "1";

function loadPubKey(): string {
  if (process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY) {
    return resolveRailwayPublishableKey(
      process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""
    );
  }
  for (const rel of ["apps/web/.env.local", "apps/mobile-cook/.env.local", "apps/mobile-customer/.env.local"]) {
    const envLocal = path.join(process.cwd(), rel);
    if (fs.existsSync(envLocal)) {
      const m = fs
        .readFileSync(envLocal, "utf8")
        .match(/(?:EXPO_PUBLIC_|NEXT_PUBLIC_)?MEDUSA_PUBLISHABLE_KEY=(.+)/);
      if (m) return resolveRailwayPublishableKey(m[1].trim());
    }
  }
  return RAILWAY_MEDUSA_PUBLISHABLE_KEY;
}

async function json(pathname: string, init?: RequestInit & { token?: string }) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-publishable-api-key": loadPubKey(),
    ...(init?.headers as Record<string, string>),
  };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;
  const res = await fetch(`${BASE}${pathname}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function ok(label: string, status: number, allowed: number[] = [200, 201]) {
  if (!allowed.includes(status)) {
    throw new Error(`${label} failed HTTP ${status}`);
  }
  console.log(`✅ ${label} (${status})`);
}

async function main() {
  console.log(`=== smoke-ai-image → ${BASE} ===`);

  const status = await json("/store/shc/ai/image");
  if (status.status === 404) throw new Error("GET /store/shc/ai/image 404 — redeploy medusa with AI image route");
  ok("GET /store/shc/ai/image", status.status, [200]);
  const st = status.body as {
    configured?: boolean;
    generate_available?: boolean;
    generate_unavailable_reason?: string | null;
    cuisine_presets?: string[];
    model?: string;
    modes?: string[];
  };
  console.log(
    `   configured=${Boolean(st.configured)} generate_available=${Boolean(st.generate_available)} model=${st.model || "?"}`
  );
  if (!st.cuisine_presets?.length) throw new Error("status missing cuisine_presets");
  if (!st.cuisine_presets.includes("Malay") && !st.cuisine_presets.includes("Peranakan")) {
    throw new Error(`unexpected cuisine_presets: ${JSON.stringify(st.cuisine_presets)}`);
  }
  console.log(`✅ cuisine_presets (${st.cuisine_presets.length}): ${st.cuisine_presets.slice(0, 4).join(", ")}…`);

  const cookLogin = await json("/store/shc/auth/cook/login", {
    method: "POST",
    body: JSON.stringify({ email: COOK_EMAIL, password: COOK_PASS }),
  });
  ok("cook login", cookLogin.status, [200]);
  const cookToken = (cookLogin.body as { token?: string }).token;
  if (!cookToken) throw new Error("no cook token");

  const image_base64 = await makeSmokeJpegBase64();

  const polish = await json("/store/shc/ai/image", {
    method: "POST",
    token: cookToken,
    body: JSON.stringify({
      mode: "enhance",
      dish_name: "Smoke Rendang",
      cuisine: "Malay",
      enhance_style: "polish",
      image_base64,
    }),
  });
  ok("POST enhance polish", polish.status, [201]);
  const polishBody = polish.body as {
    image_url?: string;
    webp_url?: string;
    source?: string;
    enhance_style?: string;
    bytes?: number;
  };
  if (!polishBody.webp_url && !polishBody.image_url) throw new Error("polish missing image url");
  if (polishBody.source !== "sharp-enhance") {
    throw new Error(`expected sharp-enhance, got ${polishBody.source}`);
  }
  console.log(`   polish source=${polishBody.source} bytes=${polishBody.bytes ?? "?"} url=${(polishBody.webp_url || polishBody.image_url || "").slice(0, 60)}…`);

  const genAvailable = st.generate_available === true || st.configured === true;
  if (!genAvailable) {
    const msg = st.generate_unavailable_reason || "CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN not set";
    if (REQUIRE_GENERATE) {
      throw new Error(`REQUIRE_AI_GENERATE=1 but generate unavailable: ${msg}`);
    }
    console.log(`⏭  SKIP generate — ${msg}`);
    console.log("=== smoke-ai-image PASSED (polish only; set CF secrets for generate) ===");
    return;
  }

  const gen = await json("/store/shc/ai/image", {
    method: "POST",
    token: cookToken,
    body: JSON.stringify({
      mode: "generate",
      dish_name: "Nasi Lemak Smoke",
      cuisine: "Malay",
      heritage_note: "Railway smoke test plate",
    }),
  });
  if (gen.status === 503) {
    const err = JSON.stringify(gen.body).slice(0, 200);
    if (REQUIRE_GENERATE) throw new Error(`generate 503: ${err}`);
    console.log(`⏭  SKIP generate (503): ${err}`);
    console.log("=== smoke-ai-image PASSED (polish only) ===");
    return;
  }
  ok("POST generate FLUX", gen.status, [201]);
  const genBody = gen.body as {
    image_url?: string;
    webp_url?: string;
    source?: string;
    model?: string;
    disclaimer?: string;
    bytes?: number;
  };
  if (!genBody.webp_url && !genBody.image_url) throw new Error("generate missing image url");
  if (!String(genBody.source || "").includes("flux")) {
    throw new Error(`expected flux source, got ${genBody.source}`);
  }
  if (!genBody.disclaimer || !/illustrative/i.test(genBody.disclaimer)) {
    throw new Error("generate missing illustrative disclaimer");
  }
  console.log(
    `   generate source=${genBody.source} model=${genBody.model || "?"} bytes=${genBody.bytes ?? "?"} url=${(genBody.webp_url || genBody.image_url || "").slice(0, 60)}…`
  );

  console.log("=== smoke-ai-image PASSED ===");
}

main().catch((e) => {
  console.error("❌", e?.message || e);
  process.exit(1);
});

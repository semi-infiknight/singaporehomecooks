import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { resolveMedusaScriptPath, ROOT } from "./medusa-script-path.js";

describe("worker medusa script paths", () => {
  it("resolves tiffin-weekly-orders under apps/medusa/scripts", () => {
    const resolved = resolveMedusaScriptPath("scripts/tiffin-weekly-orders.ts");
    expect(resolved).toBe(path.join(ROOT, "apps/medusa/scripts/tiffin-weekly-orders.ts"));
    expect(existsSync(resolved)).toBe(true);
  });

  it("resolves weekly-payout under apps/medusa/scripts", () => {
    const resolved = resolveMedusaScriptPath("scripts/weekly-payout.ts");
    expect(resolved).toBe(path.join(ROOT, "apps/medusa/scripts/weekly-payout.ts"));
    expect(existsSync(resolved)).toBe(true);
  });

  it("does not resolve to monorepo ROOT/scripts", () => {
    const resolved = resolveMedusaScriptPath("scripts/tiffin-weekly-orders.ts");
    expect(resolved).not.toBe(path.join(ROOT, "scripts/tiffin-weekly-orders.ts"));
    expect(existsSync(path.join(ROOT, "scripts/tiffin-weekly-orders.ts"))).toBe(false);
  });
});
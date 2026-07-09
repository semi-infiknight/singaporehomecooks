import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const MEDUSA_DIR = path.join(ROOT, "apps/medusa");

/** Resolve script path under apps/medusa (never ROOT/scripts/...). */
export function resolveMedusaScriptPath(scriptRel: string): string {
  if (path.isAbsolute(scriptRel)) return scriptRel;
  const normalized = scriptRel.replace(/^\.\//, "");
  if (normalized.startsWith("apps/medusa/")) {
    return path.join(ROOT, normalized);
  }
  return path.join(MEDUSA_DIR, normalized);
}

export { ROOT, MEDUSA_DIR };
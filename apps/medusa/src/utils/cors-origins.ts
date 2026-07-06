/** Medusa rejects comma lists that mix "*" with explicit origins — that breaks browser CORS. */
export function parseCorsOrigins(...parts: (string | undefined)[]): string {
  const origins = new Set<string>();
  let wildcard = false;
  for (const part of parts) {
    if (!part) continue;
    for (const raw of part.split(",")) {
      const origin = raw.trim();
      if (!origin) continue;
      if (origin === "*") {
        wildcard = true;
        continue;
      }
      origins.add(origin);
    }
  }
  if (wildcard && origins.size === 0) return "*";
  if (origins.size === 0) return "*";
  return [...origins].join(",");
}
import { describe, expect, it } from "vitest";
import { checkRateLimit, getRateLimitKey } from "./shc-rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the cap (memory fallback)", async () => {
    const key = `test:${Date.now()}:${Math.random()}`;
    const first = await checkRateLimit(key, { max: 3, windowMs: 60_000 });
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    const second = await checkRateLimit(key, { max: 3, windowMs: 60_000 });
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it("blocks when max exceeded", async () => {
    const key = `block:${Date.now()}:${Math.random()}`;
    await checkRateLimit(key, { max: 1, windowMs: 60_000 });
    const blocked = await checkRateLimit(key, { max: 1, windowMs: 60_000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});

describe("getRateLimitKey", () => {
  it("scopes by IP and label", () => {
    const key = getRateLimitKey(
      {
        headers: { "x-forwarded-for": "203.0.113.10, 10.0.0.1" },
      } as any,
      "auth.login"
    );
    expect(key).toBe("auth.login:203.0.113.10");
  });
});

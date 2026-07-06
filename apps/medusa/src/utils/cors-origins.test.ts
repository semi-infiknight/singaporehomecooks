import { describe, expect, it } from "vitest";
import { parseCorsOrigins } from "./cors-origins";

describe("parseCorsOrigins", () => {
  it("drops wildcard when explicit origins are present", () => {
    expect(
      parseCorsOrigins("*", "https://web-production-9226.up.railway.app"),
    ).toBe("https://web-production-9226.up.railway.app");
  });

  it("keeps wildcard when it is the only origin", () => {
    expect(parseCorsOrigins("*")).toBe("*");
  });

  it("dedupes and joins explicit origins", () => {
    expect(
      parseCorsOrigins(
        "https://web.example.com,http://localhost:3001",
        "https://web.example.com",
        "http://localhost:8081",
      ),
    ).toBe("https://web.example.com,http://localhost:3001,http://localhost:8081");
  });
});
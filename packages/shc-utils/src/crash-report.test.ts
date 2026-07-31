import { describe, expect, it, vi, afterEach } from "vitest";
import { reportShcCrash } from "./crash-report";

describe("reportShcCrash", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("logs structured JSON locally without endpoint", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    reportShcCrash({
      surface: "web",
      message: "Test boom",
      errorCode: "SHC-GENERIC-001",
    });
    expect(spy).toHaveBeenCalled();
    const line = String(spy.mock.calls[0]?.[0]);
    expect(line).toContain("client.crash.local");
    expect(line).toContain("Test boom");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./shc-observability", () => ({
  logInfo: vi.fn(),
  triggerOpsAlert: vi.fn(async () => ({ delivered: true })),
}));

import { notifyOpsComplianceDocSubmitted } from "./shc-compliance-ops-notify";
import { triggerOpsAlert as triggerOpsAlertMock } from "./shc-observability";

describe("notifyOpsComplianceDocSubmitted", () => {
  beforeEach(() => {
    vi.mocked(triggerOpsAlertMock).mockClear();
    delete process.env.SHC_OPS_ACTOR_ID;
  });

  it("fires PagerDuty alert and in-app notification for ops actor", async () => {
    const pushed: Array<{ actor_id: string; type: string; body: string }> = [];
    const scope = {
      resolve(name: string) {
        if (name === "shcCook") {
          return {
            listAndCountCooks: async () => [[{ id: "cook_rose", display_name: "Rose Tan" }]],
          };
        }
        if (name === "shcNotification") {
          return {
            push: async (actorId: string, n: { type: string; body: string }) => {
              pushed.push({ actor_id: actorId, ...n });
            },
          };
        }
        throw new Error(`Unknown ${name}`);
      },
    };

    const result = await notifyOpsComplianceDocSubmitted(scope, {
      cook_id: "cook_rose",
      doc_id: "comp_1",
      type: "sfa",
      file_key: "compliance/cook_rose/sfa.pdf",
    });

    expect(result.pagerduty).toBe(true);
    expect(result.in_app).toBe(true);
    expect(triggerOpsAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        severity: "info",
        source: "medusa-compliance-upload",
        dedupeKey: "compliance-cook_rose-sfa-comp_1",
        summary: expect.stringContaining("Rose Tan"),
      })
    );
    expect(pushed).toHaveLength(1);
    expect(pushed[0].actor_id).toBe("shc_ops");
    expect(pushed[0].type).toBe("compliance_review");
  });

  it("still delivers PagerDuty when in-app notification module is unavailable", async () => {
    const scope = {
      resolve(name: string) {
        if (name === "shcCook") {
          return { listAndCountCooks: async () => [[]] };
        }
        if (name === "shcNotification") throw new Error("module missing");
        throw new Error(`Unknown ${name}`);
      },
    };

    const result = await notifyOpsComplianceDocSubmitted(scope, {
      cook_id: "cook_1",
      doc_id: "comp_2",
      type: "wsq",
      file_key: "compliance/cook_1/wsq.pdf",
    });

    expect(result.pagerduty).toBe(true);
    expect(result.in_app).toBe(false);
    expect(triggerOpsAlertMock).toHaveBeenCalledOnce();
  });
});

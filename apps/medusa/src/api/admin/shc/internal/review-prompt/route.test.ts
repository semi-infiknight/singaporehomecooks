import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { REVIEW_PROMPT_DELAY_MS, reviewPromptNotificationType } from "@shc/utils";

vi.mock("../../../../../lib/shc-worker-auth", () => ({
  requireWorker: () => true,
}));

vi.mock("../../../../../lib/shc-order-push", () => ({
  resolveOrderNotifyContext: async () => ({
    orderId: "ord_1",
    orderRef: "ORD1",
    cookName: "Auntie Mei",
    dishSummary: "Nasi Lemak",
  }),
}));

vi.mock("../../../../../lib/shc-expo-push", () => ({
  sendExpoPush: vi.fn(async () => undefined),
}));

vi.mock("../../../../../lib/shc-web-push", () => ({
  sendWebPush: vi.fn(async () => undefined),
}));

vi.mock("../../../../../lib/shc-push-tokens", () => ({
  getCustomerPushToken: () => undefined,
  getCustomerPushTokenAsync: async () => undefined,
  getCustomerWebPushSubscriptionAsync: async () => undefined,
}));

vi.mock("../../../../../lib/shc-business-rules-config", () => ({
  loadBusinessRulesConfigFromScope: async () => ({
    review: { eligible_statuses: ["collected", "completed"] },
  }),
}));

describe("POST /admin/shc/internal/review-prompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("prompts customers for collected orders due after 1h without an existing review", async () => {
    const dueAt = new Date(Date.now() - REVIEW_PROMPT_DELAY_MS - 60_000).toISOString();
    const notifPush = vi.fn(async () => ({}));
    const listNotifs = vi.fn(async () => []);
    const getReview = vi.fn(async () => null);
    const listMetas = vi.fn(async (filter: { shc_status?: string }) => {
      if (filter?.shc_status === "collected") {
        return [
          [
            {
              order_id: "ord_1",
              customer_id: "cus_1",
              shc_status: "collected",
              updated_at: dueAt,
            },
          ],
        ];
      }
      return [[]];
    });

    const req: any = {
      scope: {
        resolve: (name: string) => {
          if (name === "shcOrderMeta") {
            return { listAndCountOrderMetas: listMetas };
          }
          if (name === "shcNotification") {
            return { push: notifPush, listForActor: listNotifs };
          }
          if (name === "shcReview") {
            return { getReviewForOrder: getReview };
          }
          if (name === "logger") return console;
          return {};
        },
      },
    };
    const res: any = {
      json: vi.fn(),
      status: vi.fn().mockReturnThis(),
    };

    await POST(req, res);

    expect(notifPush).toHaveBeenCalledWith(
      "cus_1",
      expect.objectContaining({
        type: reviewPromptNotificationType("ord_1"),
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ ok: true, prompted: expect.any(Number) })
    );
    const payload = res.json.mock.calls[0][0];
    expect(payload.prompted).toBeGreaterThanOrEqual(1);
  });

  it("skips when already prompted", async () => {
    const dueAt = new Date(Date.now() - REVIEW_PROMPT_DELAY_MS - 60_000).toISOString();
    const notifPush = vi.fn(async () => ({}));
    const listNotifs = vi.fn(async () => [
      { type: reviewPromptNotificationType("ord_1") },
    ]);

    const req: any = {
      scope: {
        resolve: (name: string) => {
          if (name === "shcOrderMeta") {
            return {
              listAndCountOrderMetas: async (filter: { shc_status?: string }) => {
                if (filter?.shc_status === "collected") {
                  return [
                    [
                      {
                        order_id: "ord_1",
                        customer_id: "cus_1",
                        shc_status: "collected",
                        updated_at: dueAt,
                      },
                    ],
                  ];
                }
                return [[]];
              },
            };
          }
          if (name === "shcNotification") {
            return { push: notifPush, listForActor: listNotifs };
          }
          if (name === "shcReview") {
            return { getReviewForOrder: async () => null };
          }
          if (name === "logger") return console;
          return {};
        },
      },
    };
    const res: any = { json: vi.fn(), status: vi.fn().mockReturnThis() };

    await POST(req, res);
    expect(notifPush).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0][0].prompted).toBe(0);
  });
});

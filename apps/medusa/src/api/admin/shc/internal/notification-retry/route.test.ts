import { afterEach, describe, expect, it } from "vitest";
import { POST } from "./route";

function makeRes() {
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return res;
}

describe("POST /admin/shc/internal/notification-retry", () => {
  afterEach(() => {
    delete process.env.WORKER_API_KEY;
  });

  it("reports pending in-app notifications", async () => {
    process.env.WORKER_API_KEY = "worker-secret";
    const req: any = {
      headers: { "x-worker-api-key": "worker-secret" },
      scope: {
        resolve(name: string) {
          if (name === "shcNotification") {
            return {
              listAndCountNotifications: async () => [[{ id: "n_1", read: false }], 1],
            };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await POST(req, res);

    expect(res.body.ok).toBe(true);
    expect(res.body.pending_in_app).toBe(1);
    expect(res.body.retried).toBe(0);
  });
});

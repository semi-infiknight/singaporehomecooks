import { describe, expect, it } from "vitest";
import { GET, POST } from "./route";

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

function makeStatService(value?: unknown) {
  return {
    listAndCountPlatformStats: async () => [[value ? { id: "ps_1", value } : null].filter(Boolean), value ? 1 : 0],
    updatePlatformStats: async ({ data }: any) => [{ id: "ps_1", value: data.value }],
    createPlatformStats: async (rows: any[]) => rows,
  };
}

describe("GET /admin/shc/cook-config", () => {
  it("returns normalized config", async () => {
    const req: any = {
      scope: {
        resolve(name: string) {
          if (name === "shcPlatformStat") {
            return makeStatService({ greeting: { morning: 'Hi' } });
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();
    await GET(req, res);
    expect(res.body.config.greeting.morning).toBe('Hi');
    expect(res.body.defaults.dashboard_tiles.length).toBe(6);
  });
});

describe("POST /admin/shc/cook-config", () => {
  it("patches cook config", async () => {
    let saved: any;
    const req: any = {
      body: { chat_quick_replies: { cook: ['On my way'] } },
      scope: {
        resolve(name: string) {
          if (name === "shcPlatformStat") {
            return {
              ...makeStatService(),
              createPlatformStats: async (rows: any[]) => {
                saved = rows[0].value;
                return rows;
              },
            };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();
    await POST(req, res);
    expect(res.body.config.chat_quick_replies.cook).toEqual(['On my way']);
    expect(saved.chat_quick_replies.cook).toEqual(['On my way']);
  });
});

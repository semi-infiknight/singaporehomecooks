import { describe, expect, it, beforeEach } from "vitest";
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

describe("POST /store/shc/auth/cook/register", () => {
  let created: any;
  let existingEmail: string | null;

  beforeEach(() => {
    created = null;
    existingEmail = null;
  });

  function makeReq(body: Record<string, unknown>) {
    return {
      body,
      headers: { "x-forwarded-for": "127.0.0.1" },
      scope: {
        resolve(name: string) {
          if (name === "shcCook") {
            return {
              findByLoginEmail: async (email: string) =>
                existingEmail && email === existingEmail ? { id: "cook_existing" } : null,
              createCook: async (data: any) => {
                created = data;
                return data;
              },
            };
          }
          throw new Error(`Unknown ${name}`);
        },
      },
    };
  }

  it("returns 400 for invalid payload", async () => {
    const res = makeRes();
    await POST(makeReq({ email: "bad", password: "x" }) as any, res);
    expect(res.statusCode).toBe(400);
  });

  it("returns 409 when email already registered", async () => {
    existingEmail = "taken@shc.local";
    const res = makeRes();
    await POST(
      makeReq({
        email: "taken@shc.local",
        password: "secret12",
        display_name: "Auntie Taken",
        area: "Tampines",
      }) as any,
      res
    );
    expect(res.statusCode).toBe(409);
  });

  it("creates cook with hashed password and returns JWT", async () => {
    const res = makeRes();
    await POST(
      makeReq({
        email: "newcook@shc.local",
        password: "secret12",
        display_name: "Auntie New",
        area: "Bedok",
        story: "HDB kitchen heritage",
      }) as any,
      res
    );
    expect(res.statusCode).toBe(201);
    expect(res.body?.token).toBeTruthy();
    expect(res.body?.user?.role).toBe("cook");
    expect(res.body?.user?.email).toBe("newcook@shc.local");
    expect(created.login_email).toBe("newcook@shc.local");
    expect(created.password_hash).toMatch(/^scrypt\$/);
    expect(created.status).toBe("active");
    expect(created.display_name).toBe("Auntie New");
    expect(created.area).toBe("Bedok");
  });
});
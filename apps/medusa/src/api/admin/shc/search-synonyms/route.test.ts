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

describe("GET /admin/shc/search-synonyms", () => {
  it("lists synonyms by term", async () => {
    const req: any = {
      query: { term: "ayam" },
      scope: {
        resolve(name: string) {
          if (name === "shcSearchSynonym") {
            return {
              listAndCountSearchSynonyms: async (filters: any) => [
                [{ id: "syn_1", term: filters.term, expansions: ["chicken"] }],
                1,
              ],
            };
          }
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await GET(req, res);

    expect(res.body.synonyms[0].expansions).toEqual(["chicken"]);
  });
});

describe("POST /admin/shc/search-synonyms", () => {
  it("creates a synonym when missing", async () => {
    const req: any = {
      body: { term: "sotong", expansions: ["squid"] },
      scope: {
        resolve(name: string) {
          if (name === "shcSearchSynonym") {
            return {
              listAndCountSearchSynonyms: async () => [[], 0],
              createSearchSynonyms: async (rows: any[]) => [{ id: "syn_2", ...rows[0] }],
            };
          }
          if (name === "logger") return console;
          throw new Error(`Unknown dependency ${name}`);
        },
      },
    };
    const res = makeRes();

    await POST(req, res);

    expect(res.body.synonym.term).toBe("sotong");
    expect(res.body.synonym.expansions).toEqual(["squid"]);
  });

  it("updates an existing synonym", async () => {
    let updatePayload: any;
    const req: any = {
      body: { term: "ayam", expansions: ["chicken", "poultry"] },
      scope: {
        resolve(name: string) {
          if (name === "shcSearchSynonym") {
            return {
              listAndCountSearchSynonyms: async () => [[{ id: "syn_1", term: "ayam" }], 1],
              updateSearchSynonyms: async (payload: any) => {
                updatePayload = payload;
                return [{ id: "syn_1", term: "ayam", ...payload.data }];
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

    expect(updatePayload.selector.id).toBe("syn_1");
    expect(res.body.synonym.expansions).toEqual(["chicken", "poultry"]);
  });
});

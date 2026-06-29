import { describe, expect, it } from "vitest";
import ShcLedgerModuleService from "./service";

function makeLedgerService(overrides: Record<string, unknown> = {}) {
  return Object.assign(Object.create(ShcLedgerModuleService.prototype), overrides) as any;
}

describe("ShcLedgerModuleService.postCommission", () => {
  it("uses the active commission rule when available", async () => {
    let createdRows: any[] = [];
    const service = makeLedgerService({
      listLedgerEntries: async () => [],
      createLedgerEntries: async (rows: any[]) => {
        createdRows = rows;
        return rows;
      },
    });
    const container = {
      resolve(name: string) {
        if (name === "logger") return console;
        if (name === "shcCommissionRule") {
          return {
            listAndCountCommissionRules: async () => [
              [
                { version: 2, rate_pct: 20, effective_from: "2026-01-01T00:00:00.000Z" },
                { version: 3, rate_pct: 10, effective_from: "2999-01-01T00:00:00.000Z" },
              ],
              2,
            ],
          };
        }
        throw new Error(`Unknown dependency ${name}`);
      },
    };

    await service.postCommission({ orderId: "SHC-1", totalCents: 10000, container });

    expect(createdRows).toHaveLength(2);
    expect(createdRows.find((row) => row.debit_account === "Platform-Commission-Revenue")?.amount_cents).toBe(2000);
    expect(createdRows.find((row) => row.debit_account === "Cook-Earnings-Payable")?.amount_cents).toBe(8000);
  });

  it("skips posting when commission entries already exist for the order", async () => {
    let createCalled = false;
    const existing = [{ id: "ledger_1", order_id: "SHC-1", amount_cents: 1500 }];
    const service = makeLedgerService({
      listLedgerEntries: async (filters: any) => {
        expect(filters).toEqual({ order_id: "SHC-1" });
        return existing;
      },
      createLedgerEntries: async () => {
        createCalled = true;
        return [];
      },
    });

    const result = await service.postCommission({ orderId: "SHC-1", totalCents: 10000 });

    expect(result).toBe(existing);
    expect(createCalled).toBe(false);
  });
});

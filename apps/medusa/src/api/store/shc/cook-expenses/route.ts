import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCookId } from "../../../../lib/shc-actors";
import ShcCookExpenseModuleService from "../../../../modules/shc-cook-expense/service";

const BodySchema = z
  .object({
    amount_cents: z.number().int().positive(),
    category: z.string().min(1),
    receipt_key: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

/** GET/POST /store/shc/cook-expenses — cook-owned IRAS expense tracker. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }

  const expenseService: ShcCookExpenseModuleService = req.scope.resolve("shcCookExpense") as any;
  const [expenses] = await expenseService
    .listAndCountCookExpenses({ cook_id: cookId } as any, { take: 100, order: { date: "DESC" } })
    .catch(() => [[]]);
  const total_cents = (expenses || []).reduce((sum: number, expense: any) => sum + (expense.amount_cents || 0), 0);
  res.json({ expenses: expenses || [], count: expenses?.length || 0, total_cents });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = BodySchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid cook expense", parse.error.format() as any) });
  }

  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }

  const expenseService: ShcCookExpenseModuleService = req.scope.resolve("shcCookExpense") as any;
  const [expense] = await expenseService.createCookExpenses([{ ...parse.data, cook_id: cookId } as any]);
  const logger = (req.scope as any).resolve?.("logger") || console;
  logger.info?.({ event: "cook.expense.submitted", cook_id: cookId, expense_id: expense?.id, amount_cents: parse.data.amount_cents });
  res.status(201).json({ expense });
}

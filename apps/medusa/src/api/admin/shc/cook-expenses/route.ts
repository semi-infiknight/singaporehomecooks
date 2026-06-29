import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcCookExpenseModuleService from "../../../../modules/shc-cook-expense/service";

const QuerySchema = z
  .object({
    cook_id: z.string().optional(),
    category: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).default(50),
  })
  .strict();

const CreateSchema = z
  .object({
    cook_id: z.string().min(1),
    amount_cents: z.number().int().positive(),
    category: z.string().min(1),
    receipt_key: z.string().optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

/** GET/POST /admin/shc/cook-expenses — ops visibility for cook reimbursement records. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Bad cook expense query", parse.error.format() as any) });
  }

  const expenseService: ShcCookExpenseModuleService = req.scope.resolve("shcCookExpense") as any;
  const filters: Record<string, unknown> = {};
  if (parse.data.cook_id) filters.cook_id = parse.data.cook_id;
  if (parse.data.category) filters.category = parse.data.category;
  const [expenses, count] = await expenseService.listAndCountCookExpenses(filters, { take: parse.data.limit });
  res.json({ expenses, count, filters });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = CreateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid cook expense payload", parse.error.format() as any) });
  }

  const expenseService: ShcCookExpenseModuleService = req.scope.resolve("shcCookExpense") as any;
  try {
    const [expense] = await expenseService.createCookExpenses([parse.data as any]);
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "admin.cook_expenses.create", cook_id: parse.data.cook_id, expense_id: expense?.id });
    res.status(201).json({ expense });
  } catch (e: any) {
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Cook expense create failed") });
  }
}

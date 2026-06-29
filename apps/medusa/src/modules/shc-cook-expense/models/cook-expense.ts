import { model } from "@medusajs/framework/utils";

export const CookExpense = model.define("shc_cook_expense", {
  id: model.id().primaryKey(),
  cook_id: model.text(),
  amount_cents: model.number(),
  category: model.text(),
  receipt_key: model.text().nullable(),
  date: model.text(),
});

export type CookExpense = any;

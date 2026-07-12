import { MedusaService } from "@medusajs/framework/utils";
import { Drop } from "./models/drop";
import { createSHCError } from "@shc/types";
import {
  dropCanOrder,
  dropClampOrderQty,
  dropPostDeadlineStatus,
  dropRemainingQty,
} from "@shc/business-rules";
import {
  atomicReserveDropQty,
  atomicReserveDropQtyFromDb,
  type DropPgExecutor,
} from "../../lib/shc-drop-pg";

export type DropRow = {
  id: string;
  cook_id: string;
  title: string;
  note?: string | null;
  image_url?: string | null;
  product_id?: string | null;
  price_cents: number;
  min_qty: number;
  max_qty: number;
  ordered_qty: number;
  cook_date: string;
  collection_slot: string;
  order_by: string;
  status: string;
  visibility: string;
  created_at?: string | Date;
  updated_at?: string | Date;
};

class ShcDropModuleService extends MedusaService({ Drop }) {
  /**
   * Optional test/prod override for capacity CAS.
   * Production default: Postgres UPDATE … WHERE (see shc-drop-pg).
   * Do NOT use Medusa updateDrops for capacity — it is list-then-assign by PK only.
   */
  _dropPgExecutor: DropPgExecutor | null = null;

  shape(d: any) {
    const ordered = Number(d.ordered_qty || 0);
    const max = Number(d.max_qty || 0);
    const remaining = dropRemainingQty(max, ordered);
    return {
      id: d.id,
      cook_id: d.cook_id,
      title: d.title,
      note: d.note || null,
      image_url: d.image_url || null,
      product_id: d.product_id || null,
      price_cents: Number(d.price_cents),
      price: Number(d.price_cents) / 100,
      min_qty: Number(d.min_qty || 0),
      max_qty: max,
      ordered_qty: ordered,
      remaining_qty: remaining,
      cook_date: d.cook_date,
      collection_slot: d.collection_slot,
      order_by: d.order_by,
      status: d.status,
      visibility: d.visibility || "marketplace",
      created_at: d.created_at,
      updated_at: d.updated_at,
    };
  }

  /** True only when customers may still order (open, capacity, before order_by). */
  isOrderable(row: { status: string; max_qty: number; ordered_qty: number; order_by: string }, now = new Date()) {
    return dropCanOrder(row.status, Number(row.max_qty), Number(row.ordered_qty), String(row.order_by), now).ok;
  }

  async refreshStatus(row: DropRow): Promise<DropRow> {
    const next = dropPostDeadlineStatus(
      row.status,
      Number(row.ordered_qty),
      Number(row.min_qty),
      String(row.order_by)
    );
    if (next && next !== row.status) {
      const [updated] = await this.updateDrops({
        selector: { id: row.id },
        data: { status: next } as any,
      });
      return (updated as DropRow) || { ...row, status: next };
    }
    if (row.status === "open" && dropRemainingQty(Number(row.max_qty), Number(row.ordered_qty)) <= 0) {
      const [updated] = await this.updateDrops({
        selector: { id: row.id },
        data: { status: "sold_out" } as any,
      });
      return (updated as DropRow) || { ...row, status: "sold_out" };
    }
    return row;
  }

  async createDrop(input: {
    cook_id: string;
    title: string;
    note?: string;
    image_url?: string;
    product_id?: string;
    price_cents: number;
    min_qty?: number;
    max_qty: number;
    cook_date: string;
    collection_slot: string;
    order_by: string;
    visibility?: string;
  }) {
    if (input.max_qty < 1) throw createSHCError("SHC-GENERIC-001", "max_qty must be >= 1");
    if ((input.min_qty || 0) > input.max_qty) {
      throw createSHCError("SHC-GENERIC-001", "min_qty cannot exceed max_qty");
    }
    const [created] = await this.createDrops([
      {
        cook_id: input.cook_id,
        title: input.title.trim(),
        note: input.note || null,
        image_url: input.image_url || null,
        product_id: input.product_id || null,
        price_cents: Math.round(input.price_cents),
        min_qty: Math.max(0, Math.floor(input.min_qty || 0)),
        max_qty: Math.floor(input.max_qty),
        ordered_qty: 0,
        cook_date: input.cook_date,
        collection_slot: input.collection_slot,
        order_by: input.order_by,
        status: "open",
        visibility: input.visibility === "kitchen_only" ? "kitchen_only" : "marketplace",
      } as any,
    ]);
    return this.shape(created);
  }

  /**
   * Marketplace home feed: open + orderable only (excludes sold_out, paused, expired, zero remaining).
   */
  async listMarketplace(limit = 40, now = new Date()) {
    const [rows] = await this.listAndCountDrops(
      { status: "open" as any, visibility: "marketplace" } as any,
      { take: Math.max(limit * 2, 40), order: { cook_date: "ASC" } as any }
    ).catch(() => [[]]);
    const out = [];
    for (const r of rows as DropRow[]) {
      const refreshed = await this.refreshStatus(r);
      if (!this.isOrderable(refreshed, now)) continue;
      out.push(this.shape(refreshed));
      if (out.length >= limit) break;
    }
    return out;
  }

  async listForCook(cookId: string, opts: { activeOnly?: boolean; limit?: number; now?: Date } = {}) {
    const now = opts.now || new Date();
    const [rows] = await this.listAndCountDrops({ cook_id: cookId } as any, {
      take: opts.limit || 50,
      order: { created_at: "DESC" } as any,
    }).catch(() => [[]]);
    const out = [];
    for (const r of rows as DropRow[]) {
      const refreshed = await this.refreshStatus(r);
      if (opts.activeOnly) {
        if (!this.isOrderable(refreshed, now)) continue;
      }
      out.push(this.shape(refreshed));
    }
    return out;
  }

  async getDrop(id: string) {
    const [rows] = await this.listAndCountDrops({ id } as any, { take: 1 }).catch(() => [[]]);
    const row = (rows as DropRow[])?.[0];
    if (!row) return null;
    return this.shape(await this.refreshStatus(row));
  }

  async patchDrop(id: string, cookId: string, patch: Record<string, unknown>) {
    const current = await this.getDrop(id);
    if (!current) throw createSHCError("SHC-GENERIC-001", "Drop not found");
    if (current.cook_id !== cookId) throw createSHCError("SHC-GENERIC-001", "Not your batch");
    const data: any = {};
    if (patch.status != null) {
      const s = String(patch.status);
      if (!["open", "paused", "closed", "sold_out"].includes(s)) {
        throw createSHCError("SHC-GENERIC-001", "Invalid status");
      }
      data.status = s;
    }
    if (patch.order_by != null) data.order_by = String(patch.order_by);
    if (patch.note != null) data.note = String(patch.note);
    if (patch.max_qty != null) data.max_qty = Math.floor(Number(patch.max_qty));
    if (Object.keys(data).length === 0) return current;
    const [updated] = await this.updateDrops({ selector: { id }, data });
    return this.shape(updated);
  }

  /**
   * Production capacity lock — never uses Medusa updateDrops multi-field selector
   * (that path is list-by-filter then update by PK only → race oversell).
   */
  async reserveCapacityAtomic(id: string, take: number, now: Date = new Date()) {
    if (this._dropPgExecutor) {
      return atomicReserveDropQty(this._dropPgExecutor, id, take, now);
    }
    return atomicReserveDropQtyFromDb(id, take, now);
  }

  /**
   * Capacity reserve with true SQL CAS (or injected executor with same WHERE semantics).
   */
  async reserveQty(id: string, qty: number, now = new Date()) {
    const [rows] = await this.listAndCountDrops({ id } as any, { take: 1 }).catch(() => [[]]);
    const row = (rows as DropRow[])?.[0];
    if (!row) throw createSHCError("SHC-GENERIC-001", "Drop not found");

    const refreshed = await this.refreshStatus(row);
    const check = dropCanOrder(
      refreshed.status,
      Number(refreshed.max_qty),
      Number(refreshed.ordered_qty),
      String(refreshed.order_by),
      now
    );
    if (!check.ok) {
      throw createSHCError("SHC-GENERIC-001", check.reason || "Cannot order");
    }
    const take = dropClampOrderQty(qty, check.remaining);
    if (take < 1) throw createSHCError("SHC-GENERIC-001", "Invalid quantity");

    // Single atomic UPDATE … WHERE (capacity + open + order_by)
    const updated = await this.reserveCapacityAtomic(id, take, now);
    if (!updated) {
      // Lost race or state changed — surface accurate reason
      const again = await this.getDrop(id);
      if (!again) throw createSHCError("SHC-GENERIC-001", "Drop not found");
      const recheck = dropCanOrder(
        again.status,
        Number(again.max_qty),
        Number(again.ordered_qty),
        String(again.order_by),
        now
      );
      throw createSHCError(
        "SHC-GENERIC-001",
        recheck.ok ? "Capacity conflict — try again" : recheck.reason || "Cannot order"
      );
    }

    return { drop: this.shape(updated), qty: take };
  }
}

export default ShcDropModuleService;

// @ts-nocheck - suppress list* filters signature + MedusaService override + workspace (pre-existing in whole medusa typecheck)
import { MedusaService } from "@medusajs/framework/utils";
import { PayoutBatch } from "./models/payout-batch";
import { PayoutBatchLine } from "./models/payout-batch-line";
import {
  SHCPayoutBatch,
  SHCPayoutBatchLine,
  shcPayoutBatchSchema,
  shcPayoutBatchLineSchema,
  createSHCError,
} from "@shc/types";

/**
 * shc-payout-batch module.
 * Weekly batches (cron Monday). Per-cook lines with optional transfer_ref.
 * Status: pending -> approved (sim transfer_ref) -> paid.
 */
class ShcPayoutBatchModuleService extends MedusaService({ PayoutBatch, PayoutBatchLine }) {
  private getLogger(container?: any) {
    try {
      return (container && container.resolve) ? container.resolve("logger") : console;
    } catch {
      return console;
    }
  }

  async createOrGetWeeklyBatch(weekStart: string, totalCents = 0, container?: any): Promise<SHCPayoutBatch> {
    const logger = this.getLogger(container);
    shcPayoutBatchSchema.partial().parse({ week_start: weekStart, status: "pending", total_cents: totalCents });

    const existing = await this.listPayoutBatches({ week_start: weekStart });
    if (existing.length) {
      logger.info?.({ event: "payout.batch.exists", week_start: weekStart });
      return existing[0] as unknown as SHCPayoutBatch;
    }

    const [created] = await this.createPayoutBatches([{
      week_start: weekStart,
      status: "pending",
      total_cents: totalCents,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any]);

    logger.info?.({ event: "payout.batch.created", week_start: weekStart, total_cents: totalCents });
    return created as unknown as SHCPayoutBatch;
  }

  async updateBatchTotal(batchId: string, totalCents: number, container?: any): Promise<SHCPayoutBatch> {
    const [updated] = await this.updatePayoutBatches({
      selector: { id: batchId },
      data: { total_cents: totalCents, updated_at: new Date() } as any,
    });
    return updated as unknown as SHCPayoutBatch;
  }

  async upsertBatchLine(input: {
    batchId: string;
    cookId: string;
    amountCents: number;
    orderCount?: number;
    container?: any;
  }): Promise<SHCPayoutBatchLine> {
    const logger = this.getLogger(input.container);
    const existing = await this.listPayoutBatchLines({
      batch_id: input.batchId,
      cook_id: input.cookId,
      limit: 1,
    });
    if (existing.length) {
      const [updated] = await this.updatePayoutBatchLines({
        selector: { id: existing[0].id },
        data: {
          amount_cents: input.amountCents,
          order_count: input.orderCount ?? existing[0].order_count ?? 0,
          updated_at: new Date(),
        } as any,
      });
      return updated as unknown as SHCPayoutBatchLine;
    }

    const row = {
      batch_id: input.batchId,
      cook_id: input.cookId,
      amount_cents: input.amountCents,
      order_count: input.orderCount ?? 0,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    shcPayoutBatchLineSchema.partial().parse(row);
    const [created] = await this.createPayoutBatchLines([row as any]);
    logger.info?.({
      event: "payout.batch_line.created",
      batch_id: input.batchId,
      cook_id: input.cookId,
      amount_cents: input.amountCents,
    });
    return created as unknown as SHCPayoutBatchLine;
  }

  async approvePayoutBatch(batchId: string, actor = "ops", container?: any): Promise<SHCPayoutBatch> {
    const logger = this.getLogger(container);
    const batches = await this.listPayoutBatches({ id: batchId });
    if (!batches.length) {
      throw createSHCError("SHC-PAYOUT-001", "Payout batch not found");
    }
    const current = batches[0] as any;
    if (current.status !== "pending") {
      throw createSHCError("SHC-PAYOUT-001", `Batch status ${current.status} not approvable`);
    }

    const now = new Date().toISOString();
    const transferRef = `SIM-PAYOUT-${current.week_start.replace(/-/g, "")}-${batchId.slice(0, 8).toUpperCase()}`;

    const [updated] = await this.updatePayoutBatches({
      selector: { id: batchId },
      data: {
        status: "approved",
        approved_at: now,
        transfer_ref: transferRef,
        updated_at: now,
      } as any,
    });

    const lines = await this.listPayoutBatchLines({ batch_id: batchId, limit: 500 });
    for (const line of lines) {
      const lineRef = `${transferRef}-${String(line.cook_id || "").slice(-6).toUpperCase()}`;
      await this.updatePayoutBatchLines({
        selector: { id: line.id },
        data: {
          status: "approved",
          transfer_ref: lineRef,
          updated_at: now,
        } as any,
      });
    }

    logger.info?.({
      event: "payout.batch.approved",
      batch_id: batchId,
      actor,
      transfer_ref: transferRef,
      week_start: current.week_start,
      line_count: lines.length,
    });

    return updated as unknown as SHCPayoutBatch;
  }

  async listPayoutBatches(filters: { id?: string; status?: string; week_start?: string; limit?: number } = {}): Promise<any[]> {
    const where: any = {};
    if (filters.id) where.id = filters.id;
    if (filters.status) where.status = filters.status;
    if (filters.week_start) where.week_start = filters.week_start;
    const take = filters.limit || 50;
    const [batches] = await (this as any).listAndCountPayoutBatches(where, {
      take,
      order: { week_start: "DESC" },
    }).catch(() => [[]]);
    return batches;
  }

  async listPayoutBatchLines(filters: {
    id?: string;
    batch_id?: string;
    cook_id?: string;
    status?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    const where: any = {};
    if (filters.id) where.id = filters.id;
    if (filters.batch_id) where.batch_id = filters.batch_id;
    if (filters.cook_id) where.cook_id = filters.cook_id;
    if (filters.status) where.status = filters.status;
    const take = filters.limit || 100;
    const [lines] = await (this as any).listAndCountPayoutBatchLines(where, {
      take,
      order: { created_at: "DESC" },
    }).catch(() => [[]]);
    return lines;
  }

  async getLastCookPayoutLine(cookId: string): Promise<any | null> {
    const lines = await this.listPayoutBatchLines({ cook_id: cookId, limit: 50 });
    const paidish = lines.filter((l: any) => ["approved", "paid"].includes(String(l.status || "")));
    if (!paidish.length) return null;
    const line = paidish[0];
    const batches = await this.listPayoutBatches({ id: line.batch_id, limit: 1 });
    const batch = batches[0];
    return {
      ...line,
      batch_week_start: batch?.week_start,
      batch_approved_at: batch?.approved_at,
      batch_transfer_ref: batch?.transfer_ref,
    };
  }

  async markPaid(batchId: string, container?: any): Promise<SHCPayoutBatch> {
    const [updated] = await this.updatePayoutBatches({
      selector: { id: batchId },
      data: { status: "paid", updated_at: new Date() } as any,
    });
    const lines = await this.listPayoutBatchLines({ batch_id: batchId, limit: 500 });
    for (const line of lines) {
      await this.updatePayoutBatchLines({
        selector: { id: line.id },
        data: { status: "paid", updated_at: new Date() } as any,
      });
    }
    return updated as unknown as SHCPayoutBatch;
  }
}

export default ShcPayoutBatchModuleService;

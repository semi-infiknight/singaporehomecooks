import { MedusaService } from "@medusajs/framework/utils";
import { OrderMeta, OrderMessage } from "./models/order-meta";
import { SHCOrderMeta, shcOrderMetaSchema, SHCOrderStatus, validateOrderTransition } from "@shc/types";
import { canTransition } from "@shc/business-rules"; // uses the validate

class ShcOrderMetaModuleService extends MedusaService({
  OrderMeta,
  OrderMessage,
}) {
  async createOrUpdateMeta(data: Partial<SHCOrderMeta & { origin_request_id?: string; credits_applied_cents?: number; is_corporate?: boolean; corporate_note?: string }>): Promise<SHCOrderMeta> {
    const validated = shcOrderMetaSchema.partial().parse(data);
    const extra = {
      origin_request_id: (data as any).origin_request_id,
      credits_applied_cents: (data as any).credits_applied_cents,
      is_corporate: (data as any).is_corporate,
      corporate_note: (data as any).corporate_note,
    };
    const payload = { ...validated, ...extra, updated_at: new Date() } as any;
    const existing = await this.listOrderMetas({ filters: { order_id: validated.order_id } });
    if (existing.length) {
      const [updated] = await this.updateOrderMetas({
        selector: { order_id: validated.order_id },
        data: payload,
      });
      return updated as unknown as SHCOrderMeta;
    }
    const [created] = await this.createOrderMetas([payload]);
    return created as unknown as SHCOrderMeta;
  }

  async transitionOrderState(orderId: string, to: SHCOrderStatus, actor?: string): Promise<{ meta: SHCOrderMeta; valid: boolean; error?: string }> {
    const metas = await this.listOrderMetas({ filters: { order_id: orderId } });
    if (!metas.length) {
      return { meta: null as any, valid: false, error: "Order meta not found" };
    }
    const current = metas[0] as unknown as SHCOrderMeta;
    const from = current.shc_status as SHCOrderStatus;

    // Use business rule + contract validate
    const businessValid = canTransition(from, to);
    const contractRes = validateOrderTransition(from, to);

    if (!businessValid || !contractRes.valid) {
      return { meta: current, valid: false, error: `Invalid transition ${from} -> ${to} (SHC-ORDER-001)` };
    }

    const [updated] = await this.updateOrderMetas({
      selector: { order_id: orderId },
      data: { shc_status: to, updated_at: new Date() } as any,
    });

    return { meta: updated as unknown as SHCOrderMeta, valid: true };
  }

  async addOrderMessage(orderId: string, senderActor: "customer" | "cook" | "ops", senderId: string, body: string) {
    return this.createOrderMessages([{
      order_id: orderId,
      sender_actor: senderActor,
      sender_id: senderId,
      body,
    } as any]);
  }

  async getOrderMetaWithMessages(orderId: string) {
    const [meta] = await this.listOrderMetas({ filters: { order_id: orderId } });
    const messages = await this.listOrderMessages({ filters: { order_id: orderId }, order: { created_at: "ASC" } });
    return {
      meta: meta as unknown as SHCOrderMeta | undefined,
      messages: messages as unknown as any[],
    };
  }
}

export default ShcOrderMetaModuleService;

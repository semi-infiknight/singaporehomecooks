import { MedusaService } from "@medusajs/framework/utils";
import { OrderMeta, OrderMessage } from "./models/order-meta";
import { SHCOrderMeta, shcOrderMetaSchema, SHCOrderStatus, validateOrderTransition } from "@shc/types";
import { canTransition } from "@shc/business-rules"; // uses the validate

class ShcOrderMetaModuleService extends MedusaService({
  OrderMeta,
  OrderMessage,
}) {
  async createOrUpdateMeta(
    data: Partial<
      SHCOrderMeta & {
        customer_id?: string;
        pdpa_consent_at?: string;
        pdpa_consent_version?: string;
        origin_request_id?: string;
        credits_applied_cents?: number;
        is_corporate?: boolean;
        corporate_note?: string;
      }
    >
  ): Promise<SHCOrderMeta> {
    const schemaOnly: Partial<SHCOrderMeta> = {};
    for (const key of [
      "order_id",
      "cook_id",
      "collection_date",
      "collection_slot",
      "allergen_acked_at",
      "address_released_at",
      "paynow_reference",
      "shc_status",
      "created_at",
      "updated_at",
    ] as const) {
      if ((data as any)[key] !== undefined) (schemaOnly as any)[key] = (data as any)[key];
    }
    const validated = shcOrderMetaSchema.partial().parse(schemaOnly);
    const extra = {
      customer_id: (data as any).customer_id,
      pdpa_consent_at: (data as any).pdpa_consent_at,
      pdpa_consent_version: (data as any).pdpa_consent_version,
      origin_request_id: (data as any).origin_request_id,
      credits_applied_cents: (data as any).credits_applied_cents,
      is_corporate: (data as any).is_corporate,
      corporate_note: (data as any).corporate_note,
      items: (data as any).items || (data as any).items_json || null,
      total_cents: (data as any).total_cents || (data as any).total || null,
    };
    const payload = { ...validated, ...extra, updated_at: new Date() } as any;
    const [existing] = await this.listAndCountOrderMetas(
      validated.order_id ? ({ order_id: validated.order_id } as any) : {},
      { take: 1 }
    ).catch(() => [[]]);
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
    const [metas] = await this.listAndCountOrderMetas({ order_id: orderId } as any, { take: 1 }).catch(() => [[]]);
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
    const [metas] = await this.listAndCountOrderMetas({ order_id: orderId } as any, { take: 1 }).catch(() => [[]]);
    const meta = (metas as any[])?.[0];
    const [messages] = await this.listAndCountOrderMessages({ order_id: orderId } as any, { take: 50 }).catch(() => [[]]);
    return {
      meta: meta as unknown as SHCOrderMeta | undefined,
      messages: messages as unknown as any[],
    };
  }
}

export default ShcOrderMetaModuleService;

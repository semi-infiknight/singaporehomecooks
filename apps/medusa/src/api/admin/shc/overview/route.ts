import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";

/**
 * GET /admin/shc/overview
 * Single-pane monitoring snapshot for ops dashboard.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const metaService: any = req.scope.resolve("shcOrderMeta");
    const cookService: any = req.scope.resolve("shcCook");
    let requestService: any = null;
    try {
      requestService = req.scope.resolve("shcRequest");
    } catch {
      requestService = null;
    }
    let disputeService: any = null;
    try {
      disputeService = req.scope.resolve("shcDispute");
    } catch {
      disputeService = null;
    }

    const [metas, orderCount] = await metaService.listAndCountOrderMetas({}, { take: 100, order: { updated_at: "DESC" } as any });
    const by_status: Record<string, number> = {};
    let gmv_cents = 0;
    const recent = (metas || []).slice(0, 15).map((m: any) => {
      const s = String(m.shc_status || "unknown");
      by_status[s] = (by_status[s] || 0) + 1;
      const tc =
        m.total_cents != null && Number(m.total_cents) > 0
          ? Number(m.total_cents)
          : Math.round(Number(m.total || 0) * 100);
      gmv_cents += tc > 0 ? tc : 0;
      return {
        id: m.order_id,
        shc_status: m.shc_status,
        cook_id: m.cook_id,
        customer_id: m.customer_id,
        total: tc / 100,
        collection_date: m.collection_date,
        updated_at: m.updated_at,
      };
    });
    // Recount all metas for by_status if we only took 100
    for (const m of metas || []) {
      const s = String(m.shc_status || "unknown");
      if (!by_status[s]) by_status[s] = 0;
    }

    let cooks_active = 0;
    let cooks_pending = 0;
    try {
      const [, activeCount] = await cookService.listAndCountCooks({ status: "active" }, { take: 1 });
      cooks_active = typeof activeCount === "number" ? activeCount : 0;
      const [, pendingCount] = await cookService.listAndCountCooks({ status: "pending" }, { take: 1 });
      cooks_pending = typeof pendingCount === "number" ? pendingCount : 0;
    } catch {
      /* optional */
    }

    let open_requests = 0;
    try {
      if (requestService?.listOpenRequests) {
        const reqs = await requestService.listOpenRequests({ limit: 50 });
        open_requests = Array.isArray(reqs) ? reqs.length : 0;
      } else if (requestService?.listAndCountRequests) {
        const [, c] = await requestService.listAndCountRequests({ status: "open" }, { take: 1 });
        open_requests = c || 0;
      }
    } catch {
      open_requests = 0;
    }

    let open_disputes = 0;
    try {
      if (disputeService?.listAndCountDisputes) {
        const [, c] = await disputeService.listAndCountDisputes({ status: "open" }, { take: 1 });
        open_disputes = c || 0;
      }
    } catch {
      open_disputes = 0;
    }

    let compliance_pending = 0;
    try {
      const complianceService: any = req.scope.resolve("shcComplianceDoc");
      const [docs] = await complianceService
        .listAndCountComplianceDocs({}, { take: 500, order: { created_at: "DESC" } })
        .catch(() => [[]]);
      compliance_pending = ((docs as any[]) || []).filter((d) => !d.verified_at).length;
    } catch {
      compliance_pending = 0;
    }

    const active_statuses = ["paid", "accepted", "preparing", "ready_for_collection"];
    const active_orders = active_statuses.reduce((n, s) => n + (by_status[s] || 0), 0);

    res.json({
      overview: {
        orders_total_sample: orderCount ?? metas?.length ?? 0,
        orders_active: active_orders,
        orders_by_status: by_status,
        gmv_cents_sample: gmv_cents,
        cooks_active,
        cooks_pending,
        open_requests,
        open_disputes,
        compliance_pending,
      },
      recent_orders: recent,
      generated_at: new Date().toISOString(),
    });
  } catch (e: any) {
    res.status(500).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Overview failed") });
  }
}

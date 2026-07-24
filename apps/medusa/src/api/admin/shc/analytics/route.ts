import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { createSHCError } from "@shc/types"

/**
 * GET /admin/shc/analytics
 * Marketplace trends from shc_order_meta (no Medusa dual-write).
 */
const QuerySchema = z
  .object({
    days: z.coerce.number().int().positive().max(90).default(14),
  })
  .strict()

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query)
  if (!parse.success) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", "Bad analytics query", parse.error.format() as any),
    })
  }

  const days = parse.data.days
  try {
    const metaService: any = req.scope.resolve("shcOrderMeta")
    const [metas, orderCount] = await metaService.listAndCountOrderMetas(
      {},
      { take: 500, order: { created_at: "DESC" } as any }
    )

    const today = startOfUtcDay(new Date())
    const windowStart = new Date(today)
    windowStart.setUTCDate(windowStart.getUTCDate() - (days - 1))

    const seriesMap = new Map<
      string,
      { date: string; orders: number; paid: number; gmv_cents: number }
    >()
    for (let i = 0; i < days; i++) {
      const d = new Date(windowStart)
      d.setUTCDate(windowStart.getUTCDate() + i)
      const key = dayKey(d)
      seriesMap.set(key, { date: key, orders: 0, paid: 0, gmv_cents: 0 })
    }

    const by_status: Record<string, number> = {}
    let gmv_window_cents = 0
    let paid_window = 0
    let awaiting_pay = 0

    for (const m of metas || []) {
      const status = String(m.shc_status || "unknown")
      by_status[status] = (by_status[status] || 0) + 1

      const raw = m.created_at || m.updated_at
      if (!raw) continue
      const created = new Date(raw)
      if (Number.isNaN(created.getTime())) continue
      const key = dayKey(startOfUtcDay(created))
      const bucket = seriesMap.get(key)
      if (!bucket) continue

      const tc =
        m.total_cents != null && Number(m.total_cents) > 0
          ? Math.round(Number(m.total_cents))
          : Math.round(Number(m.total || 0) * 100)

      bucket.orders += 1
      if (tc > 0) {
        bucket.gmv_cents += tc
        gmv_window_cents += tc
      }
      if (status === "paid" || status === "accepted" || status === "preparing" || status === "ready_for_collection" || status === "collected" || status === "completed") {
        bucket.paid += 1
        paid_window += 1
      }
      if (status === "cart") awaiting_pay += 1
    }

    const series = Array.from(seriesMap.values())
    const prevHalf = series.slice(0, Math.floor(days / 2))
    const nextHalf = series.slice(Math.floor(days / 2))
    const sum = (rows: typeof series, field: "orders" | "gmv_cents" | "paid") =>
      rows.reduce((n, r) => n + r[field], 0)

    const trend = {
      orders: {
        recent: sum(nextHalf, "orders"),
        prior: sum(prevHalf, "orders"),
      },
      gmv_cents: {
        recent: sum(nextHalf, "gmv_cents"),
        prior: sum(prevHalf, "gmv_cents"),
      },
      paid: {
        recent: sum(nextHalf, "paid"),
        prior: sum(prevHalf, "paid"),
      },
    }

    const pctChange = (recent: number, prior: number) => {
      if (prior <= 0) return recent > 0 ? 100 : 0
      return Math.round(((recent - prior) / prior) * 100)
    }

    const orders_in_window = series.reduce((n, r) => n + r.orders, 0)
    const conversion_rate_pct =
      orders_in_window > 0 ? Math.round((paid_window / orders_in_window) * 100) : 0

    res.json({
      window_days: days,
      orders_total: orderCount ?? metas?.length ?? 0,
      orders_in_window,
      gmv_window_cents,
      paid_window,
      awaiting_pay,
      conversion_rate_pct,
      by_status,
      series,
      trend: {
        orders_pct: pctChange(trend.orders.recent, trend.orders.prior),
        gmv_pct: pctChange(trend.gmv_cents.recent, trend.gmv_cents.prior),
        paid_pct: pctChange(trend.paid.recent, trend.paid.prior),
        ...trend,
      },
      generated_at: new Date().toISOString(),
      note: "Trends from shc_order_meta sample (up to 500 rows).",
    })
  } catch (e: any) {
    res.status(500).json({
      error: createSHCError("SHC-GENERIC-001", e?.message || "Analytics failed"),
    })
  }
}

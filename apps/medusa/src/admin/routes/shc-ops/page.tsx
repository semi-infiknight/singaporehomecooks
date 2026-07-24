import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import {
  CookSupplyChart,
  OpsQueueChart,
  OrdersTrendChart,
  Sparkline,
  StatusBarChart,
  StatusDonutChart,
} from "../../components/shc-charts"
import { shcGet, errMessage } from "../../lib/shc-api"
import { formatSgd, statusLabel, shortId } from "../../lib/shc-format"
import { withShcQuery } from "../../lib/shc-query"

type OverviewResponse = {
  overview: {
    orders_total_sample: number
    orders_active: number
    orders_by_status: Record<string, number>
    gmv_cents_sample: number
    cooks_active: number
    cooks_pending: number
    open_requests: number
    open_disputes: number
    compliance_pending: number
  }
  recent_orders: Array<{
    id: string
    shc_status: string
    cook_id?: string
    customer_id?: string
    total?: number
    collection_date?: string
    updated_at?: string
  }>
  generated_at?: string
}

type AnalyticsResponse = {
  series: Array<{ date: string; orders: number; paid: number; gmv_cents: number }>
  conversion_rate_pct?: number
  awaiting_pay?: number
}

type HealthResponse = {
  status?: string
  ok?: boolean
  service?: string
}

const ShcOpsOverviewPage = () => {
  const overviewQ = useQuery({
    queryKey: ["shc-ops", "overview"],
    queryFn: () => shcGet<OverviewResponse>("/admin/shc/overview"),
    refetchInterval: 60_000,
  })
  const analyticsQ = useQuery({
    queryKey: ["shc-ops", "analytics", "overview"],
    queryFn: () => shcGet<AnalyticsResponse>("/admin/shc/analytics?days=14"),
    refetchInterval: 60_000,
  })
  const healthQ = useQuery({
    queryKey: ["shc-ops", "health"],
    queryFn: () => shcGet<HealthResponse>("/admin/shc/health"),
    refetchInterval: 60_000,
  })

  const ov = overviewQ.data?.overview
  const recent = overviewQ.data?.recent_orders || []
  const series = analyticsQ.data?.series || []
  const loading = overviewQ.isLoading
  const error = overviewQ.error || healthQ.error

  const orderSpark = series.map((r) => r.orders)
  const gmvSpark = series.map((r) => r.gmv_cents)

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between gap-x-4">
        <div>
          <Heading level="h1">SHC Ops</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Marketplace monitoring · charts show what needs action and why
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <Button size="small" variant="secondary" asChild>
            <a href="/app/shc-ops/compliance">
              Compliance
              {!loading && (ov?.compliance_pending ?? 0) > 0
                ? ` (${ov?.compliance_pending})`
                : ""}
            </a>
          </Button>
          <Button size="small" variant="secondary" asChild>
            <a href="/app/shc-ops/insights">Insights & HitPay</a>
          </Button>
          <Button size="small" variant="secondary" asChild>
            <a href="/app/shc-ops/orders">Orders</a>
          </Button>
          <Button size="small" variant="secondary" asChild>
            <a href="/app/shc-ops/catalog">Catalog</a>
          </Button>
          <Button size="small" variant="secondary" asChild>
            <a href="/app/shc-ops/controls">Controls</a>
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => {
              void overviewQ.refetch()
              void analyticsQ.refetch()
              void healthQ.refetch()
            }}
            isLoading={overviewQ.isFetching}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Container className="border-ui-border-error bg-ui-bg-error-subtle p-4">
          <Text size="small" className="text-ui-fg-error">
            {errMessage(error)}
          </Text>
        </Container>
      )}

      <div className="grid grid-cols-1 gap-4 small:grid-cols-2 large:grid-cols-4">
        <KpiCard
          label="Active orders"
          value={loading ? "…" : String(ov?.orders_active ?? "—")}
          hint="paid → ready_for_collection — cooks must fulfil these"
          spark={orderSpark}
        />
        <KpiCard
          label="GMV (sample)"
          value={loading ? "…" : formatSgd(ov?.gmv_cents_sample, "cents")}
          hint={`${ov?.orders_total_sample ?? 0} recent orders in snapshot`}
          spark={gmvSpark}
          sparkUnit="cents"
        />
        <KpiCard
          label="Cooks active"
          value={loading ? "…" : String(ov?.cooks_active ?? "—")}
          hint={`${ov?.cooks_pending ?? 0} pending verification`}
        />
        <KpiCard
          label="Needs your action"
          value={
            loading
              ? "…"
              : String(
                  (ov?.open_disputes ?? 0) +
                    (ov?.open_requests ?? 0) +
                    (ov?.compliance_pending ?? 0)
                )
          }
          hint={`${ov?.compliance_pending ?? 0} compliance · ${ov?.open_requests ?? 0} collab · ${ov?.open_disputes ?? 0} disputes`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 large:grid-cols-2">
        <OpsQueueChart
          disputes={ov?.open_disputes ?? 0}
          requests={ov?.open_requests ?? 0}
          compliance={ov?.compliance_pending ?? 0}
        />
        <CookSupplyChart active={ov?.cooks_active ?? 0} pending={ov?.cooks_pending ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 large:grid-cols-2">
        <StatusDonutChart
          byStatus={ov?.orders_by_status || {}}
          title="Order pipeline snapshot"
          caption="Share of recent orders by fulfilment status. Hover for counts — click status chips below to drill into orders."
        />
        {series.length > 0 ? (
          <OrdersTrendChart series={series} />
        ) : (
          <Container className="p-4">
            <Heading level="h2">14-day trend</Heading>
            <Text size="small" className="mt-2 text-ui-fg-subtle">
              {analyticsQ.isLoading ? "Loading analytics…" : "No trend data yet."}
            </Text>
          </Container>
        )}
      </div>

      <StatusBarChart
        byStatus={ov?.orders_by_status || {}}
        caption="Sorted by volume. Cart + pending_payment = checkout drop-off. Ready_for_collection = waiting pickup."
      />

      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Quick filter by status</Heading>
        </div>
        <div className="flex flex-wrap gap-2 px-6 py-4">
          {loading && <Text size="small">Loading…</Text>}
          {!loading && Object.keys(ov?.orders_by_status || {}).length === 0 && (
            <Text size="small" className="text-ui-fg-subtle">
              No status breakdown yet.
            </Text>
          )}
          {Object.entries(ov?.orders_by_status || {}).map(([status, n]) => (
            <a
              key={status}
              href={`/app/shc-ops/orders?status=${encodeURIComponent(status)}`}
              className="rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-2 hover:bg-ui-bg-base-hover"
            >
              <Text size="xsmall" className="text-ui-fg-subtle">
                {statusLabel(status)}
              </Text>
              <Text weight="plus" className="block">
                {n as number}
              </Text>
            </a>
          ))}
        </div>
      </Container>

      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Recent marketplace activity</Heading>
          <Button size="small" variant="secondary" asChild>
            <a href="/app/shc-ops/orders">Full order board</a>
          </Button>
        </div>
        <div className="flex flex-col divide-y">
          {recent.length === 0 && !loading && (
            <div className="px-6 py-4">
              <Text size="small" className="text-ui-fg-subtle">
                No recent orders.
              </Text>
            </div>
          )}
          {recent.map((o) => (
            <div
              key={o.id}
              className="flex flex-wrap items-center justify-between gap-2 px-6 py-3"
            >
              <div>
                <Text size="small" weight="plus" className="font-mono">
                  {shortId(o.id, 18)}
                </Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  cook {shortId(o.cook_id, 10)} · {o.collection_date || "no date"}
                </Text>
              </div>
              <div className="flex items-center gap-x-2">
                <Badge size="2xsmall">{statusLabel(o.shc_status)}</Badge>
                <Text size="small" weight="plus">
                  {formatSgd(o.total)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      </Container>

      <Container className="p-6">
        <Heading level="h2">System health</Heading>
        <Text size="small" className="mt-2 text-ui-fg-subtle">
          {healthQ.data?.status || healthQ.data?.ok ? "API OK" : healthQ.isLoading ? "Checking…" : "Unknown"}
          {" · "}
          service {healthQ.data?.service || "admin-shc"}
          {analyticsQ.data?.conversion_rate_pct != null
            ? ` · ${analyticsQ.data.conversion_rate_pct}% paid conversion (14d)`
            : ""}
          {overviewQ.data?.generated_at
            ? ` · snapshot ${new Date(overviewQ.data.generated_at).toLocaleString()}`
            : ""}
        </Text>
      </Container>
    </div>
  )
}

const KpiCard = ({
  label,
  value,
  hint,
  spark,
  sparkUnit,
}: {
  label: string
  value: string
  hint: string
  spark?: number[]
  sparkUnit?: "cents"
}) => (
  <Container className="p-4">
    <Text size="xsmall" weight="plus" className="uppercase text-ui-fg-subtle">
      {label}
    </Text>
    <Heading level="h1" className="mt-1">
      {value}
    </Heading>
    <Text size="xsmall" className="mt-1 text-ui-fg-muted">
      {hint}
    </Text>
    {spark && spark.length > 1 ? (
      <Sparkline
        values={sparkUnit === "cents" ? spark.map((c) => c / 100) : spark}
        color={sparkUnit === "cents" ? "#D96C4A" : "#3B82F6"}
      />
    ) : null}
  </Container>
)

export const config = defineRouteConfig({
  label: "SHC Ops",
  icon: ChartBar,
  rank: 1,
})

export const handle = {
  breadcrumb: () => "SHC Ops",
}

export default withShcQuery(ShcOpsOverviewPage)

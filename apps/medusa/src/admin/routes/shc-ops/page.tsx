import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
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
  const healthQ = useQuery({
    queryKey: ["shc-ops", "health"],
    queryFn: () => shcGet<HealthResponse>("/admin/shc/health"),
    refetchInterval: 60_000,
  })

  const ov = overviewQ.data?.overview
  const recent = overviewQ.data?.recent_orders || []
  const loading = overviewQ.isLoading
  const error = overviewQ.error || healthQ.error

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between gap-x-4">
        <div>
          <Heading level="h1">SHC Ops</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Marketplace monitoring · customer & cook apps · catalog presets
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <Button size="small" variant="secondary" asChild>
            <Link to="/shc-ops/orders">Orders</Link>
          </Button>
          <Button size="small" variant="secondary" asChild>
            <Link to="/shc-ops/catalog">Catalog</Link>
          </Button>
          <Button size="small" variant="secondary" asChild>
            <Link to="/shc-ops/controls">Controls</Link>
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => {
              void overviewQ.refetch()
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
          hint="paid → ready_for_collection"
        />
        <KpiCard
          label="GMV (sample)"
          value={loading ? "…" : formatSgd(ov?.gmv_cents_sample, "cents")}
          hint={`${ov?.orders_total_sample ?? 0} recent orders`}
        />
        <KpiCard
          label="Cooks active"
          value={loading ? "…" : String(ov?.cooks_active ?? "—")}
          hint={`${ov?.cooks_pending ?? 0} pending verification`}
        />
        <KpiCard
          label="Open issues"
          value={
            loading
              ? "…"
              : String((ov?.open_disputes ?? 0) + (ov?.open_requests ?? 0))
          }
          hint={`${ov?.open_disputes ?? 0} disputes · ${ov?.open_requests ?? 0} collab requests`}
        />
      </div>

      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Orders by status</Heading>
        </div>
        <div className="flex flex-wrap gap-2 px-6 py-4">
          {loading && <Text size="small">Loading…</Text>}
          {!loading && Object.keys(ov?.orders_by_status || {}).length === 0 && (
            <Text size="small" className="text-ui-fg-subtle">
              No status breakdown yet.
            </Text>
          )}
          {Object.entries(ov?.orders_by_status || {}).map(([status, n]) => (
            <Link
              key={status}
              to={`/shc-ops/orders?status=${encodeURIComponent(status)}`}
              className="rounded-md border border-ui-border-base bg-ui-bg-base px-3 py-2 hover:bg-ui-bg-base-hover"
            >
              <Text size="xsmall" className="text-ui-fg-subtle">
                {statusLabel(status)}
              </Text>
              <Text weight="plus" className="block">
                {n as number}
              </Text>
            </Link>
          ))}
        </div>
      </Container>

      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Recent marketplace activity</Heading>
          <Button size="small" variant="secondary" asChild>
            <Link to="/shc-ops/orders">Full order board</Link>
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
}: {
  label: string
  value: string
  hint: string
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

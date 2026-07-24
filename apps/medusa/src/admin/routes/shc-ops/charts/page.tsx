import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import {
  ChartSection,
  ComplianceFunnelChart,
  CookSupplyChart,
  DataBarChart,
  DataDonutChart,
  GmvTrendChart,
  OpsQueueChart,
  OrdersTrendChart,
  PayoutBatchChart,
  RevenueSplitChart,
  type ChartDatum,
} from "../../../components/shc-charts"
import { shcGet, errMessage } from "../../../lib/shc-api"
import { formatSgd, statusChartColor, statusLabel } from "../../../lib/shc-format"
import { withShcQuery } from "../../../lib/shc-query"

type ChartsResponse = {
  window_days: number
  sample_sizes: Record<string, number>
  orders: {
    by_status: ChartDatum[]
    by_slot: ChartDatum[]
    corporate_vs_regular: ChartDatum[]
    top_cooks_by_orders: ChartDatum[]
    top_cooks_by_gmv_cents: ChartDatum[]
  }
  time_series: Array<{ date: string; orders: number; paid: number; gmv_cents: number }>
  listings: {
    by_status: ChartDatum[]
    by_cuisine: ChartDatum[]
    halal_split: ChartDatum[]
    by_price_bucket: ChartDatum[]
    total: number
  }
  availability: { by_status: ChartDatum[]; total: number }
  cooks: { active: number; pending: number }
  compliance: {
    pending: number
    verified: number
    pending_sfa: number
    pending_wsq: number
    by_type: { sfa: number; wsq: number }
  }
  payouts: {
    by_status: ChartDatum[]
    weekly: Array<{ week: string; amount_cents: number; status?: string }>
    total_batches: number
  }
  disputes: { by_type: ChartDatum[]; by_status: ChartDatum[]; open_count: number }
  ledger: {
    summary: { cook_earnings_cents: number; platform_fees_cents: number; entry_count: number }
    by_account: ChartDatum[]
  }
  expenses: { by_category_cents: ChartDatum[]; total_cents: number }
  flags: { on_off: ChartDatum[]; total: number }
  categories: { on_off: ChartDatum[] }
  ops_queue: { compliance_pending: number; open_requests: number; open_disputes: number }
  note?: string
}

function statusColored(data: ChartDatum[]): ChartDatum[] {
  return data.map((d, i) => ({
    ...d,
    name: statusLabel(d.name) || d.name,
    fill: statusChartColor(d.name) || undefined,
  }))
}

const ShcOpsChartsPage = () => {
  const [days, setDays] = useState(30)

  const chartsQ = useQuery({
    queryKey: ["shc-ops", "charts", days],
    queryFn: () => shcGet<ChartsResponse>(`/admin/shc/charts?days=${days}`),
    refetchInterval: 60_000,
  })

  const c = chartsQ.data

  return (
    <div className="flex flex-col gap-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading level="h1">Visual data explorer</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Every SHC dataset in charts — orders, listings, payouts, compliance, disputes, and more.
            {c?.note ? ` ${c.note}` : ""}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-ui-border-base bg-ui-bg-base px-2 py-1 text-sm"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
          <Button size="small" variant="secondary" asChild>
            <a href="/app/shc-ops/insights">HitPay & trends</a>
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => void chartsQ.refetch()}
            isLoading={chartsQ.isFetching}
          >
            Refresh
          </Button>
        </div>
      </div>

      {chartsQ.error && (
        <Container className="border-ui-border-error bg-ui-bg-error-subtle p-4">
          <Text size="small" className="text-ui-fg-error">
            {errMessage(chartsQ.error)}
          </Text>
        </Container>
      )}

      {c && (
        <Text size="xsmall" className="text-ui-fg-muted">
          Sample: {c.sample_sizes.orders} orders · {c.sample_sizes.listings} listings ·{" "}
          {c.sample_sizes.disputes} disputes · {c.sample_sizes.expenses} expenses
        </Text>
      )}

      <ChartSection
        title="Trends over time"
        subtitle="Daily order volume, payment conversion, and GMV for the selected window."
      >
        <OrdersTrendChart series={c?.time_series || []} />
        <GmvTrendChart series={c?.time_series || []} />
      </ChartSection>

      <ChartSection
        title="Marketplace orders"
        subtitle="Who is ordering, when they collect, and order mix by fulfilment status."
      >
        <DataDonutChart
          title="Orders by status"
          caption="Pipeline health — large cart slice means checkout friction or PayNow delays."
          data={statusColored(c?.orders.by_status || [])}
        />
        <DataDonutChart
          title="Corporate vs consumer"
          caption="B2B corporate orders vs regular home-cook checkout."
          data={c?.orders.corporate_vs_regular || []}
        />
        <DataBarChart
          title="Top cooks by order count"
          caption="Which kitchens drive the most transactions in the sample."
          data={c?.orders.top_cooks_by_orders || []}
          layout="horizontal"
        />
        <DataBarChart
          title="Top cooks by GMV"
          caption="Revenue leaders — compare with order count to spot high-AOV cooks."
          data={(c?.orders.top_cooks_by_gmv_cents || []).map((d) => ({
            ...d,
            value: d.value / 100,
          }))}
          layout="horizontal"
          valueFormatter={(v) => formatSgd(v)}
        />
        <DataBarChart
          title="Collection time slots"
          caption="When customers prefer to pick up — helps cooks plan batch prep."
          data={c?.orders.by_slot || []}
        />
      </ChartSection>

      <ChartSection
        title="Listings & catalog"
        subtitle="What cooks publish, cuisine mix, pricing, and discover category presets."
      >
        <DataDonutChart
          title="Listing status"
          caption="Active dishes vs paused — paused listings are hidden from customers."
          data={c?.listings.by_status || []}
        />
        <DataBarChart
          title="Cuisine mix"
          caption="Which food cultures dominate the marketplace catalog."
          data={c?.listings.by_cuisine || []}
          layout="horizontal"
        />
        <DataDonutChart
          title="Halal vs non-halal"
          caption="Halal badge visibility on discover and product pages."
          data={c?.listings.halal_split || []}
        />
        <DataBarChart
          title="Price distribution"
          caption="How dishes are priced — spot gaps for premium or budget segments."
          data={c?.listings.by_price_bucket || []}
        />
        <DataDonutChart
          title="Discover categories"
          caption="Enabled vs disabled cuisine chips on customer Discover screen."
          data={c?.categories.on_off || []}
          emptyMessage="Using default category presets."
        />
      </ChartSection>

      <ChartSection
        title="Availability & cooks"
        subtitle="Portion slots and cook supply — capacity vs demand."
      >
        <DataDonutChart
          title="Portion availability"
          caption="Active slots vs paused — paused stops new orders for that dish."
          data={c?.availability.by_status || []}
        />
        <CookSupplyChart
          active={c?.cooks.active ?? 0}
          pending={c?.cooks.pending ?? 0}
        />
      </ChartSection>

      <ChartSection
        title="Money & payouts"
        subtitle="Ledger split, weekly payout batches, and cook expense claims."
      >
        <RevenueSplitChart
          cookCents={c?.ledger.summary.cook_earnings_cents ?? 0}
          platformCents={c?.ledger.summary.platform_fees_cents ?? 0}
        />
        <PayoutBatchChart
          batches={(c?.payouts.weekly || []).map((w) => ({
            week_start: w.week,
            total_cents: w.amount_cents,
            status: w.status,
          }))}
        />
        <DataDonutChart
          title="Payout batch status"
          caption="Pending batches need your approval in Controls before funds release."
          data={c?.payouts.by_status || []}
        />
        <DataBarChart
          title="Cook expenses by category"
          caption={`Reimbursement claims filed by cooks — total ${formatSgd(c?.expenses.total_cents ?? 0, "cents")}.`}
          data={c?.expenses.by_category_cents || []}
          valueFormatter={(v) => formatSgd(v, "cents")}
        />
        <DataBarChart
          title="Ledger by account"
          caption="Double-entry volume per account type in recent ledger sample."
          data={(c?.ledger.by_account || []).map((d) => ({
            ...d,
            value: d.value / 100,
          }))}
          valueFormatter={(v) => formatSgd(v)}
          layout="horizontal"
        />
      </ChartSection>

      <ChartSection
        title="Trust, compliance & ops"
        subtitle="What blocks cooks from accepting orders and what needs admin resolution."
      >
        <OpsQueueChart
          disputes={c?.ops_queue.open_disputes ?? 0}
          requests={c?.ops_queue.open_requests ?? 0}
          compliance={c?.ops_queue.compliance_pending ?? 0}
        />
        {c?.compliance && <ComplianceFunnelChart summary={c.compliance} />}
        <DataDonutChart
          title="Compliance doc types"
          caption="SFA food licence vs WSQ food hygiene certificates on file."
          data={[
            { name: "SFA", value: c?.compliance.by_type.sfa ?? 0 },
            { name: "WSQ", value: c?.compliance.by_type.wsq ?? 0 },
          ]}
        />
        <DataBarChart
          title="Disputes by type"
          caption={`${c?.disputes.open_count ?? 0} open — quality, late cancel, customer complaints.`}
          data={c?.disputes.by_type || []}
          layout="horizontal"
        />
        <DataDonutChart
          title="Dispute status"
          caption="Open disputes need resolution in Controls before closing the loop."
          data={c?.disputes.by_status || []}
        />
        <DataDonutChart
          title="Feature flags"
          caption="Launch gates — paused flags hide features without redeploying."
          data={c?.flags.on_off || []}
          emptyMessage="No feature flags configured."
        />
      </ChartSection>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Charts",
  rank: 0,
})

export const handle = {
  breadcrumb: () => "Charts",
}

export default withShcQuery(ShcOpsChartsPage)

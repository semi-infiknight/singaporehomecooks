import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"
import {
  GmvTrendChart,
  HitPayStatusChart,
  OrdersTrendChart,
  StatusBarChart,
  StatusDonutChart,
} from "../../../components/shc-charts"
import { shcGet, shcPost, errMessage } from "../../../lib/shc-api"
import { formatSgd, shortId } from "../../../lib/shc-format"
import { withShcQuery } from "../../../lib/shc-query"

type AnalyticsResponse = {
  window_days: number
  orders_total: number
  orders_in_window?: number
  gmv_window_cents: number
  paid_window: number
  awaiting_pay: number
  conversion_rate_pct?: number
  by_status: Record<string, number>
  series: Array<{ date: string; orders: number; paid: number; gmv_cents: number }>
  trend: {
    orders_pct: number
    gmv_pct: number
    paid_pct: number
  }
  generated_at?: string
  note?: string
}

type HitPayResponse = {
  config: {
    configured: boolean
    env: string
    api_base: string
    webhook_salt_set: boolean
    webhook_path: string
    dashboard_url: string
  }
  payment_requests: Array<{
    id: string
    amount: string
    currency: string
    status: string
    reference_number: string | null
    purpose: string | null
    checkout_url: string | null
    payment_methods: string[]
    created_at: string | null
  }>
  total: number
  by_status?: Record<string, number>
  note?: string
}

function pctLabel(n: number): string {
  if (n > 0) return `↑ ${n}%`
  if (n < 0) return `↓ ${Math.abs(n)}%`
  return "→ 0%"
}

const ShcOpsInsightsPage = () => {
  const [orderId, setOrderId] = useState("")
  const [payRef, setPayRef] = useState("")
  const [days, setDays] = useState(14)

  const analyticsQ = useQuery({
    queryKey: ["shc-ops", "analytics", days],
    queryFn: () => shcGet<AnalyticsResponse>(`/admin/shc/analytics?days=${days}`),
    refetchInterval: 60_000,
  })

  const hitpayQ = useQuery({
    queryKey: ["shc-ops", "hitpay"],
    queryFn: () => shcGet<HitPayResponse>("/admin/shc/hitpay?per_page=40"),
    refetchInterval: 45_000,
  })

  const confirmPay = useMutation({
    mutationFn: () =>
      shcPost("/admin/shc/payment-confirm", {
        order_id: orderId.trim(),
        paynow_reference: payRef.trim(),
        notes: "Manual confirm from SHC Ops Insights",
      }),
    onSuccess: () => {
      toast.success("Payment confirmed")
      setOrderId("")
      setPayRef("")
      void analyticsQ.refetch()
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  const onConfirm = (e: FormEvent) => {
    e.preventDefault()
    if (!orderId.trim() || payRef.trim().length < 3) {
      toast.error("Order id + PayNow/HitPay reference required")
      return
    }
    confirmPay.mutate()
  }

  const a = analyticsQ.data
  const hp = hitpayQ.data
  const hitpayByStatus =
    hp?.by_status ||
    (hp?.payment_requests || []).reduce<Record<string, number>>((acc, row) => {
      const s = row.status || "unknown"
      acc[s] = (acc[s] || 0) + 1
      return acc
    }, {})

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading level="h1">Insights & HitPay</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Trends from marketplace orders · payment health from HitPay API
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <Button size="small" variant="secondary" asChild>
            <a href="/app/shc-ops">Overview</a>
          </Button>
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
          <Button
            size="small"
            variant="secondary"
            onClick={() => {
              void analyticsQ.refetch()
              void hitpayQ.refetch()
            }}
            isLoading={analyticsQ.isFetching || hitpayQ.isFetching}
          >
            Refresh
          </Button>
        </div>
      </div>

      {(analyticsQ.error || hitpayQ.error) && (
        <Container className="border-ui-border-error bg-ui-bg-error-subtle p-4">
          <Text size="small" className="text-ui-fg-error">
            {errMessage(analyticsQ.error || hitpayQ.error)}
          </Text>
        </Container>
      )}

      <div className="grid grid-cols-1 gap-4 small:grid-cols-2 large:grid-cols-4">
        <Kpi
          label={`Orders (${days}d)`}
          value={analyticsQ.isLoading ? "…" : String(a?.orders_in_window ?? a?.orders_total ?? "—")}
          hint={a ? `${pctLabel(a.trend.orders_pct)} vs prior half-window` : "—"}
        />
        <Kpi
          label="GMV window"
          value={analyticsQ.isLoading ? "…" : formatSgd(a?.gmv_window_cents, "cents")}
          hint={a ? `${pctLabel(a.trend.gmv_pct)} vs prior half-window` : "—"}
        />
        <Kpi
          label="Payment conversion"
          value={
            analyticsQ.isLoading
              ? "…"
              : a?.conversion_rate_pct != null
                ? `${a.conversion_rate_pct}%`
                : "—"
          }
          hint={`${a?.paid_window ?? 0} paid+ · ${a?.awaiting_pay ?? 0} still in cart`}
        />
        <Kpi
          label="HitPay requests"
          value={
            hitpayQ.isLoading
              ? "…"
              : hp?.config?.configured
                ? String(hp.total ?? 0)
                : "Off"
          }
          hint={
            hp?.config
              ? `${hp.config.env} · ${hp.config.webhook_salt_set ? "webhook OK" : "webhook salt missing"}`
              : "—"
          }
        />
      </div>

      {a?.note && (
        <Text size="xsmall" className="text-ui-fg-muted">
          {a.note}
        </Text>
      )}

      <OrdersTrendChart series={a?.series || []} />

      <GmvTrendChart series={a?.series || []} />

      <div className="grid grid-cols-1 gap-4 large:grid-cols-2">
        <StatusDonutChart
          byStatus={a?.by_status || {}}
          title="Status mix (window)"
          caption="Proportion of orders in each state during the selected window. Large cart slice = checkout abandonment."
        />
        <HitPayStatusChart byStatus={hitpayByStatus} />
      </div>

      <StatusBarChart
        byStatus={a?.by_status || {}}
        title="Status breakdown (counts)"
        caption="Exact counts per status — use with the order board to clear bottlenecks (e.g. stuck in preparing)."
      />

      <Container className="divide-y p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-4">
          <div>
            <Heading level="h2">HitPay payment requests</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              {hp?.note || "From HitPay API via Railway key"}
              {hp?.config?.api_base ? ` · ${hp.config.api_base}` : ""}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            {hp?.config && (
              <Badge size="2xsmall" color={hp.config.configured ? "green" : "orange"}>
                {hp.config.configured ? hp.config.env : "unconfigured"}
              </Badge>
            )}
            {hp?.config?.dashboard_url && (
              <Button size="small" variant="secondary" asChild>
                <a href={hp.config.dashboard_url} target="_blank" rel="noreferrer">
                  Open HitPay dashboard
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto px-2 pb-4">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Request</Table.HeaderCell>
                <Table.HeaderCell>Reference</Table.HeaderCell>
                <Table.HeaderCell>Methods</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Amount</Table.HeaderCell>
                <Table.HeaderCell>Created</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {(hp?.payment_requests || []).length === 0 && (
                <Table.Row>
                  <Table.Cell className="text-ui-fg-subtle">
                    {hitpayQ.isLoading
                      ? "Loading HitPay…"
                      : "No payment requests (or HitPay key missing)."}
                  </Table.Cell>
                  <Table.Cell />
                  <Table.Cell />
                  <Table.Cell />
                  <Table.Cell />
                  <Table.Cell />
                </Table.Row>
              )}
              {(hp?.payment_requests || []).map((row) => (
                <Table.Row key={row.id}>
                  <Table.Cell>
                    {row.checkout_url ? (
                      <a
                        href={row.checkout_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-ui-fg-interactive"
                      >
                        {shortId(row.id, 14)}
                      </a>
                    ) : (
                      <span className="font-mono">{shortId(row.id, 14)}</span>
                    )}
                  </Table.Cell>
                  <Table.Cell className="font-mono">
                    {row.reference_number || "—"}
                  </Table.Cell>
                  <Table.Cell>{(row.payment_methods || []).join(", ") || "—"}</Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall">{row.status}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {formatSgd(Number(row.amount) * 100, "cents")} {row.currency?.toUpperCase()}
                  </Table.Cell>
                  <Table.Cell>
                    {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Container>

      <Container className="p-6">
        <Heading level="h2">Manual payment confirm</Heading>
        <Text size="small" className="mt-1 text-ui-fg-subtle">
          Ops override when webhook missed — same path as HitPay webhook (`markOrderPaid`).
        </Text>
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={onConfirm}>
          <div className="flex flex-col gap-1">
            <Label>Order id</Label>
            <Input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="SHC-…"
              className="w-[220px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label>PayNow / HitPay reference</Label>
            <Input
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
              placeholder="HP:… or bank ref"
              className="w-[260px]"
            />
          </div>
          <Button type="submit" isLoading={confirmPay.isPending}>
            Confirm paid
          </Button>
        </form>
      </Container>
    </div>
  )
}

function Kpi({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
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
}

export const config = defineRouteConfig({
  label: "Insights",
  rank: 0,
})

export const handle = {
  breadcrumb: () => "Insights",
}

export default withShcQuery(ShcOpsInsightsPage)

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
import { useMemo, useState, type FormEvent } from "react"
import { shcGet, shcPost, errMessage } from "../../../lib/shc-api"
import { formatSgd, shortId, statusLabel } from "../../../lib/shc-format"
import { withShcQuery } from "../../../lib/shc-query"

type AnalyticsResponse = {
  window_days: number
  orders_total: number
  gmv_window_cents: number
  paid_window: number
  awaiting_pay: number
  by_status: Record<string, number>
  series: Array<{ date: string; orders: number; paid: number; gmv_cents: number }>
  trend: {
    orders_pct: number
    gmv_pct: number
    paid_pct: number
  }
  generated_at?: string
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

function BarChart({
  title,
  rows,
  valueKey,
  formatValue,
}: {
  title: string
  rows: AnalyticsResponse["series"]
  valueKey: "orders" | "gmv_cents" | "paid"
  formatValue?: (n: number) => string
}) {
  const max = Math.max(1, ...rows.map((r) => r[valueKey]))
  return (
    <Container className="p-4">
      <Heading level="h2">{title}</Heading>
      <div className="mt-4 flex items-end gap-1" style={{ height: 140 }}>
        {rows.map((r) => {
          const v = r[valueKey]
          const h = Math.max(4, Math.round((v / max) * 120))
          return (
            <div
              key={r.date}
              className="flex flex-1 flex-col items-center justify-end gap-1"
              title={`${r.date}: ${formatValue ? formatValue(v) : v}`}
            >
              <div
                className="w-full rounded-t bg-ui-bg-interactive"
                style={{ height: h, minHeight: v > 0 ? 4 : 2, opacity: v > 0 ? 1 : 0.25 }}
              />
              <Text size="xsmall" className="text-ui-fg-muted">
                {r.date.slice(5)}
              </Text>
            </div>
          )
        })}
      </div>
    </Container>
  )
}

const ShcOpsInsightsPage = () => {
  const [orderId, setOrderId] = useState("")
  const [payRef, setPayRef] = useState("")

  const analyticsQ = useQuery({
    queryKey: ["shc-ops", "analytics"],
    queryFn: () => shcGet<AnalyticsResponse>("/admin/shc/analytics?days=14"),
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
  const maxStatus = useMemo(() => {
    const vals = Object.values(a?.by_status || {})
    return Math.max(1, ...vals)
  }, [a?.by_status])

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading level="h1">Insights & HitPay</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Trends from marketplace orders · payment requests from HitPay API
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <Button size="small" variant="secondary" asChild>
            <a href="/app/shc-ops">Overview</a>
          </Button>
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
          label="Orders (14d sample)"
          value={analyticsQ.isLoading ? "…" : String(a?.orders_total ?? "—")}
          hint={a ? pctLabel(a.trend.orders_pct) + " vs prior half" : "—"}
        />
        <Kpi
          label="GMV window"
          value={analyticsQ.isLoading ? "…" : formatSgd(a?.gmv_window_cents, "cents")}
          hint={a ? pctLabel(a.trend.gmv_pct) + " vs prior half" : "—"}
        />
        <Kpi
          label="Paid / progressing"
          value={analyticsQ.isLoading ? "…" : String(a?.paid_window ?? "—")}
          hint={`${a?.awaiting_pay ?? 0} still in cart (awaiting PayNow)`}
        />
        <Kpi
          label="HitPay"
          value={
            hitpayQ.isLoading
              ? "…"
              : hp?.config?.configured
                ? String(hp.total ?? 0)
                : "Off"
          }
          hint={
            hp?.config
              ? `${hp.config.env} · ${hp.config.webhook_salt_set ? "webhook salt OK" : "salt missing"}`
              : "—"
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 large:grid-cols-3">
        <BarChart title="Orders / day" rows={a?.series || []} valueKey="orders" />
        <BarChart
          title="GMV / day"
          rows={a?.series || []}
          valueKey="gmv_cents"
          formatValue={(n) => formatSgd(n, "cents")}
        />
        <BarChart title="Paid+ progress / day" rows={a?.series || []} valueKey="paid" />
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Status mix</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Share of recent order metas
          </Text>
        </div>
        <div className="flex flex-col gap-2 px-6 py-4">
          {Object.entries(a?.by_status || {}).length === 0 && (
            <Text size="small" className="text-ui-fg-subtle">
              {analyticsQ.isLoading ? "Loading…" : "No status data."}
            </Text>
          )}
          {Object.entries(a?.by_status || {})
            .sort((x, y) => y[1] - x[1])
            .map(([status, n]) => (
              <div key={status} className="flex items-center gap-3">
                <Text size="small" className="w-36 shrink-0">
                  {statusLabel(status)}
                </Text>
                <div className="h-2 flex-1 overflow-hidden rounded bg-ui-bg-subtle">
                  <div
                    className="h-full bg-ui-bg-interactive"
                    style={{ width: `${Math.round((n / maxStatus) * 100)}%` }}
                  />
                </div>
                <Text size="small" weight="plus" className="w-8 text-right">
                  {n}
                </Text>
              </div>
            ))}
        </div>
      </Container>

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

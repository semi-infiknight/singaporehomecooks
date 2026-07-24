import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Select, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { DataBarChart, DataDonutChart } from "../../../components/shc-charts"
import { shcGet, errMessage } from "../../../lib/shc-api"
import { formatSgd, statusChartColor, statusLabel, shortId } from "../../../lib/shc-format"
import { withShcQuery } from "../../../lib/shc-query"
import { shcOpsLiveQuery, shcOpsLiveQueryFast } from "../../../lib/shc-ops-polling"
import { ShcTableCell } from "../../../lib/table-cell"

type OrderRow = {
  id: string
  cook_id?: string
  customer_id?: string
  shc_status: string
  collection_date?: string
  collection_slot?: string
  paynow_reference?: string
  is_corporate?: boolean
  item_summary?: string
  total?: number
  updated_at?: string
}

type OrdersResponse = {
  orders: OrderRow[]
  count?: number
  by_status?: Record<string, number>
}

const ShcOpsOrdersPage = () => {
  const initial =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("status") || ""
      : ""
  const [statusFilter, setStatusFilter] = useState(initial)

  const ordersQ = useQuery({
    queryKey: ["shc-ops", "orders", statusFilter],
    queryFn: () => {
      const q = new URLSearchParams({ limit: "80" })
      if (statusFilter) q.set("status", statusFilter)
      return shcGet<OrdersResponse>(`/admin/shc/orders?${q.toString()}`)
    },
    ...shcOpsLiveQueryFast,
  })

  const chartsQ = useQuery({
    queryKey: ["shc-ops", "charts", "orders"],
    queryFn: () => shcGet<any>("/admin/shc/charts?days=30"),
    ...shcOpsLiveQuery,
  })

  const orders = ordersQ.data?.orders || []
  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    for (const o of orders) set.add(String(o.shc_status || "unknown"))
    Object.keys(ordersQ.data?.by_status || {}).forEach((s) => set.add(s))
    return Array.from(set).sort()
  }, [orders, ordersQ.data?.by_status])

  const onStatusChange = (v: string) => {
    setStatusFilter(v)
    const url = new URL(window.location.href)
    if (v) url.searchParams.set("status", v)
    else url.searchParams.delete("status")
    window.history.replaceState({}, "", url.pathname + url.search)
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading level="h1">Marketplace orders</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Cross-app feed: customer checkout + cook fulfilment
            {ordersQ.data?.count != null ? ` · ${ordersQ.data.count} total` : ""}
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <div className="w-[220px]">
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => onStatusChange(v === "all" ? "" : v)}
            >
              <Select.Trigger>
                <Select.Value placeholder="All statuses" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All statuses</Select.Item>
                {statusOptions.map((s) => (
                  <Select.Item key={s} value={s}>
                    {statusLabel(s)}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <Button
            size="small"
            variant="secondary"
            onClick={() => void ordersQ.refetch()}
            isLoading={ordersQ.isFetching}
          >
            Refresh
          </Button>
        </div>
      </div>

      {ordersQ.error && (
        <Container className="border-ui-border-error bg-ui-bg-error-subtle p-4">
          <Text size="small" className="text-ui-fg-error">
            {errMessage(ordersQ.error)}
          </Text>
        </Container>
      )}

      <div className="grid grid-cols-1 gap-4 large:grid-cols-2">
        <DataDonutChart
          title="Status mix (sample)"
          caption="Full breakdown in Visual charts. Filter table below by status."
          data={(chartsQ.data?.orders?.by_status || []).map((d: { name: string; value: number }) => ({
            ...d,
            name: statusLabel(d.name),
            fill: statusChartColor(d.name),
          }))}
        />
        <DataBarChart
          title="Top cooks by GMV"
          caption="Which kitchens generate the most revenue in the last 30 days."
          data={(chartsQ.data?.orders?.top_cooks_by_gmv_cents || []).map((d: { name: string; value: number }) => ({
            name: d.name,
            value: d.value / 100,
          }))}
          layout="horizontal"
          valueFormatter={(v) => formatSgd(v)}
        />
      </div>

      <Container className="divide-y p-0 overflow-hidden">
        <div className="px-6 py-4">
          <Heading level="h2">
            Live board ({orders.length}
            {statusFilter ? ` · ${statusLabel(statusFilter)}` : ""})
          </Heading>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Order</Table.HeaderCell>
                <Table.HeaderCell>Items</Table.HeaderCell>
                <Table.HeaderCell>Cook / Customer</Table.HeaderCell>
                <Table.HeaderCell>Collection</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Total</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {ordersQ.isLoading && (
                <Table.Row>
                  <ShcTableCell colSpan={6}>
                    <Text size="small">Loading orders…</Text>
                  </ShcTableCell>
                </Table.Row>
              )}
              {!ordersQ.isLoading && orders.length === 0 && (
                <Table.Row>
                  <ShcTableCell colSpan={6}>
                    <Text size="small" className="text-ui-fg-subtle">
                      No orders match this filter.
                    </Text>
                  </ShcTableCell>
                </Table.Row>
              )}
              {orders.map((o) => (
                <Table.Row key={o.id}>
                  <Table.Cell>
                    <Text size="small" weight="plus" className="font-mono">
                      {shortId(o.id, 16)}
                    </Text>
                    {o.is_corporate && (
                      <Badge size="2xsmall" className="mt-1">
                        Corporate
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small">{o.item_summary || "—"}</Text>
                    {o.paynow_reference && (
                      <Text size="xsmall" className="text-ui-fg-subtle">
                        PayNow {o.paynow_reference}
                      </Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="xsmall" className="font-mono text-ui-fg-subtle">
                      c:{shortId(o.cook_id, 10)}
                    </Text>
                    <Text size="xsmall" className="font-mono text-ui-fg-subtle">
                      u:{shortId(o.customer_id, 10)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small">
                      {o.collection_date || "—"} {o.collection_slot || ""}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall">{statusLabel(o.shc_status)}</Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <Text size="small" weight="plus">
                      {formatSgd(o.total)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Orders",
  rank: 1,
})

export const handle = {
  breadcrumb: () => "Orders",
}

export default withShcQuery(ShcOpsOrdersPage)

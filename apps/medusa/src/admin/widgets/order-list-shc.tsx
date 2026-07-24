import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Select, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { errMessage, shcGet } from "../lib/shc-api"
import { formatSgd, shortId, statusLabel } from "../lib/shc-format"
import { withShcQuery } from "../lib/shc-query"
import { shcOpsLiveQuery, shcOpsLiveQueryFast } from "../lib/shc-ops-polling"
import { ShcTableCell } from "../lib/table-cell"

type OrderRow = {
  id: string
  cook_id?: string
  customer_id?: string
  shc_status: string
  collection_date?: string
  collection_slot?: string
  item_summary?: string
  total?: number
  total_cents?: number
  updated_at?: string
  is_corporate?: boolean
}

type OrdersResponse = {
  orders: OrderRow[]
  count?: number
  by_status?: Record<string, number>
}

type SortKey = "status" | "date" | "total"

const ShcOrderListMirror = () => {
  const [statusFilter, setStatusFilter] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("date")

  const ordersQ = useQuery({
    queryKey: ["shc-mirror", "orders", statusFilter],
    queryFn: () => {
      const q = new URLSearchParams({ limit: "100" })
      if (statusFilter) q.set("status", statusFilter)
      return shcGet<OrdersResponse>(`/admin/shc/orders?${q.toString()}`)
    },
    ...shcOpsLiveQueryFast,
  })

  const orders = useMemo(() => {
    const rows = [...(ordersQ.data?.orders || [])]
    rows.sort((a, b) => {
      if (sortKey === "status") {
        return String(a.shc_status || "").localeCompare(String(b.shc_status || ""))
      }
      if (sortKey === "total") {
        const ta = a.total_cents ?? Math.round(Number(a.total || 0) * 100)
        const tb = b.total_cents ?? Math.round(Number(b.total || 0) * 100)
        return tb - ta
      }
      const da = a.updated_at ? new Date(a.updated_at).getTime() : 0
      const db = b.updated_at ? new Date(b.updated_at).getTime() : 0
      return db - da
    })
    return rows
  }, [ordersQ.data?.orders, sortKey])

  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    for (const o of ordersQ.data?.orders || []) set.add(String(o.shc_status || "unknown"))
    Object.keys(ordersQ.data?.by_status || {}).forEach((s) => set.add(s))
    return Array.from(set).sort()
  }, [ordersQ.data])

  return (
    <Container className="divide-y p-0 overflow-hidden mb-4">
      <div className="px-6 py-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading level="h2">
            Marketplace orders
            {ordersQ.data?.count != null ? ` (${ordersQ.data.count})` : ""}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            SHC marketplace (read-only) — full ops in SHC Ops
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[180px]">
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
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
          <div className="w-[160px]">
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <Select.Trigger>
                <Select.Value placeholder="Sort" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="date">Sort: date</Select.Item>
                <Select.Item value="status">Sort: status</Select.Item>
                <Select.Item value="total">Sort: total</Select.Item>
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
        <div className="px-6 py-3">
          <Text size="small" className="text-ui-fg-error">
            {errMessage(ordersQ.error)}
          </Text>
        </div>
      )}

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
                  <Text size="small">Loading marketplace orders…</Text>
                </ShcTableCell>
              </Table.Row>
            )}
            {!ordersQ.isLoading && orders.length === 0 && (
              <Table.Row>
                <ShcTableCell colSpan={6}>
                  <Text size="small" className="text-ui-fg-subtle">
                    No SHC orders match this filter.
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
                    {o.total_cents != null
                      ? formatSgd(o.total_cents, "cents")
                      : formatSgd(o.total)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.list.before",
})

export default withShcQuery(ShcOrderListMirror)

import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Select, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { errMessage, shcGet } from "../lib/shc-api"
import { shortId, statusLabel } from "../lib/shc-format"
import { withShcQuery } from "../lib/shc-query"
import { ShcTableCell } from "../lib/table-cell"

type AvailabilityRow = {
  id: string
  product_id: string
  name: string
  portions_per_day?: number | null
  collection_days_label?: string
  time_slots_label?: string
  paused?: boolean
  status: string
}

type AvailabilityResponse = {
  availability: AvailabilityRow[]
  count?: number
  by_status?: Record<string, number>
}

type SortKey = "name" | "portions" | "status"

const ShcInventoryListMirror = () => {
  const [statusFilter, setStatusFilter] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("name")

  const availQ = useQuery({
    queryKey: ["shc-mirror", "availability", statusFilter],
    queryFn: () => {
      const q = new URLSearchParams({ limit: "100" })
      if (statusFilter === "paused") q.set("paused", "true")
      if (statusFilter === "active") q.set("paused", "false")
      return shcGet<AvailabilityResponse>(`/admin/shc/availability?${q.toString()}`)
    },
    refetchInterval: 60_000,
  })

  const rows = useMemo(() => {
    const list = [...(availQ.data?.availability || [])]
    list.sort((a, b) => {
      if (sortKey === "portions") {
        return (b.portions_per_day || 0) - (a.portions_per_day || 0)
      }
      if (sortKey === "status") {
        return String(a.status || "").localeCompare(String(b.status || ""))
      }
      return String(a.name || "").localeCompare(String(b.name || ""))
    })
    return list
  }, [availQ.data?.availability, sortKey])

  return (
    <Container className="divide-y p-0 overflow-hidden mb-4">
      <div className="px-6 py-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading level="h2">
            Portion availability
            {availQ.data?.count != null ? ` (${availQ.data.count})` : ""}
          </Heading>
          <Text size="small" className="text-ui-fg-subtle">
            SHC marketplace (read-only) — full ops in SHC Ops
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[160px]">
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}
            >
              <Select.Trigger>
                <Select.Value placeholder="All statuses" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All statuses</Select.Item>
                <Select.Item value="active">{statusLabel("active")}</Select.Item>
                <Select.Item value="paused">{statusLabel("paused")}</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <div className="w-[170px]">
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <Select.Trigger>
                <Select.Value placeholder="Sort" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="name">Sort: name</Select.Item>
                <Select.Item value="portions">Sort: portions</Select.Item>
                <Select.Item value="status">Sort: status</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <Button
            size="small"
            variant="secondary"
            onClick={() => void availQ.refetch()}
            isLoading={availQ.isFetching}
          >
            Refresh
          </Button>
        </div>
      </div>

      {availQ.error && (
        <div className="px-6 py-3">
          <Text size="small" className="text-ui-fg-error">
            {errMessage(availQ.error)}
          </Text>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Listing</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Portions / day</Table.HeaderCell>
              <Table.HeaderCell>Collection days</Table.HeaderCell>
              <Table.HeaderCell>Time slots</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {availQ.isLoading && (
              <Table.Row>
                <ShcTableCell colSpan={5}>
                  <Text size="small">Loading portion availability…</Text>
                </ShcTableCell>
              </Table.Row>
            )}
            {!availQ.isLoading && rows.length === 0 && (
              <Table.Row>
                <ShcTableCell colSpan={5}>
                  <Text size="small" className="text-ui-fg-subtle">
                    No SHC availability rows match this filter.
                  </Text>
                </ShcTableCell>
              </Table.Row>
            )}
            {rows.map((r) => (
              <Table.Row key={r.id || r.product_id}>
                <Table.Cell>
                  <Text size="small" weight="plus">
                    {r.name}
                  </Text>
                  <Text size="xsmall" className="font-mono text-ui-fg-subtle">
                    {shortId(r.product_id, 18)}
                  </Text>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Text size="small" weight="plus">
                    {r.portions_per_day ?? "—"}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{r.collection_days_label || "—"}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{r.time_slots_label || "—"}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="2xsmall">{statusLabel(r.status)}</Badge>
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
  zone: "inventory_item.list.before",
})

export default withShcQuery(ShcInventoryListMirror)

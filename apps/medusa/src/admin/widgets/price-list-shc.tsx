import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Select, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { errMessage, shcGet } from "../lib/shc-api"
import { formatSgd, shortId, statusLabel } from "../lib/shc-format"
import { withShcQuery } from "../lib/shc-query"
import { ShcTableCell } from "../lib/table-cell"

type ListingRow = {
  id: string
  product_id: string
  name: string
  cook_id?: string
  cuisine?: string | null
  price_cents?: number | null
  price?: number | null
  min_qty?: number
  status: string
}

type ListingsResponse = {
  listings: ListingRow[]
  count?: number
}

type SortKey = "price" | "name" | "cook"

const ShcPriceListMirror = () => {
  const [statusFilter, setStatusFilter] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("price")

  const listingsQ = useQuery({
    queryKey: ["shc-mirror", "price-listings", statusFilter],
    queryFn: () => {
      const q = new URLSearchParams({ limit: "100" })
      if (statusFilter) q.set("status", statusFilter)
      return shcGet<ListingsResponse>(`/admin/shc/listings?${q.toString()}`)
    },
    refetchInterval: 60_000,
  })

  const listings = useMemo(() => {
    const rows = [...(listingsQ.data?.listings || [])]
    rows.sort((a, b) => {
      if (sortKey === "name") {
        return String(a.name || "").localeCompare(String(b.name || ""))
      }
      if (sortKey === "cook") {
        return String(a.cook_id || "").localeCompare(String(b.cook_id || ""))
      }
      return (b.price_cents || 0) - (a.price_cents || 0)
    })
    return rows
  }, [listingsQ.data?.listings, sortKey])

  return (
    <Container className="divide-y p-0 overflow-hidden mb-4">
      <div className="px-6 py-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Heading level="h2">
            Listing prices
            {listingsQ.data?.count != null ? ` (${listingsQ.data.count})` : ""}
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
          <div className="w-[160px]">
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <Select.Trigger>
                <Select.Value placeholder="Sort" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="price">Sort: price</Select.Item>
                <Select.Item value="name">Sort: name</Select.Item>
                <Select.Item value="cook">Sort: cook</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <Button
            size="small"
            variant="secondary"
            onClick={() => void listingsQ.refetch()}
            isLoading={listingsQ.isFetching}
          >
            Refresh
          </Button>
        </div>
      </div>

      {listingsQ.error && (
        <div className="px-6 py-3">
          <Text size="small" className="text-ui-fg-error">
            {errMessage(listingsQ.error)}
          </Text>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Listing</Table.HeaderCell>
              <Table.HeaderCell>Cook</Table.HeaderCell>
              <Table.HeaderCell>Min qty</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell className="text-right">Price (SGD)</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {listingsQ.isLoading && (
              <Table.Row>
                <ShcTableCell colSpan={5}>
                  <Text size="small">Loading listing prices…</Text>
                </ShcTableCell>
              </Table.Row>
            )}
            {!listingsQ.isLoading && listings.length === 0 && (
              <Table.Row>
                <ShcTableCell colSpan={5}>
                  <Text size="small" className="text-ui-fg-subtle">
                    No SHC listing prices match this filter.
                  </Text>
                </ShcTableCell>
              </Table.Row>
            )}
            {listings.map((l) => (
              <Table.Row key={l.id}>
                <Table.Cell>
                  <Text size="small" weight="plus">
                    {l.name}
                  </Text>
                  <Text size="xsmall" className="font-mono text-ui-fg-subtle">
                    {shortId(l.product_id, 18)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="xsmall" className="font-mono text-ui-fg-subtle">
                    {shortId(l.cook_id, 12)}
                  </Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{l.min_qty ?? 1}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Badge size="2xsmall">{statusLabel(l.status)}</Badge>
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Text size="small" weight="plus">
                    {l.price_cents != null
                      ? formatSgd(l.price_cents, "cents")
                      : formatSgd(l.price)}
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
  zone: "price_list.list.before",
})

export default withShcQuery(ShcPriceListMirror)

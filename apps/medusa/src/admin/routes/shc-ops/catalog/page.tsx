import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Label, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, type FormEvent } from "react"
import { DataBarChart, DataDonutChart } from "../../../components/shc-charts"
import { shcDelete, shcGet, shcPost, errMessage } from "../../../lib/shc-api"
import { withShcQuery } from "../../../lib/shc-query"
import { ShcTableCell } from "../../../lib/table-cell"

type CatalogCategory = {
  id: string
  label: string
  imageUrl?: string
  enabled?: boolean
  sort_order?: number
}

type CategoriesResponse = {
  categories: CatalogCategory[]
  count?: number
  source?: string
}

const ShcOpsCatalogPage = () => {
  const qc = useQueryClient()
  const [form, setForm] = useState({ id: "", label: "", imageUrl: "", sort_order: "60" })

  const catsQ = useQuery({
    queryKey: ["shc-ops", "categories"],
    queryFn: () => shcGet<CategoriesResponse>("/admin/shc/categories"),
  })

  const chartsQ = useQuery({
    queryKey: ["shc-ops", "charts", "catalog"],
    queryFn: () => shcGet<any>("/admin/shc/charts?days=30"),
  })

  const saveMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => shcPost("/admin/shc/categories", payload),
    onSuccess: () => {
      toast.success("Category saved")
      setForm({ id: "", label: "", imageUrl: "", sort_order: "60" })
      void qc.invalidateQueries({ queryKey: ["shc-ops", "categories"] })
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  const toggleMut = useMutation({
    mutationFn: (cat: CatalogCategory) =>
      shcPost("/admin/shc/categories", {
        id: cat.id,
        label: cat.label,
        imageUrl: cat.imageUrl || "",
        sort_order: cat.sort_order,
        enabled: !cat.enabled,
      }),
    onSuccess: () => {
      toast.success("Category updated")
      void qc.invalidateQueries({ queryKey: ["shc-ops", "categories"] })
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => shcDelete(`/admin/shc/categories?id=${encodeURIComponent(id)}`),
    onSuccess: () => {
      toast.success("Category removed")
      void qc.invalidateQueries({ queryKey: ["shc-ops", "categories"] })
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  const categories = catsQ.data?.categories || []

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.id.trim() || !form.label.trim()) return
    saveMut.mutate({
      id: form.id.trim(),
      label: form.label.trim(),
      imageUrl: form.imageUrl.trim(),
      sort_order: Number(form.sort_order) || 60,
      enabled: true,
    })
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div>
        <Heading level="h1">Catalog presets</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Browse cuisine chips on Discover (not cook-owned). Served via{" "}
          <code className="text-ui-fg-base">GET /store/shc/categories</code>
          {catsQ.data?.source ? ` · source: ${catsQ.data.source}` : ""}
        </Text>
      </div>

      {catsQ.error && (
        <Container className="border-ui-border-error bg-ui-bg-error-subtle p-4">
          <Text size="small" className="text-ui-fg-error">
            {errMessage(catsQ.error)}
          </Text>
        </Container>
      )}

      <div className="grid grid-cols-1 gap-4 large:grid-cols-2">
        <DataBarChart
          title="Cuisine mix (live listings)"
          caption="What cooks actually publish — compare with Discover presets below."
          data={chartsQ.data?.listings?.by_cuisine || []}
          layout="horizontal"
        />
        <DataDonutChart
          title="Listing health"
          caption="Active vs paused dishes across the marketplace."
          data={chartsQ.data?.listings?.by_status || []}
        />
        <DataBarChart
          title="Price bands"
          caption="How dishes are priced — helps set category positioning."
          data={chartsQ.data?.listings?.by_price_bucket || []}
        />
        <DataDonutChart
          title="Discover presets"
          caption="Enabled cuisine chips on customer home screen."
          data={chartsQ.data?.categories?.on_off || []}
          emptyMessage="Default presets in use."
        />
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Add / update category</Heading>
        </div>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 px-6 py-4 small:grid-cols-2 large:grid-cols-5">
          <div className="flex flex-col gap-y-1">
            <Label>Id</Label>
            <Input
              placeholder="e.g. Korean"
              value={form.id}
              onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label>Label</Label>
            <Input
              placeholder="Display label"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label>Image URL</Label>
            <Input
              placeholder="optional"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label>Sort</Label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" isLoading={saveMut.isPending} className="w-full">
              Save
            </Button>
          </div>
        </form>
      </Container>

      <Container className="divide-y p-0 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">Categories ({categories.length})</Heading>
          <Button
            size="small"
            variant="secondary"
            onClick={() => void catsQ.refetch()}
            isLoading={catsQ.isFetching}
          >
            Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Label</Table.HeaderCell>
                <Table.HeaderCell>Id</Table.HeaderCell>
                <Table.HeaderCell>Sort</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {catsQ.isLoading && (
                <Table.Row>
                  <ShcTableCell colSpan={5}>
                    <Text size="small">Loading…</Text>
                  </ShcTableCell>
                </Table.Row>
              )}
              {!catsQ.isLoading && categories.length === 0 && (
                <Table.Row>
                  <ShcTableCell colSpan={5}>
                    <Text size="small" className="text-ui-fg-subtle">
                      No categories saved — store defaults until you save one.
                    </Text>
                  </ShcTableCell>
                </Table.Row>
              )}
              {categories.map((cat) => (
                <Table.Row key={cat.id}>
                  <Table.Cell>
                    <Text size="small" weight="plus">
                      {cat.label}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="font-mono">
                      {cat.id}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small">{cat.sort_order ?? "—"}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall" color={cat.enabled !== false ? "green" : "orange"}>
                      {cat.enabled !== false ? "on" : "off"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex justify-end gap-x-2">
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() =>
                          setForm({
                            id: cat.id,
                            label: cat.label,
                            imageUrl: cat.imageUrl || "",
                            sort_order: String(cat.sort_order ?? 60),
                          })
                        }
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        variant="secondary"
                        isLoading={toggleMut.isPending}
                        onClick={() => toggleMut.mutate(cat)}
                      >
                        {cat.enabled !== false ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="small"
                        variant="danger"
                        isLoading={deleteMut.isPending}
                        onClick={() => {
                          if (window.confirm(`Remove category “${cat.id}”?`)) {
                            deleteMut.mutate(cat.id)
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
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
  label: "Catalog",
  rank: 2,
})

export const handle = {
  breadcrumb: () => "Catalog",
}

export default withShcQuery(ShcOpsCatalogPage)

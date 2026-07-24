import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Select, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { ComplianceFunnelChart } from "../../../components/shc-charts"
import { shcGet, shcPatch, errMessage } from "../../../lib/shc-api"
import { shortId } from "../../../lib/shc-format"
import { withShcQuery, invalidateShcOpsDashboard } from "../../../lib/shc-query"
import { shcOpsLiveQueryFast } from "../../../lib/shc-ops-polling"

type ComplianceDocRow = {
  id: string
  cook_id: string
  cook_display_name?: string
  cook_area?: string | null
  type: "sfa" | "wsq"
  file_key: string
  verified_at?: string | null
  created_at?: string | null
}

type ComplianceResponse = {
  docs: ComplianceDocRow[]
  count?: number
  pending_count?: number
  summary?: {
    total: number
    pending: number
    verified: number
    pending_sfa: number
    pending_wsq: number
    by_type: { sfa: number; wsq: number }
  }
}

const docTypeLabel = (type: string) => (type === "sfa" ? "SFA licence" : type === "wsq" ? "WSQ cert" : type)

const ShcOpsCompliancePage = () => {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<"pending" | "verified" | "all">("pending")

  const complianceQ = useQuery({
    queryKey: ["shc-ops", "compliance", statusFilter],
    queryFn: () => {
      const q = new URLSearchParams({ status: statusFilter, limit: "120" })
      return shcGet<ComplianceResponse>(`/admin/shc/compliance?${q.toString()}`)
    },
    ...shcOpsLiveQueryFast,
  })

  const docs = complianceQ.data?.docs || []

  const cooksPending = useMemo(() => {
    const byCook = new Map<string, ComplianceDocRow[]>()
    for (const d of docs) {
      if (!byCook.has(d.cook_id)) byCook.set(d.cook_id, [])
      byCook.get(d.cook_id)!.push(d)
    }
    return Array.from(byCook.entries()).map(([cook_id, cookDocs]) => ({
      cook_id,
      display_name: cookDocs[0]?.cook_display_name || cook_id,
      area: cookDocs[0]?.cook_area,
      hasSfa: cookDocs.some((d) => d.type === "sfa"),
      hasWsq: cookDocs.some((d) => d.type === "wsq"),
    }))
  }, [docs])

  const verifyDoc = useMutation({
    mutationFn: (doc: ComplianceDocRow) =>
      shcPatch(`/admin/shc/compliance/${encodeURIComponent(doc.id)}/verify`, { verified: true }),
    onSuccess: () => {
      toast.success("Compliance document verified")
      void invalidateShcOpsDashboard(qc)
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  const revokeDoc = useMutation({
    mutationFn: (doc: ComplianceDocRow) =>
      shcPatch(`/admin/shc/compliance/${encodeURIComponent(doc.id)}/verify`, { verified: false }),
    onSuccess: () => {
      toast.success("Verification removed")
      void invalidateShcOpsDashboard(qc)
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  const previewDoc = useMutation({
    mutationFn: (doc: ComplianceDocRow) =>
      shcGet<{ preview_url?: string }>(
        `/admin/shc/compliance/${encodeURIComponent(doc.id)}/preview-url`
      ),
    onSuccess: (data) => {
      if (data.preview_url) {
        window.open(data.preview_url, "_blank", "noopener,noreferrer")
        return
      }
      toast.error("No preview URL returned")
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Heading level="h1">Cook compliance</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Review SFA + WSQ uploads before cooks can Accept paid orders
            {complianceQ.data?.pending_count != null && statusFilter === "pending"
              ? ` · ${complianceQ.data.pending_count} pending`
              : complianceQ.data?.count != null
                ? ` · ${complianceQ.data.count} shown`
                : ""}
          </Text>
        </div>
        <div className="flex items-center gap-x-2">
          <div className="w-[200px]">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="pending">Pending review</Select.Item>
                <Select.Item value="verified">Verified</Select.Item>
                <Select.Item value="all">All uploads</Select.Item>
              </Select.Content>
            </Select>
          </div>
          <Button
            size="small"
            variant="secondary"
            onClick={() => void complianceQ.refetch()}
            isLoading={complianceQ.isFetching}
          >
            Refresh
          </Button>
        </div>
      </div>

      {complianceQ.error && (
        <Container className="border-ui-border-error bg-ui-bg-error-subtle p-4">
          <Text size="small" className="text-ui-fg-error">
            {errMessage(complianceQ.error)}
          </Text>
        </Container>
      )}

      {complianceQ.data?.summary && (
        <ComplianceFunnelChart summary={complianceQ.data.summary} />
      )}

      <div className="grid grid-cols-1 gap-4 small:grid-cols-3">
        <Container className="p-4">
          <Text size="xsmall" weight="plus" className="uppercase text-ui-fg-subtle">
            Total uploads
          </Text>
          <Heading level="h1" className="mt-1">
            {complianceQ.data?.summary?.total ?? "—"}
          </Heading>
          <Text size="xsmall" className="mt-1 text-ui-fg-muted">
            SFA + WSQ certificates on file
          </Text>
        </Container>
        <Container className="p-4">
          <Text size="xsmall" weight="plus" className="uppercase text-ui-fg-subtle">
            Verified
          </Text>
          <Heading level="h1" className="mt-1">
            {complianceQ.data?.summary?.verified ?? "—"}
          </Heading>
          <Text size="xsmall" className="mt-1 text-ui-fg-muted">
            Cooks can Accept paid orders
          </Text>
        </Container>
        <Container className="p-4">
          <Text size="xsmall" weight="plus" className="uppercase text-ui-fg-subtle">
            Awaiting review
          </Text>
          <Heading level="h1" className="mt-1">
            {complianceQ.data?.summary?.pending ?? complianceQ.data?.pending_count ?? "—"}
          </Heading>
          <Text size="xsmall" className="mt-1 text-ui-fg-muted">
            {complianceQ.data?.summary?.pending_sfa ?? 0} SFA ·{" "}
            {complianceQ.data?.summary?.pending_wsq ?? 0} WSQ pending
          </Text>
        </Container>
      </div>

      {statusFilter === "pending" && cooksPending.length > 0 && (
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Cooks awaiting verification</Heading>
            <Text size="small" className="mt-1 text-ui-fg-subtle">
              Both SFA and WSQ must be verified before Accept is enabled on cook apps.
            </Text>
          </div>
          <div className="flex flex-col divide-y">
            {cooksPending.map((cook) => (
              <div key={cook.cook_id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
                <div>
                  <Text size="small" weight="plus">
                    {cook.display_name}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {cook.area || "—"} · {shortId(cook.cook_id, 16)}
                  </Text>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge size="2xsmall" color={cook.hasSfa ? "orange" : "grey"}>
                    SFA {cook.hasSfa ? "to review" : "—"}
                  </Badge>
                  <Badge size="2xsmall" color={cook.hasWsq ? "orange" : "grey"}>
                    WSQ {cook.hasWsq ? "to review" : "—"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Container>
      )}

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Documents</Heading>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Cook</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>File</Table.HeaderCell>
                <Table.HeaderCell>Uploaded</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {complianceQ.isLoading && (
                <Table.Row>
                  <Table.Cell>
                    <Text size="small">Loading…</Text>
                  </Table.Cell>
                </Table.Row>
              )}
              {!complianceQ.isLoading && docs.length === 0 && (
                <Table.Row>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-subtle">
                      {statusFilter === "pending"
                        ? "No documents waiting for review."
                        : "No compliance documents found."}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              )}
              {docs.map((doc) => (
                <Table.Row key={doc.id}>
                  <Table.Cell>
                    <Text size="small" weight="plus">
                      {doc.cook_display_name || doc.cook_id}
                    </Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {doc.cook_area || shortId(doc.cook_id, 12)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall">{docTypeLabel(doc.type)}</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col gap-1">
                      <Text size="xsmall" className="font-mono">
                        {doc.file_key}
                      </Text>
                      <Button
                        size="small"
                        variant="transparent"
                        className="w-fit px-0"
                        onClick={() => previewDoc.mutate(doc)}
                        isLoading={previewDoc.isPending && previewDoc.variables?.id === doc.id}
                      >
                        Preview file
                      </Button>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {doc.created_at ? new Date(doc.created_at).toLocaleString() : "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall" color={doc.verified_at ? "green" : "orange"}>
                      {doc.verified_at ? "Verified" : "Pending"}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    {doc.verified_at ? (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => revokeDoc.mutate(doc)}
                        isLoading={revokeDoc.isPending}
                      >
                        Revoke
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="primary"
                        onClick={() => verifyDoc.mutate(doc)}
                        isLoading={verifyDoc.isPending}
                      >
                        Verify
                      </Button>
                    )}
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
  label: "Compliance",
  rank: 2,
})

export const handle = {
  breadcrumb: () => "Compliance",
}

export default withShcQuery(ShcOpsCompliancePage)

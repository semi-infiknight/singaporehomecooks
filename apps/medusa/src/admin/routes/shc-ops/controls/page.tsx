import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PayoutBatchChart } from "../../../components/shc-charts"
import { shcGet, shcPost, errMessage } from "../../../lib/shc-api"
import { formatSgd } from "../../../lib/shc-format"
import { withShcQuery } from "../../../lib/shc-query"

type Flag = { id?: string; key: string; enabled: boolean; cohort_filter?: Record<string, unknown> }
type Dispute = { id: string; order_id: string; type?: string; raised_by?: string; status?: string }
type Payout = { id: string; week_start?: string; status?: string; total_cents?: number }
type Rule = { id?: string; version?: string | number; rate_pct?: number }
type Synonym = { id?: string; term?: string }

const ShcOpsControlsPage = () => {
  const qc = useQueryClient()

  const coreQ = useQuery({
    queryKey: ["shc-ops", "controls"],
    queryFn: async () => {
      const [ledger, payouts, flags, disputes, commission, expenses, synonyms, stats] =
        await Promise.all([
          shcGet<any>("/admin/shc/ledger").catch(() => ({ entries: [] })),
          shcGet<any>("/admin/shc/payouts").catch(() => ({ batches: [] })),
          shcGet<any>("/admin/shc/feature-flags").catch(() => ({ flags: [] })),
          shcGet<any>("/admin/shc/disputes?status=open").catch(() => ({ disputes: [] })),
          shcGet<any>("/admin/shc/commission-rules").catch(() => ({ rules: [] })),
          shcGet<any>("/admin/shc/cook-expenses").catch(() => ({ expenses: [] })),
          shcGet<any>("/admin/shc/search-synonyms").catch(() => ({ synonyms: [] })),
          shcGet<any>("/admin/shc/platform-stats").catch(() => ({ stats: [] })),
        ])
      return {
        ledger: (ledger.entries || ledger.ledger || []) as unknown[],
        payouts: (payouts.payouts || payouts.batches || []) as Payout[],
        flags: (flags.flags || []) as Flag[],
        disputes: (disputes.disputes || []) as Dispute[],
        commission: (commission.rules || []) as Rule[],
        expenses: (expenses.expenses || []) as unknown[],
        synonyms: (synonyms.synonyms || []) as Synonym[],
        stats: (stats.stats || []) as unknown[],
      }
    },
    refetchInterval: 60_000,
  })

  const data = coreQ.data

  const toggleFlag = useMutation({
    mutationFn: (flag: Flag) =>
      shcPost("/admin/shc/feature-flags", {
        key: flag.key,
        enabled: !flag.enabled,
        cohort_filter: flag.cohort_filter || {},
      }),
    onSuccess: () => {
      toast.success("Feature flag updated")
      void qc.invalidateQueries({ queryKey: ["shc-ops", "controls"] })
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  const resolveDispute = useMutation({
    mutationFn: (dispute: Dispute) =>
      shcPost(`/admin/shc/disputes/${encodeURIComponent(dispute.id)}`, {
        status: "resolved",
        resolution: "Resolved by ops from Medusa Admin SHC Ops.",
      }),
    onSuccess: () => {
      toast.success("Dispute resolved")
      void qc.invalidateQueries({ queryKey: ["shc-ops", "controls"] })
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  const approvePayout = useMutation({
    mutationFn: (batch: Payout) =>
      shcPost(`/admin/shc/payouts/${encodeURIComponent(batch.id)}/approve`, {
        actor: "medusa-admin-shc-ops",
      }),
    onSuccess: () => {
      toast.success("Payout approved")
      void qc.invalidateQueries({ queryKey: ["shc-ops", "controls"] })
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Heading level="h1">Launch controls</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Feature flags, disputes, payouts, commission & search presets
          </Text>
        </div>
        <Button
          size="small"
          variant="secondary"
          onClick={() => void coreQ.refetch()}
          isLoading={coreQ.isFetching}
        >
          Refresh
        </Button>
      </div>

      {coreQ.error && (
        <Container className="border-ui-border-error bg-ui-bg-error-subtle p-4">
          <Text size="small" className="text-ui-fg-error">
            {errMessage(coreQ.error)}
          </Text>
        </Container>
      )}

      <div className="grid grid-cols-1 gap-4 small:grid-cols-2 large:grid-cols-4">
        <Stat label="Ledger entries" value={data?.ledger.length ?? "…"} />
        <Stat label="Payout batches" value={data?.payouts.length ?? "…"} />
        <Stat label="Feature flags" value={data?.flags.length ?? "…"} />
        <Stat label="Open disputes" value={data?.disputes.length ?? "…"} />
      </div>

      <div className="grid grid-cols-1 gap-4 large:grid-cols-2">
        <PayoutBatchChart batches={data?.payouts || []} />
        <Container className="p-4">
          <Heading level="h2">Feature flags at a glance</Heading>
          <Text size="small" className="mt-1 text-ui-fg-subtle">
            Green = live for customers/cooks. Orange = paused gate — no redeploy needed.
          </Text>
          <div className="mt-4 flex flex-wrap gap-2">
            {(data?.flags || []).length === 0 && !coreQ.isLoading && (
              <Text size="small" className="text-ui-fg-subtle">
                No feature flags configured.
              </Text>
            )}
            {(data?.flags || []).map((flag) => (
              <Badge key={flag.key} size="small" color={flag.enabled ? "green" : "orange"}>
                {flag.key}: {flag.enabled ? "ON" : "OFF"}
              </Badge>
            ))}
          </div>
          <Text size="xsmall" className="mt-4 text-ui-fg-muted">
            {(data?.flags || []).filter((f) => f.enabled).length} of {(data?.flags || []).length} gates
            open · {(data?.disputes || []).length} disputes need resolution
          </Text>
        </Container>
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Launch gates</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Toggle high-risk features without redeploying
          </Text>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 small:grid-cols-2">
          {(data?.flags || []).length === 0 && !coreQ.isLoading && (
            <Text size="small" className="text-ui-fg-subtle">
              No feature flags yet.
            </Text>
          )}
          {(data?.flags || []).map((flag) => (
            <div
              key={flag.id || flag.key}
              className="flex items-center justify-between gap-3 rounded-md border border-ui-border-base p-4"
            >
              <div>
                <Text size="small" weight="plus" className="font-mono">
                  {flag.key}
                </Text>
                <Badge size="2xsmall" color={flag.enabled ? "green" : "orange"} className="mt-1">
                  {flag.enabled ? "on" : "off"}
                </Badge>
              </div>
              <Button
                size="small"
                variant={flag.enabled ? "secondary" : "primary"}
                isLoading={toggleFlag.isPending}
                onClick={() => toggleFlag.mutate(flag)}
              >
                {flag.enabled ? "Pause" : "Enable"}
              </Button>
            </div>
          ))}
        </div>
      </Container>

      <div className="grid grid-cols-1 gap-4 large:grid-cols-2">
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Open disputes</Heading>
          </div>
          <div className="flex flex-col gap-3 px-6 py-4">
            {(data?.disputes || []).length === 0 && (
              <Text size="small" className="text-ui-fg-subtle">
                No open disputes.
              </Text>
            )}
            {(data?.disputes || []).slice(0, 8).map((d) => (
              <div
                key={d.id}
                className="rounded-md border border-ui-border-base p-3"
              >
                <Text size="small" weight="plus" className="font-mono">
                  {d.order_id}
                </Text>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {d.type || "dispute"} · {d.raised_by || "—"}
                </Text>
                <Button
                  size="small"
                  variant="secondary"
                  className="mt-2"
                  isLoading={resolveDispute.isPending}
                  onClick={() => resolveDispute.mutate(d)}
                >
                  Mark resolved
                </Button>
              </div>
            ))}
          </div>
        </Container>

        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Payout queue</Heading>
          </div>
          <div className="flex flex-col gap-3 px-6 py-4">
            {(data?.payouts || []).length === 0 && (
              <Text size="small" className="text-ui-fg-subtle">
                No payout batches yet.
              </Text>
            )}
            {(data?.payouts || []).slice(0, 6).map((batch) => (
              <div
                key={batch.id}
                className="rounded-md border border-ui-border-base p-3"
              >
                <div className="flex items-center justify-between">
                  <Text size="small" weight="plus" className="font-mono">
                    {batch.week_start || batch.id}
                  </Text>
                  <Badge
                    size="2xsmall"
                    color={batch.status === "pending" ? "orange" : "green"}
                  >
                    {batch.status || "—"}
                  </Badge>
                </div>
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {formatSgd(batch.total_cents, "cents")}
                </Text>
                {batch.status === "pending" && (
                  <Button
                    size="small"
                    variant="secondary"
                    className="mt-2"
                    isLoading={approvePayout.isPending}
                    onClick={() => approvePayout.mutate(batch)}
                  >
                    Approve
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Container>
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Commission · Search · Stats</Heading>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 small:grid-cols-3">
          <div className="rounded-md border border-ui-border-base p-3">
            <Text size="xsmall" weight="plus" className="uppercase text-ui-fg-subtle">
              Commission
            </Text>
            {(data?.commission || []).length === 0 ? (
              <Text size="small" className="mt-1">
                No rules
              </Text>
            ) : (
              (data?.commission || []).slice(0, 3).map((rule) => (
                <Text key={String(rule.id || rule.version)} size="small" className="mt-1">
                  v{rule.version}: {rule.rate_pct}%
                </Text>
              ))
            )}
          </div>
          <div className="rounded-md border border-ui-border-base p-3">
            <Text size="xsmall" weight="plus" className="uppercase text-ui-fg-subtle">
              Synonyms
            </Text>
            {(data?.synonyms || []).length === 0 ? (
              <Text size="small" className="mt-1">
                None
              </Text>
            ) : (
              (data?.synonyms || []).slice(0, 3).map((s) => (
                <Text key={String(s.id || s.term)} size="small" className="mt-1">
                  {s.term}
                </Text>
              ))
            )}
          </div>
          <div className="rounded-md border border-ui-border-base p-3">
            <Text size="xsmall" weight="plus" className="uppercase text-ui-fg-subtle">
              Platform stats
            </Text>
            <Text size="small" className="mt-1">
              {data?.stats.length ?? 0} keys
            </Text>
            <Text size="xsmall" className="text-ui-fg-subtle">
              {data?.expenses.length ?? 0} cook expenses
            </Text>
          </div>
        </div>
      </Container>
    </div>
  )
}

const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <Container className="p-4">
    <Text size="xsmall" weight="plus" className="uppercase text-ui-fg-subtle">
      {label}
    </Text>
    <Heading level="h1" className="mt-1">
      {value}
    </Heading>
  </Container>
)

export const config = defineRouteConfig({
  label: "Controls",
  rank: 3,
})

export const handle = {
  breadcrumb: () => "Controls",
}

export default withShcQuery(ShcOpsControlsPage)

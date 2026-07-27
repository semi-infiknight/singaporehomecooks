import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState, type ReactNode } from "react"
import { PayoutBatchChart, DataBarChart, DataDonutChart, RevenueSplitChart } from "../../../components/shc-charts"
import { shcGet, shcPost, errMessage } from "../../../lib/shc-api"
import { formatSgd } from "../../../lib/shc-format"
import { withShcQuery, invalidateShcOpsDashboard } from "../../../lib/shc-query"
import { shcOpsLiveQuery } from "../../../lib/shc-ops-polling"

type Flag = { id?: string; key: string; enabled: boolean; cohort_filter?: Record<string, unknown> }
type Dispute = { id: string; order_id: string; type?: string; raised_by?: string; status?: string }
type Payout = { id: string; week_start?: string; status?: string; total_cents?: number }
type Rule = { id?: string; version?: string | number; rate_pct?: number; effective_from?: string }
type Synonym = { id?: string; term?: string; expansions?: string[] }
type BusinessRulesConfig = {
  commission: { default_rate_pct: number }
  drop: { customer_window_days: number }
  tiffin: { customize_cutoff_hours: number }
  cart: { one_cook_enforced: boolean }
  review: { eligible_statuses: string[] }
}

const ShcOpsControlsPage = () => {
  const qc = useQueryClient()

  const coreQ = useQuery({
    queryKey: ["shc-ops", "controls"],
    queryFn: async () => {
      const [ledger, payouts, flags, disputes, commission, expenses, synonyms, stats, businessRules] =
        await Promise.all([
          shcGet<any>("/admin/shc/ledger").catch(() => ({ entries: [] })),
          shcGet<any>("/admin/shc/payouts").catch(() => ({ batches: [] })),
          shcGet<any>("/admin/shc/feature-flags").catch(() => ({ flags: [] })),
          shcGet<any>("/admin/shc/disputes?status=open").catch(() => ({ disputes: [] })),
          shcGet<any>("/admin/shc/commission-rules").catch(() => ({ rules: [] })),
          shcGet<any>("/admin/shc/cook-expenses").catch(() => ({ expenses: [] })),
          shcGet<any>("/admin/shc/search-synonyms").catch(() => ({ synonyms: [] })),
          shcGet<any>("/admin/shc/platform-stats").catch(() => ({ stats: [] })),
          shcGet<any>("/admin/shc/business-rules").catch(() => ({ config: null })),
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
        businessRules: (businessRules.config || null) as BusinessRulesConfig | null,
      }
    },
    ...shcOpsLiveQuery,
  })

  const chartsQ = useQuery({
    queryKey: ["shc-ops", "charts", "controls"],
    queryFn: () => shcGet<any>("/admin/shc/charts?days=30"),
    ...shcOpsLiveQuery,
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
      void invalidateShcOpsDashboard(qc)
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
      void invalidateShcOpsDashboard(qc)
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
      void invalidateShcOpsDashboard(qc)
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  const saveBusinessRules = useMutation({
    mutationFn: (payload: Partial<BusinessRulesConfig>) => shcPost("/admin/shc/business-rules", payload),
    onSuccess: () => {
      toast.success("Business rules saved")
      void invalidateShcOpsDashboard(qc)
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  const createCommissionRule = useMutation({
    mutationFn: (payload: { version: number; rate_pct: number; effective_from: string }) =>
      shcPost("/admin/shc/commission-rules", { ...payload, created_by: "medusa-admin-shc-ops" }),
    onSuccess: () => {
      toast.success("Commission rule created")
      void invalidateShcOpsDashboard(qc)
    },
    onError: (e) => toast.error(errMessage(e)),
  })

  const upsertSynonym = useMutation({
    mutationFn: (payload: { term: string; expansions: string[] }) =>
      shcPost("/admin/shc/search-synonyms", payload),
    onSuccess: () => {
      toast.success("Search synonym saved")
      void invalidateShcOpsDashboard(qc)
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
        <RevenueSplitChart
          cookCents={chartsQ.data?.ledger?.summary?.cook_earnings_cents ?? 0}
          platformCents={chartsQ.data?.ledger?.summary?.platform_fees_cents ?? 0}
        />
        <DataBarChart
          title="Disputes by type"
          caption="Open disputes listed below — resolve to unblock customer/cook trust."
          data={chartsQ.data?.disputes?.by_type || []}
          layout="horizontal"
        />
        <DataBarChart
          title="Cook expenses by category"
          caption="Reimbursement volume ops should track against payout batches."
          data={chartsQ.data?.expenses?.by_category_cents || []}
          valueFormatter={(v) => formatSgd(v, "cents")}
        />
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
        <DataDonutChart
          title="Feature flags"
          caption="Paused gates hide features without redeploying."
          data={chartsQ.data?.flags?.on_off || []}
          emptyMessage="No feature flags configured."
        />
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

      <BusinessRulesPanel
        config={data?.businessRules}
        isLoading={coreQ.isLoading}
        isSaving={saveBusinessRules.isPending}
        onSave={(payload) => saveBusinessRules.mutate(payload)}
      />

      <div className="grid grid-cols-1 gap-4 large:grid-cols-2">
        <CommissionRulesPanel
          rules={data?.commission || []}
          isCreating={createCommissionRule.isPending}
          onCreate={(payload) => createCommissionRule.mutate(payload)}
        />
        <SearchSynonymsPanel
          synonyms={data?.synonyms || []}
          isSaving={upsertSynonym.isPending}
          onSave={(payload) => upsertSynonym.mutate(payload)}
        />
      </div>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Platform stats</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            KV keys stored for browse chrome, promos, and business rules
          </Text>
        </div>
        <div className="px-6 py-4">
          <Text size="small">
            {data?.stats.length ?? 0} keys · {data?.expenses.length ?? 0} cook expenses logged
          </Text>
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

const BusinessRulesPanel = ({
  config,
  isLoading,
  isSaving,
  onSave,
}: {
  config: BusinessRulesConfig | null | undefined
  isLoading: boolean
  isSaving: boolean
  onSave: (payload: Partial<BusinessRulesConfig>) => void
}) => {
  const [defaultRate, setDefaultRate] = useState("15")
  const [dropWindow, setDropWindow] = useState("7")
  const [tiffinCutoff, setTiffinCutoff] = useState("8")
  const [oneCook, setOneCook] = useState(true)
  const [reviewStatuses, setReviewStatuses] = useState("collected, completed")

  useEffect(() => {
    if (!config) return
    setDefaultRate(String(config.commission.default_rate_pct))
    setDropWindow(String(config.drop.customer_window_days))
    setTiffinCutoff(String(config.tiffin.customize_cutoff_hours))
    setOneCook(config.cart.one_cook_enforced)
    setReviewStatuses(config.review.eligible_statuses.join(", "))
  }, [config])

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Business rules</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Marketplace tunables — commission fallback, drops window, tiffin cutoffs, cart policy, reviews
        </Text>
      </div>
      <div className="grid grid-cols-1 gap-4 px-6 py-4 small:grid-cols-2 large:grid-cols-3">
        <Field label="Default commission %" hint="Fallback when no versioned rule is effective">
          <Input value={defaultRate} onChange={(e) => setDefaultRate(e.target.value)} disabled={isLoading} />
        </Field>
        <Field label="Drop customer window (days)" hint="Cooking soon feed horizon">
          <Input value={dropWindow} onChange={(e) => setDropWindow(e.target.value)} disabled={isLoading} />
        </Field>
        <Field label="Tiffin customize cutoff (hours)" hint="Skip/customize blocked inside this window">
          <Input value={tiffinCutoff} onChange={(e) => setTiffinCutoff(e.target.value)} disabled={isLoading} />
        </Field>
        <Field label="Review-eligible statuses" hint="Comma-separated order statuses">
          <Input value={reviewStatuses} onChange={(e) => setReviewStatuses(e.target.value)} disabled={isLoading} />
        </Field>
        <div className="flex items-center justify-between rounded-md border border-ui-border-base p-4">
          <div>
            <Text size="small" weight="plus">
              One cook per cart
            </Text>
            <Text size="xsmall" className="text-ui-fg-subtle">
              Enforce single-kitchen carts for evergreen dishes
            </Text>
          </div>
          <Switch checked={oneCook} onCheckedChange={setOneCook} disabled={isLoading} />
        </div>
      </div>
      <div className="flex justify-end px-6 py-4">
        <Button
          size="small"
          isLoading={isSaving}
          disabled={isLoading}
          onClick={() =>
            onSave({
              commission: { default_rate_pct: Number(defaultRate) },
              drop: { customer_window_days: Number(dropWindow) },
              tiffin: { customize_cutoff_hours: Number(tiffinCutoff) },
              cart: { one_cook_enforced: oneCook },
              review: {
                eligible_statuses: reviewStatuses
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
        >
          Save business rules
        </Button>
      </div>
    </Container>
  )
}

const CommissionRulesPanel = ({
  rules,
  isCreating,
  onCreate,
}: {
  rules: Rule[]
  isCreating: boolean
  onCreate: (payload: { version: number; rate_pct: number; effective_from: string }) => void
}) => {
  const nextVersion = Math.max(0, ...rules.map((r) => Number(r.version || 0))) + 1
  const [version, setVersion] = useState(String(nextVersion))
  const [ratePct, setRatePct] = useState("15")
  const [effectiveFrom, setEffectiveFrom] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    setVersion(String(nextVersion))
  }, [nextVersion])

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Commission schedule</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Versioned rules override the default commission % above
        </Text>
      </div>
      <div className="flex flex-col gap-2 px-6 py-4">
        {rules.length === 0 ? (
          <Text size="small" className="text-ui-fg-subtle">
            No versioned rules — using business-rules default.
          </Text>
        ) : (
          rules.slice(0, 6).map((rule) => (
            <Text key={String(rule.id || rule.version)} size="small">
              v{rule.version}: {rule.rate_pct}% · effective {rule.effective_from || "—"}
            </Text>
          ))
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 px-6 py-4 small:grid-cols-3">
        <Field label="Version">
          <Input value={version} onChange={(e) => setVersion(e.target.value)} />
        </Field>
        <Field label="Rate %">
          <Input value={ratePct} onChange={(e) => setRatePct(e.target.value)} />
        </Field>
        <Field label="Effective from">
          <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
        </Field>
      </div>
      <div className="flex justify-end px-6 py-4">
        <Button
          size="small"
          variant="secondary"
          isLoading={isCreating}
          onClick={() =>
            onCreate({
              version: Number(version),
              rate_pct: Number(ratePct),
              effective_from: effectiveFrom,
            })
          }
        >
          Add commission rule
        </Button>
      </div>
    </Container>
  )
}

const SearchSynonymsPanel = ({
  synonyms,
  isSaving,
  onSave,
}: {
  synonyms: Synonym[]
  isSaving: boolean
  onSave: (payload: { term: string; expansions: string[] }) => void
}) => {
  const [term, setTerm] = useState("")
  const [expansions, setExpansions] = useState("")

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Search synonyms</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Local food term expansions for discover search
        </Text>
      </div>
      <div className="flex flex-col gap-2 px-6 py-4">
        {synonyms.length === 0 ? (
          <Text size="small" className="text-ui-fg-subtle">
            No synonyms configured.
          </Text>
        ) : (
          synonyms.slice(0, 8).map((s) => (
            <Text key={String(s.id || s.term)} size="small">
              <span className="font-mono">{s.term}</span>
              {s.expansions?.length ? ` → ${s.expansions.join(", ")}` : ""}
            </Text>
          ))
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 px-6 py-4">
        <Field label="Term">
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="nasi lemak" />
        </Field>
        <Field label="Expansions" hint="Comma-separated">
          <Input
            value={expansions}
            onChange={(e) => setExpansions(e.target.value)}
            placeholder="coconut rice, malay breakfast"
          />
        </Field>
      </div>
      <div className="flex justify-end px-6 py-4">
        <Button
          size="small"
          variant="secondary"
          isLoading={isSaving}
          disabled={!term.trim()}
          onClick={() =>
            onSave({
              term: term.trim(),
              expansions: expansions
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        >
          Save synonym
        </Button>
      </div>
    </Container>
  )
}

const Field = ({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) => (
  <div className="flex flex-col gap-1.5">
    <Label>{label}</Label>
    {children}
    {hint ? (
      <Text size="xsmall" className="text-ui-fg-subtle">
        {hint}
      </Text>
    ) : null}
  </div>
)

export const config = defineRouteConfig({
  label: "Controls",
  rank: 3,
})

export const handle = {
  breadcrumb: () => "Controls",
}

export default withShcQuery(ShcOpsControlsPage)

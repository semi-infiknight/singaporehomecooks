/**
 * SHC Ops chart primitives — Recharts wrappers with ops-friendly captions.
 * Used across /app/shc-ops/* admin routes.
 */
import type { ReactNode } from "react"
import { Container, Heading, Text } from "@medusajs/ui"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { statusChartColor, statusLabel } from "../lib/shc-format"

export const CHART_COLORS = {
  primary: "#3B82F6",
  success: "#16A34A",
  warning: "#D97706",
  error: "#DC2626",
  muted: "#94A3B8",
  peach: "#D96C4A",
  mint: "#15803D",
  purple: "#7C3AED",
  cyan: "#0891B2",
} as const

const PIE_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.peach,
  CHART_COLORS.purple,
  CHART_COLORS.cyan,
  CHART_COLORS.muted,
  CHART_COLORS.error,
]

export type ChartDatum = { name: string; value: number; fill?: string }

export function ChartCard({
  title,
  caption,
  children,
  height = 280,
}: {
  title: string
  caption: string
  children: ReactNode
  height?: number
}) {
  return (
    <Container className="p-4">
      <Heading level="h2">{title}</Heading>
      <Text size="small" className="mt-1 text-ui-fg-subtle">
        {caption}
      </Text>
      <div className="mt-4" style={{ width: "100%", height }}>
        {children}
      </div>
    </Container>
  )
}

function formatAxisDate(iso: string): string {
  if (!iso || iso.length < 10) return iso
  const d = new Date(iso + "T12:00:00Z")
  return d.toLocaleDateString("en-SG", { month: "short", day: "numeric" })
}

function formatSgdAxis(cents: number): string {
  return `S$${(cents / 100).toFixed(0)}`
}

/** Orders + paid progression — shows checkout conversion over time. */
export function OrdersTrendChart({
  series,
}: {
  series: Array<{ date: string; orders: number; paid: number }>
}) {
  const data = series.map((r) => ({
    ...r,
    label: formatAxisDate(r.date),
    conversion: r.orders > 0 ? Math.round((r.paid / r.orders) * 100) : 0,
  }))

  return (
    <ChartCard
      title="Order volume & payment conversion"
      caption="Blue = all orders created that day. Green = paid or progressing (past cart). Gap = abandoned carts / awaiting PayNow."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11 }}
            width={40}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "conversion") return [`${value}%`, "Paid rate"]
              return [value, name === "orders" ? "Orders" : "Paid+"]
            }}
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="orders"
            name="Orders"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="paid"
            name="Paid+"
            stroke={CHART_COLORS.success}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="conversion"
            name="conversion"
            stroke={CHART_COLORS.warning}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** GMV trend — revenue flowing through marketplace. */
export function GmvTrendChart({
  series,
}: {
  series: Array<{ date: string; gmv_cents: number }>
}) {
  const data = series.map((r) => ({
    ...r,
    label: formatAxisDate(r.date),
    gmv: r.gmv_cents / 100,
  }))

  return (
    <ChartCard
      title="Gross merchandise value (GMV)"
      caption="Total order value per day from paid/progressing orders. Use this to spot demand spikes (festivals, weekends)."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gmvFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.peach} stopOpacity={0.35} />
              <stop offset="95%" stopColor={CHART_COLORS.peach} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `S$${v}`} tick={{ fontSize: 11 }} width={48} />
          <Tooltip formatter={(v: number) => [`S$${v.toFixed(2)}`, "GMV"]} />
          <Area
            type="monotone"
            dataKey="gmv"
            name="GMV"
            stroke={CHART_COLORS.peach}
            fill="url(#gmvFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Order status breakdown — donut for share at a glance. */
export function StatusDonutChart({
  byStatus,
  title = "Order pipeline",
  caption = "Where orders sit in fulfilment. Large cart/pending_payment slices = checkout friction or PayNow delays.",
}: {
  byStatus: Record<string, number>
  title?: string
  caption?: string
}) {
  const data: ChartDatum[] = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([status, value], i) => ({
      name: statusLabel(status),
      value,
      fill: statusChartColor(status) || PIE_PALETTE[i % PIE_PALETTE.length],
    }))

  if (data.length === 0) {
    return (
      <ChartCard title={title} caption={caption} height={200}>
        <Text size="small" className="text-ui-fg-subtle">
          No order data yet.
        </Text>
      </ChartCard>
    )
  }

  const total = data.reduce((n, d) => n + d.value, 0)

  return (
    <ChartCard title={title} caption={caption}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            label={({ name, percent }) =>
              percent > 0.08 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
            }
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={entry.fill || PIE_PALETTE[i % PIE_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number, _n, p: any) => [`${v} (${Math.round((v / total) * 100)}%)`, p?.payload?.name]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Horizontal bar — easier to read many status labels. */
export function StatusBarChart({
  byStatus,
  title = "Orders by status",
  caption = "Click a status on Overview to filter the order board.",
}: {
  byStatus: Record<string, number>
  title?: string
  caption?: string
}) {
  const data = Object.entries(byStatus)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([status, value]) => ({
      name: statusLabel(status),
      value,
      fill: statusChartColor(status),
    }))

  if (data.length === 0) {
    return (
      <ChartCard title={title} caption={caption} height={160}>
        <Text size="small" className="text-ui-fg-subtle">
          No status data.
        </Text>
      </ChartCard>
    )
  }

  return (
    <ChartCard title={title} caption={caption} height={Math.max(200, data.length * 36 + 60)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="value" name="Orders" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Ops action queue — what needs human attention right now. */
export function OpsQueueChart({
  disputes,
  requests,
  compliance,
}: {
  disputes: number
  requests: number
  compliance: number
}) {
  const data: ChartDatum[] = [
    { name: "Compliance docs", value: compliance, fill: CHART_COLORS.warning },
    { name: "Collab requests", value: requests, fill: CHART_COLORS.primary },
    { name: "Open disputes", value: disputes, fill: CHART_COLORS.error },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return (
      <ChartCard
        title="Ops action queue"
        caption="Nothing blocking right now — disputes, collab bids, and compliance reviews are clear."
        height={160}
      >
        <Text size="small" className="text-ui-fg-subtle">
          All clear ✓
        </Text>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title="Ops action queue"
      caption="Items needing admin action. Tackle compliance first — cooks cannot Accept orders until SFA + WSQ verified."
      height={220}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
          <Tooltip />
          <Bar dataKey="value" name="Open items" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Cook supply — active vs pending verification. */
export function CookSupplyChart({
  active,
  pending,
}: {
  active: number
  pending: number
}) {
  const data: ChartDatum[] = [
    { name: "Active (can list)", value: active, fill: CHART_COLORS.success },
    { name: "Pending verification", value: pending, fill: CHART_COLORS.warning },
  ]

  return (
    <ChartCard
      title="Cook supply"
      caption="Active cooks can publish listings. Pending = onboarding incomplete or awaiting ops review."
      height={220}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** HitPay payment request status mix. */
export function HitPayStatusChart({
  byStatus,
}: {
  byStatus: Record<string, number>
}) {
  const data = Object.entries(byStatus || {})
    .filter(([, v]) => v > 0)
    .map(([status, value], i) => ({
      name: status.replace(/_/g, " "),
      value,
      fill:
        status === "completed" || status === "paid"
          ? CHART_COLORS.success
          : status === "pending"
            ? CHART_COLORS.warning
            : PIE_PALETTE[i % PIE_PALETTE.length],
    }))

  if (data.length === 0) {
    return (
      <ChartCard
        title="HitPay status mix"
        caption="Payment request outcomes from HitPay API. Pending = customer hasn't paid yet."
        height={180}
      >
        <Text size="small" className="text-ui-fg-subtle">
          No HitPay requests or API not configured.
        </Text>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title="HitPay status mix"
      caption="Payment request outcomes from HitPay API. High pending = customers abandoning checkout or webhook delays."
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} label>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Weekly payout batches — ops cash-out queue. */
export function PayoutBatchChart({
  batches,
}: {
  batches: Array<{ week_start?: string; total_cents?: number; status?: string }>
}) {
  const data = [...batches]
    .filter((b) => b.week_start)
    .sort((a, b) => String(a.week_start).localeCompare(String(b.week_start)))
    .slice(-8)
    .map((b) => ({
      name: String(b.week_start).slice(5),
      amount: (b.total_cents || 0) / 100,
      fill: b.status === "pending" ? CHART_COLORS.warning : CHART_COLORS.success,
    }))

  if (data.length === 0) {
    return (
      <ChartCard
        title="Payout batches"
        caption="Weekly cook payouts awaiting approval. Orange = pending your sign-off."
        height={180}
      >
        <Text size="small" className="text-ui-fg-subtle">
          No payout batches yet.
        </Text>
      </ChartCard>
    )
  }

  return (
    <ChartCard
      title="Payout batches"
      caption="Weekly cook payouts. Orange bars need approval in the queue below before funds release."
      height={240}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={(v) => `S$${v}`} tick={{ fontSize: 11 }} width={48} />
          <Tooltip formatter={(v: number) => [`S$${v.toFixed(2)}`, "Payout"]} />
          <Bar dataKey="amount" name="Payout" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}

/** Compliance funnel — verified vs pending. */
export function ComplianceFunnelChart({
  summary,
}: {
  summary: {
    pending: number
    verified: number
    pending_sfa: number
    pending_wsq: number
  }
}) {
  const data: ChartDatum[] = [
    { name: "Verified", value: summary.verified, fill: CHART_COLORS.success },
    { name: "Pending SFA", value: summary.pending_sfa, fill: CHART_COLORS.warning },
    { name: "Pending WSQ", value: summary.pending_wsq, fill: CHART_COLORS.peach },
  ].filter((d) => d.value > 0)

  const total = summary.pending + summary.verified

  return (
    <ChartCard
      title="Compliance pipeline"
      caption={`${summary.pending} docs awaiting review. Cooks need both SFA licence + WSQ cert verified before Accept is enabled.`}
      height={240}
    >
      {total === 0 ? (
        <Text size="small" className="text-ui-fg-subtle">
          No compliance uploads yet.
        </Text>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
            <Tooltip />
            <Bar dataKey="value" name="Documents" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  )
}

/** Mini sparkline for KPI cards. */
export function Sparkline({
  values,
  color = CHART_COLORS.primary,
}: {
  values: number[]
  color?: string
}) {
  if (!values.length) return null
  const data = values.map((v, i) => ({ i, v }))
  return (
    <div style={{ width: "100%", height: 40, marginTop: 8 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Area type="monotone" dataKey="v" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={1.5} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

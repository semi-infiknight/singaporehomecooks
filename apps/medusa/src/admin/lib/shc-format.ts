/** Lightweight display helpers for SHC admin UI (avoid pulling full @shc/utils into admin bundle). */

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending payment",
  paid: "Paid",
  accepted: "Accepted",
  preparing: "Preparing",
  ready_for_collection: "Ready for collection",
  completed: "Completed",
  cancelled: "Cancelled",
  disputed: "Disputed",
  refunded: "Refunded",
  active: "Active",
  paused: "Paused",
}

export function statusLabel(status: string | null | undefined): string {
  const s = String(status || "unknown")
  return STATUS_LABELS[s] || s.replace(/_/g, " ")
}

export function formatSgd(centsOrDollars: number | null | undefined, unit: "cents" | "dollars" = "dollars"): string {
  if (centsOrDollars == null || Number.isNaN(Number(centsOrDollars))) return "—"
  const dollars = unit === "cents" ? Number(centsOrDollars) / 100 : Number(centsOrDollars)
  return `S$${dollars.toFixed(dollars % 1 === 0 ? 0 : 2)}`
}

export function shortId(id: string | null | undefined, keep = 12): string {
  if (!id) return "—"
  return id.length > keep + 3 ? `${id.slice(0, keep)}…` : id
}

/** Chart colors keyed by SHC order / ops status. */
const STATUS_CHART_COLORS: Record<string, string> = {
  cart: "#94A3B8",
  pending_payment: "#F59E0B",
  paid: "#3B82F6",
  accepted: "#6366F1",
  preparing: "#8B5CF6",
  ready_for_collection: "#0891B2",
  collected: "#16A34A",
  completed: "#15803D",
  cancelled: "#DC2626",
  disputed: "#EF4444",
  refunded: "#64748B",
  unknown: "#CBD5E1",
}

export function statusChartColor(status: string | null | undefined): string {
  const s = String(status || "unknown").toLowerCase()
  return STATUS_CHART_COLORS[s] || "#64748B"
}

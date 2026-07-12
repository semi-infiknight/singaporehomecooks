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

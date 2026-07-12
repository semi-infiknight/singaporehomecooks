/**
 * Cooking soon / cook batch rules — capacity, deadlines, fill rate.
 */

export function dropRemainingQty(maxQty: number, orderedQty: number): number {
  return Math.max(0, Math.floor(maxQty) - Math.max(0, Math.floor(orderedQty)));
}

export function dropCanOrder(
  status: string,
  maxQty: number,
  orderedQty: number,
  orderByIso: string,
  now = new Date()
): { ok: boolean; reason?: string; remaining: number } {
  const remaining = dropRemainingQty(maxQty, orderedQty);
  if (status !== 'open') {
    return { ok: false, reason: `Batch is ${status.replace(/_/g, ' ')}`, remaining };
  }
  if (remaining <= 0) {
    return { ok: false, reason: 'Sold out', remaining: 0 };
  }
  const deadline = Date.parse(orderByIso);
  if (!Number.isNaN(deadline) && now.getTime() > deadline) {
    return { ok: false, reason: 'Order window closed', remaining };
  }
  return { ok: true, remaining };
}

export function dropClampOrderQty(qty: number, remaining: number): number {
  const q = Math.floor(qty);
  if (q < 1) return 0;
  return Math.min(q, remaining);
}

/** After order_by: if min not met → cancel; else close open batches. */
export function dropPostDeadlineStatus(
  status: string,
  orderedQty: number,
  minQty: number,
  orderByIso: string,
  now = new Date()
): string | null {
  if (status !== 'open' && status !== 'paused') return null;
  const deadline = Date.parse(orderByIso);
  if (Number.isNaN(deadline) || now.getTime() <= deadline) return null;
  if (orderedQty < minQty) return 'cancelled_min_not_met';
  return 'closed';
}

export function dropFillRate(orderedQty: number, maxQty: number): number {
  if (maxQty <= 0) return 0;
  return Math.min(1, orderedQty / maxQty);
}

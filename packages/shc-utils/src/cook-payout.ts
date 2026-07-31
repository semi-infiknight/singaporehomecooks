/** PayNow weekly payout helpers — Singapore Mon–Sun accrual windows (tri-platform). */

const SG_OFFSET_MS = 8 * 60 * 60 * 1000;

export type SingaporeWeekBounds = {
  weekStart: Date;
  weekEnd: Date;
  weekStartIso: string;
};

export type CookPayoutSnapshot = {
  amount_cents: number;
  transfer_ref?: string | null;
  paid_at?: string | null;
  week_start?: string | null;
};

export type CookNextPayoutSnapshot = {
  scheduled_day: string;
  pending_cents: number;
  week_start: string;
};

function toSgLocalParts(ref: Date): { y: number; m: number; d: number; dow: number } {
  const sg = new Date(ref.getTime() + SG_OFFSET_MS);
  return {
    y: sg.getUTCFullYear(),
    m: sg.getUTCMonth() + 1,
    d: sg.getUTCDate(),
    dow: sg.getUTCDay(),
  };
}

function fromSgLocalMidnight(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0) - SG_OFFSET_MS);
}

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function addSgDays(y: number, m: number, d: number, days: number): { y: number; m: number; d: number } {
  const next = fromSgLocalMidnight(y, m, d);
  next.setTime(next.getTime() + days * 24 * 60 * 60 * 1000);
  const parts = toSgLocalParts(next);
  return { y: parts.y, m: parts.m, d: parts.d };
}

/** Current accrual week: Monday 00:00 SG through next Monday 00:00 SG (exclusive). */
export function getSingaporeWeekBounds(reference = new Date()): SingaporeWeekBounds {
  const parts = toSgLocalParts(reference);
  const daysFromMonday = parts.dow === 0 ? 6 : parts.dow - 1;
  const monday = addSgDays(parts.y, parts.m, parts.d, -daysFromMonday);
  const nextMonday = addSgDays(monday.y, monday.m, monday.d, 7);
  return {
    weekStart: fromSgLocalMidnight(monday.y, monday.m, monday.d),
    weekEnd: fromSgLocalMidnight(nextMonday.y, nextMonday.m, nextMonday.d),
    weekStartIso: isoDate(monday.y, monday.m, monday.d),
  };
}

/** Monday (YYYY-MM-DD) for the week immediately before `reference`. */
export function getPreviousWeekStartIso(reference = new Date()): string {
  const current = getSingaporeWeekBounds(reference);
  const parts = toSgLocalParts(current.weekStart);
  const prevMonday = addSgDays(parts.y, parts.m, parts.d, -7);
  return isoDate(prevMonday.y, prevMonday.m, prevMonday.d);
}

export function getWeekBoundsFromStartIso(weekStartIso: string): SingaporeWeekBounds {
  const [y, m, d] = weekStartIso.split('-').map(Number);
  const nextMonday = addSgDays(y, m, d, 7);
  return {
    weekStart: fromSgLocalMidnight(y, m, d),
    weekEnd: fromSgLocalMidnight(nextMonday.y, nextMonday.m, nextMonday.d),
    weekStartIso,
  };
}

/** Next Monday payout date label (after current accrual week). */
export function getNextPayoutMondayIso(reference = new Date()): string {
  const { weekEnd } = getSingaporeWeekBounds(reference);
  const parts = toSgLocalParts(weekEnd);
  return isoDate(parts.y, parts.m, parts.d);
}

export function isWithinSingaporeWeek(isoOrDate: string | Date, bounds: SingaporeWeekBounds): boolean {
  const ts = typeof isoOrDate === 'string' ? new Date(isoOrDate).getTime() : isoOrDate.getTime();
  return ts >= bounds.weekStart.getTime() && ts < bounds.weekEnd.getTime();
}

export function formatPayoutShortDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-SG', {
    timeZone: 'Asia/Singapore',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function formatCookLastPayoutLine(snapshot: CookPayoutSnapshot | null | undefined): string {
  if (!snapshot?.amount_cents) return 'No payouts yet';
  const amount = `S$${(snapshot.amount_cents / 100).toFixed(2)}`;
  const ref = snapshot.transfer_ref ? ` · Ref ${snapshot.transfer_ref}` : '';
  const when = snapshot.paid_at ? ` · ${formatPayoutShortDate(snapshot.paid_at)}` : '';
  return `Last payout: ${amount}${ref}${when}`;
}

export function formatCookNextPayoutLine(snapshot: CookNextPayoutSnapshot | null | undefined): string {
  if (!snapshot) return 'Next payout: Mon';
  const pending = snapshot.pending_cents
    ? ` (pending S$${(snapshot.pending_cents / 100).toFixed(2)})`
    : '';
  return `Next payout: ${snapshot.scheduled_day || 'Mon'}${pending}`;
}

export function cookHasPaynowConfigured(profile: {
  paynow_mobile?: string | null;
  paynow_uen?: string | null;
  payout_legal_name?: string | null;
} | null | undefined): boolean {
  if (!profile) return false;
  const mobile = String(profile.paynow_mobile || '').trim();
  const uen = String(profile.paynow_uen || '').trim();
  const name = String(profile.payout_legal_name || '').trim();
  if (mobile) return true;
  return Boolean(uen && name);
}

export function normalizePaynowMobile(input?: string | null): string | null {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('65') && digits.length === 10) return `+${digits}`;
  if (digits.length === 8) return `+65${digits}`;
  if (digits.startsWith('65') && digits.length === 11) return `+${digits}`;
  return digits.length >= 8 ? `+${digits.replace(/^0+/, '')}` : null;
}

export function normalizePaynowUen(input?: string | null): string | null {
  const trimmed = String(input || '').trim().toUpperCase();
  return trimmed || null;
}

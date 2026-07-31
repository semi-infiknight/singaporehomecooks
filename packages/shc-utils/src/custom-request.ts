/** Custom dish request (v2) — display helpers + copy. API tables remain shc_request / shc_bid. */

export const CUSTOM_REQUEST_COPY = {
  cookBoardTitle: 'Custom requests',
  cookBoardHint: 'Customers describe dishes they want. Send a quote with your price — accepted quotes become collection orders.',
  customerSectionTitle: 'Custom requests',
  customerSectionHint: 'Track quotes from home cooks for dishes you requested.',
  quoteNoun: 'quote',
  quoteNounPlural: 'quotes',
  sendQuote: 'Send quote',
  acceptQuote: 'Accept quote',
  quotePending: 'Quote received',
  quoteAccepted: 'Quote accepted',
  noQuotesYet: 'No quotes yet — home cooks will respond soon.',
  fromCustomRequest: 'From custom request',
  servingsLabel: 'servings',
  guestsLabel: 'guests',
} as const;

export type CustomRequestLine = {
  id: string;
  name: string;
  servings: number;
  notes?: string;
  youtube_url?: string;
};

export type CustomRequestDisplay = {
  id: string;
  status: string;
  occasion?: string;
  summary: string;
  guest_count?: number;
  lines: CustomRequestLine[];
  budget_cents?: number;
  date?: string;
  youtube_url?: string;
  created_at?: string;
};

export type CookQuoteDisplay = {
  id: string;
  cook_id: string;
  cook_name?: string;
  price_cents: number;
  message?: string;
  status: string;
  created_at?: string;
};

/** Parse API request row (legacy body + optional items_json). */
export function parseCustomRequestDisplay(raw: Record<string, unknown>): CustomRequestDisplay {
  const id = String(raw.id || '');
  const status = String(raw.status || 'open');
  const body = String(raw.body || '').trim();
  const guestCount = raw.guest_count != null ? Number(raw.guest_count) : undefined;

  let lines: CustomRequestLine[] = [];
  const itemsRaw = raw.items_json ?? raw.items;
  if (typeof itemsRaw === 'string' && itemsRaw.trim()) {
    try {
      const parsed = JSON.parse(itemsRaw);
      if (Array.isArray(parsed)) {
        lines = parsed.map((row: Record<string, unknown>, i: number) => ({
          id: String(row.id || `line_${i}`),
          name: String(row.name || 'Dish'),
          servings: Math.max(1, Number(row.servings ?? row.qty ?? 1)),
          notes: row.notes ? String(row.notes) : undefined,
          youtube_url: row.youtube_url ? String(row.youtube_url) : undefined,
        }));
      }
    } catch {
      /* fall through */
    }
  } else if (Array.isArray(itemsRaw)) {
    lines = (itemsRaw as Record<string, unknown>[]).map((row, i) => ({
      id: String(row.id || `line_${i}`),
      name: String(row.name || 'Dish'),
      servings: Math.max(1, Number(row.servings ?? row.qty ?? 1)),
      notes: row.notes ? String(row.notes) : undefined,
      youtube_url: row.youtube_url ? String(row.youtube_url) : undefined,
    }));
  }

  if (lines.length === 0 && body) {
    const occasionMatch = body.match(/^([^:]{2,40}):\s*([\s\S]+)$/);
    const occasion = occasionMatch?.[1]?.trim();
    const story = occasionMatch?.[2]?.trim() || body;
    const legacyServings = Math.max(1, Number(raw.party_size) || 1);
    lines = [
      {
        id: 'line_0',
        name: story.slice(0, 120),
        servings: legacyServings,
      },
    ];
    return {
      id,
      status,
      occasion,
      summary: body,
      guest_count: guestCount ?? legacyServings,
      lines,
      budget_cents: raw.budget_cents != null ? Number(raw.budget_cents) : undefined,
      date: raw.date ? String(raw.date) : undefined,
      youtube_url: raw.youtube_url ? String(raw.youtube_url) : undefined,
      created_at: raw.created_at ? String(raw.created_at) : undefined,
    };
  }

  return {
    id,
    status,
    summary: body || lines.map((l) => l.name).join(' · '),
    guest_count: guestCount,
    lines,
    budget_cents: raw.budget_cents != null ? Number(raw.budget_cents) : undefined,
    date: raw.date ? String(raw.date) : undefined,
    youtube_url: raw.youtube_url ? String(raw.youtube_url) : undefined,
    created_at: raw.created_at ? String(raw.created_at) : undefined,
  };
}

export function customRequestStatusLabel(status: string): string {
  switch (status) {
    case 'open':
      return 'Waiting for quotes';
    case 'bidding':
      return 'Quotes received';
    case 'matched':
      return 'Quote accepted';
    case 'closed':
      return 'Closed';
    default:
      return status.replace(/_/g, ' ');
  }
}

export function customRequestStatusVariant(status: string): 'success' | 'warning' | 'default' {
  if (status === 'matched') return 'success';
  if (status === 'open' || status === 'bidding') return 'warning';
  return 'default';
}

export function formatQuoteTotal(cents: number): string {
  return `S$${(cents / 100).toFixed(2)}`;
}

export function totalServings(lines: CustomRequestLine[]): number {
  return lines.reduce((s, l) => s + Math.max(0, l.servings), 0);
}

export function shcServingsBadgeLabel(servings: number | string): string {
  const n = Number(servings);
  if (!Number.isFinite(n) || n < 1) return '— servings';
  return n === 1 ? '1 serving' : `${n} servings`;
}

export function shcGuestCountBadgeLabel(guests: number | string): string {
  const n = Number(guests);
  if (!Number.isFinite(n) || n < 1) return '— guests';
  return n === 1 ? '1 guest' : `${n} guests`;
}

/** Custom dish request (v2) — display helpers + copy. API tables remain shc_request / shc_bid. */

export const CUSTOM_REQUEST_COPY = {
  cookBoardTitle: 'Custom requests',
  customerSectionTitle: 'Custom requests',
  quoteNoun: 'quote',
  quoteNounPlural: 'quotes',
  sendQuote: 'Send bid',
  updateQuote: 'Update bid',
  quoteSaved: 'Bid sent',
  bidSentLabel: 'Bid sent',
  acceptQuote: 'Accept quote',
  acceptSelected: 'Accept selected',
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
  line_items?: CookQuoteLineItem[];
};

export type CookQuoteLineItem = {
  request_line_id: string;
  included: boolean;
  servings?: number;
  price_cents: number;
  name?: string;
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

/** Parse bid/quote row with optional line_items_json. */
export function parseCookQuoteDisplay(
  raw: Record<string, unknown>,
  requestLines?: CustomRequestLine[]
): CookQuoteDisplay {
  const lineMap = new Map((requestLines || []).map((l) => [l.id, l]));
  let line_items: CookQuoteLineItem[] | undefined;
  const itemsRaw = raw.line_items_json ?? raw.line_items;
  if (typeof itemsRaw === 'string' && itemsRaw.trim()) {
    try {
      const parsed = JSON.parse(itemsRaw);
      if (Array.isArray(parsed)) {
        line_items = parsed.map((row: Record<string, unknown>) => {
          const id = String(row.request_line_id || '');
          const reqLine = lineMap.get(id);
          return {
            request_line_id: id,
            included: Boolean(row.included),
            servings: row.servings != null ? Number(row.servings) : reqLine?.servings,
            price_cents: Math.max(0, Number(row.price_cents) || 0),
            name: reqLine?.name,
          };
        });
      }
    } catch {
      /* ignore */
    }
  } else if (Array.isArray(itemsRaw)) {
    line_items = (itemsRaw as Record<string, unknown>[]).map((row) => {
      const id = String(row.request_line_id || '');
      const reqLine = lineMap.get(id);
      return {
        request_line_id: id,
        included: Boolean(row.included),
        servings: row.servings != null ? Number(row.servings) : reqLine?.servings,
        price_cents: Math.max(0, Number(row.price_cents) || 0),
        name: reqLine?.name,
      };
    });
  }

  return {
    id: String(raw.id || ''),
    cook_id: String(raw.cook_id || ''),
    cook_name: raw.cook_name ? String(raw.cook_name) : undefined,
    price_cents: Math.max(0, Number(raw.price_cents) || 0),
    message: raw.message ? String(raw.message) : undefined,
    status: String(raw.status || 'pending'),
    created_at: raw.created_at ? String(raw.created_at) : undefined,
    line_items,
  };
}

/** Default quote lines — all request dishes included, zero price until cook fills in. */
export function buildDefaultQuoteLines(lines: CustomRequestLine[]): CookQuoteLineItem[] {
  return lines.map((line) => ({
    request_line_id: line.id,
    included: true,
    servings: line.servings,
    price_cents: 0,
    name: line.name,
  }));
}

/** Restore quote builder state from a saved cook bid. */
export function buildQuoteLinesFromSaved(
  saved: CookQuoteDisplay,
  requestLines: CustomRequestLine[]
): CookQuoteLineItem[] {
  const savedMap = new Map((saved.line_items || []).map((l) => [l.request_line_id, l]));
  return requestLines.map((line) => {
    const hit = savedMap.get(line.id);
    if (hit) {
      return { ...hit, name: line.name, servings: hit.servings ?? line.servings };
    }
    return {
      request_line_id: line.id,
      included: false,
      servings: line.servings,
      price_cents: 0,
      name: line.name,
    };
  });
}

export function sumIncludedQuoteCents(lineItems: CookQuoteLineItem[]): number {
  return lineItems.filter((l) => l.included).reduce((s, l) => s + Math.max(0, l.price_cents), 0);
}

export function validateClientQuoteLines(lineItems: CookQuoteLineItem[]): { ok: true } | { ok: false; message: string } {
  const included = lineItems.filter((l) => l.included);
  if (!included.length) return { ok: false, message: 'Include at least one dish in your quote.' };
  for (const line of included) {
    if (!line.price_cents || line.price_cents <= 0) {
      return { ok: false, message: `Set a price for ${line.name || 'each included dish'}.` };
    }
  }
  return { ok: true };
}

/** Lines the cook included that the customer can toggle when accepting. */
export function cookIncludedQuoteLines(lineItems?: CookQuoteLineItem[]): CookQuoteLineItem[] {
  return (lineItems || []).filter((l) => l.included);
}

/** Default selection — all cook-included dishes. */
export function defaultCustomerAcceptLineIds(lineItems?: CookQuoteLineItem[]): string[] {
  return cookIncludedQuoteLines(lineItems).map((l) => l.request_line_id);
}

export function sumCustomerAcceptCents(lineItems: CookQuoteLineItem[], selectedIds: string[]): number {
  const selected = new Set(selectedIds);
  return lineItems
    .filter((l) => l.included && selected.has(l.request_line_id))
    .reduce((s, l) => s + Math.max(0, l.price_cents), 0);
}

export function validateCustomerAcceptLines(
  lineItems: CookQuoteLineItem[],
  selectedIds: string[]
): { ok: true } | { ok: false; message: string } {
  const included = cookIncludedQuoteLines(lineItems);
  if (!included.length) return { ok: false, message: 'This quote has no dishes to accept.' };
  if (!selectedIds.length) return { ok: false, message: 'Select at least one dish to accept.' };
  const allowed = new Set(included.map((l) => l.request_line_id));
  for (const id of selectedIds) {
    if (!allowed.has(id)) return { ok: false, message: 'Invalid dish selection.' };
  }
  if (sumCustomerAcceptCents(lineItems, selectedIds) <= 0) {
    return { ok: false, message: 'Selected dishes must have a positive total.' };
  }
  return { ok: true };
}

export function toggleCustomerAcceptLine(selectedIds: string[], lineId: string): string[] {
  return selectedIds.includes(lineId)
    ? selectedIds.filter((id) => id !== lineId)
    : [...selectedIds, lineId];
}

export function buildRequestBodyFromItems(occasion: string | undefined, items: CustomRequestLine[], context?: string): string {
  const names = items.map((i) => i.name.trim()).filter(Boolean);
  const summary = names.length ? names.join(' · ') : (context || '').trim();
  if (occasion && summary) return `${occasion}: ${summary}`;
  return summary || occasion || '';
}

export function newRequestDishLine(seed?: Partial<CustomRequestLine>): CustomRequestLine {
  const id = seed?.id || `line_${Date.now().toString(36)}`;
  return {
    id,
    name: seed?.name || '',
    servings: Math.max(1, Number(seed?.servings) || 4),
    notes: seed?.notes,
    youtube_url: seed?.youtube_url,
  };
}

/**
 * Cook quote line_items validation — shared by POST /bids and accept flow.
 */

export type QuoteLineInput = {
  request_line_id: string;
  included: boolean;
  servings?: number;
  price_cents: number;
};

export type RequestLineRow = {
  id: string;
  name: string;
  servings: number;
};

export function parseRequestLines(itemsJson: unknown): RequestLineRow[] {
  if (typeof itemsJson !== "string" || !itemsJson.trim()) return [];
  try {
    const parsed = JSON.parse(itemsJson);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((row: any, i: number) => ({
      id: String(row.id || `line_${i}`),
      name: String(row.name || "Dish"),
      servings: Math.max(1, Number(row.servings) || 1),
    }));
  } catch {
    return [];
  }
}

export function validateAndNormalizeQuoteLines(
  requestLines: RequestLineRow[],
  lineItems: QuoteLineInput[] | undefined,
  flatPriceCents: number
): { ok: true; lines: QuoteLineInput[]; price_cents: number; line_items_json: string } | { ok: false; message: string } {
  if (!lineItems?.length) {
    if (!flatPriceCents || flatPriceCents <= 0) {
      return { ok: false, message: "Quote total must be positive." };
    }
    return { ok: true, lines: [], price_cents: flatPriceCents, line_items_json: "" };
  }

  const requestIds = new Set(requestLines.map((l) => l.id));
  const normalized: QuoteLineInput[] = [];

  for (const row of lineItems) {
    if (!requestIds.has(row.request_line_id)) {
      return { ok: false, message: "Quote references an unknown dish line." };
    }
    if (row.included && row.price_cents <= 0) {
      return { ok: false, message: "Included dishes need a positive price." };
    }
    normalized.push({
      request_line_id: row.request_line_id,
      included: Boolean(row.included),
      servings: row.servings != null ? Math.max(1, Number(row.servings)) : undefined,
      price_cents: Math.max(0, Math.floor(Number(row.price_cents) || 0)),
    });
  }

  const included = normalized.filter((l) => l.included);
  if (!included.length) {
    return { ok: false, message: "Include at least one dish in your quote." };
  }

  const total = included.reduce((s, l) => s + l.price_cents, 0);
  if (total <= 0) {
    return { ok: false, message: "Quote total must be positive." };
  }

  return {
    ok: true,
    lines: normalized,
    price_cents: total,
    line_items_json: JSON.stringify(normalized),
  };
}

export function buildOrderLinesFromQuote(
  request: { items_json?: string; body?: string; party_size?: number; request_id: string },
  bid: { price_cents?: number; line_items_json?: string },
  requestId: string
): Array<{ product_id: string; name: string; qty: number; price: number }> {
  const requestLines = parseRequestLines(request.items_json);
  const totalCents = bid.price_cents || 0;

  const quoteLinesRaw = bid.line_items_json;
  if (typeof quoteLinesRaw === "string" && quoteLinesRaw.trim()) {
    try {
      const quoteLines = JSON.parse(quoteLinesRaw) as QuoteLineInput[];
      const included = (quoteLines || []).filter((l) => l.included);
      if (included.length) {
        return included.map((q) => {
          const reqLine = requestLines.find((r) => r.id === q.request_line_id);
          const servings = Math.max(1, Number(q.servings) || reqLine?.servings || 1);
          const name = String(reqLine?.name || "Custom dish").slice(0, 120);
          return {
            product_id: `req_${requestId}_line_${q.request_line_id}`,
            name,
            qty: servings,
            price: q.price_cents > 0 ? Math.round(q.price_cents / servings) / 100 : 0,
          };
        });
      }
    } catch {
      /* fallback */
    }
  }

  if (requestLines.length) {
    return requestLines.map((line, i) => {
      const servings = Math.max(1, line.servings);
      const share = requestLines.length === 1 ? totalCents : Math.round(totalCents / requestLines.length);
      return {
        product_id: `req_${requestId}_line_${line.id || i}`,
        name: line.name.slice(0, 120),
        qty: servings,
        price: share > 0 ? Math.round(share / servings) / 100 : 0,
      };
    });
  }

  const partySize = request.party_size || 1;
  return [
    {
      product_id: `req_${requestId}`,
      name: (request.body || "Custom dish request").slice(0, 120),
      qty: partySize,
      price: totalCents > 0 ? Math.round(totalCents / partySize) / 100 : 0,
    },
  ];
}

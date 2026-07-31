import { describe, expect, it } from "vitest";
import {
  buildOrderLinesFromQuote,
  parseRequestLines,
  validateAndNormalizeQuoteLines,
} from "./shc-quote-lines";

describe("shc-quote-lines", () => {
  const requestLines = [
    { id: "a", name: "Laksa", servings: 6 },
    { id: "b", name: "Kueh", servings: 12 },
  ];
  const itemsJson = JSON.stringify(requestLines);

  it("validates per-line quote and sums total", () => {
    const result = validateAndNormalizeQuoteLines(requestLines, [
      { request_line_id: "a", included: true, servings: 6, price_cents: 8000 },
      { request_line_id: "b", included: false, price_cents: 0 },
    ], 0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.price_cents).toBe(8000);
      expect(JSON.parse(result.line_items_json)).toHaveLength(2);
    }
  });

  it("builds order lines from quote line_items_json", () => {
    const items = buildOrderLinesFromQuote(
      { items_json: itemsJson, body: "Party", party_size: 6, request_id: "req_1" },
      {
        price_cents: 8000,
        line_items_json: JSON.stringify([
          { request_line_id: "a", included: true, servings: 6, price_cents: 8000 },
          { request_line_id: "b", included: false, price_cents: 0 },
        ]),
      },
      "req_1"
    );
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Laksa");
    expect(items[0].qty).toBe(6);
  });

  it("parses request lines from items_json", () => {
    expect(parseRequestLines(itemsJson)).toHaveLength(2);
  });
});

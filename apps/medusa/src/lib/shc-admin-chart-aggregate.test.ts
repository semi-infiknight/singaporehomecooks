import { describe, expect, it } from "vitest";
import { countBy, priceBucket, sumBy, topN } from "./shc-admin-chart-aggregate";

describe("shc-admin-chart-aggregate", () => {
  it("countBy groups and sorts descending", () => {
    const rows = [{ s: "paid" }, { s: "paid" }, { s: "cart" }];
    expect(countBy(rows, (r) => r.s)).toEqual([
      { name: "paid", value: 2 },
      { name: "cart", value: 1 },
    ]);
  });

  it("sumBy aggregates numeric values", () => {
    const rows = [
      { cook: "a", cents: 100 },
      { cook: "a", cents: 200 },
      { cook: "b", cents: 50 },
    ];
    expect(sumBy(rows, (r) => r.cook, (r) => r.cents)).toEqual([
      { name: "a", value: 300 },
      { name: "b", value: 50 },
    ]);
  });

  it("topN collapses tail into Other", () => {
    const slices = [
      { name: "a", value: 5 },
      { name: "b", value: 4 },
      { name: "c", value: 3 },
    ];
    expect(topN(slices, 2)).toEqual([
      { name: "a", value: 5 },
      { name: "b", value: 4 },
      { name: "Other", value: 3 },
    ]);
  });

  it("priceBucket buckets SGD ranges", () => {
    expect(priceBucket(800)).toBe("Under S$10");
    expect(priceBucket(1500)).toBe("S$15–19");
    expect(priceBucket(3500)).toBe("S$30+");
  });
});

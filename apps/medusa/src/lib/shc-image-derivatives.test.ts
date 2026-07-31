import { describe, expect, it } from "vitest";
import { listingDerivativeKeys } from "./shc-image-derivatives";

describe("listingDerivativeKeys", () => {
  it("derives hero and thumb keys from object name", () => {
    const keys = listingDerivativeKeys("listings/cook_1/photo.jpg");
    expect(keys.baseKey).toBe("listings/cook_1/photo");
    expect(keys.heroKey).toBe("listings/cook_1/photo-1200.webp");
    expect(keys.thumbKey).toBe("listings/cook_1/photo-400.webp");
  });

  it("normalizes existing derivative suffixes", () => {
    const keys = listingDerivativeKeys("listings/cook_1/photo-400.webp");
    expect(keys.baseKey).toBe("listings/cook_1/photo");
    expect(keys.thumbKey).toBe("listings/cook_1/photo-400.webp");
  });

  it("strips query strings from URLs", () => {
    const keys = listingDerivativeKeys("listings/cook_1/photo.jpg?X-Amz-Signature=abc");
    expect(keys.baseKey).toBe("listings/cook_1/photo");
  });
});

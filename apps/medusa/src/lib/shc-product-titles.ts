/** Canonical display titles — keep in sync with apps/medusa/scripts/seed.ts */
export const SHC_PRODUCT_TITLES: Record<string, string> = {
  dish_nasi_lemak_prawn_001: "Nasi Lemak Sambal Prawn",
  dish_ayam_buah_keluak_002: "Ayam Buah Keluak",
  dish_devils_curry_003: "Eurasian Devil's Curry (Chicken)",
};

export function productTitleFromId(productId: string): string {
  if (SHC_PRODUCT_TITLES[productId]) return SHC_PRODUCT_TITLES[productId];
  return String(productId)
    .replace(/^prod_|^dish_/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
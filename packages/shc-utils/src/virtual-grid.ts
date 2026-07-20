/** Shared grid chunking + default row estimates for virtual lists (web + mobile). */

export const VIRTUAL_DISH_ROW_HEIGHT = 300;
export const VIRTUAL_KITCHEN_ROW_HEIGHT = 128;
export const VIRTUAL_DISH_LIST_ROW_HEIGHT = 88;
export const VIRTUAL_LISTING_ROW_HEIGHT = 112;
export const VIRTUAL_KITCHEN_MENU_ROW_HEIGHT = 80;
export const VIRTUAL_DEFAULT_OVERSCAN = 5;

export function chunkForGrid<T>(items: readonly T[], columns: number): T[][] {
  if (columns < 1) return items.length ? [Array.from(items)] : [];
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += columns) {
    rows.push(items.slice(i, i + columns) as T[]);
  }
  return rows;
}

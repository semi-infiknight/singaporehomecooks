/** Mobile PWA routes that hide the bottom tab bar (matches customer mobile app). */
export const HIDE_MOBILE_TAB_BAR =
  /^\/(?:checkout|product\/|orders\/(?:[^/]+|manage)|chat\/|request|location|search|drops\/|cook\/[^/]+(?:\/ratings)?|tiffin\/(?:kitchen|confirm|planner|manage|calendar|pause|recharge|menu|subscriptions))(?:\/|$)/;

/** Routes where sticky cart bar is hidden (matches mobile HIDE_CART_BAR). */
export const HIDE_MOBILE_STICKY_CART =
  /^\/(?:cart|checkout|product\/|orders\/(?:[^/]+|manage)|chat\/|request|location|search|drops\/|cook\/[^/]+(?:\/ratings)?|tiffin\/(?:kitchen|confirm|planner|manage|menu))(?:\/|$)/;

export function hideMobileTabBar(pathname: string): boolean {
  return HIDE_MOBILE_TAB_BAR.test(pathname || '');
}

export function hideMobileStickyCart(pathname: string): boolean {
  return HIDE_MOBILE_STICKY_CART.test(pathname || '');
}

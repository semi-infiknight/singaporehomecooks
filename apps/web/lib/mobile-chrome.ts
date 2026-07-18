/** Mobile PWA routes that hide the bottom tab bar (matches customer mobile app). */
export const HIDE_MOBILE_TAB_BAR =
  /^\/(checkout|product\/|orders\/[^/]+|request|location|search|tiffin\/(kitchen|confirm|planner|manage|calendar|pause|recharge|menu|subscriptions)|cook\/[^/]+\/ratings)(\/|$)/;

export function hideMobileTabBar(pathname: string): boolean {
  return HIDE_MOBILE_TAB_BAR.test(pathname || '');
}

import { t, type ShcLocale } from './messages';

export function getCartScreenCopy(locale: ShcLocale) {
  return {
    title: t(locale, 'cart.title'),
    signInTitle: t(locale, 'cart.sign_in_title'),
    signInBody: t(locale, 'cart.sign_in_body'),
    guest: t(locale, 'cart.guest'),
    subtitle: (name: string, count: number) =>
      t(locale, count === 1 ? 'cart.subtitle' : 'cart.subtitle_plural')
        .replace('{name}', name)
        .replace('{count}', String(count)),
    emptyTitle: t(locale, 'cart.empty_title'),
    emptyBody: t(locale, 'cart.empty_body'),
    browseDishes: t(locale, 'cart.browse_dishes'),
    portionsLabel: t(locale, 'cart.portions_label'),
    subtotalLabel: t(locale, 'cart.subtotal_label'),
    orderItems: t(locale, 'cart.order_items'),
    totalLabel: t(locale, 'cart.total_label'),
    clearCart: t(locale, 'cart.clear_cart'),
    checkoutBtn: t(locale, 'cart.checkout_btn'),
    minimumHint: t(locale, 'cart.minimum_hint'),
    loading: t(locale, 'cart.loading'),
    keepBrowsing: t(locale, 'cart.keep_browsing'),
    signInBtn: t(locale, 'auth.sign_in_btn'),
    signInBodyWeb: t(locale, 'cart.sign_in_body_web'),
    headerPortions: (count: number) =>
      t(locale, count === 1 ? 'cart.header_portion' : 'cart.header_portions_plural').replace(
        '{count}',
        String(count)
      ),
  };
}

export function getLocationAlertCopy(locale: ShcLocale) {
  return {
    gpsUnavailableTitle: t(locale, 'location.gps_unavailable_title'),
    gpsUnavailableBody: t(locale, 'location.gps_unavailable_body'),
    permissionTitle: t(locale, 'location.permission_title'),
    permissionBody: t(locale, 'location.permission_body'),
    errorTitle: t(locale, 'location.error_title'),
    errorBody: t(locale, 'location.error_body'),
    errorFallback: t(locale, 'location.error_fallback'),
    saveErrorTitle: t(locale, 'location.save_error_title'),
    saveErrorBody: t(locale, 'location.save_error_body'),
  };
}

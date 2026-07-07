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
    processing: t(locale, 'cart.processing'),
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
    linePrice: (qty: number, price: string) =>
      t(locale, 'cart.line_price').replace('{qty}', String(qty)).replace('{price}', price),
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

export type LocationScreenCopy = ReturnType<typeof getLocationScreenCopy>;

export function getLocationScreenCopy(locale: ShcLocale) {
  return {
    collectionBadge: t(locale, 'location.collection_badge'),
    titleStep1: t(locale, 'location.title_step1'),
    titleStep2: t(locale, 'location.title_step2'),
    subtitleStep1: t(locale, 'location.subtitle_step1'),
    subtitleStep2: t(locale, 'location.subtitle_step2'),
    subtitleWeb: t(locale, 'location.subtitle_web'),
    stepFind: t(locale, 'location.step_find'),
    stepConfirm: t(locale, 'location.step_confirm'),
    useGps: t(locale, 'location.use_gps'),
    gettingGps: t(locale, 'location.getting_gps'),
    saved: t(locale, 'location.saved'),
    savedAddresses: t(locale, 'location.saved_addresses'),
    remove: t(locale, 'location.remove'),
    searchSection: t(locale, 'location.search_section'),
    searchPlaceholder: t(locale, 'location.search_placeholder'),
    searchPlaceholderWeb: t(locale, 'location.search_placeholder_web'),
    searchGo: t(locale, 'location.search_go'),
    searching: t(locale, 'location.searching'),
    sourceOnemap: t(locale, 'location.source_onemap'),
    sourceArea: t(locale, 'location.source_area'),
    geocodeLooking: t(locale, 'location.geocode_looking'),
    pinLabel: (lat: number, lng: number) =>
      t(locale, 'location.pin_label').replace('{lat}', lat.toFixed(4)).replace('{lng}', lng.toFixed(4)),
    pinHint: t(locale, 'location.pin_hint'),
    addressLabelSection: t(locale, 'location.address_label_section'),
    labelHome: t(locale, 'location.label_home'),
    labelWork: t(locale, 'location.label_work'),
    labelOther: t(locale, 'location.label_other'),
    line1Section: t(locale, 'location.line1_section'),
    line2Section: t(locale, 'location.line2_section'),
    line2Placeholder: t(locale, 'location.line2_placeholder'),
    postalSection: t(locale, 'location.postal_section'),
    instructionsSection: t(locale, 'location.instructions_section'),
    instructionsPlaceholder: t(locale, 'location.instructions_placeholder'),
    preview: (label: string) => t(locale, 'location.preview').replace('{label}', label),
    saveBtn: t(locale, 'location.save_btn'),
    saving: t(locale, 'location.saving'),
    loadingAddress: t(locale, 'location.loading_address'),
    back: t(locale, 'location.back'),
    geoUnsupportedWeb: t(locale, 'location.geo_unsupported_web'),
    resolveFailed: t(locale, 'location.resolve_failed'),
    permissionDeniedWeb: t(locale, 'location.permission_denied_web'),
    mapTitle: t(locale, 'location.map_title'),
    steps: () => [
      { id: 'find', label: t(locale, 'location.step_find') },
      { id: 'confirm', label: t(locale, 'location.step_confirm') },
    ],
    addressLabels: () => [
      { id: 'home' as const, title: t(locale, 'location.label_home') },
      { id: 'work' as const, title: t(locale, 'location.label_work') },
      { id: 'other' as const, title: t(locale, 'location.label_other') },
    ],
  };
}

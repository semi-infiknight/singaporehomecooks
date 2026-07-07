import { t, type ShcLocale } from './messages';

export function getWebLayoutCopy(locale: ShcLocale) {
  return {
    brandName: t(locale, 'web.layout.brand_name'),
    brandTagline: t(locale, 'web.layout.brand_tagline'),
    account: t(locale, 'web.layout.account'),
    signIn: t(locale, 'auth.sign_in_btn'),
    orders: t(locale, 'tab.orders'),
    accountCredits: t(locale, 'web.layout.account_credits'),
    setLocation: t(locale, 'discover.set_location'),
    collectFromUpper: t(locale, 'web.layout.collect_from_upper'),
    searchA11y: t(locale, 'web.layout.search_a11y'),
    cartA11y: t(locale, 'nav.cart'),
    cartA11yWithCount: (count: number) =>
      t(locale, 'web.layout.cart_a11y_count').replace('{count}', String(count)),
    menuA11y: t(locale, 'web.layout.menu_a11y'),
    mainNavA11y: t(locale, 'web.layout.main_nav_a11y'),
    mobileNavA11y: t(locale, 'web.layout.mobile_nav_a11y'),
    tabBarA11y: t(locale, 'web.layout.tab_bar_a11y'),
    pwaInstallRegion: t(locale, 'web.layout.pwa_install_region'),
    pwaInstallTitle: t(locale, 'web.layout.pwa_install_title'),
    pwaInstallBody: t(locale, 'web.layout.pwa_install_body'),
    pwaInstallBtn: t(locale, 'web.layout.pwa_install_btn'),
    pwaDismissA11y: t(locale, 'web.layout.pwa_dismiss_a11y'),
    saveDishA11y: t(locale, 'web.layout.save_dish_a11y'),
    removeSavedA11y: t(locale, 'web.layout.remove_saved_a11y'),
    cookTabBarA11y: t(locale, 'web.layout.cook_tab_bar_a11y'),
    stickyCartSubtitle: t(locale, 'web.layout.sticky_cart_subtitle'),
    stickyCartA11y: (count: string, total: string) =>
      t(locale, 'web.layout.sticky_cart_a11y').replace('{count}', count).replace('{total}', total),
    metaTitle: t(locale, 'web.meta.title'),
    metaDescription: t(locale, 'web.meta.description'),
    metaOgTitle: t(locale, 'web.meta.og_title'),
    metaOgDescription: t(locale, 'web.meta.og_description'),
    pwaShortName: t(locale, 'web.meta.pwa_short_name'),
  };
}

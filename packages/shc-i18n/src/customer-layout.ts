import { t, type ShcLocale } from './messages';

export function getCustomerLayoutCopy(locale: ShcLocale) {
  return {
    appTitle: t(locale, 'customer.layout.app_title'),
    signIn: t(locale, 'customer.layout.sign_in'),
    trustSafety: t(locale, 'customer.layout.trust_safety'),
    orderChat: t(locale, 'customer.layout.order_chat'),
    discover: t(locale, 'customer.layout.discover'),
    orders: t(locale, 'customer.layout.orders'),
    cart: t(locale, 'customer.layout.cart'),
    profile: t(locale, 'customer.layout.profile'),
    search: t(locale, 'customer.layout.search'),
    cookProfile: t(locale, 'customer.layout.cook_profile'),
    dish: t(locale, 'customer.layout.dish'),
    checkout: t(locale, 'customer.layout.checkout'),
    orderDetail: t(locale, 'customer.layout.order_detail'),
    request: t(locale, 'customer.layout.request'),
    location: t(locale, 'customer.layout.location'),
  };
}

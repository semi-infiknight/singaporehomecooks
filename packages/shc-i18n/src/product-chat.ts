import { t, type ShcLocale } from './messages';

export type OrderChatRole = 'customer' | 'cook';

export function getProductDetailCopy(locale: ShcLocale) {
  return {
    restoringSession: t(locale, 'auth.restoring_session'),
    loadingDish: t(locale, 'product.loading_dish'),
    halal: t(locale, 'product.halal'),
    minQty: t(locale, 'product.min_qty'),
    signInToAdd: t(locale, 'guest.sign_in_add_body'),
    allergenRequired: t(locale, 'product.allergen_required'),
    cartUpdateFailed: t(locale, 'product.cart_update_failed'),
    addFailed: t(locale, 'product.add_failed'),
    screenTitle: t(locale, 'product.screen_title'),
    loadingWeb: t(locale, 'product.loading_web'),
  };
}

export function getOrderChatCopy(locale: ShcLocale, role: OrderChatRole) {
  const isCook = role === 'cook';
  return {
    title: (orderId: string) => t(locale, 'chat.order_title').replace('{id}', orderId),
    subtitle: t(locale, isCook ? 'chat.subtitle_cook' : 'chat.subtitle_customer'),
    empty: t(locale, isCook ? 'chat.empty_cook' : 'orders.detail.no_messages'),
    placeholder: t(locale, isCook ? 'chat.placeholder_cook' : 'orders.detail.message_placeholder'),
    send: t(locale, 'orders.detail.send'),
  };
}

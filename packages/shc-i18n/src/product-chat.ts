import { t, type ShcLocale } from './messages';

export type OrderChatRole = 'customer' | 'cook';

export function getProductDetailCopy(locale: ShcLocale) {
  const minQty = (qty: number) => t(locale, 'product.min_qty').replace('{qty}', String(qty));
  return {
    restoringSession: t(locale, 'auth.restoring_session'),
    loadingDish: t(locale, 'product.loading_dish'),
    halal: t(locale, 'product.halal'),
    minQty,
    signInToAdd: t(locale, 'guest.sign_in_add_body'),
    allergenRequired: t(locale, 'product.allergen_required'),
    cartUpdateFailed: t(locale, 'product.cart_update_failed'),
    addFailed: t(locale, 'product.add_failed'),
    screenTitle: t(locale, 'product.screen_title'),
    loadingWeb: t(locale, 'product.loading_web'),
    back: t(locale, 'product.back'),
    offBadge: (percent: number) => t(locale, 'product.off_badge').replace('{percent}', String(percent)),
    priceMeta: (cook: string, price: number, qty: number) =>
      t(locale, 'product.price_meta')
        .replace('{cook}', cook)
        .replace('{price}', String(price))
        .replace('{minQty}', minQty(qty)),
    ingredientsTitle: t(locale, 'product.ingredients_title'),
    ingredientsSubtitle: t(locale, 'product.ingredients_subtitle'),
    allergenContains: t(locale, 'product.allergen_contains'),
    allergenMayContain: t(locale, 'product.allergen_may_contain'),
    allergenTrace: t(locale, 'product.allergen_trace'),
    ingredientsLabel: t(locale, 'product.ingredients_label'),
    calorieEstimating: t(locale, 'product.calorie_estimating'),
    calorieRefresh: t(locale, 'product.calorie_refresh'),
    quantityTitle: t(locale, 'product.quantity_title'),
    decreaseQty: t(locale, 'product.decrease_qty'),
    increaseQty: t(locale, 'product.increase_qty'),
    adding: t(locale, 'product.adding'),
    addToCart: t(locale, 'product.add_to_cart'),
    collectionSlots: t(locale, 'product.collection_slots'),
    addCartConflict: t(locale, 'product.add_cart_conflict'),
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

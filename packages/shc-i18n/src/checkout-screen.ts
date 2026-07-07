import { t, type ShcLocale } from './messages';

export function getCheckoutScreenCopy(locale: ShcLocale) {
  return {
    errorAllergenRequired: t(locale, 'checkout.error.allergen_required'),
    errorPdpaRequired: t(locale, 'checkout.error.pdpa_required'),
    errorSlotRequired: t(locale, 'checkout.error.slot_required'),
    orderPlacedSubtitle: (id: string) => t(locale, 'checkout.order_placed_subtitle').replace('{id}', id),
    firstOrderCelebration: t(locale, 'checkout.first_order_celebration'),
    creditsAvailableHint: (balance: number) =>
      t(locale, 'checkout.credits_available_hint').replace('{balance}', String(balance)),
    footerEarnings: (amount: number) =>
      t(locale, 'checkout.footer_earnings').replace('{amount}', String(amount)),
    corporateA11y: t(locale, 'checkout.corporate_a11y'),
    tier1Typical: t(locale, 'checkout.tier1_typical'),
    errorNetwork: t(locale, 'checkout.error.network'),
    errorPlaceOrder: t(locale, 'checkout.error.place_order'),
    corporateFlagNote: t(locale, 'checkout.corporate_flag_note'),
    allergenAckLabel: t(locale, 'checkout.allergen_ack_label'),
    collectionSlotHint: t(locale, 'checkout.collection_slot_hint'),
    collectionSlotEmpty: t(locale, 'checkout.collection_slot_empty'),
    itemsCount: (count: number) =>
      t(locale, count === 1 ? 'checkout.items_count' : 'checkout.items_count_plural').replace(
        '{count}',
        String(count)
      ),
  };
}

export function getOrdersListCopy(locale: ShcLocale) {
  return {
    guest: t(locale, 'cart.guest'),
    subtitle: (name: string, updating: boolean) =>
      t(locale, updating ? 'orders.list_subtitle_updating' : 'orders.list_subtitle').replace('{name}', name),
    inProgressLabel: (count: number) =>
      t(locale, 'orders.in_progress_count').replace('{count}', String(count)),
    fallbackDish: t(locale, 'orders.fallback_dish'),
  };
}

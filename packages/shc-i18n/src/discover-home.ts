import { t, type ShcLocale } from './messages';

export function getDiscoverHomeCopy(locale: ShcLocale) {
  return {
    headline: t(locale, 'discover.home_headline'),
    collectFrom: t(locale, 'discover.collect_from'),
    setLocation: t(locale, 'discover.set_location'),
    searchPlaceholder: t(locale, 'nav.search_placeholder_mobile'),
    emptyTitle: t(locale, 'discover.empty_title'),
    emptyDescription: t(locale, 'discover.empty_description'),
    clearFilters: t(locale, 'discover.clear_filters'),
    trustLink: t(locale, 'discover.trust_link'),
    evidenceTitle: t(locale, 'discover.evidence_title'),
    topPicks: t(locale, 'discover.top_picks'),
    heritageTitle: t(locale, 'discover.heritage_banner_title'),
    heritageBody: t(locale, 'discover.heritage_banner_body'),
    guestBrowseTitle: t(locale, 'guest.browse_title'),
    guestBrowseBody: t(locale, 'guest.browse_body'),
    signInBtn: t(locale, 'auth.sign_in_btn'),
    filterA11y: t(locale, 'nav.search_filter_a11y'),
    dishRowPopular: t(locale, 'discover.dish_row_popular'),
    dishRowOfferTop: t(locale, 'discover.dish_row_offer_top'),
    dishRowOfferDiscount: t(locale, 'discover.dish_row_offer_discount'),
    calorieLight: t(locale, 'discover.calorie_light'),
    calorieModerate: t(locale, 'discover.calorie_moderate'),
    calorieHearty: t(locale, 'discover.calorie_hearty'),
    calorieApprox: (cal: number) => t(locale, 'discover.calorie_approx').replace('{cal}', String(cal)),
    searchResultsHeader: (count: number, query: string) =>
      t(locale, 'search.results_for')
        .replace('{count}', String(count))
        .replace('{query}', query),
    searchClear: t(locale, 'search.clear_btn'),
    searchNoMatch: t(locale, 'search.no_match'),
    whatsOnYourMind: t(locale, 'discover.whats_on_your_mind'),
    categoryAll: t(locale, 'discover.category_all'),
    exploreCuisines: t(locale, 'discover.explore_cuisines'),
    fallbackCuisine: t(locale, 'discover.fallback_cuisine'),
    hdbCollect: t(locale, 'discover.hdb_collect'),
    heritageOffer: (label: string) =>
      t(locale, 'discover.heritage_offer').replace('{label}', label),
    halalBadge: t(locale, 'discover.halal_badge'),
    dishAdd: t(locale, 'discover.dish_add'),
  };
}

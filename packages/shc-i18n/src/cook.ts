import { t, type ShcLocale } from './messages';
import { getLocalizedOrderStatus } from './order-detail';

export function getCookOrderActionLabel(locale: ShcLocale, status: string): string | null {
  const map: Record<string, string> = {
    paid: t(locale, 'cook.action.accept'),
    accepted: t(locale, 'cook.action.prepare'),
    preparing: t(locale, 'cook.action.ready'),
    ready_for_collection: t(locale, 'cook.action.collected'),
  };
  return map[status] ?? null;
}

export function getCookOrderTransitionActions(locale: ShcLocale) {
  return [
    { status: 'paid', to: 'accepted' as const, label: t(locale, 'cook.action.accept') },
    { status: 'accepted', to: 'preparing' as const, label: t(locale, 'cook.action.prepare') },
    { status: 'preparing', to: 'ready_for_collection' as const, label: t(locale, 'cook.action.ready') },
    { status: 'ready_for_collection', to: 'collected' as const, label: t(locale, 'cook.action.collected') },
  ];
}

export function getCookQuickActionLabels(locale: ShcLocale) {
  return {
    listings: t(locale, 'cook.quick.listings'),
    orders: t(locale, 'cook.quick.orders'),
    earnings: t(locale, 'cook.quick.earnings'),
    compliance: t(locale, 'cook.quick.compliance'),
  };
}

export function getCookOrderStatusLabel(locale: ShcLocale, status: string): string {
  return getLocalizedOrderStatus(locale, status);
}

export function getCookAuthCopy(locale: ShcLocale) {
  return {
    title: t(locale, 'cook.auth.title'),
    subtitle: t(locale, 'cook.auth.subtitle'),
    emailPlaceholder: t(locale, 'cook.auth.email_placeholder'),
    passwordPlaceholder: t(locale, 'auth.password_placeholder'),
    signInBtn: t(locale, 'cook.auth.sign_in_btn'),
    pleaseWait: t(locale, 'auth.please_wait'),
    failedTitle: t(locale, 'auth.failed_title'),
    demoHint: t(locale, 'cook.auth.demo_hint'),
  };
}

export function getCookListingsCopy(locale: ShcLocale) {
  return {
    title: t(locale, 'cook.listings.title'),
    subtitleCount: t(locale, 'cook.listings.subtitle_count'),
    searchPlaceholder: t(locale, 'cook.listings.search_placeholder'),
    filterAll: t(locale, 'cook.listings.filter_all'),
    filterLive: t(locale, 'cook.listings.filter_live'),
    filterPaused: t(locale, 'cook.listings.filter_paused'),
    holdHint: t(locale, 'cook.listings.hold_hint'),
    empty: t(locale, 'cook.listings.empty'),
    noMatch: t(locale, 'cook.listings.no_match'),
    wizardNew: t(locale, 'cook.listings.wizard_new'),
    wizardEdit: t(locale, 'cook.listings.wizard_edit'),
    step1Title: t(locale, 'cook.listings.step1_title'),
    step2Title: t(locale, 'cook.listings.step2_title'),
    step3Title: t(locale, 'cook.listings.step3_title'),
    step4Title: t(locale, 'cook.listings.step4_title'),
    dishNamePlaceholder: t(locale, 'cook.listings.dish_name_placeholder'),
    pricePlaceholder: t(locale, 'cook.listings.price_placeholder'),
    minQtyPlaceholder: t(locale, 'cook.listings.min_qty_placeholder'),
    aiCalories: t(locale, 'cook.listings.ai_calories'),
    photoTips: t(locale, 'cook.listings.photo_tips'),
    photoTipsTitle: t(locale, 'cook.listings.photo_tips_title'),
    cancelEdit: t(locale, 'cook.listings.cancel_edit'),
    publishedLive: t(locale, 'cook.listings.published_live'),
    celebration: t(locale, 'cook.listings.celebration'),
    edit: t(locale, 'cook.listings.edit'),
    pause: t(locale, 'cook.listings.pause'),
    unpause: t(locale, 'cook.listings.unpause'),
    delete: t(locale, 'cook.listings.delete'),
    deleteTitle: t(locale, 'cook.listings.delete_title'),
    deleteMessage: t(locale, 'cook.listings.delete_message'),
    deleteBtn: t(locale, 'cook.listings.delete_btn'),
    ok: t(locale, 'cook.listings.ok'),
    cancel: t(locale, 'cook.listings.cancel'),
    signInRequired: t(locale, 'cook.listings.sign_in_required'),
    signInBody: t(locale, 'cook.listings.sign_in_body'),
    publishFailed: t(locale, 'cook.listings.publish_failed'),
    updateFailed: t(locale, 'cook.listings.update_failed'),
    deleteFailed: t(locale, 'cook.listings.delete_failed'),
    pauseFailed: t(locale, 'cook.listings.pause_failed'),
    unpauseFailed: t(locale, 'cook.listings.unpause_failed'),
    badgePaused: t(locale, 'cook.listings.badge_paused'),
    badgeMin: t(locale, 'cook.listings.badge_min'),
    saveErrorGeneric: t(locale, 'cook.listings.save_error_generic'),
  };
}

export function getCookEarningsCopy(locale: ShcLocale) {
  return {
    title: t(locale, 'cook.earnings.title'),
    subtitle: t(locale, 'cook.earnings.subtitle'),
    thisWeek: t(locale, 'cook.dashboard.this_week'),
    projected: t(locale, 'cook.earnings.projected'),
    completed: t(locale, 'cook.earnings.completed'),
    ordersCount: t(locale, 'cook.earnings.orders_count'),
    quickActions: t(locale, 'cook.dashboard.quick_actions'),
    createListingsCta: t(locale, 'cook.earnings.create_listings_cta'),
    note: t(locale, 'cook.earnings.note'),
    expenseSection: t(locale, 'cook.earnings.expense_section'),
    recordedYear: t(locale, 'cook.earnings.recorded_year'),
    amountPlaceholder: t(locale, 'cook.earnings.amount_placeholder'),
    categoryPlaceholder: t(locale, 'cook.earnings.category_placeholder'),
    saving: t(locale, 'cook.earnings.saving'),
    logExpense: t(locale, 'cook.earnings.log_expense'),
    emptyExpenses: t(locale, 'cook.earnings.empty_expenses'),
    expenseFailedTitle: t(locale, 'cook.earnings.expense_failed_title'),
    expenseFailedBody: t(locale, 'cook.earnings.expense_failed_body'),
    expenseInvalidTitle: t(locale, 'cook.earnings.expense_invalid_title'),
    expenseInvalidBody: t(locale, 'cook.earnings.expense_invalid_body'),
  };
}

export function getCookOrderDetailCopy(locale: ShcLocale) {
  return {
    loading: t(locale, 'cook.order_detail.loading'),
    collection: t(locale, 'cook.order_detail.collection'),
    itemsMeta: t(locale, 'cook.order_detail.items_meta'),
    hint: t(locale, 'cook.order_detail.hint'),
    updating: t(locale, 'cook.order_detail.updating'),
    chat: t(locale, 'cook.order_detail.chat'),
    issueReported: t(locale, 'cook.order_detail.issue_reported'),
    reportIssue: t(locale, 'cook.order_detail.report_issue'),
    disputeHint: t(locale, 'cook.order_detail.dispute_hint'),
    disputePlaceholder: t(locale, 'cook.order_detail.dispute_placeholder'),
    disputeSubmitting: t(locale, 'cook.order_detail.dispute_submitting'),
    disputeSubmit: t(locale, 'tray.dispute_submit'),
    confirmMessage: t(locale, 'cook.order_detail.confirm_message'),
    trayReportedTitle: t(locale, 'cook.order_detail.tray_reported_title'),
    trayReportedBody: t(locale, 'cook.order_detail.tray_reported_body'),
    gotIt: t(locale, 'cook.order_detail.got_it'),
    trayErrorTitle: t(locale, 'cook.order_detail.tray_error_title'),
    trayErrorBody: t(locale, 'cook.order_detail.tray_error_body'),
    ok: t(locale, 'tray.ok'),
    footer: t(locale, 'cook.order_detail.footer'),
    transitionFailed: t(locale, 'cook.order_detail.transition_failed'),
    cancel: t(locale, 'cook.order_detail.cancel'),
  };
}

export function getCookOnboardingCopy(locale: ShcLocale) {
  return {
    title: t(locale, 'cook.onboarding.title'),
    subtitle: t(locale, 'cook.onboarding.subtitle'),
    cta: t(locale, 'cook.onboarding.cta'),
    hdbBadge: t(locale, 'cook.onboarding.hdb_badge'),
  };
}

export function getCookLayoutCopy(locale: ShcLocale) {
  return {
    appTitle: t(locale, 'cook.layout.app_title'),
    signIn: t(locale, 'cook.layout.sign_in'),
    welcome: t(locale, 'cook.layout.welcome'),
    orderChat: t(locale, 'cook.layout.order_chat'),
  };
}

export function getCookDashboardExtras(locale: ShcLocale) {
  return {
    recentOrders: t(locale, 'cook.dashboard.recent_orders'),
    noOrdersYet: t(locale, 'cook.dashboard.no_orders_yet'),
    addStory: t(locale, 'cook.dashboard.add_story'),
    heritageAdded: t(locale, 'cook.dashboard.heritage_added'),
    verifiedBadge: t(locale, 'cook.dashboard.verified_badge'),
  };
}

export function getErrorBoundaryCopy(locale: ShcLocale) {
  return {
    title: t(locale, 'error.boundary.title'),
    codeLabel: t(locale, 'error.boundary.code'),
    message: t(locale, 'error.boundary.message'),
    opsNote: t(locale, 'error.boundary.ops_note'),
    retry: t(locale, 'error.boundary.retry'),
    discover: t(locale, 'error.boundary.discover'),
  };
}

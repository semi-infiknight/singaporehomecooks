import { t, type ShcLocale } from './messages';

export type OrderTrayLabels = {
  leaveReview: string;
  reportIssue: string;
  reviewTitle: string;
  reviewThanksTitle: string;
  reviewThanksBody: string;
  reviewDone: string;
  reviewFailed: string;
  disputeTitle: string;
  disputeReportedTitle: string;
  disputeReportedBody: string;
  disputeGotIt: string;
  disputeMessageCook: string;
  disputeFailed: string;
  ok: string;
};

export function getOrderTrayLabels(locale: ShcLocale): OrderTrayLabels {
  return {
    leaveReview: t(locale, 'tray.leave_review'),
    reportIssue: t(locale, 'tray.report_issue'),
    reviewTitle: t(locale, 'tray.review_title'),
    reviewThanksTitle: t(locale, 'tray.review_thanks_title'),
    reviewThanksBody: t(locale, 'tray.review_thanks_body'),
    reviewDone: t(locale, 'tray.review_done'),
    reviewFailed: t(locale, 'tray.review_failed'),
    disputeTitle: t(locale, 'tray.dispute_title'),
    disputeReportedTitle: t(locale, 'tray.dispute_reported_title'),
    disputeReportedBody: t(locale, 'tray.dispute_reported_body'),
    disputeGotIt: t(locale, 'tray.dispute_got_it'),
    disputeMessageCook: t(locale, 'tray.dispute_message_cook'),
    disputeFailed: t(locale, 'tray.dispute_failed'),
    ok: t(locale, 'tray.ok'),
  };
}

export function getActiveOrderBannerLabels(locale: ShcLocale) {
  return {
    inProgress: t(locale, 'orders.banner.in_progress'),
    track: t(locale, 'orders.banner.track'),
  };
}

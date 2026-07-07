// Shipped order tray screen section — thin render over useOrderTrayTracking (mobile).
// @ts-nocheck
import React, { useMemo } from 'react';
import { GourmeatPrimaryButton } from './gourmeat';
import { shcSpacing } from './theme';
import { useSHCTray, SHCTrayAction } from './tray';
import { createOrderTrayFns, useOrderTrayTracking } from './order-tray-tracking';
import { SHCOrderReviewTrayContent, SHCOrderDisputeTrayContent } from './order-tray-content';
import type { SubmitReviewFn, SubmitDisputeFn, OrderTrayLabels } from './order-tray-opener-core';
import { DEFAULT_TRAY_LABELS } from './order-tray-opener-core';
import type { OrderTrayScreenOrder } from './order-tray-tracking';

export type { OrderTrayScreenOrder } from './order-tray-tracking';

export function OrderTrackingTraySection({
  orderId,
  order,
  existingReview,
  disputes,
  submitReview,
  submitOrderDispute,
  onMessageCook,
  labels = DEFAULT_TRAY_LABELS,
}: {
  orderId: string;
  order: OrderTrayScreenOrder;
  existingReview: unknown;
  disputes: unknown[];
  submitReview: SubmitReviewFn;
  submitOrderDispute: SubmitDisputeFn;
  onMessageCook?: () => void;
  labels?: OrderTrayLabels;
}) {
  const { openTray, dismiss } = useSHCTray();
  const trayFns = useMemo(
    () =>
      createOrderTrayFns({
        openTray,
        dismiss,
        renderSuccess: ({ message, primaryLabel, testID, secondaryLabel, onSecondary }) => (
          <SHCTrayAction
            message={message}
            primaryLabel={primaryLabel}
            onPrimary={dismiss}
            secondaryLabel={secondaryLabel}
            onSecondary={onSecondary}
            testID={testID}
          />
        ),
        renderError: ({ id, message }) => (
          <SHCTrayAction
            message={message}
            primaryLabel={labels.ok}
            onPrimary={dismiss}
            testID={id === 'dispute-error' ? 'dispute-error-tray' : 'review-error-tray'}
          />
        ),
      }),
    [dismiss, labels.ok, openTray]
  );

  const { showReviewForm, showDisputeForm, openReviewTray, openDisputeTray } = useOrderTrayTracking({
    orderId,
    order,
    existingReview,
    disputes,
    submitReview,
    submitOrderDispute,
    trayFns,
    onMessageCook,
    ReviewContent: SHCOrderReviewTrayContent,
    DisputeContent: SHCOrderDisputeTrayContent,
    labels,
  });

  return (
    <>
      {showReviewForm ? (
        <GourmeatPrimaryButton
          label={labels.leaveReview}
          onPress={openReviewTray}
          testID="open-review-tray-btn"
          style={{ marginBottom: shcSpacing.sm }}
        />
      ) : null}
      {showDisputeForm ? (
        <GourmeatPrimaryButton
          label={labels.reportIssue}
          variant="outline"
          onPress={openDisputeTray}
          testID="open-dispute-tray-btn"
        />
      ) : null}
    </>
  );
}
'use client';

import React, { useMemo } from 'react';
import { SHCButton, SHCTrayActionWeb, useSHCTrayWeb } from './shc-tray-web';
import { createOrderTrayFns, useOrderTrayTracking } from '@shc/ui/order-tray-tracking';
import type { OrderTrayLabels, SubmitReviewFn, SubmitDisputeFn } from '@shc/ui/order-tray-opener-core';
import { DEFAULT_TRAY_LABELS } from '@shc/ui/order-tray-opener-core';
import type { OrderTrayScreenOrder } from '@shc/ui/order-tray-tracking';
import { SHCOrderReviewTrayContentWeb, SHCOrderDisputeTrayContentWeb } from './order-tray-content-web';

export function OrderTrackingTraySectionWeb({
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
  const { openTray, dismiss } = useSHCTrayWeb();
  const trayFns = useMemo(
    () =>
      createOrderTrayFns({
        openTray,
        dismiss,
        renderSuccess: ({ message, primaryLabel, testID, secondaryLabel, onSecondary }) => (
          <SHCTrayActionWeb
            message={message}
            primaryLabel={primaryLabel}
            onPrimary={dismiss}
            secondaryLabel={secondaryLabel}
            onSecondary={onSecondary}
            testID={testID}
          />
        ),
        renderError: ({ id, message }) => (
          <SHCTrayActionWeb
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
    ReviewContent: SHCOrderReviewTrayContentWeb,
    DisputeContent: SHCOrderDisputeTrayContentWeb,
    labels,
  });

  return (
    <>
      {showReviewForm ? (
        <SHCButton className="mt-6 w-full" onClick={openReviewTray} testID="open-review-tray-btn">
          {labels.leaveReview}
        </SHCButton>
      ) : null}
      {showDisputeForm ? (
        <SHCButton className="mt-6 w-full" variant="outline" onClick={openDisputeTray} testID="open-dispute-tray-btn">
          {labels.reportIssue}
        </SHCButton>
      ) : null}
    </>
  );
}

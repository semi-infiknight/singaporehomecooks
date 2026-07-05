// Shipped order tray screen section — same wiring as mobile orders/[id].tsx.
// @ts-nocheck
import React, { useCallback, useMemo } from 'react';
import { GourmeatPrimaryButton } from './gourmeat';
import { shcSpacing } from './theme';
import { useSHCTray, SHCTrayAction } from './tray';
import { openOrderReviewTray, openOrderDisputeTray } from './order-tray-opener';
import { orderTrayActions } from '@shc/utils';
import type { SubmitReviewFn, SubmitDisputeFn } from './order-tray-opener-core';

export type OrderTrayScreenOrder = {
  shc_status?: string;
};

export function OrderTrackingTraySection({
  orderId,
  order,
  existingReview,
  disputes,
  submitReview,
  submitOrderDispute,
  onMessageCook,
}: {
  orderId: string;
  order: OrderTrayScreenOrder;
  existingReview: unknown;
  disputes: unknown[];
  submitReview: SubmitReviewFn;
  submitOrderDispute: SubmitDisputeFn;
  onMessageCook?: () => void;
}) {
  const { openTray, dismiss } = useSHCTray();

  const trayFns = useMemo(
    () => ({
      openTray,
      dismiss,
      renderSuccess: ({
        message,
        primaryLabel,
        testID,
        secondaryLabel,
        onSecondary,
      }: {
        message: string;
        primaryLabel: string;
        testID: string;
        secondaryLabel?: string;
        onSecondary?: () => void;
      }) => (
        <SHCTrayAction
          message={message}
          primaryLabel={primaryLabel}
          onPrimary={dismiss}
          secondaryLabel={secondaryLabel}
          onSecondary={onSecondary}
          testID={testID}
        />
      ),
      renderError: ({ id, message }: { id: string; message: string }) => (
        <SHCTrayAction
          message={message}
          primaryLabel="OK"
          onPrimary={dismiss}
          testID={id === 'dispute-error' ? 'dispute-error-tray' : 'review-error-tray'}
        />
      ),
    }),
    [dismiss, openTray]
  );

  const openReviewTray = useCallback(() => {
    openOrderReviewTray(orderId, submitReview, trayFns);
  }, [orderId, submitReview, trayFns]);

  const openDisputeTray = useCallback(() => {
    openOrderDisputeTray(orderId, submitOrderDispute, trayFns, {
      onMessageCook,
    });
  }, [onMessageCook, orderId, submitOrderDispute, trayFns]);

  const { showReviewBtn: showReviewForm, showDisputeBtn: showDisputeForm } = orderTrayActions({
    order,
    review: existingReview,
    disputes,
  });

  return (
    <>
      {showReviewForm ? (
        <GourmeatPrimaryButton
          label="Leave a review"
          onPress={openReviewTray}
          testID="open-review-tray-btn"
          style={{ marginBottom: shcSpacing.sm }}
        />
      ) : null}
      {showDisputeForm ? (
        <GourmeatPrimaryButton
          label="Report an issue"
          variant="outline"
          onPress={openDisputeTray}
          testID="open-dispute-tray-btn"
        />
      ) : null}
    </>
  );
}
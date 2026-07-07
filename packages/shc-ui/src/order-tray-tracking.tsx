// Canonical shipped order tray contract — hook + trayFns builder (mobile + web).
import React, { useCallback, useMemo, type ComponentType, type ReactNode } from 'react';
import { orderTrayActions } from '@shc/utils';
import {
  openOrderReviewTray as openOrderReviewTrayCore,
  openOrderDisputeTray as openOrderDisputeTrayCore,
} from './order-tray-opener-core';
import type {
  OrderTrayOpenFns,
  OrderReviewTrayContentProps,
  OrderDisputeTrayContentProps,
  SubmitReviewFn,
  SubmitDisputeFn,
} from './order-tray-opener-core';

export type OrderTrayScreenOrder = { shc_status?: string };

export type OrderTrayTrackingInput = {
  orderId: string;
  order: OrderTrayScreenOrder;
  existingReview: unknown;
  disputes: unknown[];
  submitReview: SubmitReviewFn;
  submitOrderDispute: SubmitDisputeFn;
  trayFns: OrderTrayOpenFns;
  onMessageCook?: () => void;
  ReviewContent: ComponentType<OrderReviewTrayContentProps>;
  DisputeContent: ComponentType<OrderDisputeTrayContentProps>;
  labels?: import('./order-tray-opener-core').OrderTrayLabels;
};

export function createOrderTrayFns(args: {
  openTray: OrderTrayOpenFns['openTray'];
  dismiss: OrderTrayOpenFns['dismiss'];
  renderSuccess: (p: {
    message: string;
    primaryLabel: string;
    testID: string;
    secondaryLabel?: string;
    onSecondary?: () => void;
  }) => ReactNode;
  renderError: (p: { id: string; message: string }) => ReactNode;
}): OrderTrayOpenFns {
  return {
    openTray: args.openTray,
    dismiss: args.dismiss,
    renderSuccess: (p) => args.renderSuccess(p),
    renderError: (p) => args.renderError(p),
  };
}

export function useOrderTrayTracking(input: OrderTrayTrackingInput) {
  const {
    orderId,
    order,
    existingReview,
    disputes,
    submitReview,
    submitOrderDispute,
    trayFns,
    onMessageCook,
    ReviewContent,
    DisputeContent,
    labels,
  } = input;

  const openReviewTray = useCallback(() => {
    openOrderReviewTrayCore(orderId, submitReview, trayFns, ReviewContent, labels);
  }, [orderId, submitReview, trayFns, ReviewContent, labels]);

  const openDisputeTray = useCallback(() => {
    openOrderDisputeTrayCore(orderId, submitOrderDispute, trayFns, DisputeContent, { onMessageCook, labels });
  }, [orderId, submitOrderDispute, trayFns, DisputeContent, onMessageCook, labels]);

  const flags = useMemo(
    () => orderTrayActions({ order, review: existingReview, disputes }),
    [order, existingReview, disputes]
  );

  return {
    showReviewForm: flags.showReviewBtn,
    showDisputeForm: flags.showDisputeBtn,
    openReviewTray,
    openDisputeTray,
  };
}
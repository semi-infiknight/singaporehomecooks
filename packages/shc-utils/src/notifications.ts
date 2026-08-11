import { orderIdFromReviewPromptType } from './review-prompt';

/** Parse order id from in-app notification type (`order:<id>` or `review_prompt:<id>`). */
export function orderIdFromNotificationType(type: string | undefined | null): string | null {
  if (!type) return null;
  if (type.startsWith('order:')) {
    const id = type.slice('order:'.length).trim();
    return id || null;
  }
  return orderIdFromReviewPromptType(type);
}

export function isOrderNotification(type: string | undefined | null): boolean {
  return Boolean(orderIdFromNotificationType(type));
}

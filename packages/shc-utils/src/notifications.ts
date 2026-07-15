/** Parse order id from in-app notification type (`order:<id>`). */
export function orderIdFromNotificationType(type: string | undefined | null): string | null {
  if (!type || !type.startsWith("order:")) return null;
  const id = type.slice("order:".length).trim();
  return id || null;
}

export function isOrderNotification(type: string | undefined | null): boolean {
  return Boolean(orderIdFromNotificationType(type));
}

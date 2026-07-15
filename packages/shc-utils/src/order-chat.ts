/** Order-scoped support chat helpers (Zomato / Redbus-style). */

export type ChatViewerRole = 'customer' | 'cook';

export type ChatMessageRow = {
  id?: string;
  sender_actor?: string;
  body?: string;
  created_at?: string;
};

export type OrderChatContextInput = {
  orderId: string;
  status?: string;
  statusLabel?: string;
  counterpartyName?: string;
  dishSummary?: string;
  collectionDate?: string;
  collectionSlot?: string;
  collectionInstructions?: string;
  addressReleased?: boolean;
};

export const CUSTOMER_CHAT_QUICK_REPLIES = [
  'Running 5 mins late',
  'Any allergen questions?',
  'Where is the collection point?',
  'Thank you!',
] as const;

export const COOK_CHAT_QUICK_REPLIES = [
  'Order accepted — see you at collection',
  'Collection details in chat below',
  'Running slightly behind — sorry!',
  'Please bring your own bag',
] as const;

export function chatQuickReplies(role: ChatViewerRole): readonly string[] {
  return role === 'cook' ? COOK_CHAT_QUICK_REPLIES : CUSTOMER_CHAT_QUICK_REPLIES;
}

export function isSystemChatActor(senderActor?: string): boolean {
  return senderActor === 'ops' || senderActor === 'system';
}

/** True when bubble should appear on the right (sent by viewer). */
export function isOutgoingChatMessage(viewerRole: ChatViewerRole, senderActor?: string): boolean {
  if (isSystemChatActor(senderActor)) return false;
  if (viewerRole === 'customer') return senderActor === 'customer';
  return senderActor === 'cook';
}

export function chatSenderLabel(viewerRole: ChatViewerRole, senderActor?: string, counterpartyName?: string): string {
  if (isSystemChatActor(senderActor)) return 'Singapore Home Cooks';
  if (senderActor === 'cook') return counterpartyName || 'Home cook';
  if (senderActor === 'customer') return viewerRole === 'cook' ? 'Customer' : 'You';
  return senderActor || 'Message';
}

export function sortChatMessages<T extends ChatMessageRow>(messages: T[]): T[] {
  return [...messages].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return ta - tb;
  });
}

export function formatChatTime(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function formatChatDateLabel(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const today = new Date();
    const sameDay =
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate();
    if (sameDay) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();
    if (isYesterday) return 'Yesterday';
    return d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export function orderChatRef(orderId: string): string {
  const id = String(orderId || '').trim();
  if (id.length <= 10) return id.toUpperCase();
  return `#${id.slice(-8).toUpperCase()}`;
}

export type OrderChatContext = {
  orderId: string;
  orderRef: string;
  statusLabel?: string;
  counterpartyName: string;
  dishSummary?: string;
  collectionDate?: string;
  collectionSlot?: string;
  privacyHint?: string;
  collectionInstructions?: string;
};

export function buildOrderChatContext(order: OrderChatContextInput & { items?: Array<{ name?: string; product_id?: string }> }): OrderChatContext {
  const items = Array.isArray(order.items) ? order.items : [];
  const names = items.map((i) => String(i.name || '').trim()).filter(Boolean);
  const dishSummary =
    order.dishSummary ||
    (names.length ? names.slice(0, 2).join(' · ') + (names.length > 2 ? ` +${names.length - 2}` : '') : 'Your order');

  return {
    orderId: order.orderId,
    orderRef: orderChatRef(order.orderId),
    statusLabel: order.statusLabel,
    counterpartyName: order.counterpartyName || (order.status ? 'Home cook' : 'Support'),
    dishSummary,
    collectionDate: order.collectionDate,
    collectionSlot: order.collectionSlot,
    collectionInstructions: order.collectionInstructions,
  };
}

export type ChatThreadItem =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'message'; id: string; message: ChatMessageRow };

/** Insert date separators between messages (Redbus-style day breaks). */
export function buildChatThreadItems(messages: ChatMessageRow[]): ChatThreadItem[] {
  const sorted = sortChatMessages(messages);
  const out: ChatThreadItem[] = [];
  let lastDate = '';
  sorted.forEach((m, idx) => {
    const dateLabel = formatChatDateLabel(m.created_at);
    if (dateLabel && dateLabel !== lastDate) {
      out.push({ kind: 'date', id: `date-${dateLabel}-${idx}`, label: dateLabel });
      lastDate = dateLabel;
    }
    out.push({ kind: 'message', id: m.id || `msg-${idx}`, message: m });
  });
  return out;
}

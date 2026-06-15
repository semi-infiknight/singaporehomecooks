export type ShcNotification = {
  id: string;
  type: string;
  body: string;
  created_at: string;
  read?: boolean;
};

const store = new Map<string, ShcNotification[]>();

export function listNotifications(actorId: string): ShcNotification[] {
  return store.get(actorId) || [];
}

export function pushNotification(actorId: string, n: Omit<ShcNotification, "id" | "created_at">) {
  const list = store.get(actorId) || [];
  const entry: ShcNotification = {
    ...n,
    id: `n_${Date.now()}_${list.length}`,
    created_at: new Date().toISOString(),
    read: false,
  };
  list.unshift(entry);
  store.set(actorId, list.slice(0, 50));
  return entry;
}
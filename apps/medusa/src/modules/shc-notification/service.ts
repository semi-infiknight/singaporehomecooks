import { MedusaService } from "@medusajs/framework/utils";
import { Notification } from "./models/notification";

class ShcNotificationModuleService extends MedusaService({ Notification }) {
  async listForActor(actorId: string, limit = 50) {
    const [list] = await this.listAndCountNotifications(
      { actor_id: actorId } as any,
      { order: { created_at: "DESC" }, take: limit }
    ).catch(() => [[]]);
    return (list as any[]) || [];
  }

  async createNotification(data: { actor_id: string; type: string; body: string }) {
    const [created] = await this.createNotifications([data as any]);
    return created;
  }

  async markRead(notificationId: string) {
    const [updated] = await this.updateNotifications({
      selector: { id: notificationId } as any,
      data: { read: true, updated_at: new Date() } as any,
    });
    return updated;
  }

  async push(actorId: string, n: { type: string; body: string }) {
    // Per-type limit (deeper feature): keep last 20 per type per actor
    const existing = await this.listForActor(actorId, 100);
    const sameType = existing.filter((notif: any) => notif.type === n.type);
    if (sameType.length >= 20) {
      // prune oldest
      const oldest = sameType[sameType.length - 1];
      if (oldest?.id) {
        await this.deleteNotifications({ id: oldest.id } as any);
      }
    }
    return this.createNotification({ actor_id: actorId, ...n });
  }

  async markAllReadForActor(actorId: string) {
    const list = await this.listForActor(actorId);
    const updates = list
      .filter((n: any) => !n.read)
      .map((n: any) => this.updateNotifications({ selector: { id: n.id }, data: { read: true } }));
    await Promise.all(updates);
    return { updated: updates.length };
  }

  async getUnreadCount(actorId: string) {
    const list = await this.listForActor(actorId);
    return list.filter((n: any) => !n.read).length;
  }
}

export default ShcNotificationModuleService;
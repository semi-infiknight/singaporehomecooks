import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250620000004CreateShcNotification extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "shc_notification" (
        "id" text NOT NULL,
        "actor_id" text NOT NULL,
        "type" text NOT NULL,
        "body" text NOT NULL,
        "read" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz,
        CONSTRAINT "shc_notification_pkey" PRIMARY KEY ("id")
      );
    `);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shc_notification_actor" ON "shc_notification" ("actor_id");`);
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "shc_notification";`);
  }
}
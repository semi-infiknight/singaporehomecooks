import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleInboundCookRegisterVerifyMessage } from "../../../../lib/shc-cook-whatsapp-verify-session";

function verifyToken(): string {
  return process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN?.trim() || "shc-whatsapp-verify";
}

/**
 * GET /hooks/shc/whatsapp — Meta webhook verification challenge.
 * POST /hooks/shc/whatsapp — inbound WhatsApp messages (user messaged us first → free OTP reply).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = (req.query || {}) as Record<string, string>;
  const mode = query["hub.mode"];
  const token = query["hub.verify_token"];
  const challenge = query["hub.challenge"];

  if (mode === "subscribe" && token === verifyToken() && challenge) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send("Forbidden");
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as any;
  if (body.object !== "whatsapp_business_account") {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const entries = Array.isArray(body.entry) ? body.entry : [];
  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];
    for (const change of changes) {
      const value = change?.value;
      const messages = Array.isArray(value?.messages) ? value.messages : [];
      for (const message of messages) {
        if (message?.type !== "text") continue;
        const from = String(message.from || "");
        const text = String(message.text?.body || "");
        if (!from || !text) continue;
        try {
          await handleInboundCookRegisterVerifyMessage(from, text);
        } catch (e) {
          console.error("[shc-whatsapp-webhook]", (e as Error).message);
        }
      }
    }
  }

  return res.status(200).json({ ok: true });
}

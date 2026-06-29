type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

type WebPushSubscription = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

let webPushClient: {
  setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
  sendNotification: (subscription: WebPushSubscription, payload: string) => Promise<unknown>;
} | null = null;

function getWebPush() {
  if (webPushClient) return webPushClient;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webpush = require("web-push");
    const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (publicKey && privateKey) {
      webpush.setVapidDetails("mailto:ops@singaporehomecooks.sg", publicKey, privateKey);
      webPushClient = webpush;
      return webPushClient;
    }
  } catch {
    /* optional dependency */
  }
  return null;
}

/** Send browser Web Push when customer metadata includes a subscription. */
export async function sendWebPush(
  subscription: WebPushSubscription | undefined | null,
  payload: PushPayload,
  logger: { info?: (msg: string) => void } = console
): Promise<boolean> {
  if (!subscription?.endpoint) {
    return false;
  }
  const webpush = getWebPush();
  if (!webpush) {
    logger.info?.(`[WEB-PUSH-STUB] ${subscription.endpoint.slice(0, 32)}… "${payload.title}"`);
    return false;
  }
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    logger.info?.(`[WEB-PUSH] sent "${payload.title}" to ${subscription.endpoint.slice(0, 32)}…`);
    return true;
  } catch (e: any) {
    logger.info?.(`[WEB-PUSH] failed: ${e?.message || e}`);
    return false;
  }
}

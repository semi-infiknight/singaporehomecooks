type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

let expoClient: { sendPushNotificationsAsync: (msgs: unknown[]) => Promise<unknown[]>; isExpoPushToken: (t: string) => boolean } | null = null;

function getExpo() {
  if (expoClient) return expoClient;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Expo } = require("expo-server-sdk");
    expoClient = new Expo();
    return expoClient;
  } catch {
    return null;
  }
}

/** Send Expo push; logs stub when SDK missing or token invalid (local dev). */
export async function sendExpoPush(
  token: string | undefined | null,
  payload: PushPayload,
  logger: { info?: (msg: string) => void } = console
): Promise<boolean> {
  if (!token) {
    logger.info?.(`[PUSH] skipped (no token): ${payload.title}`);
    return false;
  }
  const expo = getExpo();
  if (!expo || !expo.isExpoPushToken(token)) {
    logger.info?.(`[PUSH-STUB] ${token.slice(0, 22)}… "${payload.title}" — ${payload.body}`);
    return false;
  }
  try {
    const [ticket] = await expo.sendPushNotificationsAsync([
      {
        to: token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: payload.data,
        priority: "high",
      },
    ]);
    logger.info?.(`[PUSH] sent "${payload.title}" ticket=${JSON.stringify(ticket)}`);
    return true;
  } catch (e: any) {
    logger.info?.(`[PUSH] failed: ${e?.message || e}`);
    return false;
  }
}
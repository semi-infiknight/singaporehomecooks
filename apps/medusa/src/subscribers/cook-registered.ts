import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

/**
 * Basic subscriber: new cook registration -> stub compliance checklist / welcome notification.
 */
export default async function cookRegisteredHandler({ event }: SubscriberArgs<{ cookId: string; displayName: string }>) {
  const data = event.data;
  console.log(`[SHC-SUBSCRIBER] New cook registered: ${data?.displayName} (${data?.cookId}). Stub: send onboarding checklist + mark pending verification.`);
  // Later: create shc_compliance_doc stubs, send email via Resend
}

export const config: SubscriberConfig = {
  event: "shc.cook.created",
};

import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { isPushNativeModuleAvailable } from './push';

/** Open cook order detail when user taps a push notification. */
export function usePushNotificationRouting() {
  const router = useRouter();

  useEffect(() => {
    if (!isPushNativeModuleAvailable()) return;

    let sub: { remove: () => void } | undefined;
    let cancelled = false;

    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        if (cancelled) return;
        sub = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as { orderId?: string } | undefined;
          const orderId = data?.orderId ? String(data.orderId) : '';
          if (!orderId) return;
          router.push(`/(cook)/orders/${orderId}` as any);
        });
      } catch {
        /* optional native module */
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [router]);
}

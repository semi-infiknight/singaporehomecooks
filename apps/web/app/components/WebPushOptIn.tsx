'use client';

import { useEffect, useState } from 'react';
import { SHCButton } from './SHCWebComponents';
import { isWebPushSupported, registerWebPushSubscription } from '../../lib/web-push';
import { useAuth } from '../../lib/useAuth';

export function WebPushOptIn() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    if (!isWebPushSupported()) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);
  }, [user]);

  if (!user || permission === 'unsupported') return null;

  if (permission === 'granted') {
    return (
      <div className="mt-4 rounded-xl border-2 border-[#241812] bg-white p-4" data-testid="web-push-enabled">
        <p className="font-black">Browser notifications</p>
        <p className="mt-1 text-sm text-[#5C5144]">Enabled for this browser — order updates will appear here.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border-2 border-[#241812] bg-white p-4">
      <p className="font-black">Browser notifications</p>
      <p className="mt-1 text-sm text-[#5C5144]">Get order updates in your browser when the app is installed or open in the background.</p>
      <SHCButton
        className="mt-3"
        size="sm"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setStatus(null);
          try {
            const result = await registerWebPushSubscription();
            if (result.ok) {
              setPermission('granted');
              setStatus('Notifications enabled for this browser.');
            } else if (result.reason === 'missing_vapid_key') setStatus('Push is not configured on this environment yet.');
            else if (result.reason === 'denied') setStatus('Permission denied. Enable notifications in browser settings.');
            else setStatus('Push not supported on this device.');
          } catch (e) {
            setStatus((e as Error).message || 'Could not enable notifications.');
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Enabling…' : 'Enable notifications'}
      </SHCButton>
      {status && <p className="mt-2 text-sm font-semibold text-[#5C5144]">{status}</p>}
    </div>
  );
}

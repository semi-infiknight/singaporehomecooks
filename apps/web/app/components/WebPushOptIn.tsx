'use client';

import { useState } from 'react';
import { SHCButton } from './SHCWebComponents';
import { isWebPushSupported, registerWebPushSubscription } from '../../lib/web-push';
import { useAuth } from '../../lib/useAuth';

export function WebPushOptIn() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!user || !isWebPushSupported()) return null;

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
            if (result.ok) setStatus('Notifications enabled for this browser.');
            else if (result.reason === 'missing_vapid_key') setStatus('Push is not configured on this environment yet.');
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

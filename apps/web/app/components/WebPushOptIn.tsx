'use client';

import { useEffect, useState } from 'react';
import { SHCButton } from './SHCWebComponents';
import {
  getWebPushPermissionState,
  isWebPushSupported,
  registerWebPushSubscription,
} from '../../lib/web-push';
import { useShcI18n, getWebPushCopy } from '@shc/i18n';
import { useAuth } from '../../lib/useAuth';

type PushState = 'unsupported' | 'granted' | 'denied' | 'default' | 'missing_vapid';

export function WebPushOptIn() {
  const { user } = useAuth();
  const { locale } = useShcI18n();
  const copy = getWebPushCopy(locale);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [permission, setPermission] = useState<PushState>('default');

  useEffect(() => {
    setPermission(getWebPushPermissionState());
  }, []);

  if (!user || permission === 'unsupported') return null;
  if (permission === 'granted') {
    return (
      <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-[var(--shc-shadow-soft)]" data-testid="web-push-granted">
        <p className="font-black">{copy.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{copy.enabled}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-[var(--shc-shadow-soft)]" data-testid="web-push-opt-in">
      <p className="font-black">{copy.title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{copy.description}</p>
      {permission === 'denied' ? (
        <p className="mt-3 text-sm font-semibold text-muted-foreground">{copy.denied}</p>
      ) : (
        <SHCButton
          className="mt-3"
          size="sm"
          appearance="customer"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setStatus(null);
            try {
              const result = await registerWebPushSubscription();
              if (result.ok) {
                setStatus(copy.enabled);
                setPermission('granted');
              } else if (result.reason === 'missing_vapid_key') setStatus(copy.notConfigured);
              else if (result.reason === 'denied') {
                setStatus(copy.denied);
                setPermission('denied');
              } else setStatus(copy.unsupportedDevice);
            } catch (e) {
              setStatus((e as Error).message || copy.enableFailed);
            } finally {
              setBusy(false);
            }
          }}
          testID="web-push-enable-btn"
        >
          {busy ? copy.enabling : copy.enable}
        </SHCButton>
      )}
      {status && <p className="mt-2 text-sm font-semibold text-muted-foreground">{status}</p>}
    </div>
  );
}

/** Compact banner for checkout success / profile nudge (P1-21). */
export function WebPushPromptBanner({ className = '' }: { className?: string }) {
  const { user } = useAuth();
  const { locale } = useShcI18n();
  const copy = getWebPushCopy(locale);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const permission = getWebPushPermissionState();

  if (!user || dismissed || permission !== 'default' || !isWebPushSupported()) return null;

  return (
    <div
      className={`rounded-xl border border-border bg-[var(--shc-peach-50)] p-4 shadow-[var(--shc-shadow-soft)] ${className}`}
      data-testid="web-push-prompt-banner"
    >
      <p className="text-sm font-bold text-foreground">{copy.promptBanner}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <SHCButton
          size="sm"
          appearance="customer"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const result = await registerWebPushSubscription();
            setBusy(false);
            if (result.ok || result.reason === 'denied') setDismissed(true);
          }}
          testID="web-push-banner-enable"
        >
          {busy ? copy.enabling : copy.enable}
        </SHCButton>
        <button
          type="button"
          className="text-xs font-bold text-muted-foreground underline"
          onClick={() => setDismissed(true)}
        >
          {copy.notNow}
        </button>
      </div>
    </div>
  );
}

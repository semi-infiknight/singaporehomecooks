'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'shc_pwa_install_dismissed';

export function PWAInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  if (!visible || !deferred) return null;

  return (
    <div
      className="md:hidden fixed left-3 right-3 z-[60] bottom-[calc(110px+env(safe-area-inset-bottom))] rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card shadow-[var(--shc-shadow-brutal)] p-3 flex items-center gap-3"
      role="region"
      aria-label="Install app"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-primary" aria-hidden />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-extrabold text-foreground">Install SHC</p>
        <p className="text-xs text-muted-foreground">Add to Home Screen for app-like ordering.</p>
      </div>
      <button
        type="button"
        className="shrink-0 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
        onClick={async () => {
          await deferred.prompt();
          setVisible(false);
          setDeferred(null);
        }}
      >
        Install
      </button>
      <button
        type="button"
        className="shrink-0 p-1 text-muted-foreground"
        aria-label="Dismiss install prompt"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, '1');
          setVisible(false);
        }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
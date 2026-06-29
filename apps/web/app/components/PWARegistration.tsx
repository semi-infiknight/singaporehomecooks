'use client';

import { useEffect } from 'react';

export function PWARegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('[shc-pwa] service worker registration failed', error);
    });
  }, []);

  return null;
}

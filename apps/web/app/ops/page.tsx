'use client';

/**
 * Legacy /ops entry — SHC ops lives inside Medusa Admin (single admin app).
 * Redirects to /app/shc-ops on the Medusa host.
 */
import { useEffect, useMemo } from 'react';
import { resolveRailwayMedusaBase } from '@shc/utils';
import { showDevTools } from '../../lib/dev';

const API_BASE = resolveRailwayMedusaBase(process.env.NEXT_PUBLIC_SHC_API_BASE);
const ADMIN_OPS_URL = `${API_BASE.replace(/\/$/, '')}/app/shc-ops`;

export default function OpsRedirectPage() {
  const target = useMemo(() => ADMIN_OPS_URL, []);

  useEffect(() => {
    window.location.replace(target);
  }, [target]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16" data-testid="ops-redirect">
      <h1 className="text-xl font-black">Admin moved to Medusa</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Marketplace ops (orders, catalog presets, launch controls) are part of the Medusa Admin
        dashboard — one admin app.
      </p>
      <a
        href={target}
        className="mt-6 inline-block rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground"
        data-testid="ops-redirect-link"
      >
        Open Medusa Admin · SHC Ops
      </a>
      <p className="mt-4 font-mono text-xs text-muted-foreground break-all">{target}</p>
      {showDevTools && (
        <p className="mt-2 text-xs text-muted-foreground">
          Login: admin@shc.local · supersecret (after bootstrap)
        </p>
      )}
    </div>
  );
}

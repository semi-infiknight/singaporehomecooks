'use client';

import { useEffect, useState } from 'react';
import { SHCButton, SHCCard, SHCPageHeader, SHCBadge } from '../components/SHCWebComponents';

const API_BASE = process.env.NEXT_PUBLIC_SHC_API_BASE || 'http://localhost:9000';

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message || body?.message || `HTTP ${res.status}`);
  return body;
}

export default function OpsDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [ledger, setLedger] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [commissionRules, setCommissionRules] = useState<any[]>([]);
  const [cookExpenses, setCookExpenses] = useState<any[]>([]);
  const [searchSynonyms, setSearchSynonyms] = useState<any[]>([]);
  const [platformStats, setPlatformStats] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [busyFlag, setBusyFlag] = useState<string | null>(null);
  const [busyDispute, setBusyDispute] = useState<string | null>(null);
  const [busyPayout, setBusyPayout] = useState<string | null>(null);

  async function load() {
    setError('');
    try {
      const [
        healthRes,
        ledgerRes,
        payoutRes,
        flagRes,
        disputeRes,
        commissionRes,
        expenseRes,
        synonymRes,
        statRes,
      ] = await Promise.all([
        fetchJson('/admin/shc/health'),
        fetchJson('/admin/shc/ledger'),
        fetchJson('/admin/shc/payouts'),
        fetchJson('/admin/shc/feature-flags'),
        fetchJson('/admin/shc/disputes?status=open'),
        fetchJson('/admin/shc/commission-rules'),
        fetchJson('/admin/shc/cook-expenses'),
        fetchJson('/admin/shc/search-synonyms'),
        fetchJson('/admin/shc/platform-stats'),
      ]);
      setHealth(healthRes);
      setLedger(ledgerRes.entries || ledgerRes.ledger || []);
      setPayouts(payoutRes.payouts || payoutRes.batches || []);
      setFlags(flagRes.flags || []);
      setDisputes(disputeRes.disputes || []);
      setCommissionRules(commissionRes.rules || []);
      setCookExpenses(expenseRes.expenses || []);
      setSearchSynonyms(synonymRes.synonyms || []);
      setPlatformStats(statRes.stats || []);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleFlag(flag: any) {
    setBusyFlag(flag.key);
    setError('');
    try {
      await fetchJson('/admin/shc/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: flag.key,
          enabled: !flag.enabled,
          cohort_filter: flag.cohort_filter || {},
        }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyFlag(null);
    }
  }

  async function resolveDispute(dispute: any) {
    setBusyDispute(dispute.id);
    setError('');
    try {
      await fetchJson(`/admin/shc/disputes/${encodeURIComponent(dispute.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          resolution: 'Resolved by ops from launch dashboard.',
        }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyDispute(null);
    }
  }

  async function approvePayout(batch: any) {
    setBusyPayout(batch.id);
    setError('');
    try {
      await fetchJson(`/admin/shc/payouts/${encodeURIComponent(batch.id)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: 'ops-dashboard' }),
      });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyPayout(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <SHCPageHeader
        title="Ops Dashboard"
        subtitle="Launch control for health, feature flags, ledger entries, and weekly payout batches."
      />
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-bold text-muted-foreground">API: {API_BASE}</p>
        <SHCButton onClick={load}>Refresh</SHCButton>
      </div>
      {error && <p className="mt-4 rounded-xl border-2 border-red-700 bg-red-50 p-3 text-sm font-bold text-red-700">{error}</p>}

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <SHCCard className="p-5">
          <h2 className="font-black">Health</h2>
          <p className="mt-2 text-sm text-muted-foreground">{health?.status || health?.ok ? 'OK' : 'Unknown'}</p>
          {health?.observability && (
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li>Logging: {health.observability.structured_logging ? 'on' : 'off'}</li>
              <li>PagerDuty: {health.observability.pagerduty_configured ? 'configured' : 'stub'}</li>
              <li>Web push: {health.observability.web_push_configured ? 'configured' : 'stub'}</li>
            </ul>
          )}
        </SHCCard>
        <SHCCard className="p-5">
          <h2 className="font-black">Ledger</h2>
          <p className="mt-2 text-3xl font-black">{ledger.length}</p>
          <p className="text-sm text-muted-foreground">recent entries</p>
        </SHCCard>
        <SHCCard className="p-5">
          <h2 className="font-black">Payouts</h2>
          <p className="mt-2 text-3xl font-black">{payouts.length}</p>
          <p className="text-sm text-muted-foreground">batches</p>
        </SHCCard>
        <SHCCard className="p-5">
          <h2 className="font-black">Feature Flags</h2>
          <p className="mt-2 text-3xl font-black">{flags.length}</p>
          <p className="text-sm text-muted-foreground">launch gates</p>
        </SHCCard>
        <SHCCard className="p-5">
          <h2 className="font-black">Disputes</h2>
          <p className="mt-2 text-3xl font-black">{disputes.length}</p>
          <p className="text-sm text-muted-foreground">open cases</p>
        </SHCCard>
        <SHCCard className="p-5">
          <h2 className="font-black">Commission</h2>
          <p className="mt-2 text-3xl font-black">{commissionRules[0]?.rate_pct ?? '--'}%</p>
          <p className="text-sm text-muted-foreground">latest rule</p>
        </SHCCard>
        <SHCCard className="p-5">
          <h2 className="font-black">Cook Expenses</h2>
          <p className="mt-2 text-3xl font-black">{cookExpenses.length}</p>
          <p className="text-sm text-muted-foreground">records</p>
        </SHCCard>
        <SHCCard className="p-5">
          <h2 className="font-black">Search Ops</h2>
          <p className="mt-2 text-3xl font-black">{searchSynonyms.length}</p>
          <p className="text-sm text-muted-foreground">synonym rules</p>
        </SHCCard>
      </div>

      <SHCCard className="mt-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-black">Launch Gates</h2>
            <p className="mt-1 text-sm text-muted-foreground">Toggle high-risk features without redeploying.</p>
          </div>
          <SHCBadge variant="heritage">Ops</SHCBadge>
        </div>
        {flags.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-muted-foreground">No feature flags yet. Use the admin API to seed launch gates.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {flags.map((flag) => (
              <div key={flag.id || flag.key} className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-black">{flag.key}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {flag.enabled ? 'Enabled for launch traffic' : 'Paused for launch traffic'}
                    </p>
                  </div>
                  <SHCBadge variant={flag.enabled ? 'success' : 'warning'}>
                    {flag.enabled ? 'on' : 'off'}
                  </SHCBadge>
                </div>
                <SHCButton
                  className="mt-3"
                  size="sm"
                  variant={flag.enabled ? 'outline' : 'primary'}
                  disabled={busyFlag === flag.key}
                  onClick={() => toggleFlag(flag)}
                >
                  {busyFlag === flag.key ? 'Updating...' : flag.enabled ? 'Pause' : 'Enable'}
                </SHCButton>
              </div>
            ))}
          </div>
        )}
      </SHCCard>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SHCCard className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black">Open Disputes</h2>
              <p className="mt-1 text-sm text-muted-foreground">Manual ops queue for launch-day issue handling.</p>
            </div>
            <SHCBadge variant={disputes.length > 0 ? 'warning' : 'success'}>
              {disputes.length > 0 ? `${disputes.length} open` : 'clear'}
            </SHCBadge>
          </div>
          <div className="mt-4 space-y-3">
            {disputes.length === 0 ? (
              <p className="text-sm font-semibold text-muted-foreground">No open disputes.</p>
            ) : (
              disputes.slice(0, 5).map((dispute) => (
                <div key={dispute.id} className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-sm font-black">{dispute.order_id}</p>
                    <SHCBadge variant="warning">{dispute.status}</SHCBadge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{dispute.type} · raised by {dispute.raised_by}</p>
                  {dispute.notes && <p className="mt-2 text-sm font-semibold">{dispute.notes}</p>}
                  <SHCButton
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    disabled={busyDispute === dispute.id}
                    onClick={() => resolveDispute(dispute)}
                  >
                    {busyDispute === dispute.id ? 'Resolving...' : 'Mark resolved'}
                  </SHCButton>
                </div>
              ))
            )}
          </div>
        </SHCCard>

        <SHCCard className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black">Ops Data</h2>
              <p className="mt-1 text-sm text-muted-foreground">Latest commission, search, and platform stat controls.</p>
            </div>
            <SHCBadge variant="heritage">Admin</SHCBadge>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Commission rules</p>
              {commissionRules.length === 0 ? (
                <p className="mt-1 text-sm font-semibold text-muted-foreground">No commission rules configured.</p>
              ) : (
                commissionRules.slice(0, 3).map((rule) => (
                  <p key={rule.id || rule.version} className="mt-1 text-sm font-semibold">
                    v{rule.version}: {rule.rate_pct}%{rule.gst_rate != null ? ` · GST ${rule.gst_rate}%` : ''}
                  </p>
                ))
              )}
            </div>
            <div className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Search synonyms</p>
              {searchSynonyms.length === 0 ? (
                <p className="mt-1 text-sm font-semibold text-muted-foreground">No synonym rules configured.</p>
              ) : (
                searchSynonyms.slice(0, 3).map((synonym) => (
                  <p key={synonym.id || synonym.term} className="mt-1 text-sm font-semibold">
                    {synonym.term}: {(synonym.expansions || []).join(', ')}
                  </p>
                ))
              )}
            </div>
            <div className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-3">
              <p className="text-xs font-black uppercase tracking-wide text-muted-foreground">Platform stats</p>
              {platformStats.length === 0 ? (
                <p className="mt-1 text-sm font-semibold text-muted-foreground">No platform stats recorded.</p>
              ) : (
                platformStats.slice(0, 3).map((stat) => (
                  <p key={stat.id || stat.key} className="mt-1 text-sm font-semibold">
                    {stat.key}: <span className="font-mono">{JSON.stringify(stat.value)}</span>
                  </p>
                ))
              )}
            </div>
          </div>
        </SHCCard>
      </div>

      <SHCCard className="mt-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-black">Payout Queue</h2>
            <p className="mt-1 text-sm text-muted-foreground">Approve weekly cook payout batches after ledger review.</p>
          </div>
          <SHCBadge variant={payouts.some((batch) => batch.status === 'pending') ? 'warning' : 'success'}>
            {payouts.some((batch) => batch.status === 'pending') ? 'pending' : 'clear'}
          </SHCBadge>
        </div>
        {payouts.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-muted-foreground">No payout batches yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {payouts.slice(0, 6).map((batch) => (
              <div key={batch.id} className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-black">{batch.week_start}</p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      S${((batch.total_cents || 0) / 100).toFixed(2)} · {batch.transfer_ref || 'no transfer ref'}
                    </p>
                  </div>
                  <SHCBadge variant={batch.status === 'pending' ? 'warning' : 'success'}>{batch.status}</SHCBadge>
                </div>
                {batch.status === 'pending' && (
                  <SHCButton
                    className="mt-3"
                    size="sm"
                    variant="outline"
                    disabled={busyPayout === batch.id}
                    onClick={() => approvePayout(batch)}
                  >
                    {busyPayout === batch.id ? 'Approving...' : 'Approve payout'}
                  </SHCButton>
                )}
              </div>
            ))}
          </div>
        )}
      </SHCCard>

      <SHCCard className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#FFE6A7]">
              <tr>
                <th className="p-3">Ledger ID</th>
                <th className="p-3">Order</th>
                <th className="p-3">Debit</th>
                <th className="p-3">Credit</th>
                <th className="p-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ledger.slice(0, 30).map((entry: any) => (
                <tr key={entry.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{entry.id}</td>
                  <td className="p-3">{entry.order_id || '-'}</td>
                  <td className="p-3">{entry.debit_account}</td>
                  <td className="p-3">{entry.credit_account}</td>
                  <td className="p-3 font-bold">S${((entry.amount_cents || 0) / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SHCCard>
    </div>
  );
}

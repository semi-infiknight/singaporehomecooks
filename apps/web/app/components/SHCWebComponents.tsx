'use client';

import React from 'react';
// Fully self-contained web components (tokens copied from packages/shc-ui/theme.ts to avoid pulling RN/gluestack in Next build for Phase 10 web parity)
const shcColors = { primary: '#1D9E75', accent: '#B85C38', background: '#FAF7F2', surface: '#F5F0E6', surfaceAlt: '#FDF9F3', text: '#2C2416', textLight: '#5C5144', success: '#2E8B57', warning: '#D97706', error: '#B91C1C', trafficGreen: '#15803D', trafficYellow: '#CA8A04', trafficRed: '#B91C1C', heritage: '#8B5E3C' };

// Web equivalents / adaptations of shc-ui (primitives + domain). Tailwind + tokens. testID via data-testid. A11y first.

export function SHCButton({ children, onClick, disabled, variant = 'primary', size = 'md', testID, className = '' }: any) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60';
  const sizes: any = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3' };
  const variants: any = {
    primary: 'bg-[#1D9E75] hover:bg-[#166B52] text-white focus:ring-[#1D9E75]',
    outline: 'border border-[#1D9E75] text-[#1D9E75] hover:bg-[#F5F0E6] focus:ring-[#1D9E75]',
    accent: 'bg-[#B85C38] hover:bg-[#8B5E3C] text-white',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testID}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
}

export function SHCCard({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white border border-[#E8D5B7] rounded-xl p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SHCBadge({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default'|'success'|'warning'|'error'|'heritage' }) {
  const bg = variant === 'success' ? '#DCFCE7' : variant === 'warning' ? '#FEF3C7' : variant === 'error' ? '#FEE2E2' : variant === 'heritage' ? '#FDF2E9' : '#F5F0E6';
  const color = variant === 'success' ? shcColors.success : variant === 'warning' ? shcColors.warning : variant === 'error' ? shcColors.error : shcColors.text;
  return <span className="inline-block text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: bg, color }}>{children}</span>;
}

export function SHCSectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold mt-6 mb-2" style={{ color: shcColors.primary }}>{children}</h3>;
}

export function SHCErrorBanner({ code, message }: { code?: string; message: string }) {
  return (
    <div className="bg-[#FEE2E2] border-l-4 border-[#B91C1C] p-3 rounded-md my-2" role="alert" aria-live="polite">
      {code && <div className="font-mono text-xs text-[#B91C1C] font-semibold">{code}</div>}
      <div className="text-sm text-[#2C2416]">{message}</div>
    </div>
  );
}

export function AllergenAckCheckbox({ checked, onChange, testID }: { checked: boolean; onChange: (v: boolean) => void; testID?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testID}
        className="mt-1 accent-[#1D9E75]"
        aria-required="true"
      />
      <span>I acknowledge the allergens listed (Tier 1 mandatory disclosure per Singapore home kitchen rules). I understand this is a home kitchen and cross-contamination is possible.</span>
    </label>
  );
}

export function PriceEarningsCalc({ total }: { total: number }) {
  const earnings = Math.floor(total * 0.85);
  return <div className="text-sm text-[#2E8B57]">Cook earnings preview: S${earnings} (85% after 15% platform — business rule)</div>;
}

export function CreditBadge({ balance }: { balance: number }) {
  return <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">Credits: {balance} units (redeem ~S${(balance/4).toFixed(0)})</span>;
}

export function WalletCard({ balance, tier = 'Silver' }: { balance: number; tier?: string }) {
  return (
    <SHCCard className="bg-[#F5F0E6]">
      <div className="flex justify-between">
        <div>
          <div className="text-sm text-[#5C5144]">Home Credits Wallet</div>
          <div className="text-2xl font-semibold">{balance} units</div>
        </div>
        <div className="text-right text-xs">
          Tier: <span className="font-medium">{tier}</span><br />
          ~S${(balance / 4).toFixed(0)} redeemable
        </div>
      </div>
      <div className="text-[10px] mt-1 text-[#5C5144]">Earn 5% on collected orders (12m expiry). Redeem at checkout.</div>
    </SHCCard>
  );
}

export function PayNowPanel({ amount, reference, onRefChange }: { amount: number; reference: string; onRefChange?: (r: string) => void }) {
  return (
    <SHCCard>
      <div className="font-medium mb-2">PayNow (manual sim — same as mobile + content/paynow-flow.md)</div>
      <div>Amount: <span className="font-semibold">S${amount}</span></div>
      <div className="my-2 p-3 bg-white border rounded font-mono text-sm">UEN: 12345678X • Ref: {reference}</div>
      <input
        placeholder="Enter PayNow reference here (demo)"
        className="w-full border rounded p-2 text-sm"
        defaultValue={reference}
        onChange={(e) => onRefChange?.(e.target.value)}
        data-testid="paynow-ref-input"
      />
      <div className="text-xs text-[#5C5144] mt-1">Customer enters exact ref after paying. Ops confirms in Admin. Address releases on schedule.</div>
    </SHCCard>
  );
}

export function CollectionSlotPicker({ slots, selected, onSelect }: { slots: Array<{date:string;slot:string}>; selected: any; onSelect: (d:string,s:string)=>void }) {
  return (
    <div>
      <div className="text-sm font-medium mb-1">Select collection slot (HDB, 2h address release)</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {slots.length === 0 && <div className="text-xs text-[#5C5144]">No slots (availability paused or past). Use mock data in demo.</div>}
        {slots.map((s, i) => (
          <button key={i} onClick={() => onSelect(s.date, s.slot)} className={`text-left p-2 border rounded text-sm ${selected?.date===s.date && selected?.slot===s.slot ? 'border-[#1D9E75] bg-[#F5F0E6]' : 'border-[#E8D5B7] hover:bg-white'}`} data-testid={`slot-${i}`}>
            {s.date} • {s.slot}
          </button>
        ))}
      </div>
    </div>
  );
}

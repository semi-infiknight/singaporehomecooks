'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'outline' | 'accent' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

export function SHCButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
  size = 'md',
  testID,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  testID?: string;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-primary hover:opacity-90 text-primary-foreground shadow-sm',
    outline: 'border border-primary text-primary hover:bg-secondary bg-card',
    accent: 'bg-[var(--shc-accent-dark)] hover:opacity-90 text-white shadow-sm',
    ghost: 'text-muted-foreground hover:bg-secondary',
  };
  return (
    <button
      type={type}
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

export function SHCCard({
  children,
  className = '',
  hover = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={`bg-card border border-border rounded-xl p-5 shadow-[var(--shc-shadow)] ${
        hover ? 'transition-shadow hover:shadow-[var(--shc-shadow-lg)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function SHCBadge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'heritage';
}) {
  const styles: Record<string, string> = {
    default: 'bg-secondary text-foreground',
    success: 'bg-emerald-50 text-emerald-800',
    warning: 'bg-amber-50 text-amber-800',
    error: 'bg-red-50 text-red-800',
    heritage: 'bg-accent text-[var(--shc-heritage)]',
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${styles[variant]}`}>
      {children}
    </span>
  );
}

export function SHCSectionTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="mt-8 mb-3">
      <h2 className="text-lg font-semibold text-foreground">{children}</h2>
      {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}

export function SHCPageHeader({
  title,
  subtitle,
  backHref,
  backLabel = 'Back',
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="mb-8">
      {backHref && (
        <a href={backHref} className="text-sm text-muted-foreground hover:text-primary mb-3 inline-block">
          ← {backLabel}
        </a>
      )}
      <h1 className="shc-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="text-muted-foreground mt-2 max-w-2xl">{subtitle}</p>}
    </div>
  );
}

export function SHCErrorBanner({ code, message }: { code?: string; message: string }) {
  return (
    <div
      className="flex gap-3 bg-red-50 border border-red-100 rounded-lg p-4 my-3"
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden />
      <div>
        {code && <div className="font-mono text-xs text-red-700 font-semibold">{code}</div>}
        <div className="text-sm text-foreground">{message}</div>
      </div>
    </div>
  );
}

export function SHCEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <SHCCard className="text-center py-12">
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </SHCCard>
  );
}

export function SHCSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading dishes">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="shc-skeleton h-5 w-3/4" />
          <div className="shc-skeleton h-4 w-1/2" />
          <div className="shc-skeleton h-12 w-full" />
          <div className="flex gap-2">
            <div className="shc-skeleton h-6 w-16 rounded-full" />
            <div className="shc-skeleton h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SHCLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground py-8" role="status">
      <Loader2 className="w-5 h-5 animate-spin text-primary" aria-hidden />
      <span>{label}</span>
    </div>
  );
}

export function AllergenAckCheckbox({
  checked,
  onChange,
  testID,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  testID?: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm cursor-pointer p-4 bg-[var(--shc-surface-alt)] border border-border rounded-lg">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testID}
        className="mt-0.5 w-4 h-4 accent-primary rounded"
        aria-required="true"
      />
      <span className="text-foreground leading-relaxed">
        I acknowledge the allergens listed for this dish. I understand this is prepared in a home kitchen and
        cross-contamination is possible.
      </span>
    </label>
  );
}

export function PriceEarningsCalc({ total, compact }: { total: number; compact?: boolean }) {
  const earnings = Math.floor(total * 0.85);
  if (compact) {
    return <span className="text-xs text-muted-foreground">Cook receives ~S${earnings}</span>;
  }
  return (
    <p className="text-sm text-[var(--shc-success)]">
      Your cook receives S${earnings} after platform fee (85% of order total)
    </p>
  );
}

export function CreditBadge({ balance }: { balance: number }) {
  return (
    <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full font-medium">
      {balance} Home Credits · ~S${(balance / 4).toFixed(0)} value
    </span>
  );
}

export function WalletCard({ balance, tier = 'Silver' }: { balance: number; tier?: string }) {
  return (
    <SHCCard className="bg-brand-bg border-border">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-muted-foreground">Home Credits</div>
          <div className="text-3xl font-semibold mt-1 tabular-nums">{balance}</div>
          <div className="text-xs text-muted-foreground mt-1">~S${(balance / 4).toFixed(0)} redeemable at checkout</div>
        </div>
        <SHCBadge variant="heritage">{tier} tier</SHCBadge>
      </div>
      <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
        Earn 5% back on every collected order. Credits expire after 12 months.
      </p>
    </SHCCard>
  );
}

export function PayNowPanel({
  amount,
  reference,
  onRefChange,
}: {
  amount: number;
  reference: string;
  onRefChange?: (r: string) => void;
}) {
  return (
    <SHCCard>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="font-medium">Pay with PayNow</div>
          <div className="text-sm text-muted-foreground">Transfer the exact amount, then enter your reference below</div>
        </div>
      </div>
      <div className="text-2xl font-semibold tabular-nums mb-3">S${amount.toFixed(2)}</div>
      <div className="p-4 bg-secondary border border-border rounded-lg font-mono text-sm space-y-1">
        <div>
          <span className="text-muted-foreground">UEN</span> 12345678X
        </div>
        <div>
          <span className="text-muted-foreground">Reference</span> {reference}
        </div>
      </div>
      <label className="block mt-4 text-sm font-medium text-foreground">Payment reference</label>
      <input
        placeholder="Enter the reference from your banking app"
        className="shc-input mt-1.5"
        defaultValue={reference}
        onChange={(e) => onRefChange?.(e.target.value)}
        data-testid="paynow-ref-input"
      />
      <p className="text-xs text-muted-foreground mt-2">
        Your collection address is shared 2 hours before your slot, after payment is confirmed.
      </p>
    </SHCCard>
  );
}

export function CollectionSlotPicker({
  slots,
  selected,
  onSelect,
}: {
  slots: Array<{ date: string; slot: string }>;
  selected: { date: string; slot: string } | null;
  onSelect: (d: string, s: string) => void;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">Pick-up from the cook&apos;s HDB — address shared before your slot</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {slots.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-2 py-4 text-center bg-secondary rounded-lg">
            No collection slots available right now. Try another dish or check back soon.
          </p>
        )}
        {slots.map((s, i) => {
          const isSelected = selected?.date === s.date && selected?.slot === s.slot;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(s.date, s.slot)}
              className={`text-left p-3 border rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'border-primary bg-secondary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50 bg-card'
              }`}
              data-testid={`slot-${i}`}
            >
              <div className="font-medium">{s.date}</div>
              <div className="text-muted-foreground">{s.slot}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TrustStrip() {
  const items = [
    { label: '127+ verified cooks', sub: 'Across 28 areas' },
    { label: '4,892 meals', sub: 'Served this month' },
    { label: 'HDB collection', sub: 'No delivery — planned occasions' },
    { label: 'Allergen disclosure', sub: 'Mandatory before checkout' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.label} className="text-center p-4 bg-card/80 border border-border/60 rounded-xl">
          <div className="font-semibold text-foreground text-sm">{item.label}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
        </div>
      ))}
    </div>
  );
}

export function CalorieBadge({ calories }: { calories: number }) {
  const variant = calories < 400 ? 'success' : calories < 550 ? 'warning' : 'error';
  const label = calories < 400 ? 'Light' : calories < 550 ? 'Moderate' : 'Hearty';
  return (
    <SHCBadge variant={variant}>
      {label} · ~{calories} cal
    </SHCBadge>
  );
}
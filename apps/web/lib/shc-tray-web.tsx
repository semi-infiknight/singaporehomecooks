'use client';

import React from 'react';
import {
  pushTray,
  popTray,
  currentTray,
  TRAY_HEIGHT_PX,
  shouldReduceMotion,
  type TrayFrame,
  type TrayHeight,
} from '@shc/ui/family-values-core';

export type { TrayFrame, TrayHeight };

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
  appearance = 'default',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  testID?: string;
  className?: string;
  type?: 'button' | 'submit';
  appearance?: 'default' | 'customer';
}) {
  const brutalBase =
    'inline-flex items-center justify-center gap-2 font-bold rounded-lg border-2 border-[var(--shc-border-brutal)] shadow-[var(--shc-shadow-brutal-sm)] transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:translate-x-px active:translate-y-px active:shadow-none';
  const customerBase =
    'inline-flex items-center justify-center gap-2 font-bold rounded-xl border border-border shadow-[var(--shc-shadow-card)] transition-shadow duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const base = appearance === 'customer' ? customerBase : brutalBase;
  const sizes: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  };
  const brutalVariants: Record<ButtonVariant, string> = {
    primary: 'shc-btn-primary',
    outline: 'border-2 border-[var(--shc-border-brutal)] text-primary hover:bg-secondary bg-card',
    accent: 'bg-[var(--shc-accent)] hover:opacity-90 text-[var(--shc-text)]',
    ghost: 'border-transparent shadow-none text-muted-foreground hover:bg-secondary',
  };
  const customerVariants: Record<ButtonVariant, string> = {
    primary: 'bg-primary text-primary-foreground border-transparent hover:brightness-105',
    outline: 'border border-border text-primary hover:bg-secondary bg-card',
    accent: 'bg-[var(--shc-accent)] hover:opacity-90 text-[var(--shc-text)] border border-border',
    ghost: 'border-transparent shadow-none text-muted-foreground hover:bg-secondary',
  };
  const variants = appearance === 'customer' ? customerVariants : brutalVariants;
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

export type TrayContentInputWeb = React.ReactNode | (() => React.ReactNode);

type TrayContextValueWeb = {
  stack: TrayFrame[];
  openTray: (frame: TrayFrame, content: TrayContentInputWeb) => void;
  pushTrayContent: (frame: TrayFrame, content: TrayContentInputWeb) => void;
  popTray: () => void;
  dismiss: () => void;
  contentMap: Record<string, () => React.ReactNode>;
};

const TrayContextWeb = React.createContext<TrayContextValueWeb | null>(null);

export function useSHCTrayWeb(): TrayContextValueWeb {
  const ctx = React.useContext(TrayContextWeb);
  if (!ctx) throw new Error('useSHCTrayWeb must be used within SHCTrayProviderWeb');
  return ctx;
}

function trayHeightStyle(height: TrayHeight): React.CSSProperties {
  const px = TRAY_HEIGHT_PX[height];
  return { height: `min(${px}px, 92vh)` };
}

export function SHCTrayWeb() {
  const { stack, popTray: pop, dismiss, contentMap } = useSHCTrayWeb();
  const frame = currentTray(stack);
  const depth = stack.length;
  const reduce = shouldReduceMotion();

  React.useEffect(() => {
    if (!frame) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [frame]);

  if (!frame) return null;

  const renderContent = contentMap[frame.id];
  const content = renderContent?.();
  const onNav = depth > 1 ? pop : dismiss;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`shc-tray-title-${frame.id}`}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-[rgba(0,0,0,0.45)] ${reduce ? '' : 'shc-tray-backdrop'}`}
        onClick={dismiss}
        aria-label="Dismiss tray"
        data-testid="shc-tray-backdrop"
      />
      <div
        className={`relative bg-card border-2 border-[var(--shc-border-brutal)] border-b-0 rounded-t-2xl shadow-[var(--shc-shadow-brutal)] flex flex-col overflow-hidden ${reduce ? '' : 'shc-tray-sheet'}`}
        style={trayHeightStyle(frame.height)}
        data-testid={`shc-tray-${frame.id}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/40 mx-auto mt-2 mb-1 shrink-0" aria-hidden />
        <div className="flex items-center gap-2 px-4 pb-2 border-b border-[var(--shc-border)] shrink-0">
          <button
            type="button"
            onClick={onNav}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors shrink-0"
            aria-label={depth > 1 ? 'Back' : 'Close'}
            data-testid="shc-tray-nav"
          >
            <span aria-hidden>{depth > 1 ? '‹' : '×'}</span>
          </button>
          <h2
            id={`shc-tray-title-${frame.id}`}
            className="flex-1 text-center text-base font-extrabold text-foreground truncate"
          >
            {frame.title}
          </h2>
          <span className="w-9 shrink-0" aria-hidden />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{content}</div>
      </div>
    </div>
  );
}

export function SHCTrayProviderWeb({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = React.useState<TrayFrame[]>([]);
  const [contentMap, setContentMap] = React.useState<Record<string, () => React.ReactNode>>({});

  const wrapTrayContent = React.useCallback((content: TrayContentInputWeb): (() => React.ReactNode) => {
    if (typeof content === 'function') return content;
    return () => content;
  }, []);

  const openTray = React.useCallback(
    (frame: TrayFrame, content: TrayContentInputWeb) => {
      setContentMap((m) => ({ ...m, [frame.id]: wrapTrayContent(content) }));
      setStack([frame]);
    },
    [wrapTrayContent]
  );

  const pushTrayContent = React.useCallback(
    (frame: TrayFrame, content: TrayContentInputWeb) => {
      setContentMap((m) => ({ ...m, [frame.id]: wrapTrayContent(content) }));
      setStack((s) => pushTray(s, frame));
    },
    [wrapTrayContent]
  );

  const pop = React.useCallback(() => setStack((s) => popTray(s)), []);

  const dismiss = React.useCallback(() => {
    setStack([]);
    setContentMap({});
  }, []);

  const value = React.useMemo(
    () => ({ stack, openTray, pushTrayContent, popTray: pop, dismiss, contentMap }),
    [stack, openTray, pushTrayContent, pop, dismiss, contentMap]
  );

  return (
    <TrayContextWeb.Provider value={value}>
      {children}
      <SHCTrayWeb />
    </TrayContextWeb.Provider>
  );
}

export function SHCTrayActionWeb({
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  destructive,
  testID = 'shc-tray-action',
  appearance = 'default',
}: {
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  destructive?: boolean;
  testID?: string;
  appearance?: 'default' | 'customer';
}) {
  return (
    <div className="flex flex-col gap-4" data-testid={testID}>
      <p className="text-[15px] font-medium text-foreground leading-relaxed">{message}</p>
      <SHCButton
        className="w-full"
        size="lg"
        variant={destructive ? 'outline' : 'primary'}
        appearance={appearance}
        onClick={onPrimary}
        testID={`${testID}-primary`}
      >
        <span className={destructive ? 'text-[var(--shc-error)]' : undefined}>{primaryLabel}</span>
      </SHCButton>
      {secondaryLabel && onSecondary ? (
        <button
          type="button"
          onClick={onSecondary}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground py-2 transition-colors"
          data-testid={`${testID}-secondary`}
        >
          {secondaryLabel}
        </button>
      ) : null}
    </div>
  );
}
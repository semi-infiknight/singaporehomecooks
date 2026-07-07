'use client';

import Link from 'next/link';
import { useShcI18n, getFooterCopy } from '@shc/i18n';
import { showDevTools } from '../../lib/dev';

export function AppFooter() {
  const { locale } = useShcI18n();
  const copy = getFooterCopy(locale);

  return (
    <footer className="border-t border-border/80 bg-card mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="shc-display text-lg font-semibold text-foreground">Singapore Home Cooks</div>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{copy.tagline}</p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{copy.customersHeading}</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#discover" className="text-foreground hover:text-primary">
                  {copy.browseDishes}
                </Link>
              </li>
              <li>
                <Link href="/content/trust" className="text-foreground hover:text-primary">
                  {copy.trustSafety}
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-foreground hover:text-primary">
                  {copy.homeCredits}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{copy.cooksHeading}</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/cook-portal" className="text-foreground hover:text-primary">
                  {copy.cookDashboard}
                </Link>
              </li>
              <li>
                <span className="text-muted-foreground">{copy.sfaWsq}</span>
              </li>
              <li>
                <span className="text-muted-foreground">{copy.weeklyPayouts}</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-muted-foreground">
          <span>{copy.copyright(new Date().getFullYear())}</span>
          {showDevTools && (
            <span className="font-mono text-[10px] opacity-60">
              dev: web :3001 · mobile :8081 · api :9000
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}

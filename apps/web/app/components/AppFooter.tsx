import Link from 'next/link';
import { showDevTools } from '../../lib/dev';

export function AppFooter() {
  return (
    <footer className="border-t border-[#E8D5B7]/80 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="shc-display text-lg font-semibold text-[#2C2416]">Singapore Home Cooks</div>
            <p className="text-sm text-[#5C5144] mt-2 leading-relaxed">
              Heritage recipes from verified home kitchens across Singapore. Planned occasions, HDB collection,
              PayNow — no delivery.
            </p>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#5C5144] mb-3">For customers</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#discover" className="text-[#2C2416] hover:text-[#1D9E75]">
                  Browse dishes
                </Link>
              </li>
              <li>
                <Link href="/content/trust" className="text-[#2C2416] hover:text-[#1D9E75]">
                  Trust & Safety
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-[#2C2416] hover:text-[#1D9E75]">
                  Home Credits
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-[#5C5144] mb-3">For cooks</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/cook-portal" className="text-[#2C2416] hover:text-[#1D9E75]">
                  Cook dashboard
                </Link>
              </li>
              <li>
                <span className="text-[#5C5144]">SFA registration & WSQ support</span>
              </li>
              <li>
                <span className="text-[#5C5144]">Weekly payouts · 85% earnings</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[#E8D5B7]/60 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-[#5C5144]">
          <span>© {new Date().getFullYear()} Singapore Home Cooks · PDPA compliant · Collection only</span>
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
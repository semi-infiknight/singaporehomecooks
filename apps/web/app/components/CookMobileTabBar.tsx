'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, FileCheck } from 'lucide-react';

const TABS = [
  { href: '/cook-portal/dashboard', label: 'Home', icon: LayoutDashboard, testID: 'tab-cook-dashboard' },
  { href: '/cook-portal/orders', label: 'Orders', icon: ClipboardList, testID: 'tab-cook-orders' },
  { href: '/cook-portal/listings', label: 'Listings', icon: UtensilsCrossed, testID: 'tab-cook-listings' },
  { href: '/cook-portal/compliance', label: 'Docs', icon: FileCheck, testID: 'tab-cook-compliance' },
];

const HIDE_ON = [/^\/cook-portal\/orders\/[^/]+$/];

export function CookMobileTabBar() {
  const pathname = usePathname();
  if (HIDE_ON.some((re) => re.test(pathname))) return null;

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none px-3 pb-[max(env(safe-area-inset-bottom),8px)]">
      <nav
        className="pointer-events-auto rounded-[28px] bg-[var(--shc-gourmeat-nav)] shadow-[0_8px_24px_rgba(0,0,0,0.25)] px-2 py-2"
        data-testid="cook-bottom-tab-bar"
        aria-label="Cook navigation"
      >
        <div className="flex items-stretch min-h-[52px]">
          {TABS.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                data-testid={tab.testID}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 ${
                  active ? 'text-primary' : 'text-white/55'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={`w-[22px] h-[22px] ${active ? 'text-primary' : ''}`} strokeWidth={active ? 2.5 : 2} aria-hidden />
                <span className={`text-[10px] ${active ? 'font-bold text-primary' : 'font-medium'}`}>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
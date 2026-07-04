'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { AppMobileTabBar } from './AppMobileTabBar';
import { CookMobileTabBar } from './CookMobileTabBar';

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isCookPortal = pathname.startsWith('/cook-portal');

  if (isCookPortal) {
    return (
      <>
        <main className="flex-1 w-full pb-[100px] bg-background">{children}</main>
        <CookMobileTabBar />
      </>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <AppHeader />
      </div>
      <main className="flex-1 w-full pb-[110px] md:pb-0">{children}</main>
      <div className="hidden md:block">
        <AppFooter />
      </div>
      <AppMobileTabBar />
    </>
  );
}
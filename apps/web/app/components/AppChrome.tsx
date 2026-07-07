'use client';

import { usePathname } from 'next/navigation';
import { AppHeader } from './AppHeader';
import { AppFooter } from './AppFooter';
import { AppMobileTabBar } from './AppMobileTabBar';
import { CookMobileTabBar } from './CookMobileTabBar';
import { DirectionalTabShell } from './DirectionalTabShell';
import { WebDocumentMeta } from './WebDocumentMeta';

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isCookPortal = pathname.startsWith('/cook-portal');

  if (isCookPortal) {
    return (
      <>
        <WebDocumentMeta />
        <main className="flex-1 w-full pb-[100px] bg-background md:pb-0">
          <DirectionalTabShell mode="cook">{children}</DirectionalTabShell>
        </main>
        <CookMobileTabBar />
      </>
    );
  }

  return (
    <>
      <WebDocumentMeta />
      <div className="hidden md:block">
        <AppHeader />
      </div>
      <main className="flex-1 w-full pb-[110px] md:pb-0">
        <DirectionalTabShell mode="customer">{children}</DirectionalTabShell>
      </main>
      <div className="hidden md:block">
        <AppFooter />
      </div>
      <AppMobileTabBar />
    </>
  );
}
'use client';

import { SHCCard, SHCPageHeader } from '../components/SHCWebComponents';

export default function CookPortalRedirect() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <SHCPageHeader
        title="Cook portal moved"
        subtitle="Cooks now use the dedicated SHC Cook mobile app — separate from the customer experience."
      />
      <SHCCard className="p-6 text-left space-y-3">
        <p className="text-sm text-[#5C5144]">
          Run <code className="bg-muted px-1 rounded">pnpm cook:dev</code> and sign in with your cook account
          (e.g. rose@shc.local / cooksecret after bootstrap).
        </p>
        <p className="text-sm text-[#5C5144]">
          Customer ordering stays on this website and the SHC Customer app.
        </p>
      </SHCCard>
    </div>
  );
}
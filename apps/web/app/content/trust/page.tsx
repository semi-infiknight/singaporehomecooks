import React from 'react';
import { SHCCard, SHCSectionTitle } from '../../components/SHCWebComponents';

export default function TrustPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold">Trust &amp; Safety + PDPA</h1>
      <SHCCard className="mt-4">
        <SHCSectionTitle>Five Layer Architecture</SHCSectionTitle>
        <p className="text-sm">1. Kitchen video + AI quality. 2. Tasting portions. 3. Clear receipts + tax invoices. 4. Tiered guarantees (up to 50% refund capped). 5. Strict cancellation + HDB guide. Full details in blueprint/content/trust-and-safety.md.</p>
      </SHCCard>
      <SHCCard className="mt-4">
        <SHCSectionTitle>PDPA Compliance (Singapore)</SHCSectionTitle>
        <p className="text-sm">Explicit consent captured at checkout and cook onboarding (timestamp + version). Data retention: orders 7yrs, personal 3yrs or deletion request. Audit logs on all access. See production/compliance-pdpa.md + blueprint.</p>
      </SHCCard>
      <p className="mt-4 text-xs">Same content rendered in mobile. Web SSR enables SEO for these pages.</p>
    </div>
  );
}

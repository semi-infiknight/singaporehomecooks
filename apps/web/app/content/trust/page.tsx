import React from 'react';
import Link from 'next/link';
import { SHCCard, SHCSectionTitle, SHCPageHeader } from '../../components/SHCWebComponents';
import { Shield, Video, Receipt, BadgeCheck, MapPin } from 'lucide-react';

const layers = [
  {
    icon: Video,
    title: 'Kitchen transparency',
    desc: 'Every cook shares a dish demo or kitchen intro. We assess photo quality so you know what to expect.',
  },
  {
    icon: BadgeCheck,
    title: 'Tasting portions',
    desc: 'New cooks offer small tasting portions (S$3–5) so you can try before committing to a larger order.',
  },
  {
    icon: Receipt,
    title: 'Clear receipts',
    desc: 'Every order includes a detailed receipt. Corporate customers receive tax invoices automatically.',
  },
  {
    icon: Shield,
    title: 'Occasion guarantee',
    desc: 'Orders over S$150 are covered by our tiered guarantee — proportional refund up to 50%, capped at S$100.',
  },
  {
    icon: MapPin,
    title: 'Safe HDB collection',
    desc: 'Exact address shared 2 hours before your slot. First-order collection guide included. No delivery.',
  },
];

export default function TrustPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <SHCPageHeader
        title="Trust & Safety"
        subtitle="Five layers of protection for customers and cooks — built for Singapore home kitchens."
      />

      <div className="space-y-4 mb-10">
        {layers.map((layer) => (
          <SHCCard key={layer.title} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F5F0E6] flex items-center justify-center shrink-0">
              <layer.icon className="w-5 h-5 text-[#1D9E75]" aria-hidden />
            </div>
            <div>
              <h3 className="font-semibold text-[#2C2416]">{layer.title}</h3>
              <p className="text-sm text-[#5C5144] mt-1 leading-relaxed">{layer.desc}</p>
            </div>
          </SHCCard>
        ))}
      </div>

      <SHCCard>
        <SHCSectionTitle>Allergen disclosure</SHCSectionTitle>
        <p className="text-sm text-[#5C5144] leading-relaxed">
          Every dish includes mandatory Tier 1 allergen disclosure. You must acknowledge allergens before checkout.
          Home kitchens carry cross-contamination risk — we make that clear upfront.
        </p>
      </SHCCard>

      <SHCCard className="mt-4">
        <SHCSectionTitle>Cancellation policy</SHCSectionTitle>
        <ul className="text-sm text-[#5C5144] space-y-2">
          <li>· 72+ hours before collection: full refund</li>
          <li>· 24–72 hours: 50% refund</li>
          <li>· Less than 24 hours: no refund</li>
        </ul>
      </SHCCard>

      <SHCCard className="mt-4">
        <SHCSectionTitle>PDPA & privacy</SHCSectionTitle>
        <p className="text-sm text-[#5C5144] leading-relaxed">
          We collect only what&apos;s needed to fulfil your order. Explicit consent is captured at checkout. Collection
          addresses are gated until 2 hours before your slot. You can request data deletion at any time.
        </p>
      </SHCCard>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-[#1D9E75] font-medium hover:underline">
          ← Start browsing dishes
        </Link>
      </div>
    </div>
  );
}
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCook, useProducts } from '../../../lib/useProducts';
import { useAuth } from '../../../lib/useAuth';
import { SHCCard, SHCButton, SHCBadge, SHCSectionTitle } from '../../components/SHCWebComponents';
import { getHeritageArchive } from '../../../lib/api-client';

export default function CookProfile() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const { data: cook, isLoading } = useCook(slug);
  const { data: products = [] } = useProducts('', { /* will filter client */ });
  const { user } = useAuth();
  const [heritage, setHeritage] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (cook?.id) getHeritageArchive(cook.id).then(setHeritage).catch(()=>{});
  }, [cook?.id]);

  if (isLoading || !cook) return <p>Loading cook profile (shared seed)...</p>;

  const cookProducts = products.filter((p:any) => p.cook_id === cook.id || p.cook_name?.includes(cook.display_name?.split('(')[0] || ''));

  return (
    <div>
      <Link href="/" className="text-sm underline">← Back to Discover</Link>
      <h1 className="text-3xl font-semibold mt-2">{cook.display_name}</h1>
      <p className="text-[#B85C38]">{cook.area} • {cook.status}</p>

      <SHCCard className="mt-4">
        <p className="italic text-[#5C5144]">{cook.story}</p>
        <div className="mt-3 text-sm">
          <strong>Collection:</strong> {cook.collection_address}<br />
          <strong>Instructions:</strong> {cook.collection_instructions}
        </div>
        <div className="mt-2 text-xs">SFA: {cook.sfa_reg_number} • WSQ expiry {cook.wsq_cert_expiry?.slice(0,10)} • PDPA consented {cook.pdpa_consent_at?.slice(0,10)}</div>
      </SHCCard>

      {/* Heritage Archive (Phase 8 parity, permanent, published) */}
      <SHCSectionTitle>Heritage Recipe Archive (Permanent • NLB/NHB path)</SHCSectionTitle>
      <div className="grid gap-3">
        {heritage.length > 0 ? heritage.map((h:any,i:number)=> (
          <SHCCard key={i}><div className="font-medium">{h.title}</div><div className="text-sm text-[#5C5144]">{h.story}</div><div className="text-[10px] mt-1 text-[#1D9E75]">Published {h.created_at?.slice(0,10)} • always visible</div></SHCCard>
        )) : <p className="text-xs">No additional published entries yet. Cooks add from dashboard (permanent).</p>}
      </div>

      <SHCSectionTitle>Listings ({cookProducts.length})</SHCSectionTitle>
      <div className="grid md:grid-cols-2 gap-3">
        {cookProducts.map((p:any) => (
          <Link key={p.id} href={`/product/${p.id}`} className="block">
            <SHCCard>
              <div className="font-semibold">{p.name} — S${p.price}</div>
              <div className="text-xs">{p.heritage_note?.slice(0,90)}...</div>
              <SHCBadge variant="heritage">{p.cuisine}</SHCBadge>
            </SHCCard>
          </Link>
        ))}
      </div>

      {user.role === 'cook' && <div className="mt-6"><Link href="/cook-portal"><SHCButton>Go to your Cook Dashboard (orders, collab, heritage, earnings)</SHCButton></Link></div>}
      <p className="mt-6 text-xs text-[#5C5144]">Structured data + SEO for cook profiles (JSON-LD). Same as mobile cook/[slug].</p>
    </div>
  );
}

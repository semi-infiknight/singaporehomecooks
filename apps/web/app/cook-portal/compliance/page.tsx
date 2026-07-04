'use client';

import { useState } from 'react';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import { useComplianceDocs, useSubmitComplianceDoc } from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCBadge,
  VisualBentoTile,
} from '../../components/SHCWebComponents';

export default function CookCompliancePage() {
  const { user } = useCookAuth();
  const { data: docs = [] } = useComplianceDocs();
  const submitDoc = useSubmitComplianceDoc();
  const [type, setType] = useState<'sfa' | 'wsq'>('sfa');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const upload = async () => {
    if (!fileName.trim()) return;
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-');
    await submitDoc.mutateAsync({
      type,
      file_key: `compliance/${user?.id || 'cook'}/${Date.now()}-${safeName}`,
    });
    setResult(`${type.toUpperCase()} submitted for review`);
    setFileName('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-compliance-screen">
      <div className="rounded-xl bg-[var(--shc-bento-mint)] border-2 border-[var(--shc-border-brutal)] p-4 mb-4" data-testid="compliance-phase-banner">
        <p className="font-extrabold text-sm">Compliance documents are saved for admin review</p>
        <p className="text-xs text-muted-foreground mt-1">
          Submit your SFA registration or WSQ certificate reference. Admin verification controls launch readiness.
        </p>
      </div>

      <GourmeatCookHeader
        title="Compliance"
        subtitle={user?.name}
        badges={<SHCBadge variant="warning">Required to accept orders</SHCBadge>}
      />

      <div className="grid grid-cols-2 gap-2 mb-4">
        <VisualBentoTile
          imageUrl={BENTO_ACTION_IMAGES.compliance}
          label="SFA"
          badge={type === 'sfa' ? '✓' : undefined}
          onClick={() => setType('sfa')}
          variant={type === 'sfa' ? 'bento-mint' : 'default'}
          testID="compliance-type-sfa"
        />
        <VisualBentoTile
          imageUrl={BENTO_ACTION_IMAGES.listings}
          label="WSQ"
          badge={type === 'wsq' ? '✓' : undefined}
          onClick={() => setType('wsq')}
          variant={type === 'wsq' ? 'bento-yellow' : 'default'}
          testID="compliance-type-wsq"
        />
      </div>

      <GourmeatCard>
        <SHCBadge variant="heritage">{type.toUpperCase()} upload</SHCBadge>
        <input
          className="w-full mt-3 rounded-xl border border-border px-3 py-2 text-sm"
          placeholder="cert.pdf"
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          data-testid="compliance-file-input"
        />
        <GourmeatPrimaryButton
          label={submitDoc.isPending ? 'Uploading…' : 'Submit document'}
          className="mt-3"
          disabled={submitDoc.isPending || !fileName.trim()}
          onClick={upload}
          testID="compliance-submit-btn"
        />
        {result ? <p className="text-sm font-bold text-[var(--shc-success)] mt-2">{result}</p> : null}
      </GourmeatCard>

      {docs.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-extrabold">Submitted</p>
          {docs.map((d: { id?: string; type?: string; status?: string; file_key?: string }) => (
            <GourmeatCard key={d.id || d.file_key}>
              <p className="font-bold text-sm">{String(d.type || '').toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">{d.file_key}</p>
              <SHCBadge variant="warning">{d.status || 'pending_review'}</SHCBadge>
            </GourmeatCard>
          ))}
        </div>
      )}
    </div>
  );
}
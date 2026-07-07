'use client';

import { useEffect, useState } from 'react';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import { useComplianceDocs, useSubmitComplianceDoc } from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCBadge,
  VisualBentoTile,
  SHCCelebrationWeb,
  useMilestoneCelebrationWeb,
} from '../../components/SHCWebComponents';
import { useShcI18n, getCookComplianceCopy } from '@shc/i18n';

export default function CookCompliancePage() {
  const { user } = useCookAuth();
  const { locale } = useShcI18n();
  const copy = getCookComplianceCopy(locale);
  const { data: docs = [] } = useComplianceDocs();
  const submitDoc = useSubmitComplianceDoc();
  const [type, setType] = useState<'sfa' | 'wsq'>('sfa');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const {
    show: showApprovedCelebration,
    triggerIfFirst: triggerComplianceApproved,
    dismiss: dismissApprovedCelebration,
  } = useMilestoneCelebrationWeb('compliance_approved', user?.id || user?.name || 'anon');

  useEffect(() => {
    const approved = (docs as { status?: string; verified_at?: string }[]).some(
      (d) => d.status === 'approved' || d.verified_at
    );
    if (approved) void triggerComplianceApproved();
  }, [docs, triggerComplianceApproved]);

  const upload = async () => {
    if (!fileName.trim()) return;
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-');
    await submitDoc.mutateAsync({
      type,
      file_key: `compliance/${user?.id || 'cook'}/${Date.now()}-${safeName}`,
    });
    setResult(copy.submittedResult(type));
    setFileName('');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-compliance-screen">
      <div className="rounded-xl bg-[var(--shc-bento-mint)] border-2 border-[var(--shc-border-brutal)] p-4 mb-4" data-testid="compliance-phase-banner">
        <p className="font-extrabold text-sm">{copy.bannerTitle}</p>
        <p className="text-xs text-muted-foreground mt-1">{copy.bannerBody}</p>
      </div>

      <GourmeatCookHeader
        title={copy.title}
        subtitle={user?.name}
        badges={<SHCBadge variant="warning">{copy.requiredBadge}</SHCBadge>}
      />

      <div className="grid grid-cols-2 gap-2 mb-4">
        <VisualBentoTile
          imageUrl={BENTO_ACTION_IMAGES.compliance}
          label={copy.sfaLabel}
          badge={type === 'sfa' ? '✓' : undefined}
          onClick={() => setType('sfa')}
          variant={type === 'sfa' ? 'bento-mint' : 'default'}
          testID="compliance-type-sfa"
        />
        <VisualBentoTile
          imageUrl={BENTO_ACTION_IMAGES.listings}
          label={copy.wsqLabel}
          badge={type === 'wsq' ? '✓' : undefined}
          onClick={() => setType('wsq')}
          variant={type === 'wsq' ? 'bento-yellow' : 'default'}
          testID="compliance-type-wsq"
        />
      </div>

      <GourmeatCard appearance="cook">
        <SHCBadge variant="heritage">{copy.uploadBadge(type)}</SHCBadge>
        <input
          className="shc-input mt-3"
          placeholder={copy.filePlaceholder}
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          data-testid="compliance-file-input"
        />
        <GourmeatPrimaryButton
          label={submitDoc.isPending ? copy.uploading : copy.submitDocument}
          className="mt-3"
          disabled={submitDoc.isPending || !fileName.trim()}
          onClick={upload}
          testID="compliance-submit-btn"
        />
        {result ? <p className="text-sm font-bold text-[var(--shc-success)] mt-2">{result}</p> : null}
      </GourmeatCard>

      {docs.length > 0 && (
        <div className="mt-6 space-y-2">
          <p className="text-sm font-extrabold">{copy.submittedSection}</p>
          {docs.map((d: { id?: string; type?: string; status?: string; file_key?: string }) => (
            <GourmeatCard appearance="cook" key={d.id || d.file_key}>
              <p className="font-bold text-sm">{String(d.type || '').toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">{d.file_key}</p>
              <SHCBadge variant="warning">{d.status || copy.statusPendingReview}</SHCBadge>
            </GourmeatCard>
          ))}
        </div>
      )}
      <SHCCelebrationWeb
        visible={showApprovedCelebration}
        message={copy.celebration}
        onDone={dismissApprovedCelebration}
        testID="compliance-approved-celebration"
      />
    </div>
  );
}

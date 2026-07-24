'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BENTO_ACTION_IMAGES,
  complianceLinksForType,
  hasComplianceDocOfType,
  missingComplianceTypes,
  shcUploadTypeBadgeLabel,
} from '@shc/utils';
import { useCookAuth } from '../../../lib/useCookAuth';
import { useComplianceDocs, useSubmitComplianceDoc } from '../../../lib/useCookPortal';
import {
  GourmeatCookHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCBadge,
  SHCMetaBadge,
  VisualBentoTile,
  SHCCelebrationWeb,
  useMilestoneCelebrationWeb,
} from '../../components/SHCWebComponents';

export default function CookCompliancePage() {
  const { user } = useCookAuth();
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

  const missing = useMemo(() => missingComplianceTypes(docs as any[]), [docs]);
  const hasSelected = hasComplianceDocOfType(docs as any[], type);
  const courseLinks = useMemo(() => complianceLinksForType(type), [type]);

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
          No cert yet? Take the official course below, then upload here. Ops verifies before you accept orders.
        </p>
      </div>

      <GourmeatCookHeader
        title="Compliance"
        subtitle={user?.name}
        badges={<SHCBadge variant="warning">Required to accept orders</SHCBadge>}
      />

      {missing.length > 0 && (
        <div
          className="mb-4 rounded-xl border-2 border-[var(--shc-border-brutal)] bg-[var(--shc-bento-yellow)] p-4"
          data-testid="compliance-missing-banner"
        >
          <p className="text-sm font-extrabold">Still needed</p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {missing.map((t) => t.toUpperCase()).join(' · ')} — open the course links, complete training, then upload.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-4">
        <VisualBentoTile
          imageUrl={BENTO_ACTION_IMAGES.compliance}
          label={hasComplianceDocOfType(docs as any[], 'sfa') ? 'SFA ✓' : 'SFA'}
          badge={type === 'sfa' ? '✓' : undefined}
          onClick={() => setType('sfa')}
          variant={type === 'sfa' ? 'bento-mint' : 'default'}
          testID="compliance-type-sfa"
        />
        <VisualBentoTile
          imageUrl={BENTO_ACTION_IMAGES.listings}
          label={hasComplianceDocOfType(docs as any[], 'wsq') ? 'WSQ ✓' : 'WSQ'}
          badge={type === 'wsq' ? '✓' : undefined}
          onClick={() => setType('wsq')}
          variant={type === 'wsq' ? 'bento-yellow' : 'default'}
          testID="compliance-type-wsq"
        />
      </div>

      {/* Course links when this cert type is missing */}
      {!hasSelected && (
        <div className="mb-4 space-y-2" data-testid={`compliance-courses-${type}`}>
          <p className="text-sm font-extrabold">
            {type === 'sfa' ? 'SFA registration & guides' : 'WSQ Food Safety Course links'}
          </p>
          <p className="text-xs font-semibold text-muted-foreground">
            Official .gov.sg / SkillsFuture destinations — complete the course, then upload your cert below.
          </p>
          {courseLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`compliance-course-link-${link.id}`}
              className="block rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-4 shadow-[var(--shc-shadow-brutal-sm)] hover:opacity-95"
            >
              <p className="text-sm font-black text-primary">{link.title} →</p>
              <p className="mt-1 text-xs font-semibold text-muted-foreground">{link.description}</p>
            </a>
          ))}
        </div>
      )}

      {hasSelected && (
        <p className="mb-3 text-xs font-semibold text-muted-foreground" data-testid={`compliance-have-${type}`}>
          You already submitted {type.toUpperCase()}. Add another version below if renewing, or switch type.
        </p>
      )}

      <GourmeatCard>
        <SHCMetaBadge kind="upload_type">{shcUploadTypeBadgeLabel(type)}</SHCMetaBadge>
        <p className="mt-2 text-xs text-muted-foreground">
          After your course: upload the certificate filename / reference for ops review.
        </p>
        <input
          className="w-full mt-3 rounded-xl border border-border px-3 py-2 text-sm"
          placeholder="cert.pdf or cert reference"
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
      <SHCCelebrationWeb
        visible={showApprovedCelebration}
        message="Compliance approved — you're cleared to accept orders!"
        onDone={dismissApprovedCelebration}
        testID="compliance-approved-celebration"
      />
    </div>
  );
}
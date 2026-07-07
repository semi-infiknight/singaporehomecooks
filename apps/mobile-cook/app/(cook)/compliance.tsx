import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCard,
  SHCButton,
  SHCButtonText,
  SHCVisualBentoTile,
  GourmeatCookHeader,
  SHCSectionTitle,
  SHCBadge,
  SHCIcon,
  SHCFadeIn,
  gourmeatColors,
  shcColors,
  shcSpacing,
  shcBorders,
  shcRadii,
  shcShadows,
  DirectionalTabScreen,
  SHCCelebration,
  useMilestoneCelebration,
} from '@shc/ui';
import * as SecureStore from 'expo-secure-store';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { useAuth } from '../../hooks/useAuth';
import { useShcI18n } from '@shc/i18n';
import { getComplianceDocs, submitComplianceDoc } from '../../lib/api-client';

const milestoneStorage = {
  get: (k: string) => SecureStore.getItemAsync(k),
  set: (k: string, v: string) => SecureStore.setItemAsync(k, v),
};

export default function ComplianceUpload() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useShcI18n();
  const [type, setType] = useState<'sfa' | 'wsq'>('sfa');
  const [fileName, setFileName] = useState('');
  const [docs, setDocs] = useState<any[]>([]);
  const [result, setResult] = useState<{ status: string; type: string; fileName: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { show: showApprovedCelebration, triggerIfFirst, dismiss } = useMilestoneCelebration(
    'compliance_approved',
    user?.id || '',
    milestoneStorage
  );

  useEffect(() => {
    getComplianceDocs()
      .then((loaded) => {
        setDocs(loaded);
        const approved = (loaded as { status?: string }[]).some((d) => d.status === 'approved');
        if (approved) void triggerIfFirst();
      })
      .catch(() => setDocs([]));
  }, [triggerIfFirst]);

  const upload = async () => {
    if (!fileName) return;
    setSubmitting(true);
    try {
      const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-');
      const doc = await submitComplianceDoc({
        type,
        file_key: `compliance/${user?.id || 'cook'}/${Date.now()}-${safeName}`,
      });
      setDocs((prev) => [doc, ...prev]);
      setResult({ status: 'pending_review', type, fileName });
      setFileName('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DirectionalTabScreen testID="cook-compliance-tab-scene">

    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
      testID="cook-compliance-screen"
    >
      <View style={styles.phaseBanner} testID="compliance-phase-banner">
        <Text style={styles.phaseBannerTitle}>{t('cook.compliance.banner_title')}</Text>
        <Text style={styles.phaseBannerBody}>{t('cook.compliance.banner_body')}</Text>
      </View>

      <GourmeatCookHeader
        title={t('cook.compliance.title')}
        subtitle={user?.name}
        badges={
          <View style={styles.heroBadges}>
            <SHCIcon name="compliance" size={22} color={gourmeatColors.primary} active />
            <SHCBadge variant="warning">{t('cook.compliance.required_badge')}</SHCBadge>
          </View>
        }
      />

      <SHCFadeIn delay={80}>
        <View style={styles.bentoRow}>
          <View style={styles.bentoCol}>
            <Pressable onPress={() => setType('sfa')} testID="compliance-type-sfa">
              <SHCVisualBentoTile
                imageUri={BENTO_ACTION_IMAGES.compliance}
                iconKey="document"
                label="SFA"
                badge={type === 'sfa' ? '✓' : undefined}
                variant={type === 'sfa' ? 'bento-mint' : 'default'}
              />
            </Pressable>
          </View>
          <View style={styles.bentoCol}>
            <Pressable onPress={() => setType('wsq')} testID="compliance-type-wsq">
              <SHCVisualBentoTile
                imageUri={BENTO_ACTION_IMAGES.listings}
                iconKey="education"
                label="WSQ"
                badge={type === 'wsq' ? '✓' : undefined}
                variant={type === 'wsq' ? 'bento-yellow' : 'default'}
              />
            </Pressable>
          </View>
        </View>
      </SHCFadeIn>

      <SHCFadeIn delay={140}>
        <SHCCard style={styles.uploadCard}>
          <View style={styles.uploadHeader}>
            <SHCIcon name="compliance" size={22} color={shcColors.primary} active />
            <SHCBadge variant="heritage">{type.toUpperCase()} upload</SHCBadge>
          </View>

          <TextInput
            placeholder="cert.pdf"
            value={fileName}
            onChangeText={setFileName}
            style={styles.fileInput}
            testID="compliance-file-input"
          />

          <SHCButton onPress={upload} disabled={!fileName || submitting} style={styles.uploadBtn} testID="compliance-submit-btn">
            <SHCButtonText>{submitting ? t('cook.compliance.submitting') : t('cook.compliance.submit')}</SHCButtonText>
          </SHCButton>
        </SHCCard>
      </SHCFadeIn>

      {result && (
        <SHCFadeIn>
          <SHCCard variant="bento-mint" style={styles.resultCard}>
            <View style={styles.resultRow}>
              <SHCIcon name="compliance" size={24} color={shcColors.success} active />
              <View style={styles.resultInfo}>
                <SHCBadge variant="default">{result.type.toUpperCase()}</SHCBadge>
                <Text style={styles.resultFile} numberOfLines={1}>{result.fileName}</Text>
              </View>
              <SHCBadge variant="warning">{result.status.replace(/_/g, ' ')}</SHCBadge>
            </View>
          </SHCCard>
        </SHCFadeIn>
      )}

      {docs.length > 0 && (
        <SHCFadeIn>
          <SHCSectionTitle>{t('cook.compliance.submitted_docs')}</SHCSectionTitle>
          {docs.map((doc: any) => (
            <SHCCard key={doc.id || doc.file_key} style={styles.resultCard}>
              <View style={styles.resultRow}>
                <SHCIcon name="compliance" size={24} color={doc.verified_at ? shcColors.success : shcColors.warning} active />
                <View style={styles.resultInfo}>
                  <SHCBadge variant="default">{String(doc.type).toUpperCase()}</SHCBadge>
                  <Text style={styles.resultFile} numberOfLines={1}>{doc.file_key}</Text>
                </View>
                <SHCBadge variant={doc.verified_at ? 'success' : 'warning'}>
                  {doc.verified_at ? t('cook.compliance.doc_verified') : t('cook.compliance.doc_pending')}
                </SHCBadge>
              </View>
            </SHCCard>
          ))}
        </SHCFadeIn>
      )}

      <View style={styles.footerBadges}>
        <SHCBadge variant="default">Admin review</SHCBadge>
        <SHCBadge variant="success">DEV switcher</SHCBadge>
      </View>
    </ScrollView>
      <SHCCelebration
        visible={showApprovedCelebration}
        message={t('cook.compliance.celebration')}
        onDone={dismiss}
        testID="compliance-approved-celebration"
      />
    </DirectionalTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  phaseBanner: {
    marginBottom: shcSpacing.md,
    padding: shcSpacing.md,
    borderRadius: shcRadii.md,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.warning,
    backgroundColor: shcColors.surface,
    ...shcShadows.brutalSm,
  },
  phaseBannerTitle: { fontSize: 14, fontWeight: '800', color: shcColors.warning, marginBottom: 4 },
  phaseBannerBody: { fontSize: 12, color: shcColors.textLight, lineHeight: 18 },
  heroBadges: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  bentoRow: { flexDirection: 'row', gap: shcSpacing.sm, marginBottom: shcSpacing.md },
  bentoCol: { flex: 1 },
  uploadCard: { marginBottom: shcSpacing.md },
  uploadHeader: { flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, marginBottom: shcSpacing.sm },
  fileInput: {
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.md,
    padding: shcSpacing.sm,
    backgroundColor: shcColors.surface,
    ...shcShadows.brutalSm,
  },
  uploadBtn: { marginTop: shcSpacing.md },
  resultCard: { marginBottom: shcSpacing.md },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm },
  resultInfo: { flex: 1, gap: 4 },
  resultFile: { fontWeight: '600', fontSize: 13 },
  footerBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: shcSpacing.sm, marginTop: shcSpacing.sm, marginBottom: shcSpacing.md },
});
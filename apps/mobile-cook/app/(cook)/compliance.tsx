import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCard,
  SHCButton,
  SHCButtonText,
  SHCVisualBentoTile,
  GourmeatCookHeader,
  SHCSectionTitle,
  SHCBadge,
  SHCMetaBadge,
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
  contentPadForTabBar,
} from '@shc/ui';
import * as SecureStore from 'expo-secure-store';
import {
  BENTO_ACTION_IMAGES,
  complianceLinksForType,
  hasComplianceDocOfType,
  missingComplianceTypes,
  shcUploadTypeBadgeLabel,
} from '@shc/utils';
import { useAuth } from '../../hooks/useAuth';
import { getComplianceDocs, submitComplianceDoc } from '../../lib/api-client';
import { pickComplianceCertificate, uploadComplianceCertificate, type PickedComplianceFile } from '../../lib/compliance-upload';

const milestoneStorage = {
  get: (k: string) => SecureStore.getItemAsync(k),
  set: (k: string, v: string) => SecureStore.setItemAsync(k, v),
};

export default function ComplianceUpload() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [type, setType] = useState<'sfa' | 'wsq'>('sfa');
  const [fileName, setFileName] = useState('');
  const [pickedFile, setPickedFile] = useState<PickedComplianceFile | null>(null);
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

  const missing = useMemo(() => missingComplianceTypes(docs), [docs]);
  const hasSelected = hasComplianceDocOfType(docs, type);
  const courseLinks = useMemo(() => complianceLinksForType(type), [type]);

  const upload = async () => {
    if (!pickedFile && !fileName) return;
    setSubmitting(true);
    try {
      let doc: any;
      if (pickedFile) {
        doc = await uploadComplianceCertificate(user?.id || 'cook', type, pickedFile);
        setResult({ status: 'pending_review', type, fileName: pickedFile.name });
      } else {
        const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, '-');
        doc = await submitComplianceDoc({
          type,
          file_key: `compliance/${user?.id || 'cook'}/${Date.now()}-${safeName}`,
        });
        setResult({ status: 'pending_review', type, fileName });
      }
      setDocs((prev) => [doc, ...prev]);
      setFileName('');
      setPickedFile(null);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Could not submit compliance document.');
    } finally {
      setSubmitting(false);
    }
  };

  const choosePhoto = async () => {
    const file = await pickComplianceCertificate();
    if (!file) return;
    setPickedFile(file);
    setFileName('');
  };

  return (
    <DirectionalTabScreen testID="cook-compliance-tab-scene">

    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) }]}
      testID="cook-compliance-screen"
    >
      <View style={styles.phaseBanner} testID="compliance-phase-banner">
        <Text style={styles.phaseBannerTitle}>Compliance documents are saved for admin review</Text>
        <Text style={styles.phaseBannerBody}>
          No cert yet? Open the official course links below, complete training, then upload here for ops review.
        </Text>
      </View>

      <GourmeatCookHeader
        title="Compliance"
        subtitle={user?.name}
        badges={
          <View style={styles.heroBadges}>
            <SHCIcon name="compliance" size={22} color={gourmeatColors.primary} active />
            <SHCBadge variant="warning">Required to accept orders</SHCBadge>
          </View>
        }
      />

      {missing.length > 0 && (
        <View style={styles.missingBanner} testID="compliance-missing-banner">
          {/* Avoid fontWeight 800 + hard shadow on same card — Android faux-bold double-draws glyphs */}
          <Text style={styles.missingTitle} maxFontSizeMultiplier={1.2}>
            Still needed
          </Text>
          <Text style={styles.missingBody} maxFontSizeMultiplier={1.2}>
            {missing.map((t) => t.toUpperCase()).join(' · ')} — take the course, then upload your cert.
          </Text>
        </View>
      )}

      <SHCFadeIn delay={80}>
        <View style={styles.bentoRow}>
          <View style={styles.bentoCol}>
            <Pressable onPress={() => setType('sfa')} testID="compliance-type-sfa">
              <SHCVisualBentoTile
                imageUri={BENTO_ACTION_IMAGES.compliance}
                iconKey="document"
                label={hasComplianceDocOfType(docs, 'sfa') ? 'SFA ✓' : 'SFA'}
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
                label={hasComplianceDocOfType(docs, 'wsq') ? 'WSQ ✓' : 'WSQ'}
                badge={type === 'wsq' ? '✓' : undefined}
                variant={type === 'wsq' ? 'bento-yellow' : 'default'}
              />
            </Pressable>
          </View>
        </View>
      </SHCFadeIn>

      {!hasSelected && (
        <SHCFadeIn delay={100}>
          <SHCSectionTitle>
            {type === 'sfa' ? 'SFA registration & guides' : 'WSQ Food Safety Course'}
          </SHCSectionTitle>
          <View testID={`compliance-courses-${type}`}>
            {courseLinks.map((link) => (
              <Pressable
                key={link.id}
                testID={`compliance-course-link-${link.id}`}
                onPress={() => void Linking.openURL(link.url)}
                style={styles.courseCard}
              >
                <Text style={styles.courseTitle}>{link.title} →</Text>
                <Text style={styles.courseBody}>{link.description}</Text>
              </Pressable>
            ))}
          </View>
        </SHCFadeIn>
      )}

      <SHCFadeIn delay={140}>
        <SHCCard style={styles.uploadCard}>
          <View style={styles.uploadHeader}>
            <SHCIcon name="compliance" size={22} color={shcColors.primary} active />
            <SHCMetaBadge kind="upload_type">{shcUploadTypeBadgeLabel(type)}</SHCMetaBadge>
          </View>
          <Text style={styles.uploadHint}>
            Upload a photo of your certificate, or enter a reference if you will email the PDF to ops.
          </Text>

          <SHCButton variant="outline" onPress={choosePhoto} style={styles.pickBtn} testID="compliance-pick-photo-btn">
            <SHCButtonText variant="outline">{pickedFile ? 'Change photo' : 'Choose certificate photo'}</SHCButtonText>
          </SHCButton>
          {pickedFile ? (
            <Text style={styles.pickedName} numberOfLines={1} testID="compliance-picked-file">
              {pickedFile.name}
            </Text>
          ) : null}

          <TextInput
            placeholder="Or cert reference (e.g. SFA reg no.)"
            value={fileName}
            onChangeText={(v) => {
              setFileName(v);
              if (v) setPickedFile(null);
            }}
            style={styles.fileInput}
            testID="compliance-file-input"
          />

          <SHCButton
            onPress={upload}
            disabled={(!pickedFile && !fileName) || submitting}
            style={styles.uploadBtn}
            testID="compliance-submit-btn"
          >
            <SHCButtonText>{submitting ? 'Submitting…' : 'Submit'}</SHCButtonText>
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
          <SHCSectionTitle>Submitted documents</SHCSectionTitle>
          {docs.map((doc: any) => (
            <SHCCard key={doc.id || doc.file_key} style={styles.resultCard}>
              <View style={styles.resultRow}>
                <SHCIcon name="compliance" size={24} color={doc.verified_at ? shcColors.success : shcColors.warning} active />
                <View style={styles.resultInfo}>
                  <SHCBadge variant="default">{String(doc.type).toUpperCase()}</SHCBadge>
                  <Text style={styles.resultFile} numberOfLines={1}>{doc.file_key}</Text>
                </View>
                <SHCBadge variant={doc.verified_at ? 'success' : 'warning'}>
                  {doc.verified_at ? 'verified' : 'pending review'}
                </SHCBadge>
              </View>
            </SHCCard>
          ))}
        </SHCFadeIn>
      )}

      {/* Demo stub chips removed — were hardcoded "Admin review" / "DEV switcher"
      <View style={styles.footerBadges}>
        <SHCBadge variant="default">Admin review</SHCBadge>
        <SHCBadge variant="success">DEV switcher</SHCBadge>
      </View>
      */}
    </ScrollView>
      <SHCCelebration
        visible={showApprovedCelebration}
        message="Compliance approved — you're cleared to accept orders!"
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
  missingBanner: {
    marginBottom: shcSpacing.md,
    padding: shcSpacing.md,
    borderRadius: shcRadii.md,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: shcColors.bentoYellow,
    // No hard shadow here — clips/composites with bold text and looks double-struck
  },
  missingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: shcColors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  missingBody: {
    fontSize: 13,
    color: shcColors.textLight,
    lineHeight: 19,
    fontWeight: '500',
  },
  heroBadges: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  bentoRow: { flexDirection: 'row', gap: shcSpacing.sm, marginBottom: shcSpacing.md },
  bentoCol: { flex: 1 },
  courseCard: {
    marginBottom: shcSpacing.sm,
    padding: shcSpacing.md,
    borderRadius: shcRadii.md,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: shcColors.surface,
    ...shcShadows.brutalSm,
  },
  courseTitle: { fontSize: 14, fontWeight: '900', color: gourmeatColors.primary },
  courseBody: { marginTop: 4, fontSize: 12, fontWeight: '600', color: shcColors.textLight, lineHeight: 17 },
  uploadCard: { marginBottom: shcSpacing.md },
  uploadHeader: { flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, marginBottom: shcSpacing.sm },
  uploadHint: { fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginBottom: shcSpacing.sm },
  pickBtn: { marginBottom: shcSpacing.sm },
  pickedName: { fontSize: 12, fontWeight: '700', color: shcColors.text, marginBottom: shcSpacing.sm },
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
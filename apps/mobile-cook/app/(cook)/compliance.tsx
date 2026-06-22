import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCard,
  SHCButton,
  SHCButtonText,
  SHCVisualBentoTile,
  GourmeatCookHeader,
  SHCBadge,
  SHCIcon,
  SHCFadeIn,
  gourmeatColors,
  shcColors,
  shcSpacing,
  shcBorders,
  shcRadii,
  shcShadows,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES } from '@shc/utils';
import { useAuth } from '../../hooks/useAuth';

export default function ComplianceUpload() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [type, setType] = useState<'sfa' | 'wsq'>('sfa');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<{ status: string; type: string; fileName: string } | null>(null);

  const upload = () => {
    if (!fileName) return;
    setResult({ status: 'pending_review', type, fileName });
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
      testID="cook-compliance-screen"
    >
      <View style={styles.phaseBanner} testID="compliance-phase-banner">
        <Text style={styles.phaseBannerTitle}>Phase 6 — upload API coming</Text>
        <Text style={styles.phaseBannerBody}>
          Certificate upload is a local stub for now. Submissions are not sent to the server until the MinIO/S3 upload API ships.
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

          <SHCButton onPress={upload} disabled={!fileName} style={styles.uploadBtn} testID="compliance-submit-btn">
            <SHCButtonText>Submit</SHCButtonText>
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

      <View style={styles.footerBadges}>
        <SHCBadge variant="default">Admin review</SHCBadge>
        <SHCBadge variant="success">DEV switcher</SHCBadge>
      </View>
    </ScrollView>
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
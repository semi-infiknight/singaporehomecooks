import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { SHCCard, SHCButton, SHCButtonText, shcColors } from '@shc/ui';
import { useAuth } from '../../../hooks/useAuth';
export default function ComplianceUpload() {
  const { user } = useAuth();
  const [type, setType] = useState<'sfa' | 'wsq'>('sfa');
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<{ status: string; type: string; fileName: string } | null>(null);

  const upload = () => {
    if (!fileName) return;
    setResult({ status: 'pending_review', type, fileName });
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: shcColors.text }}>Compliance (SFA / WSQ)</Text>
      <Text style={{ color: shcColors.textLight, marginBottom: 12 }}>For {user?.name}. Mandatory for cook actions per blueprint (SFA/WSQ certs required before accept).</Text>

      <SHCCard style={{ marginVertical: 12, padding: 16 }}>
        <Text style={{ fontWeight: '600', marginBottom: 8 }}>Upload type</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <SHCButton onPress={() => setType('sfa')} style={{ flex: 1 }}>
            <SHCButtonText>SFA</SHCButtonText>
          </SHCButton>
          <SHCButton onPress={() => setType('wsq')} style={{ flex: 1 }}>
            <SHCButtonText>WSQ</SHCButtonText>
          </SHCButton>
        </View>

        <TextInput
          placeholder="File name (e.g. cert.pdf)"
          value={fileName}
          onChangeText={setFileName}
          style={{ borderWidth: 1, borderColor: '#E8D5B7', borderRadius: 8, padding: 10, marginTop: 12, backgroundColor: '#fff' }}
        />

        <SHCButton onPress={upload} disabled={!fileName} style={{ marginTop: 12 }}>
          <SHCButtonText>Upload &amp; Submit for Verification</SHCButtonText>
        </SHCButton>
      </SHCCard>

      {result && (
        <SHCCard style={{ padding: 12, backgroundColor: '#DCFCE7' }}>
          <Text>Submitted: {result.type} — {result.fileName}</Text>
          <Text style={{ color: shcColors.accent }}>Status: {result.status}</Text>
        </SHCCard>
      )}

      <Text style={{ fontSize: 12, color: shcColors.textLight, marginTop: 16 }}>Ops will verify in Admin (Medusa). Status moves to active after. (Stub enhanced for Integration — uses mock service + contracts). Use DEV switcher to test as cook.</Text>
    </ScrollView>
  );
}

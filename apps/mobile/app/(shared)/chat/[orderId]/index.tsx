// apps/mobile/app/(shared)/chat/[orderId]/index.tsx
// Real chat route: polling mock (4.5s per useOrderChat hook), typed messages from schema.
// Per 10-mobile.md + phase-5. SG HDB copy. Later real push + ws.
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, shcColors } from '@shc/ui';
import { useOrderChat } from '../../../../hooks/useOrder';
import { useAuth } from '../../../../hooks/useAuth';

export default function OrderChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { messages, send } = useOrderChat(orderId || '');
  const [draft, setDraft] = useState('');
  const { user, isCook } = useAuth();

  const handleSend = () => {
    if (!draft.trim()) return;
    send({ body: draft.trim(), from: isCook ? 'cook' : 'customer' });
    setDraft('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: shcColors.background }}>
      <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: shcColors.text }}>Chat for Order {orderId}</Text>
        <Text style={{ fontSize: 12, color: shcColors.textLight }}>Secure order-scoped • Polling every ~4s (demo) • HDB notes visible here post-pay</Text>

        <SHCCard style={{ marginVertical: 12, minHeight: 220, backgroundColor: '#fff' }}>
          {messages.length === 0 && <Text style={{ color: shcColors.textLight }}>No messages yet. Send a note about collection time or dietary prefs.</Text>}
          {messages.map((m: any, i: number) => (
            <Text key={i} style={{ marginBottom: 8, color: m.sender_actor === 'cook' ? shcColors.primary : shcColors.text }}>
              {m.sender_actor}: {m.body} <Text style={{ fontSize: 10, color: shcColors.textLight }}>({new Date(m.created_at).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })})</Text>
            </Text>
          ))}
        </SHCCard>
      </ScrollView>

      <View style={{ padding: 12, backgroundColor: shcColors.surface, flexDirection: 'row', gap: 8 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderColor: '#E8D5B7', borderRadius: 8, padding: 10, backgroundColor: '#fff' }}
          placeholder="Message the other party (collection instructions, thanks...)"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleSend}
        />
        <SHCButton onPress={handleSend}>
          <SHCButtonText>Send</SHCButtonText>
        </SHCButton>
      </View>
    </KeyboardAvoidingView>
  );
}
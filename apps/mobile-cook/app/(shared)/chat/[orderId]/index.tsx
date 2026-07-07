// apps/mobile/app/(shared)/chat/[orderId]/index.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, shcColors, shcBorders, shcRadii } from '@shc/ui';
import { useOrderChat } from '../../../../hooks/useOrder';
import { useAuth } from '../../../../hooks/useAuth';
import { useShcI18n, getOrderChatCopy } from '@shc/i18n';

export default function OrderChatScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const { messages, send } = useOrderChat(orderId || '');
  const [draft, setDraft] = useState('');
  const { locale } = useShcI18n();
  const copy = getOrderChatCopy(locale, 'cook');
  useAuth();

  const handleSend = () => {
    if (!draft.trim()) return;
    send({ body: draft.trim(), from: 'cook' });
    setDraft('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: shcColors.background }}>
      <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: shcColors.text }} testID="chat-order-title">
          {copy.title(orderId || '')}
        </Text>
        <Text style={{ fontSize: 12, color: shcColors.textLight }}>{copy.subtitle}</Text>

        <SHCCard style={{ marginVertical: 12, minHeight: 220, backgroundColor: shcColors.surface }}>
          {messages.length === 0 && <Text style={{ color: shcColors.textLight }}>{copy.empty}</Text>}
          {messages.map((m: any, i: number) => (
            <Text key={i} style={{ marginBottom: 8, color: m.sender_actor === 'cook' ? shcColors.primary : shcColors.text }}>
              {m.sender_actor}: {m.body}{' '}
              <Text style={{ fontSize: 10, color: shcColors.textLight }}>
                ({new Date(m.created_at).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })})
              </Text>
            </Text>
          ))}
        </SHCCard>
      </ScrollView>

      <View style={{ padding: 12, backgroundColor: shcColors.surface, flexDirection: 'row', gap: 8 }}>
        <TextInput
          testID="chat-message-input"
          style={{ flex: 1, borderWidth: shcBorders.brutal, borderColor: shcColors.borderLight, borderRadius: shcRadii.md, padding: 10, backgroundColor: shcColors.surface }}
          placeholder={copy.placeholder}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={handleSend}
        />
        <SHCButton onPress={handleSend}>
          <SHCButtonText>{copy.send}</SHCButtonText>
        </SHCButton>
      </View>
    </KeyboardAvoidingView>
  );
}

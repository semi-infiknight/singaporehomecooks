import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { shcColors } from '@shc/ui';

export default function RootIndex() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: shcColors.background }}>
        <ActivityIndicator color={shcColors.primary} />
      </View>
    );
  }

  // Principle 5 (Weavers Web 2025): guest browse — sign in only at checkout
  return <Redirect href="/(customer)" />;
}
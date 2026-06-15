import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { shcColors } from '@shc/ui';

export default function RootIndex() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: shcColors.background }}>
        <ActivityIndicator color={shcColors.primary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(shared)/auth" />;
  }

  return <Redirect href="/(customer)" />;
}
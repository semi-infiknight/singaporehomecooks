// Simple ErrorBoundary for mobile customer (RN + Expo). Gourmeat skin + @shc/i18n copy.

import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { gourmeatColors, SHCButton, SHCButtonText } from '@shc/ui';
import { SHCErrorCode } from '@shc/types';
import { useShcI18n, getErrorBoundaryCopy } from '@shc/i18n';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCode?: SHCErrorCode | string;
}

class ErrorBoundaryInner extends Component<
  Props & { copy: ReturnType<typeof getErrorBoundaryCopy> },
  State
> {
  constructor(props: Props & { copy: ReturnType<typeof getErrorBoundaryCopy> }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    let code: any = 'SHC-GENERIC-001';
    if (error.message?.includes('SHC-')) {
      code = error.message.match(/SHC-[A-Z]+-\d+/)?.[0] || code;
    }
    return { hasError: true, error, errorCode: code };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('[SHC-ERROR-BOUNDARY]', error, errorInfo);
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('shc_error_boundary_catch');
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorCode: undefined });
  };

  render() {
    if (this.state.hasError) {
      const code = this.state.errorCode || 'SHC-GENERIC-001';
      const { copy } = this.props;
      return (
        <View style={{ flex: 1, backgroundColor: gourmeatColors.background, padding: 20, justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: gourmeatColors.error, marginBottom: 8 }}>
            {copy.title}
          </Text>
          <Text style={{ fontSize: 14, color: gourmeatColors.text, marginBottom: 4 }}>
            {copy.codeLabel} {code}
          </Text>
          <Text style={{ fontSize: 13, color: gourmeatColors.textLight, marginBottom: 16 }}>
            {this.state.error?.message || copy.message}
          </Text>
          <Text style={{ fontSize: 11, color: gourmeatColors.textLight, marginBottom: 12 }}>{copy.opsNote}</Text>
          <SHCButton onPress={this.handleRetry}>
            <SHCButtonText>{copy.retry}</SHCButtonText>
          </SHCButton>
          <Pressable onPress={() => router.replace('/(customer)')} style={{ marginTop: 12 }}>
            <Text style={{ color: gourmeatColors.primary, textAlign: 'center' }}>{copy.discover}</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary(props: Props) {
  const { locale } = useShcI18n();
  const copy = getErrorBoundaryCopy(locale);
  return <ErrorBoundaryInner {...props} copy={copy} />;
}

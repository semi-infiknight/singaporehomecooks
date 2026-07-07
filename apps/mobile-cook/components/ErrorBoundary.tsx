// Simple ErrorBoundary for mobile (RN + Expo). Wraps key layouts/screens per production-hardening.md.
// Shows friendly SHCErrorCode message + retry (reset) button. No core contract change.
// For real: integrate with Expo error reporting / Sentry later.

import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { shcColors, SHCButton, SHCButtonText } from '@shc/ui';
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
        <View style={{ flex: 1, backgroundColor: shcColors.background, padding: 20, justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: shcColors.error, marginBottom: 8 }}>
            {copy.title}
          </Text>
          <Text style={{ fontSize: 14, color: shcColors.text, marginBottom: 4 }}>
            {copy.codeLabel} {code}
          </Text>
          <Text style={{ fontSize: 13, color: shcColors.textLight, marginBottom: 16 }}>
            {this.state.error?.message || copy.message}
          </Text>
          <Text style={{ fontSize: 11, color: shcColors.textLight, marginBottom: 12 }}>{copy.opsNote}</Text>
          <SHCButton onPress={this.handleRetry}>
            <SHCButtonText>{copy.retry}</SHCButtonText>
          </SHCButton>
          <Pressable onPress={() => router.replace('/(cook)/dashboard')} style={{ marginTop: 12 }}>
            <Text style={{ color: shcColors.primary, textAlign: 'center' }}>{copy.cookDashboard}</Text>
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

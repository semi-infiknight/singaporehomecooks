// Simple ErrorBoundary for mobile (RN + Expo). Wraps key layouts/screens per production-hardening.md.
// Shows friendly SHCErrorCode message + retry (reset) button. No core contract change.
// For real: integrate with Expo error reporting / Sentry later.

import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable } from 'react-native';
import { shcColors, SHCButton, SHCButtonText } from '@shc/ui';
import { SHCErrorCode } from '@shc/types';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCode?: SHCErrorCode | string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    // Map generic to SHC if possible
    let code: any = 'SHC-GENERIC-001';
    if (error.message?.includes('SHC-')) {
      code = error.message.match(/SHC-[A-Z]+-\d+/)?.[0] || code;
    }
    return { hasError: true, error, errorCode: code };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Observability stub: console + perf for later pino/railway + tracing
    console.error('[SHC-ERROR-BOUNDARY]', error, errorInfo);
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('shc_error_boundary_catch');
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorCode: undefined });
    // Caller can add reload logic if needed
  };

  render() {
    if (this.state.hasError) {
      const code = this.state.errorCode || 'SHC-GENERIC-001';
      return (
        <View style={{ flex: 1, backgroundColor: shcColors.background, padding: 20, justifyContent: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: shcColors.error, marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ fontSize: 14, color: shcColors.text, marginBottom: 4 }}>
            Error code: {code}
          </Text>
          <Text style={{ fontSize: 13, color: shcColors.textLight, marginBottom: 16 }}>
            {this.state.error?.message || 'An unexpected error occurred. Please retry or restart the flow.'}
          </Text>
          <Text style={{ fontSize: 11, color: shcColors.textLight, marginBottom: 12 }}>
            This is logged for ops. (See ERROR_CODES.md)
          </Text>
          <SHCButton onPress={this.handleRetry}>
            <SHCButtonText>Retry</SHCButtonText>
          </SHCButton>
          <Pressable onPress={() => { /* could navigate home */ }} style={{ marginTop: 12 }}>
            <Text style={{ color: shcColors.primary, textAlign: 'center' }}>Go to Discover</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

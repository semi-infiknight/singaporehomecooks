'use client';

import React, { Component, ReactNode } from 'react';
import { SHCErrorCode } from '@shc/types';
import { useShcI18n, getErrorBoundaryCopy } from '@shc/i18n';

interface Props { children: ReactNode; fallbackTitle?: string; }
interface State { hasError: boolean; error: Error | null; errorCode?: SHCErrorCode | string; }

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
    console.error('[SHC-WEB-ERROR-BOUNDARY]', error, errorInfo);
    if (typeof performance !== 'undefined' && performance.mark) performance.mark('shc_web_error_boundary');
  }
  handleRetry = () => this.setState({ hasError: false, error: null, errorCode: undefined });
  render() {
    if (this.state.hasError) {
      const code = this.state.errorCode || 'SHC-GENERIC-001';
      const { copy } = this.props;
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-8 bg-background">
          <div className="max-w-md w-full border border-border bg-card rounded-xl p-8 shadow-[var(--shc-shadow-brutal-sm)]">
            <h2 className="text-xl font-semibold text-destructive mb-2">{copy.title}</h2>
            <p className="text-sm mb-1">
              {copy.codeLabel} <code className="font-mono">{code}</code>
            </p>
            <p className="text-muted-foreground text-sm mb-4">{this.state.error?.message || copy.message}</p>
            <p className="text-xs text-muted-foreground mb-4">{copy.opsNote}</p>
            <button onClick={this.handleRetry} className="px-4 py-2 bg-primary text-primary-foreground rounded font-medium">
              {copy.retry}
            </button>
            <a href="/" className="ml-4 text-sm underline text-primary">{copy.discover}</a>
          </div>
        </div>
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

export { ErrorBoundary };

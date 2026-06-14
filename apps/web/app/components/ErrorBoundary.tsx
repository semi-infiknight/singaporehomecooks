'use client';

import React, { Component, ReactNode } from 'react';
import { SHCErrorCode } from '@shc/types';

interface Props { children: ReactNode; fallbackTitle?: string; }
interface State { hasError: boolean; error: Error | null; errorCode?: SHCErrorCode | string; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
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
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-8 bg-[#FAF7F2]">
          <div className="max-w-md w-full border border-[#E8D5B7] bg-white rounded-xl p-8">
            <h2 className="text-xl font-semibold text-[#B91C1C] mb-2">Something went wrong</h2>
            <p className="text-sm mb-1">Error code: <code className="font-mono">{code}</code></p>
            <p className="text-[#5C5144] text-sm mb-4">{this.state.error?.message || 'Unexpected error. Retry or refresh.'}</p>
            <p className="text-xs text-[#5C5144] mb-4">Logged for ops. See ERROR_CODES.md + production-hardening.</p>
            <button onClick={this.handleRetry} className="px-4 py-2 bg-[#1D9E75] text-white rounded font-medium">Retry</button>
            <a href="/" className="ml-4 text-sm underline text-[#1D9E75]">Go to Discover</a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

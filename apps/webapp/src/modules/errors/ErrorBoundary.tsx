'use client';

import { Component, createContext, useContext, type ErrorInfo, type ReactNode } from 'react';

import { reportError } from '@/lib/errors';

export type CaughtError = Error & { digest?: string };

export interface ErrorBoundaryStateValue {
  error: CaughtError;
  reset: () => void;
}

const ErrorBoundaryStateContext = createContext<ErrorBoundaryStateValue | null>(null);

/** The caught error and reset, available to any fallback rendered by an ErrorBoundary; null elsewhere. */
export function useErrorBoundaryState(): ErrorBoundaryStateValue | null {
  return useContext(ErrorBoundaryStateContext);
}

export interface ErrorBoundaryProps {
  /** Reported with the error, e.g. 'app-providers', 'navigation', 'install-banner', 'widget:checklist'. */
  scope: string;
  children: ReactNode;
  /** Element (required when passed from a server component) or render function (client callers only). */
  fallback: ReactNode | ((state: ErrorBoundaryStateValue) => ReactNode);
  onError?: (error: CaughtError, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: CaughtError | null;
}

function toCaughtError(value: unknown): CaughtError {
  return value instanceof Error
    ? value
    : new Error('A non-Error value was thrown', { cause: value });
}

/**
 * Contains render-time failures of its children. Does not catch event-handler or async errors —
 * handle those inline with describeError(). See docs/developer/error-handling.md.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toCaughtError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    const caught = toCaughtError(error);
    reportError({
      error: caught,
      scope: this.props.scope,
      componentStack: info.componentStack ?? null,
      digest: caught.digest,
    });
    this.props.onError?.(caught, info);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const value: ErrorBoundaryStateValue = { error, reset: this.reset };
    const { fallback } = this.props;
    return (
      <ErrorBoundaryStateContext.Provider value={value}>
        {typeof fallback === 'function' ? fallback(value) : fallback}
      </ErrorBoundaryStateContext.Provider>
    );
  }
}

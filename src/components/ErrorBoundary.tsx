import { Component, type ErrorInfo, type ReactNode } from 'react';

// ─── Props & State ────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Optional custom fallback; if omitted the default error UI is shown */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ─── ErrorBoundary ────────────────────────────────────────────────────────────

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In production this would be sent to an error reporting service
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center gap-4 p-8 text-center"
        >
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold text-red-700 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-red-600 mb-4">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

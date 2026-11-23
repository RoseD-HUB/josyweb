import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let readable = error.message || 'An unexpected application error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed.error === 'string') {
        readable = `Database operation (${parsed.operationType || 'request'}) failed: ${parsed.error}`;
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: readable };
  }

  componentDidCatch(error: Error) {
    console.error('Josy Textile ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#111113] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#E4E4E0] p-8 space-y-5">
            <p className="text-xs tracking-widest text-[#71717A] uppercase">Josy Textile</p>
            <h1 className="text-3xl font-medium">Something interrupted your session</h1>
            <p className="text-sm text-[#52525B] leading-relaxed break-words">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="px-5 py-2.5 bg-[#111113] text-white text-sm font-medium hover:bg-[#27272A] transition-colors cursor-pointer"
            >
              Reload Storefront
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

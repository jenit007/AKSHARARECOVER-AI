import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught render error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#101614] text-[#f1f2e9] flex items-center justify-center p-6">
          <div className="max-w-lg w-full p-8 rounded-2xl bg-[#17211d] border border-[#35443a] text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-[#faedcd]/15 border border-[#faedcd]/40 text-[#faedcd] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-[#fefae0]">
              Something went wrong in the workspace
            </h1>
            <p className="text-xs text-[#a9b3a8] leading-relaxed">
              {this.state.error?.message || 'An unexpected UI error interrupted rendering.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#ccd5ae] text-[#101614] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#e9edc9] transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Page</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

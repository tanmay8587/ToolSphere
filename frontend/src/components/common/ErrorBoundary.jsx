import { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="mx-auto flex min-h-[75vh] max-w-4xl flex-col items-center justify-center px-6 text-center">
          
          {/* Error Code Badge */}
          <div className="animate-pulse rounded-full border border-rose-500/20 bg-rose-500/10 px-6 py-2 text-rose-300">
            Error 500
          </div>

          {/* Main Icon */}
          <div className="mt-8 flex h-32 w-32 items-center justify-center rounded-full border border-rose-500/20 bg-rose-500/5">
            <FiAlertTriangle className="text-6xl text-rose-400" />
          </div>

          {/* Title */}
          <h1 className="mt-8 text-5xl font-extrabold text-white sm:text-6xl">
            Oops! Something went wrong
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            We're sorry, but something unexpected happened. Our team has been notified and we're working to fix it.
          </p>

          {/* Error Details (only in development) */}
          {import.meta.env.DEV && this.state.error && (
            <div className="mt-6 max-w-2xl rounded-xl border border-rose-500/20 bg-slate-900/50 p-4 text-left">
              <p className="text-sm font-mono text-rose-300">
                {this.state.error.message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            
            {/* Retry Button */}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-6 py-3 font-semibold text-white transition hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20"
            >
              <FiRefreshCw />
              Try Again
            </button>

            {/* Home Button */}
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 hover:border-cyan-500/40"
            >
              <FiHome />
              Go Home
            </Link>
          </div>

          {/* Footer */}
          <div className="mt-16 text-sm text-slate-500">
            © 2026 ToolSphere. All rights reserved.
          </div>

        </div>
      );
    }

    return this.props.children;
  }
}
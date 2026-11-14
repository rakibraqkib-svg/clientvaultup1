import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './i18n/LanguageContext.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unexpected workspace rendering error.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#041536] text-white flex items-center justify-center p-6">
          <div className="ocean-glass neon-cyan-border max-w-md w-full rounded-3xl p-8 text-center space-y-4">
            <h1 className="text-xl font-display font-bold">ClientVault Workspace Recovery</h1>
            <p className="text-xs text-[#B9D8EB] leading-relaxed">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('clientvault_session_token');
                } catch {
                  // ignore storage access issues
                }
                window.location.reload();
              }}
              className="cta-ocean-gradient inline-flex items-center justify-center rounded-full px-6 py-2.5 text-xs font-semibold text-white"
            >
              Reload Workspace
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </AppErrorBoundary>
);

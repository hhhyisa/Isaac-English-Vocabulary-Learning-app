import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Error Boundary Component to catch crashes (like missing API keys)
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const isApiKeyError = this.state.error?.message.includes("API Key") || this.state.error?.message.includes("API_KEY");
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-red-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h1>
            
            {isApiKeyError ? (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm text-left mb-6 border border-red-200">
                    <p className="font-bold mb-2">Missing API Configuration</p>
                    <p>The application could not find the Gemini API Key.</p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>Go to your Vercel Project Settings.</li>
                        <li>Click <strong>Environment Variables</strong>.</li>
                        <li>Add Key: <code>API_KEY</code></li>
                        <li>Value: Your Google Gemini API Key.</li>
                        <li>Redeploy the project.</li>
                    </ul>
                </div>
            ) : (
                <p className="text-slate-500 mb-6">
                  {this.state.error?.message || "An unexpected error occurred."}
                </p>
            )}

            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center w-full transition-colors"
            >
              <RefreshCw size={18} className="mr-2" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
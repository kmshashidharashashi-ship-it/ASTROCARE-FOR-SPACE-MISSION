import React from 'react';
import { AlertOctagon, RefreshCw, Home, ShieldAlert, Cpu } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ASTROCARE 3D SYSTEM ERROR]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided (e.g. for individual widgets or 3D viewport)
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback(this.state.error, this.handleReset)
          : this.props.fallback;
      }

      // Default Full-Page Mission Control Recovery Screen
      return (
        <div className="min-h-screen bg-[#050B16] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden font-sans">
          {/* Background emergency glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emergency-red/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-glow/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-xl w-full p-8 rounded-2xl bg-[#0B1528]/90 border border-emergency-red/50 shadow-[0_0_50px_rgba(255,82,107,0.25)] backdrop-blur-xl relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emergency-red/20 border border-emergency-red/40 text-emergency-glow">
                <AlertOctagon className="w-8 h-8 animate-pulse text-[#FF526B]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emergency-red/20 text-[#FF526B] border border-emergency-red/40 font-bold">
                    SYSTEM EXCEPTION DETECTED
                  </span>
                  <span className="text-xs font-mono text-slate-400">SUBSYSTEM DIAGNOSTICS</span>
                </div>
                <h2 className="text-xl font-orbitron font-bold text-white mt-1">
                  Telemetry Interface Recovery
                </h2>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              A runtime exception interrupted the telemetry visualization pipeline. The aerospace safety layer has contained the fault to prevent data corruption.
            </p>

            <div className="p-4 rounded-xl bg-[#050B16] border border-space-border/80 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-space-border/40">
                <span className="flex items-center gap-1.5 text-cyan-glow">
                  <Cpu className="w-3.5 h-3.5" />
                  ERROR STACK TRACE
                </span>
                <span className="text-[10px] text-slate-500">UTC {new Date().toISOString().slice(11, 19)}</span>
              </div>
              <div className="text-[#FF526B] font-semibold break-words">
                {this.state.error?.toString() || 'Unknown application error'}
              </div>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[11px] text-slate-400 max-h-36 overflow-y-auto whitespace-pre-wrap scrollbar-thin">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-glow to-holo-blue text-[#050B16] font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(50,230,224,0.3)] hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-4 h-4" />
                <span>REINITIALIZE TELEMETRY</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto py-3 px-4 rounded-xl bg-space-surface border border-space-border text-slate-300 font-mono text-xs hover:bg-space-card transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>MISSION CONTROL</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

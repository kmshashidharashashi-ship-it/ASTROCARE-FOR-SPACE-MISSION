import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StarfieldBackground from '../components/layout/StarfieldBackground';
import {
  Activity,
  Lock,
  Mail,
  Shield,
  ArrowRight,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('commander@astrocare.space');
  const [password, setPassword] = useState('MissionCmd2026!');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { role: 'Mission Commander', email: 'commander@astrocare.space', pwd: 'MissionCmd2026!' },
    { role: 'Flight Surgeon', email: 'surgeon@astrocare.space', pwd: 'FlightSurgeon2026!' },
    { role: 'Medical Officer', email: 'medical@astrocare.space', pwd: 'MedOfficer2026!' },
    { role: 'Mission Analyst', email: 'analyst@astrocare.space', pwd: 'MissionAnalyst2026!' },
    { role: 'Administrator', email: 'admin@astrocare.space', pwd: 'AstroAdmin2026!' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const msg =
        err.response?.data?.detail ||
        (err.message === 'Network Error' || !err.response
          ? 'Backend API server is unreachable (port 8000). Ensure the FastAPI server is running.'
          : 'Authentication failed. Please verify credentials.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoAccount = (acc) => {
    setEmail(acc.email);
    setPassword(acc.pwd);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050B16] relative overflow-hidden">
      <StarfieldBackground />
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-holo-blue/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-glow/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl bg-space-surface/90 border border-space-border/80 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-glow/20 to-holo-blue/30 border border-cyan-glow/40 shadow-[0_0_20px_rgba(50,230,224,0.3)] mb-2">
            <Activity className="w-8 h-8 text-cyan-glow" />
          </div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-wider">
            ASTROCARE <span className="text-cyan-glow">3D</span>
          </h1>
          <p className="text-xs font-mono text-slate-400">
            AEROSPACE MEDICAL COMMAND INTELLIGENCE
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-emergency-red/20 border border-emergency-red text-rose-200 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-emergency-red" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Mission Personnel Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full py-2.5 pl-10 pr-4 rounded-lg bg-space-dark border border-space-border text-xs font-mono text-white focus:border-cyan-glow focus:outline-none"
                placeholder="officer@astrocare.space"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Encrypted Security Clearance Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full py-2.5 pl-10 pr-4 rounded-lg bg-space-dark border border-space-border text-xs font-mono text-white focus:border-cyan-glow focus:outline-none"
                placeholder="••••••••••••"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-glow to-holo-blue hover:from-cyan-300 hover:to-blue-500 text-[#050B16] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(50,230,224,0.35)] disabled:opacity-50"
          >
            <span>{loading ? 'AUTHENTICATING CLEARANCE...' : 'AUTHORIZE & ENTER COMMAND'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Role Presets */}
        <div className="pt-2 border-t border-space-border/50">
          <p className="text-[10px] font-mono text-slate-400 uppercase text-center mb-2 flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-glow" /> Quick Demo Role Presets
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {demoAccounts.slice(0, 4).map((acc) => (
              <button
                key={acc.role}
                type="button"
                onClick={() => handleSelectDemoAccount(acc)}
                className="p-1.5 px-2 rounded bg-space-dark hover:bg-space-card border border-space-border/60 text-[10px] font-mono text-slate-300 hover:text-cyan-glow text-left transition-colors truncate"
                title={`${acc.role}: ${acc.email}`}
              >
                {acc.role}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs font-mono text-slate-400">
            Need mission clearance?{' '}
            <Link to="/register" className="text-cyan-glow hover:underline font-bold">
              Register Credentials
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

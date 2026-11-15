import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StarfieldBackground from '../components/layout/StarfieldBackground';
import {
  Activity,
  Lock,
  Mail,
  User,
  Shield,
  ArrowRight,
  AlertCircle,
  Radio,
} from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'Medical Officer',
    callsign: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const roles = [
    'Mission Commander',
    'Flight Surgeon',
    'Medical Officer',
    'Mission Analyst',
    'Administrator',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050B16] relative overflow-hidden">
      <StarfieldBackground />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-glow/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl bg-space-surface/90 border border-space-border/80 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-cyan-glow/20 to-holo-blue/30 border border-cyan-glow/40 mb-2">
            <Activity className="w-8 h-8 text-cyan-glow" />
          </div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white tracking-wider">
            MISSION CLEARANCE REGISTRATION
          </h1>
          <p className="text-xs font-mono text-slate-400">
            ASTROCARE 3D SPACE MEDICINE PLATFORM
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-emergency-red/20 border border-emergency-red text-rose-200 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-emergency-red" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
          <div>
            <label className="text-slate-400 uppercase block mb-1">Full Legal Name</label>
            <div className="relative">
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
                className="w-full py-2.5 pl-10 pr-4 rounded-lg bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
                placeholder="Dr. Julian Patel"
              />
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-slate-400 uppercase block mb-1">Official Mission Email</label>
            <div className="relative">
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full py-2.5 pl-10 pr-4 rounded-lg bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
                placeholder="julian.patel@astrocare.space"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-slate-400 uppercase block mb-1">Mission Control Role</label>
            <div className="relative">
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full py-2.5 pl-10 pr-4 rounded-lg bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <Shield className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-slate-400 uppercase block mb-1">Tactical Callsign (Optional)</label>
            <div className="relative">
              <input
                type="text"
                value={form.callsign}
                onChange={(e) => setForm({ ...form, callsign: e.target.value })}
                className="w-full py-2.5 pl-10 pr-4 rounded-lg bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
                placeholder="MED-ALPHA"
              />
              <Radio className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="text-slate-400 uppercase block mb-1">Clearance Password (min 6 chars)</label>
            <div className="relative">
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full py-2.5 pl-10 pr-4 rounded-lg bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
                placeholder="••••••••••••"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-glow to-holo-blue hover:from-cyan-300 hover:to-blue-500 text-[#050B16] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_16px_rgba(50,230,224,0.35)] disabled:opacity-50 mt-4"
          >
            <span>{loading ? 'REGISTERING CLEARANCE...' : 'COMPLETE REGISTRATION'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-space-border/50">
          <p className="text-xs font-mono text-slate-400">
            Already authorized?{' '}
            <Link to="/login" className="text-cyan-glow hover:underline font-bold">
              Sign In Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

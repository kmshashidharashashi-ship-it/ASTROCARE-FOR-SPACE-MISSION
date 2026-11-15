import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  Activity,
  Radio,
  Clock,
  User,
  LogOut,
  PlayCircle,
  ChevronDown,
  Shield,
  Bell,
  Sparkles,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, setDemoRole } = useAuth();
  const {
    astronauts,
    selectedAstronautId,
    setSelectedAstronautId,
    activeEmergencyAlert,
    wsConnected,
  } = useTelemetry();
  const navigate = useNavigate();

  const [utcTime, setUtcTime] = useState('');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const roles = [
    'Mission Commander',
    'Flight Surgeon',
    'Medical Officer',
    'Mission Analyst',
    'Administrator',
  ];

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#050B16]/90 backdrop-blur-md border-b border-space-border/80 px-4 md:px-6 flex items-center justify-between">
      {/* Brand & Mission */}
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-glow/20 via-holo-blue/30 to-violet-space/20 border border-cyan-glow/50 flex items-center justify-center shadow-[0_0_12px_rgba(50,230,224,0.3)] group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-cyan-glow" />
            <div className="absolute -inset-0.5 rounded-lg border border-cyan-glow/40 animate-ping opacity-20 pointer-events-none" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-extrabold text-base tracking-wider bg-gradient-to-r from-white via-cyan-100 to-cyan-glow bg-clip-text text-transparent">
                ASTROCARE
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-orbitron font-black text-cyan-glow border border-cyan-glow/50 rounded bg-cyan-glow/10">
                3D
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400 tracking-tight hidden sm:block">
              SPACE MEDICAL INTELLIGENCE PLATFORM
            </p>
          </div>
        </Link>

        {/* Mission Badge */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-space-surface/60 border border-space-border text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-alert-green animate-pulse" />
          <span className="text-slate-300 font-semibold">ARTEMIS IV</span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-glow/80">LUNAR GATEWAY</span>
        </div>
      </div>

      {/* Center: Live UTC Clock & Telemetry Status */}
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-space-surface/80 border border-space-border/60 text-xs font-mono text-cyan-glow">
          <Clock className="w-3.5 h-3.5 text-cyan-glow" />
          <span>{utcTime || '18:45:00 UTC'}</span>
        </div>

        {/* Simulation & Telemetry Link Badge */}
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded border text-xs font-mono ${
          wsConnected
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
            : 'bg-space-surface border-space-border/80 text-slate-400'
        }`}>
          <Radio className={`w-3 h-3 ${wsConnected ? 'animate-pulse text-emerald-400' : 'text-slate-500'}`} />
          <span className="font-semibold">{wsConnected ? 'TELEMETRY LIVE' : 'TELEMETRY STANDBY'}</span>
        </div>
      </div>

      {/* Right Controls: Crew Selector, Demo Mode Button, Profile */}
      <div className="flex items-center gap-3">
        {/* Crew Selector */}
        <div className="relative">
          <select
            value={selectedAstronautId}
            onChange={(e) => setSelectedAstronautId(e.target.value)}
            className="appearance-none bg-space-surface/90 hover:bg-space-card border border-space-border hover:border-cyan-glow/50 text-xs font-mono text-slate-200 py-1.5 pl-3 pr-8 rounded focus:outline-none focus:border-cyan-glow cursor-pointer transition-colors"
          >
            {astronauts.map((ast) => (
              <option key={ast.astronaut_id} value={ast.astronaut_id}>
                {ast.astronaut_id} • {ast.name.split(' ')[0]} {ast.name.split(' ')[1]}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Guided Demo Button */}
        <button
          onClick={() => navigate('/demo')}
          className="relative px-3 py-1.5 bg-gradient-to-r from-cyan-glow/20 via-holo-blue/30 to-violet-space/20 hover:from-cyan-glow/30 hover:to-holo-blue/40 border border-cyan-glow/60 rounded text-xs font-mono font-bold text-cyan-glow flex items-center gap-1.5 shadow-[0_0_15px_rgba(50,230,224,0.25)] hover:shadow-[0_0_20px_rgba(50,230,224,0.45)] transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-glow" style={{ animationDuration: '6s' }} />
          <span>START DEMO</span>
        </button>

        {/* Emergency Alert indicator if any */}
        {activeEmergencyAlert && (
          <Link
            to="/alerts"
            className="p-1.5 rounded bg-emergency-red/20 border border-emergency-red text-emergency-red animate-pulse"
            title="Active Critical Alert"
          >
            <Bell className="w-4 h-4" />
          </Link>
        )}

        {/* User Role & Profile Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 p-1.5 px-2.5 rounded bg-space-surface hover:bg-space-card border border-space-border text-xs font-mono transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-violet-space" />
            <span className="hidden sm:inline text-slate-200 font-medium">
              {user?.role || 'Medical Officer'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-space-surface border border-space-border rounded-lg shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-space-border/60">
                <p className="text-xs font-semibold text-white">{user?.full_name || 'Crew Member'}</p>
                <p className="text-[10px] font-mono text-cyan-glow">{user?.email || 'officer@astrocare.space'}</p>
              </div>
              <div className="py-1">
                <p className="px-3 py-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  Switch Active Role (Demo)
                </p>
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setDemoRole(r);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs font-mono rounded flex items-center justify-between ${
                      user?.role === r
                        ? 'bg-cyan-glow/20 text-cyan-glow font-bold'
                        : 'text-slate-300 hover:bg-space-card'
                    }`}
                  >
                    <span>{r}</span>
                    {user?.role === r && <span className="w-1.5 h-1.5 rounded-full bg-cyan-glow" />}
                  </button>
                ))}
              </div>
              <div className="pt-2 border-t border-space-border/60">
                <button
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

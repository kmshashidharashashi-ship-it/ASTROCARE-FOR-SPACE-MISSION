import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  LayoutDashboard,
  UserCheck,
  Eye,
  HeartPulse,
  BrainCircuit,
  Radiation,
  Smile,
  Gauge,
  AlertTriangle,
  Database,
  FileText,
  PlayCircle,
  Settings,
  ShieldAlert,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Mission Dashboard', icon: LayoutDashboard },
  { path: '/twin', label: '3D Digital Twin', icon: UserCheck, highlight: true },
  { path: '/assistant', label: 'AI Medical Assistant', icon: ShieldAlert, emergency: true },
  { path: '/anatomy', label: 'Anatomy Explorer', icon: Eye },
  { path: '/health', label: 'Health Telemetry', icon: HeartPulse },
  { path: '/ai', label: 'AI Risk Intelligence', icon: BrainCircuit },
  { path: '/radiation', label: 'Radiation Monitor', icon: Radiation },
  { path: '/wellness', label: 'Mental Wellness', icon: Smile },
  { path: '/environment', label: 'Spacecraft Cabin', icon: Gauge },
  { path: '/alerts', label: 'Emergency Alerts', icon: AlertTriangle },
  { path: '/nasa', label: 'NASA Open Data', icon: Database },
  { path: '/reports', label: 'Medical Reports', icon: FileText },
  { path: '/settings', label: 'System Settings', icon: Settings },
  { path: '/demo', label: 'Interactive Demo', icon: PlayCircle, special: true },
];

const Sidebar = () => {
  const { activeEmergencies } = useTelemetry();
  const hasEmergency = activeEmergencies && activeEmergencies.length > 0;

  return (
    <aside className="w-16 md:w-60 bg-[#060D1A]/95 border-r border-space-border/80 flex flex-col justify-between shrink-0 transition-all z-20">
      <div className="py-4 px-2 md:px-3 space-y-1">
        <div className="hidden md:block px-3 py-1.5 mb-2">
          <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-semibold">
            TELEMETRY SYSTEMS
          </p>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isEmergencyItem = item.emergency && hasEmergency;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono font-medium transition-all group relative ${
                  isActive
                    ? 'bg-cyan-glow/15 text-cyan-glow border border-cyan-glow/40 shadow-[0_0_12px_rgba(50,230,224,0.15)]'
                    : isEmergencyItem
                    ? 'bg-emergency-red/20 text-[#FF526B] border border-emergency-red/50 shadow-[0_0_15px_rgba(255,82,107,0.25)] animate-pulse'
                    : item.special
                    ? 'text-cyan-300 hover:bg-space-surface border border-cyan-glow/20 bg-cyan-950/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-space-surface/70'
                }`
              }
              title={item.label}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  isEmergencyItem
                    ? 'text-[#FF526B] animate-bounce-subtle'
                    : item.highlight
                    ? 'text-cyan-glow'
                    : item.special
                    ? 'text-cyan-glow animate-pulse'
                    : 'text-slate-400 group-hover:text-cyan-glow'
                }`}
              />
              <span className="hidden md:inline truncate">{item.label}</span>
              {isEmergencyItem && (
                <span className="hidden md:inline-block ml-auto px-1.5 py-0.2 rounded bg-emergency-red text-white text-[9px] font-bold">
                  SOS
                </span>
              )}
              {item.highlight && !isEmergencyItem && (
                <span className="hidden md:inline-block ml-auto w-1.5 h-1.5 rounded-full bg-cyan-glow animate-ping" />
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer System Telemetry Status */}
      <div className="p-3 border-t border-space-border/60 hidden md:block">
        <div className="p-2.5 rounded-lg bg-space-surface/40 border border-space-border/40 text-[11px] font-mono text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span>MCC LINK</span>
            <span className="text-alert-green font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-alert-green animate-pulse" />
              OPTIMAL
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>DOWNLINK</span>
            <span className="text-cyan-glow/80 font-semibold">142.4 Mbps</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500">
            <span>ORBIT PERIOD</span>
            <span>92.8 min</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

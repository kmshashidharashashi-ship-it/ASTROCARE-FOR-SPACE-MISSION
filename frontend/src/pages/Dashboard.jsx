import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../context/TelemetryContext';
import { useAuth } from '../context/AuthContext';
import AstronautDigitalTwin from '../components/astronaut/AstronautDigitalTwin';
import OrganTelemetryPanel from '../components/astronaut/OrganTelemetryPanel';
import EmergencyDecisionPanel from '../components/dashboard/EmergencyDecisionPanel';
import {
  Heart,
  Wind,
  Activity,
  Gauge,
  Radiation,
  AlertTriangle,
  PlayCircle,
  TrendingUp,
  Shield,
  Users,
  Compass,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const Dashboard = () => {
  const {
    telemetry,
    environment,
    radiation,
    selectedAstronaut,
    activeEmergencyAlert,
  } = useTelemetry();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock real-time trend data
  const [trendData, setTrendData] = useState([
    { time: '12:00', hr: 68, spo2: 98.5 },
    { time: '13:00', hr: 70, spo2: 98.2 },
    { time: '14:00', hr: 72, spo2: 98.0 },
    { time: '15:00', hr: 69, spo2: 98.4 },
    { time: '16:00', hr: 71, spo2: 98.6 },
    { time: '17:00', hr: 70, spo2: 98.3 },
    { time: 'Now', hr: telemetry.heart_rate, spo2: telemetry.oxygen_saturation },
  ]);

  useEffect(() => {
    setTrendData((prev) => {
      const next = [...prev.slice(1)];
      next.push({
        time: new Date().toLocaleTimeString().slice(0, 5),
        hr: telemetry.heart_rate,
        spo2: telemetry.oxygen_saturation,
      });
      return next;
    });
  }, [telemetry.heart_rate, telemetry.oxygen_saturation]);

  return (
    <div className="space-y-6">
      {/* Top Mission Status Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Mission Card */}
        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Active Mission</p>
            <h3 className="text-base font-orbitron font-bold text-white mt-0.5">ARTEMIS IV</h3>
            <p className="text-xs font-mono text-cyan-glow">Lunar Gateway • Day 142</p>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-glow/15 border border-cyan-glow/40">
            <Compass className="w-5 h-5 text-cyan-glow animate-spin" style={{ animationDuration: '24s' }} />
          </div>
        </div>

        {/* Monitored Astronaut */}
        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Selected Astronaut</p>
            <h3 className="text-base font-orbitron font-bold text-white mt-0.5 truncate max-w-[140px]">
              {selectedAstronaut?.name || 'Commander Alex Chen'}
            </h3>
            <p className="text-xs font-mono text-holo-glow">{selectedAstronaut?.role || 'Mission Commander'}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-holo-blue/30 to-cyan-glow/30 border border-cyan-glow/50 flex items-center justify-center font-orbitron font-bold text-white">
            {selectedAstronaut?.avatar_initials || 'AC'}
          </div>
        </div>

        {/* Environmental Quality */}
        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Cabin Atmosphere</p>
            <h3 className="text-base font-orbitron font-bold text-white mt-0.5">O2 {environment.cabin_o2}% • 101 kPa</h3>
            <p className="text-xs font-mono text-alert-green">Atmosphere Nominal</p>
          </div>
          <div className="p-2.5 rounded-lg bg-alert-green/15 border border-alert-green/40">
            <Gauge className="w-5 h-5 text-alert-green" />
          </div>
        </div>

        {/* Active Alert / System Health */}
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
          activeEmergencyAlert
            ? 'bg-emergency-red/20 border-emergency-red shadow-[0_0_16px_rgba(255,82,107,0.3)] animate-pulse'
            : 'bg-space-surface/80 border-space-border/80'
        }`}>
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Health Alert Status</p>
            <h3 className="text-base font-orbitron font-bold text-white mt-0.5">
              {activeEmergencyAlert ? 'CRITICAL ALERT' : 'NOMINAL STATUS'}
            </h3>
            <p className={`text-xs font-mono ${activeEmergencyAlert ? 'text-emergency-glow font-bold' : 'text-cyan-glow'}`}>
              {activeEmergencyAlert ? 'Flight Surgeon Review' : 'AI Risk Score: 0.08'}
            </p>
          </div>
          <div className={`p-2.5 rounded-lg border ${
            activeEmergencyAlert
              ? 'bg-emergency-red/30 border-emergency-red'
              : 'bg-cyan-glow/15 border-cyan-glow/40'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${activeEmergencyAlert ? 'text-emergency-red' : 'text-cyan-glow'}`} />
          </div>
        </div>
      </div>

      {/* AI Emergency Decision Support Recommendation Panel */}
      <EmergencyDecisionPanel />

      {/* Signature Feature: Central 3D Digital Twin & Organ Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left/Center: 3D Living Astronaut Digital Twin (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <AstronautDigitalTwin />
        </div>

        {/* Right: Organ Telemetry and Explainable AI Panel (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          <OrganTelemetryPanel />

          {/* Quick Interactive Demo Callout Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-glow/15 via-holo-blue/20 to-space-surface border border-cyan-glow/40 flex items-center justify-between shadow-lg">
            <div>
              <h4 className="text-xs font-orbitron font-bold text-cyan-glow tracking-wide">
                GUIDED HACKATHON DEMO MODE
              </h4>
              <p className="text-[11px] font-mono text-slate-300 mt-0.5">
                Run the 8-step live walkthrough with real telemetry & AI alerts.
              </p>
            </div>
            <button
              onClick={() => navigate('/demo')}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-glow text-[#050B16] font-mono font-bold text-xs hover:bg-cyan-200 transition-all shadow-[0_0_12px_rgba(50,230,224,0.4)] flex items-center gap-1.5 shrink-0"
            >
              <PlayCircle className="w-4 h-4" />
              <span>START DEMO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-space-surface/75 border border-space-border/70 hover:border-cyan-glow/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Heart Rate</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-orbitron font-bold text-white">{telemetry.heart_rate}</p>
          <p className="text-[10px] font-mono text-cyan-glow">BPM • Sinus Rhythm</p>
        </div>

        <div className="p-3.5 rounded-xl bg-space-surface/75 border border-space-border/70 hover:border-cyan-glow/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Oxygen SpO2</span>
            <Wind className="w-4 h-4 text-cyan-glow" />
          </div>
          <p className="text-xl font-orbitron font-bold text-white">{telemetry.oxygen_saturation}%</p>
          <p className="text-[10px] font-mono text-alert-green">Target: 96-100%</p>
        </div>

        <div className="p-3.5 rounded-xl bg-space-surface/75 border border-space-border/70 hover:border-cyan-glow/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Blood Pressure</span>
            <Activity className="w-4 h-4 text-holo-glow" />
          </div>
          <p className="text-xl font-orbitron font-bold text-white">
            {telemetry.systolic_bp} / {telemetry.diastolic_bp}
          </p>
          <p className="text-[10px] font-mono text-slate-400">mmHg</p>
        </div>

        <div className="p-3.5 rounded-xl bg-space-surface/75 border border-space-border/70 hover:border-cyan-glow/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Respiration</span>
            <Wind className="w-4 h-4 text-cyan-glow" />
          </div>
          <p className="text-xl font-orbitron font-bold text-white">{telemetry.respiratory_rate}</p>
          <p className="text-[10px] font-mono text-slate-400">breaths/min</p>
        </div>

        <div className="p-3.5 rounded-xl bg-space-surface/75 border border-space-border/70 hover:border-cyan-glow/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Radiation</span>
            <Radiation className="w-4 h-4 text-alert-amber" />
          </div>
          <p className="text-xl font-orbitron font-bold text-white">25.4</p>
          <p className="text-[10px] font-mono text-alert-amber">uSv/h • Safe</p>
        </div>

        <div className="p-3.5 rounded-xl bg-space-surface/75 border border-space-border/70 hover:border-cyan-glow/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Body Temp</span>
            <Gauge className="w-4 h-4 text-violet-space" />
          </div>
          <p className="text-xl font-orbitron font-bold text-white">{telemetry.body_temperature}°C</p>
          <p className="text-[10px] font-mono text-alert-green">Normothermic</p>
        </div>
      </div>

      {/* Real-Time Telemetry Trend Chart */}
      <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-glow" />
            <h3 className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
              Real-Time Physiological Telemetry Waveforms (HR & SpO2)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Streaming: 4.0s tick</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#32E6E0" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#32E6E0" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" stroke="#4A5568" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#4A5568" tick={{ fontSize: 10, fontFamily: 'monospace' }} domain={[50, 160]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0F1D38',
                  borderColor: '#1B315B',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                }}
              />
              <Area type="monotone" dataKey="hr" stroke="#32E6E0" strokeWidth={2} fillOpacity={1} fill="url(#colorHr)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

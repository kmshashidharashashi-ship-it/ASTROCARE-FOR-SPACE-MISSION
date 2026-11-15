import React, { useState, useEffect } from 'react';
import { environmentApi } from '../services/api';
import {
  Gauge,
  Wind,
  Thermometer,
  Droplets,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Flame,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const EnvironmentMonitor = () => {
  const [current, setCurrent] = useState({
    cabin_oxygen_pct: 21.0,
    carbon_dioxide_mmhg: 2.2,
    cabin_pressure_kpa: 101.3,
    cabin_temp_c: 22.4,
    humidity_pct: 48.0,
    radiation_ambient_usv_h: 22.4,
    air_quality_index: 98.0,
    status: 'nominal',
    warnings_json: '[]',
  });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchEnv = async () => {
      try {
        const [latestRes, historyRes] = await Promise.all([
          environmentApi.getLatest(),
          environmentApi.getHistory(30),
        ]);
        setCurrent(latestRes.data);
        setHistory(historyRes.data || []);
      } catch (e) {
        console.warn('Using baseline environmental telemetry');
      }
    };
    fetchEnv();
  }, []);

  const chartData = history.length > 0
    ? [...history].reverse().map((r) => ({
        time: new Date(r.recorded_at).toLocaleTimeString().slice(0, 5),
        o2: r.cabin_oxygen_pct,
        co2: r.carbon_dioxide_mmhg,
        pressure: r.cabin_pressure_kpa,
      }))
    : [
        { time: '12:00', o2: 20.9, co2: 2.1, pressure: 101.2 },
        { time: '13:00', o2: 21.0, co2: 2.3, pressure: 101.3 },
        { time: '14:00', o2: 21.1, co2: 2.2, pressure: 101.4 },
        { time: '15:00', o2: 21.0, co2: 2.1, pressure: 101.3 },
        { time: '16:00', o2: 21.0, co2: 2.2, pressure: 101.3 },
      ];

  let activeWarnings = [];
  try {
    activeWarnings = JSON.parse(current.warnings_json || '[]');
  } catch (e) {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-glow/15 border border-cyan-glow/40 text-cyan-glow">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-orbitron font-bold text-white">
              SPACECRAFT ENVIRONMENTAL LIFE SUPPORT (ECLSS)
            </h2>
            <p className="text-xs font-mono text-cyan-glow">
              Artemis IV Lunar Gateway Habitat • Atmospheric & Cabin Pressure Telemetry
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded bg-alert-green/20 border border-alert-green/40 text-alert-green text-xs font-mono font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          LIFE SUPPORT NOMINAL
        </span>
      </div>

      {/* Primary Atmospheric Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Cabin Oxygen</span>
            <Wind className="w-4 h-4 text-cyan-glow" />
          </div>
          <p className="text-2xl font-orbitron font-bold text-white">{current.cabin_oxygen_pct}%</p>
          <p className="text-[11px] font-mono text-alert-green">Target: 20.9% – 21.5%</p>
        </div>

        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Carbon Dioxide</span>
            <AlertTriangle className="w-4 h-4 text-alert-amber" />
          </div>
          <p className="text-2xl font-orbitron font-bold text-white">{current.carbon_dioxide_mmhg} <span className="text-xs text-slate-400">mmHg</span></p>
          <p className="text-[11px] font-mono text-alert-green">Safe: &lt; 3.0 mmHg</p>
        </div>

        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Cabin Pressure</span>
            <Gauge className="w-4 h-4 text-holo-glow" />
          </div>
          <p className="text-2xl font-orbitron font-bold text-white">{current.cabin_pressure_kpa} <span className="text-xs text-slate-400">kPa</span></p>
          <p className="text-[11px] font-mono text-cyan-glow">Standard 1.0 Atm</p>
        </div>

        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Temperature</span>
            <Thermometer className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-orbitron font-bold text-white">{current.cabin_temp_c}°C</p>
          <p className="text-[11px] font-mono text-slate-400">Target: 21 – 24°C</p>
        </div>

        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Relative Humidity</span>
            <Droplets className="w-4 h-4 text-cyan-glow" />
          </div>
          <p className="text-2xl font-orbitron font-bold text-white">{current.humidity_pct}%</p>
          <p className="text-[11px] font-mono text-alert-green">Comfort Envelope</p>
        </div>
      </div>

      {/* Atmospheric Chart */}
      <div className="p-5 rounded-2xl bg-space-surface/85 border border-space-border/80">
        <h3 className="text-xs font-orbitron font-bold text-white uppercase mb-4">
          Atmospheric Gas Dynamics (Oxygen & CO2 Partial Pressure)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="o2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#32E6E0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#32E6E0" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2D54" />
              <XAxis dataKey="time" stroke="#4A5568" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#4A5568" tick={{ fontSize: 10, fontFamily: 'monospace' }} domain={[0, 30]} />
              <Tooltip contentStyle={{ backgroundColor: '#0F1D38', borderColor: '#1B315B', fontFamily: 'monospace', fontSize: '11px' }} />
              <Area type="monotone" dataKey="o2" name="Oxygen (%)" stroke="#32E6E0" strokeWidth={2} fillOpacity={1} fill="url(#o2Grad)" />
              <Area type="monotone" dataKey="co2" name="CO2 (mmHg)" stroke="#FFA927" strokeWidth={2} fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Safety Protocols & ECLSS Hardware Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 text-xs font-mono space-y-2">
          <h4 className="font-orbitron font-bold text-white uppercase">ECLSS Subsystem Health</h4>
          <div className="space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between p-2 rounded bg-space-dark/60 border border-space-border/50">
              <span>Oxygen Generation Assembly (OGA)</span>
              <span className="text-alert-green font-bold">100% OPERATIONAL</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-space-dark/60 border border-space-border/50">
              <span>Carbon Dioxide Removal Assembly (CDRA)</span>
              <span className="text-alert-green font-bold">SCRUBBING ACTIVE</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-space-dark/60 border border-space-border/50">
              <span>Trace Contaminant Control Subsystem (TCCS)</span>
              <span className="text-cyan-glow font-bold">OPTIMAL</span>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 text-xs font-mono space-y-2">
          <h4 className="font-orbitron font-bold text-white uppercase">Atmospheric Contingency Protocols</h4>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            Automatic rapid depressurization threshold configured at 90.0 kPa. If cabin CO2 exceeds 4.5 mmHg, secondary Amine beds activate immediately with flight crew notification.
          </p>
          <div className="p-2.5 rounded bg-space-dark/60 border border-space-border/40 text-[10px] text-cyan-glow">
            Air Quality Index: 98.0 / 100 • Zero airborne particulate hazards detected.
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentMonitor;

import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { radiationApi } from '../services/api';
import {
  Radiation,
  Shield,
  AlertTriangle,
  Sun,
  Activity,
  Calendar,
  CheckCircle,
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

const RadiationMonitor = () => {
  const { selectedAstronautId, selectedAstronaut } = useTelemetry();
  const [data, setData] = useState({
    latest_rate_usv_h: 25.4,
    cumulative_dose_msv: 14.8,
    annual_limit_pct: 29.6,
    status: 'normal',
    solar_particle_event: false,
    history: [],
  });

  useEffect(() => {
    const fetchRad = async () => {
      try {
        const res = await radiationApi.getSummary(selectedAstronautId, 40);
        setData(res.data);
      } catch (e) {
        console.warn('Using baseline radiation telemetry');
      }
    };
    fetchRad();
  }, [selectedAstronautId]);

  const chartData = (data.history && data.history.length > 0)
    ? [...data.history].reverse().map((r) => ({
        time: new Date(r.recorded_at).toLocaleTimeString().slice(0, 5),
        rate: r.current_rate_usv_h,
        dose: r.cumulative_dose_msv,
      }))
    : [
        { time: '08:00', rate: 24.2, dose: 14.1 },
        { time: '10:00', rate: 25.0, dose: 14.3 },
        { time: '12:00', rate: 25.8, dose: 14.5 },
        { time: '14:00', rate: 24.9, dose: 14.7 },
        { time: '16:00', rate: 25.4, dose: 14.8 },
      ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-alert-amber/15 border border-alert-amber/40 text-alert-amber">
            <Radiation className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-orbitron font-bold text-white">
              DEEP SPACE RADIATION DOSIMETRY & GCR MONITOR
            </h2>
            <p className="text-xs font-mono text-cyan-glow">
              Active Dosimeter Channel AST-RAD • Astronaut {selectedAstronaut?.name}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded bg-space-card border border-space-border text-xs font-mono text-slate-300">
          Source: Simulated Dosimeter
        </span>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
          <p className="text-[10px] font-mono text-slate-400 uppercase">Instantaneous Flux</p>
          <h3 className="text-2xl font-orbitron font-bold text-cyan-glow mt-1">
            {data.latest_rate_usv_h} <span className="text-xs font-mono text-slate-400">uSv/h</span>
          </h3>
          <p className="text-[11px] font-mono text-alert-green mt-1">Nominal background GCR</p>
        </div>

        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
          <p className="text-[10px] font-mono text-slate-400 uppercase">Mission Cumulative Dose</p>
          <h3 className="text-2xl font-orbitron font-bold text-white mt-1">
            {data.cumulative_dose_msv} <span className="text-xs font-mono text-slate-400">mSv</span>
          </h3>
          <p className="text-[11px] font-mono text-slate-400 mt-1">Day 142 of Artemis IV</p>
        </div>

        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
          <p className="text-[10px] font-mono text-slate-400 uppercase">Annual Career Limit (50 mSv)</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-orbitron font-bold text-holo-glow">{data.annual_limit_pct}%</span>
            <span className="text-[10px] font-mono text-slate-400">{data.cumulative_dose_msv} / 50 mSv</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 bg-space-dark rounded-full overflow-hidden mt-2 border border-space-border">
            <div
              className="h-full bg-gradient-to-r from-alert-green via-cyan-glow to-alert-amber rounded-full"
              style={{ width: `${Math.min(100, data.annual_limit_pct)}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono text-slate-400 uppercase">Solar Storm (SPE)</p>
            <h3 className="text-xl font-orbitron font-bold text-alert-green mt-1">
              {data.solar_particle_event ? 'SPE WARNING' : 'QUIET'}
            </h3>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">Heliospheric Flux: Class A</p>
          </div>
          <div className="p-2.5 rounded-lg bg-alert-green/15 border border-alert-green/40">
            <Sun className="w-5 h-5 text-alert-green" />
          </div>
        </div>
      </div>

      {/* Radiation Time-Series Chart */}
      <div className="p-5 rounded-2xl bg-space-surface/85 border border-space-border/80">
        <h3 className="text-xs font-orbitron font-bold text-white uppercase mb-4">
          Galactic Cosmic Ray (GCR) Dosimetry Trajectory
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="radColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFA927" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#FFA927" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2D54" />
              <XAxis dataKey="time" stroke="#4A5568" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#4A5568" tick={{ fontSize: 10, fontFamily: 'monospace' }} domain={[15, 45]} />
              <Tooltip contentStyle={{ backgroundColor: '#0F1D38', borderColor: '#1B315B', fontFamily: 'monospace', fontSize: '11px' }} />
              <Area type="monotone" dataKey="rate" name="Rate (uSv/h)" stroke="#FFA927" strokeWidth={2} fillOpacity={1} fill="url(#radColor)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default RadiationMonitor;

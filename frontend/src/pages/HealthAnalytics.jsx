import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { healthApi } from '../services/api';
import LiveECGCanvas from '../components/charts/LiveECGCanvas';
import {
  HeartPulse,
  Activity,
  PlusCircle,
  Clock,
  Filter,
  CheckCircle,
  AlertTriangle,
  Send,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const HealthAnalytics = () => {
  const { selectedAstronautId, selectedAstronaut, telemetry } = useTelemetry();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form state for manual telemetry ingestion
  const [form, setForm] = useState({
    heart_rate: '72.0',
    systolic_bp: '120.0',
    diastolic_bp: '80.0',
    oxygen_saturation: '98.5',
    body_temperature: '36.7',
    sleep_duration: '7.5',
    notes: 'Nominal telemetry packet logged by Medical Officer.',
  });
  const [submitMsg, setSubmitMsg] = useState(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await healthApi.getHistory(selectedAstronautId, 30);
      setHistory(res.data.records || []);
    } catch (e) {
      console.warn('Could not fetch health history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedAstronautId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        astronaut_id: selectedAstronautId,
        heart_rate: parseFloat(form.heart_rate),
        systolic_bp: parseFloat(form.systolic_bp),
        diastolic_bp: parseFloat(form.diastolic_bp),
        oxygen_saturation: parseFloat(form.oxygen_saturation),
        body_temperature: parseFloat(form.body_temperature),
        sleep_duration: parseFloat(form.sleep_duration),
        notes: form.notes,
        data_source: 'manual',
      };
      await healthApi.submitRecord(payload);
      setSubmitMsg('Measurement successfully validated and saved to flight database.');
      fetchRecords();
      setTimeout(() => setSubmitMsg(null), 4000);
    } catch (err) {
      setSubmitMsg('Error submitting reading: ' + (err.response?.data?.detail || err.message));
    }
  };

  const chartData = [...history].reverse().map((r) => ({
    time: new Date(r.recorded_at).toLocaleTimeString().slice(0, 5),
    heart_rate: r.heart_rate,
    systolic_bp: r.systolic_bp,
    spo2: r.oxygen_saturation,
  }));

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-glow/15 border border-cyan-glow/40 text-cyan-glow">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-orbitron font-bold text-white">
              PHYSIOLOGICAL TELEMETRY & HEALTH ANALYTICS
            </h2>
            <p className="text-xs font-mono text-cyan-glow">
              Astronaut {selectedAstronaut?.name} ({selectedAstronaut?.astronaut_id}) • Live Continuous Surveillance
            </p>
          </div>
        </div>
      </div>

      {/* Live ECG Waveform Ribbon */}
      <div className="p-4 rounded-xl bg-space-surface/90 border border-space-border/80">
        <h3 className="text-xs font-orbitron font-bold text-white mb-2 uppercase">
          Continuous Electrocardiogram (Lead II Monitor)
        </h3>
        <LiveECGCanvas
          heartRate={telemetry.heart_rate}
          isAbnormal={telemetry.heart_rate > 100}
          width={800}
          height={100}
        />
      </div>

      {/* Historical Telemetry Multi-Line Chart */}
      <div className="p-5 rounded-2xl bg-space-surface/85 border border-space-border/80">
        <h3 className="text-xs font-orbitron font-bold text-white mb-4 uppercase">
          Hemodynamic & Oxygenation Trends Over Time
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.length ? chartData : [{ time: 'Now', heart_rate: telemetry.heart_rate, systolic_bp: telemetry.systolic_bp, spo2: telemetry.oxygen_saturation }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2D54" />
              <XAxis dataKey="time" stroke="#4A5568" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#4A5568" tick={{ fontSize: 10, fontFamily: 'monospace' }} domain={[50, 160]} />
              <Tooltip contentStyle={{ backgroundColor: '#0A152A', borderColor: '#1B315B', fontFamily: 'monospace', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px' }} />
              <Line type="monotone" dataKey="heart_rate" name="Heart Rate (BPM)" stroke="#32E6E0" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="systolic_bp" name="Systolic BP (mmHg)" stroke="#9275FF" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="spo2" name="Oxygen SpO2 (%)" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: Manual Ingestion Form & Records History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Manual Ingestion Form (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-space-surface/85 border border-space-border/80 space-y-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-cyan-glow" />
            <h3 className="text-xs font-orbitron font-bold text-white uppercase">
              Submit Telemetry Measurement
            </h3>
          </div>

          {submitMsg && (
            <div className={`p-3 rounded-lg text-xs font-mono border ${
              submitMsg.includes('Error')
                ? 'bg-emergency-red/20 border-emergency-red text-rose-200'
                : 'bg-alert-green/20 border-alert-green text-emerald-200'
            }`}>
              {submitMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase">Heart Rate (bpm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.heart_rate}
                  onChange={(e) => setForm({ ...form, heart_rate: e.target.value })}
                  className="w-full mt-1 p-2 rounded bg-space-dark border border-space-border text-xs font-mono text-white focus:border-cyan-glow focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase">SpO2 (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.oxygen_saturation}
                  onChange={(e) => setForm({ ...form, oxygen_saturation: e.target.value })}
                  className="w-full mt-1 p-2 rounded bg-space-dark border border-space-border text-xs font-mono text-white focus:border-cyan-glow focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase">Systolic BP</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.systolic_bp}
                  onChange={(e) => setForm({ ...form, systolic_bp: e.target.value })}
                  className="w-full mt-1 p-2 rounded bg-space-dark border border-space-border text-xs font-mono text-white focus:border-cyan-glow focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase">Diastolic BP</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.diastolic_bp}
                  onChange={(e) => setForm({ ...form, diastolic_bp: e.target.value })}
                  className="w-full mt-1 p-2 rounded bg-space-dark border border-space-border text-xs font-mono text-white focus:border-cyan-glow focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase">Body Temp (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.body_temperature}
                  onChange={(e) => setForm({ ...form, body_temperature: e.target.value })}
                  className="w-full mt-1 p-2 rounded bg-space-dark border border-space-border text-xs font-mono text-white focus:border-cyan-glow focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase">Sleep (hrs)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.sleep_duration}
                  onChange={(e) => setForm({ ...form, sleep_duration: e.target.value })}
                  className="w-full mt-1 p-2 rounded bg-space-dark border border-space-border text-xs font-mono text-white focus:border-cyan-glow focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase">Medical Clinical Notes</label>
              <textarea
                rows="2"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full mt-1 p-2 rounded bg-space-dark border border-space-border text-xs font-mono text-white focus:border-cyan-glow focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-cyan-glow hover:bg-cyan-200 text-[#050B16] font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(50,230,224,0.3)]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>RECORD MEASUREMENT</span>
            </button>
          </form>
        </div>

        {/* History Table (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-space-surface/85 border border-space-border/80">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-orbitron font-bold text-white uppercase">
              Recent Physiological Records
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Total: {history.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-[10px] text-slate-400 uppercase bg-space-dark/80 border-b border-space-border">
                <tr>
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">HR</th>
                  <th className="py-2 px-3">BP</th>
                  <th className="py-2 px-3">SpO2</th>
                  <th className="py-2 px-3">Temp</th>
                  <th className="py-2 px-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-border/40 text-slate-300">
                {history.slice(0, 8).map((r) => (
                  <tr key={r.id} className="hover:bg-space-dark/50">
                    <td className="py-2 px-3 text-[11px] text-slate-400">
                      {new Date(r.recorded_at).toLocaleTimeString()}
                    </td>
                    <td className={`py-2 px-3 font-bold ${r.heart_rate > 100 ? 'text-emergency-red' : 'text-white'}`}>
                      {r.heart_rate} bpm
                    </td>
                    <td className="py-2 px-3">
                      {r.systolic_bp}/{r.diastolic_bp}
                    </td>
                    <td className={`py-2 px-3 ${r.oxygen_saturation < 95 ? 'text-alert-amber' : 'text-alert-green'}`}>
                      {r.oxygen_saturation}%
                    </td>
                    <td className="py-2 px-3">{r.body_temperature}°C</td>
                    <td className="py-2 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-space-card border border-space-border text-cyan-glow">
                        {r.data_source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthAnalytics;

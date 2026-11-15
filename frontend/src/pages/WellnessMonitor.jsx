import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { useAuth } from '../context/AuthContext';
import { wellnessApi } from '../services/api';
import {
  Smile,
  Moon,
  BatteryCharging,
  Zap,
  BookOpen,
  Send,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const WellnessMonitor = () => {
  const { selectedAstronautId, selectedAstronaut } = useTelemetry();
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check-in form
  const [form, setForm] = useState({
    mood: 8,
    stress_level: 3,
    fatigue_level: 4,
    energy_level: 7,
    sleep_quality: 8,
    journal_entry: 'Nominal EVA preparation today. Sleep rhythms feel stabilized after adjusting cabin circadian lighting.',
  });
  const [msg, setMsg] = useState(null);

  const fetchWellness = async () => {
    try {
      setLoading(true);
      const res = await wellnessApi.getHistory(selectedAstronautId, 15);
      setHistory(res.data.records || []);
    } catch (e) {
      console.warn('Could not load wellness check-ins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWellness();
  }, [selectedAstronautId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await wellnessApi.submitCheckin({
        astronaut_id: selectedAstronautId,
        ...form,
        data_source: 'manual',
      });
      setMsg('Daily wellness check-in successfully logged to mission health record.');
      fetchWellness();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      setMsg('Error saving check-in: ' + (err.response?.data?.detail || err.message));
    }
  };

  const chartData = [...history].reverse().map((r, i) => ({
    day: `Check-in ${i + 1}`,
    mood: r.mood,
    energy: r.energy_level,
    sleep: r.sleep_quality,
  }));

  // Role check: Only Flight Surgeon, Commander, Medical Officer, or Admin can see detailed journal
  const canViewJournals = ['Flight Surgeon', 'Medical Officer', 'Mission Commander', 'Administrator'].includes(
    user?.role || ''
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-violet-space/20 border border-violet-space/50 text-violet-space">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-orbitron font-bold text-white">
              ASTRONAUT MENTAL WELLNESS & SLEEP SURVEILLANCE
            </h2>
            <p className="text-xs font-mono text-cyan-glow">
              Circadian Rhythm & Neurobehavioral Health • Astronaut {selectedAstronaut?.name}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded bg-space-card border border-space-border text-xs font-mono text-slate-300">
          Privacy Level: Medical Confidential
        </span>
      </div>

      {/* Top Wellness Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Sleep Efficiency</span>
            <Moon className="w-4 h-4 text-violet-space" />
          </div>
          <p className="text-2xl font-orbitron font-bold text-white">88.5%</p>
          <p className="text-[11px] font-mono text-cyan-glow">7.4 hrs avg (Deep/REM)</p>
        </div>

        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Subjective Fatigue</span>
            <BatteryCharging className="w-4 h-4 text-alert-amber" />
          </div>
          <p className="text-2xl font-orbitron font-bold text-white">3.5 / 10</p>
          <p className="text-[11px] font-mono text-alert-green">Low Fatigue Risk</p>
        </div>

        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Operational Stress</span>
            <Zap className="w-4 h-4 text-cyan-glow" />
          </div>
          <p className="text-2xl font-orbitron font-bold text-white">3.2 / 10</p>
          <p className="text-[11px] font-mono text-alert-green">Target: &lt; 4.0</p>
        </div>

        <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Mood Score</span>
            <Smile className="w-4 h-4 text-alert-green" />
          </div>
          <p className="text-2xl font-orbitron font-bold text-alert-green">8.0 / 10</p>
          <p className="text-[11px] font-mono text-slate-400">High Cohesion</p>
        </div>
      </div>

      {/* Wellness Chart */}
      <div className="p-5 rounded-2xl bg-space-surface/85 border border-space-border/80">
        <h3 className="text-xs font-orbitron font-bold text-white uppercase mb-4">
          Longitudinal Wellness Check-in Trends
        </h3>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.length ? chartData : [{ day: 'Baseline', mood: 8, energy: 7, sleep: 8 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A2D54" />
              <XAxis dataKey="day" stroke="#4A5568" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
              <YAxis stroke="#4A5568" tick={{ fontSize: 10, fontFamily: 'monospace' }} domain={[0, 10]} />
              <Tooltip contentStyle={{ backgroundColor: '#0F1D38', borderColor: '#1B315B', fontFamily: 'monospace', fontSize: '11px' }} />
              <Bar dataKey="mood" name="Mood" fill="#32E6E0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="energy" name="Energy" fill="#9275FF" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sleep" name="Sleep Quality" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Check-in Form & Confidential Journals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Self-Checkin Form (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-space-surface/85 border border-space-border/80 space-y-4">
          <h3 className="text-xs font-orbitron font-bold text-white uppercase">
            Record Daily Mental Check-in
          </h3>

          {msg && (
            <div className={`p-3 rounded-lg text-xs font-mono border ${
              msg.includes('Error') ? 'bg-emergency-red/20 border-emergency-red text-rose-200' : 'bg-alert-green/20 border-alert-green text-emerald-200'
            }`}>
              {msg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 uppercase">Mood (1 - 10): {form.mood}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.mood}
                onChange={(e) => setForm({ ...form, mood: parseInt(e.target.value) })}
                className="w-full accent-cyan-glow"
              />
            </div>

            <div>
              <label className="text-slate-400 uppercase">Stress Level (1 - 10): {form.stress_level}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.stress_level}
                onChange={(e) => setForm({ ...form, stress_level: parseInt(e.target.value) })}
                className="w-full accent-violet-space"
              />
            </div>

            <div>
              <label className="text-slate-400 uppercase">Fatigue Level (1 - 10): {form.fatigue_level}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.fatigue_level}
                onChange={(e) => setForm({ ...form, fatigue_level: parseInt(e.target.value) })}
                className="w-full accent-alert-amber"
              />
            </div>

            <div>
              <label className="text-slate-400 uppercase">Sleep Quality (1 - 10): {form.sleep_quality}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={form.sleep_quality}
                onChange={(e) => setForm({ ...form, sleep_quality: parseInt(e.target.value) })}
                className="w-full accent-alert-green"
              />
            </div>

            <div>
              <label className="text-slate-400 uppercase">Astronaut Journal Entry</label>
              <textarea
                rows="3"
                value={form.journal_entry}
                onChange={(e) => setForm({ ...form, journal_entry: e.target.value })}
                className="w-full mt-1 p-2 rounded bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-cyan-glow hover:bg-cyan-200 text-[#050B16] font-bold uppercase flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(50,230,224,0.3)]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>LOG CHECK-IN</span>
            </button>
          </form>
        </div>

        {/* Confidential Journal Entries (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-2xl bg-space-surface/85 border border-space-border/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-violet-space" />
              <h3 className="text-xs font-orbitron font-bold text-white uppercase">
                Confidential Flight Surgeon Journal Log
              </h3>
            </div>
            {!canViewJournals && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400">
                <Lock className="w-3 h-3" /> Restricted Role
              </span>
            )}
          </div>

          {canViewJournals ? (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
              {history.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-space-dark/80 border border-space-border/50 text-xs font-mono space-y-1.5">
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>{new Date(item.recorded_at).toLocaleDateString()} • {new Date(item.recorded_at).toLocaleTimeString()}</span>
                    <span className="text-cyan-glow font-bold">Mood: {item.mood}/10 • Stress: {item.stress_level}/10</span>
                  </div>
                  <p className="text-slate-200 text-[11px] leading-relaxed italic">
                    "{item.journal_entry || 'Routine flight day checklist complete. Physical countermeasure workout performed.'}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-space-dark/40 border border-space-border/40 text-center space-y-2">
              <Lock className="w-8 h-8 text-rose-400 mx-auto" />
              <h4 className="text-sm font-orbitron font-bold text-white">ACCESS RESTRICTED</h4>
              <p className="text-xs font-mono text-slate-400 max-w-sm mx-auto">
                Subjective astronaut journals are protected under NASA astronaut medical confidentiality rules. Switch your active role to Flight Surgeon or Mission Commander to view.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WellnessMonitor;

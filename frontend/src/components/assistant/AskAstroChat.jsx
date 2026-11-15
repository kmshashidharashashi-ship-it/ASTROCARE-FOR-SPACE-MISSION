import React, { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { useAuth } from '../../context/AuthContext';
import { astroAiApi } from '../../services/api';
import {
  Send,
  Bot,
  User,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Heart,
  Wind,
  Brain,
  Bone,
  Radiation,
  Info,
  RefreshCw,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  {
    label: 'Heart Rate Spike',
    query: 'Why is my heart rate increasing?',
    icon: Heart,
    color: 'text-rose-400 border-rose-500/30 hover:bg-rose-950/40',
  },
  {
    label: 'Oxygen Saturation Drop',
    query: 'Why is my oxygen level decreasing?',
    icon: Wind,
    color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-950/40',
  },
  {
    label: 'Breathing Difficulty',
    query: 'What should I do if I experience breathing difficulty?',
    icon: Wind,
    color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/40',
  },
  {
    label: 'Cognitive Fatigue',
    query: 'Why am I feeling fatigued?',
    icon: Brain,
    color: 'text-violet-400 border-violet-500/30 hover:bg-violet-950/40',
  },
  {
    label: 'Sleep Improvement',
    query: 'What can I do to improve my sleep in microgravity?',
    icon: Brain,
    color: 'text-purple-400 border-purple-500/30 hover:bg-purple-950/40',
  },
  {
    label: 'Radiation Surge',
    query: 'What happens if radiation exposure increases?',
    icon: Radiation,
    color: 'text-amber-400 border-amber-500/30 hover:bg-amber-950/40',
  },
  {
    label: 'Spine & Bone Health',
    query: 'Why am I experiencing reduced physical activity or spinal decompression?',
    icon: Bone,
    color: 'text-sky-400 border-sky-500/30 hover:bg-sky-950/40',
  },
  {
    label: 'Clinical Triage Priority',
    query: 'Which health measurements require immediate attention right now?',
    icon: Activity,
    color: 'text-cyan-300 border-cyan-400/40 hover:bg-cyan-950/50',
  },
];

const AskAstroChat = ({ initialOrgan = null }) => {
  const { selectedAstronautId, selectedAstronaut } = useTelemetry();
  const { user } = useAuth();

  const [inputQuestion, setInputQuestion] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'astro_ai',
      timestamp: new Date().toLocaleTimeString(),
      text: `Greetings, ${user?.full_name || 'Commander'}. I am **ASTRO MEDICAL INTELLIGENCE**, the mission-control clinical decision support agent for **${selectedAstronaut?.name || 'Commander Alex Chen'}**. I analyze multi-channel telemetry against validated individual aerospace baselines. How may I assist your medical surveillance?`,
      assessment: null,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionText) => {
    const q = (questionText || inputQuestion).trim();
    if (!q || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      userName: user?.full_name || 'Commander',
      userRole: user?.role || 'Mission Commander',
      timestamp: new Date().toLocaleTimeString(),
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await astroAiApi.query({
        astronaut_id: selectedAstronautId,
        question: q,
        role: user?.role || 'Mission Commander',
      });

      if (res.data) {
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'astro_ai',
          timestamp: new Date().toLocaleTimeString(),
          text: res.data.problem_identified,
          assessment: res.data,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error('Error in Astro AI query:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'astro_ai',
          timestamp: new Date().toLocaleTimeString(),
          text: 'Telemetry query error: Unable to contact medical decision engine. Please verify Gateway telemetry stream.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-emergency-red text-white border-white animate-pulse';
      case 'WARNING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'MONITOR':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div className="flex flex-col h-[740px] rounded-2xl bg-[#060E1E]/95 border border-cyan-glow/30 shadow-2xl backdrop-blur-xl overflow-hidden font-sans">
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <div className="p-4 bg-gradient-to-r from-cyan-950/40 via-space-surface/90 to-space-surface/90 border-b border-cyan-glow/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-glow/15 border border-cyan-glow/40 shadow-[0_0_15px_rgba(50,230,224,0.2)]">
            <Bot className="w-5 h-5 text-cyan-glow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-orbitron font-bold text-white tracking-wide">
                ASK ASTRO AI
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/40">
                DECISION SUPPORT v2.4
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Active Patient: <span className="text-white font-medium">{selectedAstronaut?.name || 'Commander Alex Chen'}</span> ({selectedAstronautId})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">
            TELEMETRY REASONING LIVE
          </span>
        </div>
      </div>

      {/* ── SUGGESTED HIGH-YIELD QUESTIONS ─────────────────────────────────── */}
      <div className="p-3 bg-space-dark/60 border-b border-space-border/60 overflow-x-auto flex items-center gap-2 scrollbar-thin">
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest shrink-0 font-bold flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-glow" />
          Suggested:
        </span>
        {SUGGESTED_PROMPTS.map((p, i) => {
          const Icon = p.icon;
          return (
            <button
              key={i}
              onClick={() => handleSend(p.query)}
              disabled={loading}
              className={`px-3 py-1 rounded-lg border text-xs font-mono font-medium transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap bg-space-surface/80 ${p.color} disabled:opacity-50`}
            >
              <Icon className="w-3 h-3" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── CHAT MESSAGES SCROLL AREA ───────────────────────────────────────── */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin">
        {messages.map((m) => {
          const isAi = m.sender === 'astro_ai';

          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
            >
              {isAi && (
                <div className="w-8 h-8 rounded-lg bg-cyan-glow/20 border border-cyan-glow/40 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-cyan-glow" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-xl p-4 text-xs font-sans ${
                  isAi
                    ? 'bg-space-surface/90 border border-cyan-glow/30 text-slate-200 shadow-lg'
                    : 'bg-holo-blue/20 border border-holo-blue/40 text-white shadow-md'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-4 pb-2 mb-2 border-b border-space-border/50 text-[10px] font-mono">
                  <span className={isAi ? 'text-cyan-glow font-bold' : 'text-holo-glow font-bold'}>
                    {isAi ? 'ASTRO MEDICAL INTELLIGENCE' : `${m.userName} (${m.userRole})`}
                  </span>
                  <span className="text-slate-500">{m.timestamp}</span>
                </div>

                {/* Primary Content */}
                <p className="leading-relaxed text-slate-200 whitespace-pre-line text-xs font-medium">
                  {m.text}
                </p>

                {/* 10-Point Structured Assessment for AI Responses */}
                {m.assessment && (
                  <div className="mt-4 pt-3 border-t border-space-border/60 space-y-3 font-mono">
                    {/* Severity Header */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase text-slate-400 font-bold">
                        CLINICAL SEVERITY & TRIAGE
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(
                          m.assessment.severity
                        )}`}
                      >
                        {m.assessment.severity}
                      </span>
                    </div>

                    {/* Supporting Measurements Table */}
                    {m.assessment.supporting_measurements && (
                      <div className="overflow-x-auto rounded-lg border border-space-border/60 bg-space-dark/80">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="border-b border-space-border/60 bg-space-card/60 text-slate-400 text-[10px]">
                              <th className="p-2">METRIC</th>
                              <th className="p-2">MEASURED</th>
                              <th className="p-2">BASELINE</th>
                              <th className="p-2">DEVIATION</th>
                              <th className="p-2">STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {m.assessment.supporting_measurements.map((sm, idx) => (
                              <tr key={idx} className="border-b border-space-border/30 hover:bg-space-card/40">
                                <td className="p-2 text-slate-300 font-semibold">{sm.metric}</td>
                                <td className="p-2 text-white font-bold">{sm.current_value}</td>
                                <td className="p-2 text-slate-400">{sm.baseline_value}</td>
                                <td className="p-2 text-cyan-glow">{sm.deviation}</td>
                                <td className="p-2">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                      sm.status === 'CRITICAL'
                                        ? 'bg-emergency-red/20 text-[#FF526B]'
                                        : sm.status === 'ELEVATED' || sm.status === 'WARNING'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : 'bg-emerald-500/20 text-emerald-300'
                                    }`}
                                  >
                                    {sm.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Possible Explanations */}
                    <div className="p-2.5 rounded bg-space-dark/60 border border-space-border/60">
                      <span className="text-[10px] font-bold text-cyan-glow uppercase block mb-1">
                        3. Possible Explanations
                      </span>
                      <p className="text-[11px] font-sans leading-relaxed text-slate-300">
                        {m.assessment.possible_explanations}
                      </p>
                    </div>

                    {/* Immediate Safety Actions */}
                    <div className="p-2.5 rounded bg-space-dark/60 border border-space-border/60">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">
                        5. Immediate Safety Actions
                      </span>
                      <ul className="space-y-1 text-[11px] font-sans text-slate-300">
                        {m.assessment.immediate_safety_actions.map((act, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Medical Review & Monitoring Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-space-dark/40 border border-space-border/40">
                        <span className="text-[10px] text-holo-glow font-bold block mb-0.5">
                          6. Medical Review
                        </span>
                        <p className="text-slate-300 font-sans">{m.assessment.recommended_medical_review}</p>
                      </div>
                      <div className="p-2 rounded bg-space-dark/40 border border-space-border/40">
                        <span className="text-[10px] text-holo-glow font-bold block mb-0.5">
                          7. Follow-Up Monitoring
                        </span>
                        <p className="text-slate-300 font-sans">{m.assessment.follow_up_monitoring}</p>
                      </div>
                    </div>

                    {/* Data Limitations & Confidence Footer */}
                    <div className="p-2 rounded bg-space-dark/30 border border-space-border/30 text-[10px] text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>8. Limitations:</span>
                        <span className="text-slate-300 italic">{m.assessment.missing_information}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>9. AI Confidence:</span>
                        <span className="text-cyan-glow font-bold">{m.assessment.confidence_and_uncertainty}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>10. Sensor Source:</span>
                        <span className="text-slate-300">{m.assessment.data_source_and_timestamp}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isAi && (
                <div className="w-8 h-8 rounded-lg bg-holo-blue/30 border border-holo-blue/50 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4 text-holo-glow" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-glow/20 border border-cyan-glow/40 flex items-center justify-center">
              <Bot className="w-4 h-4 text-cyan-glow animate-spin" />
            </div>
            <div className="p-3 rounded-xl bg-space-surface border border-cyan-glow/30 text-xs font-mono text-cyan-glow flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Synthesizing physiological records & mission flight rules...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── QUESTION INPUT FORM ─────────────────────────────────────────────── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-space-surface/95 border-t border-space-border/80 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuestion}
          onChange={(e) => setInputQuestion(e.target.value)}
          placeholder={`Ask ASTRO AI regarding ${selectedAstronaut?.name || 'Commander Alex Chen'}...`}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl bg-space-dark border border-space-border focus:border-cyan-glow/60 text-xs text-white placeholder-slate-500 outline-none font-mono transition-colors"
        />
        <button
          type="submit"
          disabled={!inputQuestion.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-cyan-glow hover:bg-cyan-200 text-[#050B16] font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(50,230,224,0.3)] disabled:opacity-50 shrink-0"
        >
          <span>QUERY</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default AskAstroChat;

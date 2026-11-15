import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTelemetry } from '../../context/TelemetryContext';
import { emergencyApi } from '../../services/api';
import {
  AlertTriangle,
  ShieldAlert,
  Activity,
  Heart,
  Wind,
  Brain,
  Bone,
  CheckCircle2,
  ArrowRight,
  UserCheck,
  Zap,
  Radio,
  ExternalLink,
} from 'lucide-react';

const EmergencyDecisionPanel = () => {
  const {
    activeEmergencies,
    fetchActiveEmergencies,
    setSelectedOrgan,
    setSelectedAstronautId,
    setActiveEmergencyAlert,
  } = useTelemetry();
  const navigate = useNavigate();

  const [acknowledging, setAcknowledging] = useState(false);
  const [triggeringDemo, setTriggeringDemo] = useState(false);

  const topEmergency = activeEmergencies && activeEmergencies.length > 0 ? activeEmergencies[0] : null;

  const handleAcknowledge = async (e) => {
    e.stopPropagation();
    if (!topEmergency) return;
    setAcknowledging(true);
    try {
      await emergencyApi.acknowledge(topEmergency.id, 'Flight Surgeon', 'Flight Surgeon');
      await fetchActiveEmergencies();
      if (setActiveEmergencyAlert) setActiveEmergencyAlert(null);
    } catch (err) {
      console.error('Error acknowledging emergency alert:', err);
    } finally {
      setAcknowledging(false);
    }
  };

  const handleSimulateQuickDrill = async () => {
    setTriggeringDemo(true);
    try {
      const res = await emergencyApi.simulateScenario('AST-001', 'cardiac_tachycardia');
      await fetchActiveEmergencies(true);
      setSelectedOrgan('heart');
      if (res.data?.alert && setActiveEmergencyAlert) {
        const a = res.data.alert;
        setActiveEmergencyAlert({
          id: a.id,
          title: a.title,
          severity: a.severity,
          organ: a.organ_affected || 'heart',
          explanation: a.ai_explanation,
          recommendation: a.protocol?.response_steps?.[0]?.action || 'Clinical evaluation required',
          timestamp: new Date().toLocaleTimeString(),
        });
      }
    } catch (err) {
      console.error('Error triggering simulated drill:', err);
    } finally {
      setTriggeringDemo(false);
    }
  };

  const handleInspect3DTwin = (organ, astId) => {
    if (organ) setSelectedOrgan(organ);
    if (astId) setSelectedAstronautId(astId);
    navigate('/twin');
  };

  const getOrganIcon = (organ) => {
    switch (organ?.toLowerCase()) {
      case 'heart':
        return Heart;
      case 'lungs':
        return Wind;
      case 'brain':
        return Brain;
      case 'skeleton':
        return Bone;
      default:
        return Activity;
    }
  };

  if (!topEmergency) {
    // Nominal Standby State
    return (
      <div className="p-5 rounded-2xl bg-[#060E1E]/90 border border-cyan-glow/20 shadow-xl backdrop-blur-xl relative overflow-hidden font-sans">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-cyan-glow/10 border border-cyan-glow/30 text-cyan-glow shadow-[0_0_15px_rgba(50,230,224,0.15)]">
              <ShieldAlert className="w-5 h-5 text-cyan-glow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  AUTONOMOUS MEDICAL SURVEILLANCE • STANDBY
                </span>
              </div>
              <h3 className="text-sm font-orbitron font-bold text-white mt-0.5">
                All Astronaut Physiological Baselines Nominal
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleSimulateQuickDrill}
              disabled={triggeringDemo}
              className="px-3.5 py-1.5 rounded-xl bg-emergency-red/20 hover:bg-emergency-red/30 border border-emergency-red/50 text-[#FF526B] font-mono text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(255,82,107,0.2)] disabled:opacity-50"
              title="Trigger simulated cardiac tachycardia to test emergency pipeline"
            >
              <Zap className="w-3.5 h-3.5 animate-pulse" />
              <span>{triggeringDemo ? 'INJECTING CRISIS...' : 'SIMULATE EMERGENCY DRILL'}</span>
            </button>
            <Link
              to="/assistant"
              className="px-3 py-1.5 rounded-xl bg-space-surface hover:bg-space-card border border-space-border/80 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <span>AI Assistant</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Active Emergency State
  const OrganIcon = getOrganIcon(topEmergency.organ_affected);
  const steps = topEmergency.protocol?.response_steps || [];

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-b from-[#18080E]/95 via-[#0D050B]/95 to-[#060D1A]/95 border-2 border-emergency-red/80 shadow-[0_0_40px_rgba(255,82,107,0.3)] backdrop-blur-xl relative overflow-hidden font-sans space-y-5 animate-pulse-slow">
      {/* Background warning gradient */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emergency-red/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-emergency-red/30">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emergency-red/20 border border-emergency-red text-[#FF526B] shadow-[0_0_20px_rgba(255,82,107,0.4)] animate-bounce-subtle">
            <AlertTriangle className="w-6 h-6 text-[#FF526B]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-emergency-red text-white text-[10px] font-mono font-bold tracking-wider uppercase animate-pulse">
                LEVEL 1 CLINICAL EMERGENCY • {topEmergency.severity}
              </span>
              <span className="px-2 py-0.5 rounded bg-space-surface border border-space-border text-slate-300 text-[10px] font-mono">
                STATUS: {topEmergency.status}
              </span>
              {topEmergency.is_simulated && (
                <span className="px-2 py-0.5 rounded bg-violet-900/40 text-violet-300 border border-violet-500/40 text-[10px] font-mono font-bold">
                  SIMULATED DRILL
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-orbitron font-extrabold text-white mt-1">
              {topEmergency.title}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleInspect3DTwin(topEmergency.organ_affected, topEmergency.astronaut_id)}
            className="px-3 py-1.5 rounded-xl bg-cyan-glow/15 hover:bg-cyan-glow/25 border border-cyan-glow/40 text-cyan-glow font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <OrganIcon className="w-4 h-4 text-cyan-glow animate-pulse" />
            <span>FOCUS 3D TWIN</span>
          </button>
          <Link
            to="/assistant"
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emergency-red to-rose-600 text-white font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,82,107,0.4)] hover:opacity-90 transition-opacity"
          >
            <span>LAUNCH AI ASSISTANT</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid: Context & AI Decision Support */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Triggering Measurements */}
        <div className="p-4 rounded-xl bg-[#080307]/80 border border-emergency-red/40 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="text-[#FF526B] font-bold uppercase tracking-wider">ASTRONAUT IN CRITICAL CARE</span>
            <span className="text-white font-semibold">{topEmergency.astronaut_name} ({topEmergency.astronaut_id})</span>
          </div>

          <div className="space-y-2 pt-1">
            {topEmergency.trigger_readings && topEmergency.trigger_readings.length > 0 ? (
              topEmergency.trigger_readings.map((tr, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-space-dark/80 border border-space-border/60 text-xs font-mono">
                  <span className="text-slate-300">{tr.metric}</span>
                  <div className="text-right">
                    <span className="text-[#FF526B] font-bold">{tr.value}</span>
                    <span className="text-[10px] text-slate-500 block">Nominal: {tr.normal}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-2.5 rounded-lg bg-space-dark text-xs font-mono text-slate-400">
                Acute physiological departure from baseline logged.
              </div>
            )}
          </div>
        </div>

        {/* AI Rationale & Explanation */}
        <div className="p-4 rounded-xl bg-[#080307]/80 border border-emergency-red/40 space-y-2 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-glow font-bold mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span>AI CLINICAL DECISION RATIONALE</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {topEmergency.ai_explanation}
            </p>
          </div>

          {/* Quick Immediate Protocol Actions */}
          <div className="pt-2 border-t border-space-border/50">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block mb-1.5 font-semibold">
              EVIDENCE-BASED IMMEDIATE ACTIONS:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {steps.slice(0, 2).map((st) => (
                <div key={st.id} className="p-2 rounded-lg bg-space-dark/90 border border-space-border/70 flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-emergency-red/20 text-[#FF526B] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {st.order}
                  </span>
                  <div>
                    <span className="text-white font-semibold block">{st.action}</span>
                    <span className="text-[10px] text-slate-400 block line-clamp-1">{st.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <span className="text-slate-300">ASSIGNED CLINICAL LEAD:</span>
          <span className="text-cyan-glow font-bold">
            {topEmergency.assigned_to || topEmergency.assigned_role || 'Flight Surgeon'}
          </span>
          {topEmergency.is_escalated && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emergency-red/30 text-[#FF526B] font-bold">
              ESCALATED
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {topEmergency.status === 'ACTIVE' && (
            <button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-space-surface hover:bg-space-card border border-cyan-glow/40 text-cyan-glow font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(50,230,224,0.15)] disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{acknowledging ? 'LOGGING...' : 'ACKNOWLEDGE ALERT'}</span>
            </button>
          )}

          <Link
            to="/assistant"
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gradient-to-r from-emergency-red to-rose-600 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,82,107,0.4)] hover:opacity-90 transition-opacity"
          >
            <span>OPEN EMERGENCY CHECKLIST</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmergencyDecisionPanel;

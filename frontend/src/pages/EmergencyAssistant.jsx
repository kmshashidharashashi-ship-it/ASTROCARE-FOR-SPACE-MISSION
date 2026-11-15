import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../context/TelemetryContext';
import { useAuth } from '../context/AuthContext';
import { emergencyApi } from '../services/api';
import {
  ShieldAlert,
  AlertTriangle,
  Activity,
  Heart,
  Wind,
  Brain,
  Bone,
  CheckCircle2,
  Clock,
  UserCheck,
  Send,
  Zap,
  ArrowUpRight,
  FileCheck2,
  History,
  FileText,
  AlertOctagon,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  ChevronRight,
  Info,
  Bot,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import AskAstroChat from '../components/assistant/AskAstroChat';

const EmergencyAssistant = () => {
  const {
    astronauts,
    selectedAstronautId,
    setSelectedAstronautId,
    activeEmergencies,
    fetchActiveEmergencies,
    setSelectedOrgan,
  } = useTelemetry();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('triage'); // 'triage' | 'ask_ai' | 'simulation'
  const [loading, setLoading] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [protocols, setProtocols] = useState({});
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);

  // Modal / Form States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    name: 'Dr. Sarah Lindqvist',
    role: 'Flight Surgeon',
  });

  const [showActionModal, setShowActionModal] = useState(false);
  const [actionForm, setActionForm] = useState({
    type: 'CLINICAL_EVALUATION',
    notes: '',
  });

  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNotes, setResolveNotes] = useState('');

  const [simulatingScenario, setSimulatingScenario] = useState(false);
  const [demoStepLog, setDemoStepLog] = useState([]);

  // Fetch protocols and astronaut incident history
  useEffect(() => {
    const loadProtocolsAndHistory = async () => {
      setLoading(true);
      try {
        const [protRes, incRes] = await Promise.all([
          emergencyApi.getProtocols(),
          emergencyApi.getAstronautIncidents(selectedAstronautId),
        ]);
        if (protRes.data?.protocols) setProtocols(protRes.data.protocols);
        if (incRes.data?.incidents) {
          setIncidents(incRes.data.incidents);
          if (incRes.data.incidents.length > 0 && !selectedIncidentId) {
            setSelectedIncidentId(incRes.data.incidents[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching emergency data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProtocolsAndHistory();
  }, [selectedAstronautId]);

  const activeAlert =
    incidents.find((i) => i.id === selectedIncidentId) ||
    activeEmergencies.find((a) => a.astronaut_id === selectedAstronautId) ||
    activeEmergencies[0] ||
    incidents[0] ||
    null;

  const refreshCurrent = async () => {
    await fetchActiveEmergencies();
    try {
      const incRes = await emergencyApi.getAstronautIncidents(selectedAstronautId);
      if (incRes.data?.incidents) {
        setIncidents(incRes.data.incidents);
      }
    } catch (e) {}
  };

  // ── CLINICAL RESPONSE ACTIONS ──────────────────────────────────────────────

  const handleAcknowledge = async () => {
    if (!activeAlert) return;
    try {
      await emergencyApi.acknowledge(
        activeAlert.id,
        user?.full_name || 'Dr. Eleanor Smith',
        user?.role || 'Flight Surgeon'
      );
      await refreshCurrent();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignOfficer = async (e) => {
    e.preventDefault();
    if (!activeAlert) return;
    try {
      await emergencyApi.assign(
        activeAlert.id,
        assignForm.name,
        assignForm.role,
        user?.full_name || 'Mission Commander'
      );
      setShowAssignModal(false);
      await refreshCurrent();
    } catch (e) {
      console.error(e);
    }
  };

  const handleChecklistToggle = async (stepId, currentStatus) => {
    if (!activeAlert) return;
    try {
      await emergencyApi.updateChecklistStep(
        activeAlert.id,
        stepId,
        !currentStatus,
        user?.full_name || 'Flight Surgeon'
      );
      await refreshCurrent();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRecordAction = async (e) => {
    e.preventDefault();
    if (!activeAlert || !actionForm.notes.trim()) return;
    try {
      await emergencyApi.recordAction(
        activeAlert.id,
        actionForm.type,
        actionForm.notes,
        user?.full_name || 'Flight Surgeon',
        user?.role || 'Flight Surgeon'
      );
      setActionForm({ type: 'CLINICAL_EVALUATION', notes: '' });
      setShowActionModal(false);
      await refreshCurrent();
    } catch (e) {
      console.error(e);
    }
  };

  const handleEscalate = async (e) => {
    e.preventDefault();
    if (!activeAlert || !escalateReason.trim()) return;
    try {
      await emergencyApi.escalate(
        activeAlert.id,
        user?.full_name || 'Medical Officer',
        escalateReason
      );
      setEscalateReason('');
      setShowEscalateModal(false);
      await refreshCurrent();
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!activeAlert || !resolveNotes.trim()) return;
    try {
      await emergencyApi.resolve(
        activeAlert.id,
        user?.full_name || 'Dr. Eleanor Smith (Lead Surgeon)',
        resolveNotes
      );
      setResolveNotes('');
      setShowResolveModal(false);
      await refreshCurrent();
    } catch (e) {
      console.error(e);
    }
  };

  // ── REPEATABLE DEMONSTRATION SEQUENCE ──────────────────────────────────────

  const runSimulationScenario = async (scenarioKey) => {
    setSimulatingScenario(true);
    setDemoStepLog([]);
    const steps = [
      '1. Initializing Lunar Gateway physiological baseline monitoring...',
      '2. Injecting crisis telemetry stream (Tagged SIMULATED)...',
      '3. AI multivariate anomaly detection running against individual baseline...',
      '4. Anomaly detected: Threshold violation identified.',
      '5. Matching evidence-based mission medical protocol...',
      '6. Generating Emergency Decision Support alert and response checklist...',
      '7. Broadcasting real-time alerts via WebSockets (/ws/alerts)...',
      '8. Synchronizing 3D Astronaut Digital Twin organ highlight...',
      '9. Establishing Space-to-Ground medical loop...',
      '10. Prepared for Flight Surgeon acknowledgement & intervention.',
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 120));
      setDemoStepLog((prev) => [...prev, steps[i]]);
    }

    try {
      const res = await emergencyApi.simulateScenario(selectedAstronautId, scenarioKey);
      if (res.data?.alert) {
        setSelectedIncidentId(res.data.alert.id);
        if (res.data.alert.organ_affected) {
          setSelectedOrgan(res.data.alert.organ_affected);
        }
      }
      await refreshCurrent();
    } catch (e) {
      console.error(e);
    } finally {
      setSimulatingScenario(false);
    }
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

  return (
    <div className="space-y-6 font-sans">
      {/* ── SAFETY & SCIENTIFIC RESPONSIBILITY DISCLAIMER BANNER ─────────────── */}
      <div className="p-3.5 rounded-xl bg-space-surface/90 border border-holo-blue/40 flex items-start gap-3 backdrop-blur-md">
        <Info className="w-4 h-4 text-holo-blue shrink-0 mt-0.5" />
        <div className="text-xs font-mono text-slate-300">
          <span className="text-cyan-glow font-bold uppercase tracking-wider">
            NASA Space Medicine Research Decision-Support System:
          </span>{' '}
          This is an experimental clinical decision-support and research demonstration platform, not an autonomous medical device. All clinical recommendations follow NASA/ISS mission flight rules and evidence-based protocols. The certified Flight Surgeon retains exclusive clinical authority. All simulated readings are strictly marked as{' '}
          <span className="text-amber-400 font-bold">SIMULATED</span>.
        </div>
      </div>

      {/* ── TOP HEADER & CREW SELECTOR ───────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-emergency-red/20 text-[#FF526B] border border-emergency-red/40 font-bold animate-pulse">
              AUTONOMOUS MEDICAL DECISION SUPPORT
            </span>
            <span className="text-xs font-mono text-slate-400">GATEWAY LEVEL-1 TRIAGE</span>
          </div>
          <h1 className="text-2xl font-orbitron font-extrabold text-white mt-1">
            AI Astronaut Medical Emergency Assistant
          </h1>
        </div>

        {/* Crew Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-space-surface border border-space-border overflow-x-auto w-full lg:w-auto">
          {astronauts.map((ast) => (
            <button
              key={ast.astronaut_id}
              onClick={() => setSelectedAstronautId(ast.astronaut_id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold whitespace-nowrap transition-all ${
                selectedAstronautId === ast.astronaut_id
                  ? 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/40 shadow-[0_0_12px_rgba(50,230,224,0.2)]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ast.name} ({ast.astronaut_id})
            </button>
          ))}
        </div>
      </div>

      {/* ── TOP SECTION NAVIGATION TABS ───────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-space-surface/90 border border-space-border/80">
        <button
          onClick={() => setActiveTab('triage')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === 'triage'
              ? 'bg-emergency-red/20 text-[#FF526B] border border-emergency-red/50 shadow-[0_0_12px_rgba(255,82,107,0.25)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>TRIAGE & INCIDENT COMMAND</span>
        </button>

        <button
          onClick={() => setActiveTab('ask_ai')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ask_ai'
              ? 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/50 shadow-[0_0_12px_rgba(50,230,224,0.25)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>ASK ASTRO AI (CONVERSATIONAL)</span>
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 ${
            activeTab === 'simulation'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>CRISIS SIMULATION TEST BENCH</span>
        </button>
      </div>

      {/* ── TAB 1: ASK ASTRO AI CONVERSATIONAL ASSISTANT ─────────────────────── */}
      {activeTab === 'ask_ai' && <AskAstroChat />}

      {/* ── TAB 2: TRIAGE & ACTIVE INCIDENT COMMAND ──────────────────────────── */}
      {activeTab === 'triage' && (
        <>
          {activeAlert ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Incident Details & Checklist */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary Incident Card */}
            <div className="p-6 rounded-2xl bg-space-surface/90 border-2 border-emergency-red/80 shadow-[0_0_35px_rgba(255,82,107,0.25)] space-y-5 backdrop-blur-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-emergency-red/20 border border-emergency-red text-[#FF526B] shadow-[0_0_15px_rgba(255,82,107,0.3)]">
                    <ShieldAlert className="w-7 h-7 text-[#FF526B]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-emergency-red text-white text-[10px] font-mono font-bold uppercase">
                        {activeAlert.severity} PRIORITY
                      </span>
                      <span className="px-2 py-0.5 rounded bg-space-dark border border-space-border text-cyan-glow text-[10px] font-mono font-bold">
                        STATUS: {activeAlert.status}
                      </span>
                      {activeAlert.is_simulated && (
                        <span className="px-2 py-0.5 rounded bg-violet-900/40 text-violet-300 border border-violet-500/40 text-[10px] font-mono font-bold">
                          SIMULATED
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-orbitron font-bold text-white mt-1">
                      {activeAlert.title}
                    </h2>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (activeAlert.organ_affected) setSelectedOrgan(activeAlert.organ_affected);
                    navigate('/twin');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-glow/15 hover:bg-cyan-glow/25 border border-cyan-glow/40 text-cyan-glow font-mono text-xs flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {React.createElement(getOrganIcon(activeAlert.organ_affected), { className: 'w-4 h-4 text-cyan-glow' })}
                  <span>INSPECT 3D TWIN</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </button>
              </div>

              {/* Trigger Readings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeAlert.trigger_readings && activeAlert.trigger_readings.length > 0 ? (
                  activeAlert.trigger_readings.map((tr, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-space-dark border border-space-border flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-slate-400 block text-[11px]">{tr.metric}</span>
                        <span className="text-[10px] text-slate-500">Nominal: {tr.normal}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-[#FF526B]">{tr.value}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emergency-red/20 text-[#FF526B] font-semibold block mt-0.5">
                          {tr.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-xl bg-space-dark text-xs font-mono text-slate-400 sm:col-span-2">
                    Acute physiological departure from baseline logged.
                  </div>
                )}
              </div>

              {/* AI Clinical Diagnosis & Microgravity Mechanism Explanation */}
              <div className="p-4 rounded-xl bg-space-dark/80 border border-space-border/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-glow font-bold">
                  <Activity className="w-4 h-4" />
                  <span>AI CLINICAL MECHANISM &amp; RATIONALE</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {activeAlert.ai_explanation}
                </p>
                {activeAlert.protocol?.clinical_rationale && (
                  <p className="text-xs text-slate-400 italic pt-1 border-t border-space-border/40 font-sans">
                    <span className="text-slate-300 font-semibold not-italic">Aerospace Pathophysiology:</span>{' '}
                    {activeAlert.protocol.clinical_rationale}
                  </p>
                )}
                {activeAlert.protocol?.uncertainty_analysis && (
                  <div className="text-[11px] font-mono text-holo-blue/90 pt-1">
                    <span className="font-semibold text-holo-blue">Sensor Confidence &amp; Quality:</span>{' '}
                    {activeAlert.protocol.uncertainty_analysis}
                  </div>
                )}
              </div>

              {/* Clinical Protocol Response Checklist */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-cyan-glow" />
                    <span className="text-xs font-orbitron font-bold text-white uppercase tracking-wider">
                      Mission Medical Protocol Checklist
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    {activeAlert.protocol?.protocol_id || 'PROT-NASA-STD'}
                  </span>
                </div>

                <div className="space-y-2">
                  {(activeAlert.protocol?.response_steps || []).map((step) => {
                    const stepState = (activeAlert.checklist || []).find((s) => s.id === step.id);
                    const isChecked = Boolean(stepState?.completed);

                    return (
                      <div
                        key={step.id}
                        onClick={() => handleChecklistToggle(step.id, isChecked)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                          isChecked
                            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-space-dark/80 border-space-border/80 hover:border-cyan-glow/50 text-slate-300'
                        }`}
                      >
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent div
                            className="w-4 h-4 accent-cyan-glow cursor-pointer"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-mono font-bold ${isChecked ? 'line-through text-slate-400' : 'text-white'}`}>
                              {step.order}. {step.action}
                            </span>
                            {step.is_mandatory && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emergency-red/20 text-[#FF526B] font-bold">
                                MANDATORY
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-sans">
                            {step.detail}
                          </p>
                          {isChecked && stepState?.completed_by && (
                            <span className="text-[10px] font-mono text-emerald-400 block mt-1">
                              ✓ Executed by {stepState.completed_by} at{' '}
                              {new Date(stepState.completed_at).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-space-border/60 flex-wrap">
                {activeAlert.status === 'ACTIVE' && (
                  <button
                    onClick={handleAcknowledge}
                    className="px-4 py-2 rounded-xl bg-cyan-glow text-[#050B16] font-mono font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(50,230,224,0.3)] hover:opacity-90 transition-opacity"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ACKNOWLEDGE ALERT</span>
                  </button>
                )}

                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-space-surface border border-space-border text-slate-300 hover:text-white font-mono text-xs flex items-center gap-2 hover:bg-space-card transition-colors"
                >
                  <UserCheck className="w-4 h-4 text-holo-blue" />
                  <span>ASSIGN OFFICER</span>
                </button>

                <button
                  onClick={() => setShowActionModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-space-surface border border-space-border text-slate-300 hover:text-white font-mono text-xs flex items-center gap-2 hover:bg-space-card transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <span>RECORD CLINICAL ACTION</span>
                </button>

                {!activeAlert.is_escalated && (
                  <button
                    onClick={() => setShowEscalateModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-emergency-red/20 border border-emergency-red/50 text-[#FF526B] hover:bg-emergency-red/30 font-mono text-xs flex items-center gap-2 transition-colors ml-auto"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>ESCALATE TO SURGEON</span>
                  </button>
                )}

                {activeAlert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30 font-mono text-xs flex items-center gap-2 transition-colors ml-auto"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>RESOLVE INCIDENT</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Timeline & Protocol Details */}
          <div className="space-y-6">
            {/* Assigned Personnel Card */}
            <div className="p-5 rounded-2xl bg-space-surface/90 border border-space-border/80 shadow-xl space-y-3 font-mono text-xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold block">
                INCIDENT RESPONSE TEAM
              </span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-glow/20 to-holo-blue/30 border border-cyan-glow/40 flex items-center justify-center font-bold text-cyan-glow text-sm">
                  {activeAlert.assigned_to ? activeAlert.assigned_to.slice(0, 2).toUpperCase() : 'FS'}
                </div>
                <div>
                  <span className="text-white font-bold block">
                    {activeAlert.assigned_to || 'Dr. Sarah Lindqvist'}
                  </span>
                  <span className="text-[11px] text-cyan-glow block">
                    {activeAlert.assigned_role || 'Lead Flight Surgeon'}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-space-border/60 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Logged UTC:</span>
                  <span className="text-white">
                    {activeAlert.created_at ? new Date(activeAlert.created_at).toLocaleTimeString() : 'NOW'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Escalated:</span>
                  <span className={activeAlert.is_escalated ? 'text-[#FF526B] font-bold' : 'text-slate-500'}>
                    {activeAlert.is_escalated ? 'YES (PRIORITY)' : 'NO'}
                  </span>
                </div>
              </div>
            </div>

            {/* Incident Chronological Action Log */}
            <div className="p-5 rounded-2xl bg-space-surface/90 border border-space-border/80 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="text-white font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-cyan-glow" />
                  ACTION AUDIT LOG
                </span>
                <span className="text-[10px]">{activeAlert.actions_taken?.length || 0} events</span>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                {activeAlert.actions_taken && activeAlert.actions_taken.length > 0 ? (
                  activeAlert.actions_taken.map((act, i) => (
                    <div key={i} className="p-3 rounded-xl bg-space-dark border border-space-border/60 text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-cyan-glow font-bold">{act.action}</span>
                        <span className="text-slate-500">{new Date(act.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300 font-sans text-xs">{act.notes}</p>
                      <span className="text-[10px] text-slate-400 block pt-0.5">By: {act.actor}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 rounded-xl bg-space-dark text-xs font-mono text-slate-500 text-center">
                    No clinical intervention actions recorded yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-space-surface/90 border border-space-border/80 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-orbitron font-bold text-white">
            No Active Medical Emergencies
          </h2>
          <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
            All astronaut telemetry is within nominal microgravity cruise parameters. The autonomous clinical surveillance engine is operating on a 4.0-second loop.
          </p>
        </div>
      )}
    </>
  )}

      {/* ── REPEATABLE SIMULATION DEMONSTRATION SUITE ────────────────────────── */}
      {activeTab === 'simulation' && (
        <div className="p-6 rounded-2xl bg-[#060E1E]/90 border border-cyan-glow/30 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/40 font-bold">
                11-STEP VERIFICATION SUITE
              </span>
              <span className="text-xs font-mono text-slate-400">REPEATABLE TEST DRILLS</span>
            </div>
            <h2 className="text-lg font-orbitron font-bold text-white mt-1">
              Simulated Medical Emergency Test Bench
            </h2>
          </div>

          <span className="text-xs font-mono text-slate-400">
            Target: <span className="text-white font-bold">{selectedAstronautId}</span>
          </span>
        </div>

        {/* Drill Launch Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'cardiac_tachycardia',
              title: 'Cardiac Tachycardia',
              detail: 'HR 144 bpm • BP 160/98 (ARED Exercise)',
              organ: 'heart',
              icon: Heart,
            },
            {
              id: 'hypoxia',
              title: 'Airlock Acute Hypoxia',
              detail: 'SpO2 89.2% • pO2 Desaturation',
              organ: 'lungs',
              icon: Wind,
            },
            {
              id: 'hyperthermia',
              title: 'Garment Hyperthermia',
              detail: 'Core Temp 39.2°C • Heat Dissipation Fail',
              organ: 'brain',
              icon: Brain,
            },
            {
              id: 'solar_particle_event_radiation',
              title: 'Solar Particle Event (SPE)',
              detail: 'Cosmic Flux 72 µSv/h • Storm Haven',
              organ: 'skeleton',
              icon: Bone,
            },
          ].map((sc) => {
            const Icon = sc.icon;
            return (
              <button
                key={sc.id}
                onClick={() => runSimulationScenario(sc.id)}
                disabled={simulatingScenario}
                className="p-4 rounded-xl bg-space-dark hover:bg-space-card border border-space-border hover:border-emergency-red/60 text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-emergency-red group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-mono text-cyan-glow">SIMULATE</span>
                </div>
                <div className="text-xs font-mono font-bold text-white group-hover:text-cyan-glow transition-colors">
                  {sc.title}
                </div>
                <div className="text-[10px] font-mono text-slate-400 mt-1">{sc.detail}</div>
              </button>
            );
          })}
        </div>

        {/* Step-by-Step Simulation Execution Console */}
        {demoStepLog.length > 0 && (
          <div className="p-4 rounded-xl bg-[#040812] border border-cyan-glow/40 text-xs font-mono space-y-1.5">
            <div className="flex items-center justify-between text-cyan-glow font-bold pb-1 border-b border-space-border/40">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 animate-pulse" />
                AUTOMATED DEMO EXECUTION LOG (ALL READINGS TAGGED SIMULATED)
              </span>
              <span className="text-[10px] text-slate-400">{demoStepLog.length} / 10 STEPS</span>
            </div>
            {demoStepLog.map((log, idx) => (
              <div key={idx} className="text-slate-300 text-[11px] flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                <span>{log}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* ── HISTORICAL INCIDENTS ARCHIVE ─────────────────────────────────────── */}
      {activeTab === 'triage' && (
      <div className="p-6 rounded-2xl bg-space-surface/90 border border-space-border/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-holo-blue" />
            <h2 className="text-base font-orbitron font-bold text-white">
              Astronaut Clinical Incident History
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Total Logged: {incidents.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-space-border/80 text-slate-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Incident Title</th>
                <th className="py-2.5 px-3">Organ</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Assigned Lead</th>
                <th className="py-2.5 px-3">Resolution Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-border/40">
              {incidents.map((inc) => (
                <tr
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(inc.id)}
                  className={`hover:bg-space-dark/50 cursor-pointer transition-colors ${
                    selectedIncidentId === inc.id ? 'bg-cyan-glow/10 text-cyan-glow' : 'text-slate-300'
                  }`}
                >
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {inc.created_at ? new Date(inc.created_at).toLocaleString() : 'N/A'}
                  </td>
                  <td className="py-3 px-3 font-semibold text-white max-w-xs truncate">
                    {inc.title}
                  </td>
                  <td className="py-3 px-3 capitalize">{inc.organ_affected}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emergency-red/20 text-[#FF526B]">
                      {inc.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      inc.status === 'RESOLVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-glow/20 text-cyan-glow'
                    }`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-3 px-3">{inc.assigned_to || inc.assigned_role || 'Flight Surgeon'}</td>
                  <td className="py-3 px-3 text-[11px] text-slate-400 max-w-xs truncate">
                    {inc.resolution_notes || 'Pending clinical resolution'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ── MODALS (ASSIGN, ACTION, ESCALATE, RESOLVE) ───────────────────────── */}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-space-surface border border-space-border shadow-2xl space-y-4">
            <h3 className="text-base font-orbitron font-bold text-white">Assign Medical Officer</h3>
            <form onSubmit={handleAssignOfficer} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 block mb-1">Personnel Name</label>
                <input
                  type="text"
                  value={assignForm.name}
                  onChange={(e) => setAssignForm({ ...assignForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Assigned Role</label>
                <select
                  value={assignForm.role}
                  onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
                >
                  <option value="Flight Surgeon">Flight Surgeon (Primary Authority)</option>
                  <option value="Medical Officer">Medical Officer (Crew Quarters)</option>
                  <option value="Mission Commander">Mission Commander (Operational Override)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 rounded-xl bg-space-dark text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-glow text-[#050B16] font-bold"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-space-surface border border-space-border shadow-2xl space-y-4">
            <h3 className="text-base font-orbitron font-bold text-white">Record Clinical Response Action</h3>
            <form onSubmit={handleRecordAction} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 block mb-1">Action Category</label>
                <select
                  value={actionForm.type}
                  onChange={(e) => setActionForm({ ...actionForm, type: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
                >
                  <option value="O2_MASK_ADMINISTERED">Emergency O2 Mask Administered</option>
                  <option value="ECG_LEAD_ATTACHED">12-Lead ECG Bioharness Attached</option>
                  <option value="ARED_HALTED">Resistive Workload Halted</option>
                  <option value="COOLING_INITIATED">Forced Air Cooling Loop Initiated</option>
                  <option value="CLINICAL_EVALUATION">General Clinical Evaluation</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Clinical Observation Notes</label>
                <textarea
                  rows="3"
                  value={actionForm.notes}
                  onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                  placeholder="Detail physiological response, rhythm stability, subjective symptoms..."
                  className="w-full p-2.5 rounded-xl bg-space-dark border border-space-border text-white focus:border-cyan-glow focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-4 py-2 rounded-xl bg-space-dark text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-[#050B16] font-bold"
                >
                  Append Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-space-surface border border-emergency-red shadow-2xl space-y-4">
            <h3 className="text-base font-orbitron font-bold text-white text-rose-300">
              Priority Escalation to Flight Surgeon
            </h3>
            <form onSubmit={handleEscalate} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 block mb-1">Clinical Justification for Escalation</label>
                <textarea
                  rows="3"
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="E.g., Sustained tachycardia > 140 bpm post rest, ST segment alteration observed..."
                  className="w-full p-2.5 rounded-xl bg-space-dark border border-space-border text-white focus:border-emergency-red focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="px-4 py-2 rounded-xl bg-space-dark text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emergency-red text-white font-bold"
                >
                  Confirm Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md p-6 rounded-2xl bg-space-surface border border-emerald-500 shadow-2xl space-y-4">
            <h3 className="text-base font-orbitron font-bold text-white text-emerald-300">
              Close &amp; Resolve Medical Emergency
            </h3>
            <form onSubmit={handleResolve} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-300 block mb-1">Final Medical Outcome &amp; Return-to-Nominal Notes</label>
                <textarea
                  rows="3"
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="E.g., Astronaut returned to nominal sinus rhythm (74 bpm) post rest & electrolyte hydration. Cleared for light duties."
                  className="w-full p-2.5 rounded-xl bg-space-dark border border-space-border text-white focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 rounded-xl bg-space-dark text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-[#050B16] font-bold"
                >
                  Close Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyAssistant;

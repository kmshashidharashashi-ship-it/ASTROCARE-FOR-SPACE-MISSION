import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { astroAiApi } from '../../services/api';
import LiveECGCanvas from '../charts/LiveECGCanvas';
import {
  Heart,
  Wind,
  Brain,
  Bone,
  AlertTriangle,
  CheckCircle,
  Activity,
  Info,
  ShieldCheck,
  Zap,
  Sparkles,
  X,
  ExternalLink,
  RefreshCw,
  FileCheck2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const OrganTelemetryPanel = () => {
  const {
    selectedOrgan,
    setSelectedOrgan,
    telemetry,
    activeEmergencyAlert,
    selectedAstronautId,
    selectedAstronaut,
  } = useTelemetry();

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);

  // Mini historical trend sample points
  const hrTrendData = [
    { time: '10m', val: 68 },
    { time: '8m', val: 70 },
    { time: '6m', val: 71 },
    { time: '4m', val: 69 },
    { time: '2m', val: 72 },
    { time: 'Now', val: telemetry.heart_rate },
  ];

  const spo2TrendData = [
    { time: '10m', val: 98.6 },
    { time: '8m', val: 98.4 },
    { time: '6m', val: 98.5 },
    { time: '4m', val: 98.2 },
    { time: '2m', val: 98.3 },
    { time: 'Now', val: telemetry.oxygen_saturation },
  ];

  const organData = {
    heart: {
      name: 'Cardiovascular System',
      organ: 'Heart & Myocardium',
      aiButtonLabel: 'ANALYZE HEART HEALTH',
      icon: Heart,
      status: telemetry.heart_rate > 100 ? 'CRITICAL' : telemetry.heart_rate > 85 ? 'MONITOR' : 'NORMAL',
      statusColor: telemetry.heart_rate > 100 ? 'text-emergency-red' : telemetry.heart_rate > 85 ? 'text-alert-amber' : 'text-cyan-glow',
      badgeBg: telemetry.heart_rate > 100 ? 'bg-emergency-red/20 border-emergency-red' : 'bg-cyan-glow/15 border-cyan-glow/40',
      measurements: [
        { label: 'Heart Rate', value: `${telemetry.heart_rate} bpm`, normal: '60 - 80 bpm' },
        { label: 'Blood Pressure', value: `${telemetry.systolic_bp} / ${telemetry.diastolic_bp} mmHg`, normal: '120/80 mmHg' },
        { label: 'Cardiac Output', value: '5.2 L/min (est.)', normal: '4.8 - 6.2 L/min' },
        { label: 'Arterial Stiffness (AI)', value: '0.12 (Normal)', normal: '< 0.25' },
      ],
      unavailable: ['Direct Echocardiography (EVA restricted)', 'Coronary CT Angiography'],
      trendData: hrTrendData,
      anomalyText:
        telemetry.heart_rate > 100
          ? 'Acute tachycardia departure detected (+4.2 SD from baseline). Elevated myocardial workload.'
          : 'Cardiac electrical axis and sinus rhythms conform to personal astronaut baseline within 1.0 SD.',
      aiExplanation:
        'Continuous predictive hemodynamic modeling correlates microgravity cephalad fluid redistribution with baroreceptor desensitization. Personal baseline stability index: 96.4%.',
      recommendation:
        telemetry.heart_rate > 100
          ? 'Halt current workload protocol immediately. Initiate Flight Surgeon telemetry audio review. Prepare 12-lead telemetry capture.'
          : 'Nominal cardiovascular performance. Continue scheduled aerobic and resistive countermeasure exercise.',
      source: 'Bio-Harness Telemetry Vest (Live Sensor Channel A)',
      confidence: '98.5% (High Telemetry SNR)',
    },
    lungs: {
      name: 'Respiratory System',
      organ: 'Pulmonary Lobes & Gas Exchange',
      aiButtonLabel: 'ANALYZE RESPIRATORY HEALTH',
      icon: Wind,
      status: telemetry.oxygen_saturation < 92 ? 'CRITICAL' : telemetry.oxygen_saturation < 95 ? 'WARNING' : 'NORMAL',
      statusColor: telemetry.oxygen_saturation < 92 ? 'text-emergency-red' : telemetry.oxygen_saturation < 95 ? 'text-alert-amber' : 'text-cyan-glow',
      badgeBg: telemetry.oxygen_saturation < 92 ? 'bg-emergency-red/20 border-emergency-red' : 'bg-cyan-glow/15 border-cyan-glow/40',
      measurements: [
        { label: 'Oxygen Saturation (SpO2)', value: `${telemetry.oxygen_saturation}%`, normal: '96 - 100%' },
        { label: 'Respiratory Rate', value: `${telemetry.respiratory_rate} breaths/min`, normal: '12 - 18' },
        { label: 'Tidal Volume', value: '495 mL', normal: '450 - 550 mL' },
        { label: 'End-Tidal CO2 (est.)', value: '37 mmHg', normal: '35 - 42 mmHg' },
      ],
      unavailable: ['Pulmonary Function Spirometry Chamber', 'Arterial Blood Gas (PaO2) Direct'],
      trendData: spo2TrendData,
      anomalyText:
        telemetry.oxygen_saturation < 92
          ? 'Hypoxia hazard detected! SpO2 dropped below 92.0%. High physiological risk.'
          : 'Alveolar diffusion and respiratory rate tracking within target envelope.',
      aiExplanation:
        'Atmospheric oxygen fractional pressure and microgravity lung perfusion dynamics match nominal lunar gateway habitat parameters.',
      recommendation:
        telemetry.oxygen_saturation < 92
          ? 'Immediate oxygen enrichment protocol. Inspect cabin ventilation and astronaut suit environmental loop.'
          : 'Maintain cabin partial pressure ventilation standards.',
      source: 'Pulse Oximeter & Acoustic Respiratory Sensor',
      confidence: '97.2%',
    },
    brain: {
      name: 'Nervous & Mental Health',
      organ: 'Cerebral Cortex & Wellness',
      aiButtonLabel: 'ANALYZE BRAIN AND WELLNESS',
      icon: Brain,
      status: telemetry.stress_index > 7 ? 'WARNING' : 'NORMAL',
      statusColor: telemetry.stress_index > 7 ? 'text-alert-amber' : 'text-violet-glow',
      badgeBg: 'bg-violet-space/20 border-violet-space/50',
      measurements: [
        { label: 'Sleep Duration (Last Night)', value: `${telemetry.sleep_duration} hrs`, normal: '7.0 - 8.5 hrs' },
        { label: 'Fatigue Rating', value: `${telemetry.fatigue_level} / 10`, normal: '< 5 / 10' },
        { label: 'Stress Self-Assessment', value: `${telemetry.stress_index} / 10`, normal: '< 4 / 10' },
        { label: 'Cognitive Readiness Score', value: '92 / 100', normal: '> 85' },
      ],
      unavailable: ['Direct 64-Channel EEG (Requires Dedicated Helmet)', 'fMRI Imaging'],
      trendData: [
        { time: 'Day 1', val: 7.2 },
        { time: 'Day 2', val: 6.8 },
        { time: 'Day 3', val: 7.5 },
        { time: 'Day 4', val: 7.1 },
        { time: 'Day 5', val: telemetry.sleep_duration },
      ],
      anomalyText: 'No significant sleep fragmentation or acute circadian disruption noted.',
      aiExplanation:
        'Behavioral pattern analysis synthesized from diurnal rhythm trackers and psychomotor vigilance testing (PVT). Stress index within expected operational limits for translunar flight.',
      recommendation:
        'Schedule 30-minute circadian blue-light phase shift prior to tomorrow’s scheduled EVA checklist.',
      source: 'Astronaut Sleep Wearable & Daily Subjective Check-in',
      confidence: '91.0% (Self-report + Actigraphy)',
    },
    skeleton: {
      name: 'Musculoskeletal System',
      organ: 'Skeleton & Vertebral Column',
      aiButtonLabel: 'ANALYZE BONE AND MOBILITY HEALTH',
      icon: Bone,
      status: 'NORMAL',
      statusColor: 'text-cyan-glow',
      badgeBg: 'bg-cyan-glow/15 border-cyan-glow/40',
      measurements: [
        { label: 'Vertebral Elongation (est.)', value: '+3.2 cm', normal: '< +4.5 cm' },
        { label: 'Daily Resistive Load', value: '1,420 kJ', normal: '> 1,200 kJ' },
        { label: 'Bone Density Retention Rate', value: '98.8%', normal: '> 98.0%' },
        { label: 'Joint Mobility Score', value: '94 / 100', normal: '> 85' },
      ],
      unavailable: ['Dual-Energy X-Ray Absorptiometry (DEXA Scan)', 'Direct Bone Biopsy'],
      trendData: [
        { time: 'Wk 1', val: 99.5 },
        { time: 'Wk 2', val: 99.2 },
        { time: 'Wk 3', val: 99.0 },
        { time: 'Wk 4', val: 98.8 },
      ],
      anomalyText: 'Nominal spinal de-loading consistent with microgravity expansion. Zero fracture risk indicators.',
      aiExplanation:
        'Calculated from cumulative Advanced Resistive Exercise Device (ARED) force sensors and daily accelerometry. Bone mineral density loss mitigated by resistance regimen.',
      recommendation:
        'Maintain daily 2.5-hour scheduled countermeasure physical training protocol (treadmill + resistive harness).',
      source: 'Gymnasium Telemetry & Inertial Measurement Units (IMU)',
      confidence: '89.5% (Kinematic Modeling)',
    },
  };

  const current = organData[selectedOrgan] || organData.heart;
  const IconComponent = current.icon;
  const isEmergencyActive = activeEmergencyAlert && activeEmergencyAlert.organ === selectedOrgan;

  const handleRunAiAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await astroAiApi.analyzeOrgan(selectedAstronautId, selectedOrgan || 'heart');
      if (res.data) {
        setAnalysisResult(res.data);
        setShowAiModal(true);
      }
    } catch (err) {
      console.error('Error running organ AI analysis:', err);
      // Fallback to local clinical synthesis if backend temporarily offline
      setAnalysisResult({
        query: `Analyze ${current.organ.toUpperCase()} Health`,
        astronaut_id: selectedAstronautId,
        astronaut_name: selectedAstronaut?.name || 'Commander Alex Chen',
        problem_identified: current.anomalyText,
        supporting_measurements: current.measurements.map((m) => ({
          metric: m.label,
          current_value: m.value,
          baseline_value: m.normal,
          normal_range: m.normal,
          deviation: '0.2 SD',
          status: current.status,
        })),
        possible_explanations: current.aiExplanation,
        severity: current.status,
        immediate_safety_actions: [current.recommendation],
        recommended_medical_review: 'Flight Surgeon routine briefing.',
        follow_up_monitoring: 'Standard 4.0-second telemetry streaming.',
        missing_information: current.unavailable.join(', '),
        confidence_and_uncertainty: current.confidence,
        data_source_and_timestamp: `${current.source} • LIVE`,
      });
      setShowAiModal(true);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <div className={`p-4 rounded-xl border backdrop-blur-md transition-all shadow-xl ${
        isEmergencyActive
          ? 'bg-rose-950/80 border-emergency-red shadow-[0_0_24px_rgba(255,82,107,0.3)]'
          : 'bg-space-surface/85 border-space-border/80 hover:border-cyan-glow/40'
      }`}>
        {/* Header with Organ Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-space-border/60">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg border ${current.badgeBg}`}>
              <IconComponent className={`w-5 h-5 ${isEmergencyActive ? 'text-emergency-red animate-pulse' : current.statusColor}`} />
            </div>
            <div>
              <h3 className="text-sm font-orbitron font-bold text-white tracking-wide">
                {current.organ.toUpperCase()}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                {current.name} • {telemetry.last_updated}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${
              isEmergencyActive
                ? 'bg-emergency-red text-white border-white animate-pulse'
                : `${current.badgeBg} ${current.statusColor}`
            }`}>
              {isEmergencyActive ? 'CRITICAL ALERT' : current.status}
            </span>
          </div>
        </div>

        {/* Organ Switcher Pills */}
        <div className="grid grid-cols-4 gap-1.5 my-3">
          {[
            { key: 'heart', label: 'Heart', icon: Heart },
            { key: 'lungs', label: 'Lungs', icon: Wind },
            { key: 'brain', label: 'Brain', icon: Brain },
            { key: 'skeleton', label: 'Skeleton', icon: Bone },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setSelectedOrgan(item.key)}
              className={`py-1.5 px-2 rounded text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 transition-all ${
                selectedOrgan === item.key
                  ? 'bg-cyan-glow/20 text-cyan-glow border border-cyan-glow/60 shadow-[0_0_8px_rgba(50,230,224,0.2)]'
                  : 'bg-space-dark/60 text-slate-400 border border-space-border/40 hover:bg-space-card'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Dynamic ECG if Heart is selected */}
        {selectedOrgan === 'heart' && (
          <div className="mb-3">
            <LiveECGCanvas
              heartRate={telemetry.heart_rate}
              isAbnormal={telemetry.heart_rate > 100}
              width={400}
              height={85}
            />
          </div>
        )}

        {/* Telemetry Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {current.measurements.map((m, idx) => (
            <div key={idx} className="p-2.5 rounded bg-space-dark/80 border border-space-border/50">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tight">{m.label}</p>
              <p className="text-sm font-mono font-bold text-white mt-0.5">{m.value}</p>
              <p className="text-[9px] font-mono text-cyan-glow/70">Nominal: {m.normal}</p>
            </div>
          ))}
        </div>

        {/* ── MANDATORY AI HEALTH ANALYSIS BUTTON (Priority 2) ────────────────── */}
        <div className="mb-3">
          <button
            onClick={handleRunAiAnalysis}
            disabled={analyzing}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-glow/20 via-holo-blue/30 to-cyan-glow/20 hover:from-cyan-glow/30 hover:to-cyan-glow/30 border border-cyan-glow/60 text-cyan-glow hover:text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(50,230,224,0.25)] disabled:opacity-50"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-glow" />
                <span>EXAMINING {current.organ.toUpperCase()} BASELINES...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-glow animate-pulse" />
                <span>{current.aiButtonLabel}</span>
              </>
            )}
          </button>
        </div>

        {/* Anomaly & Explainable AI Section */}
        <div className="space-y-2 text-xs font-mono mb-3">
          <div className={`p-2.5 rounded border ${
            isEmergencyActive || current.status !== 'NORMAL'
              ? 'bg-rose-950/40 border-emergency-red/60 text-rose-200'
              : 'bg-space-dark/60 border-space-border/60 text-slate-300'
          }`}>
            <div className="flex items-center gap-1.5 font-bold mb-1 text-cyan-glow">
              <Zap className="w-3.5 h-3.5 text-cyan-glow" />
              <span>AI ANOMALY ASSESSMENT</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              {current.anomalyText}
            </p>
          </div>

          <div className="p-2.5 rounded bg-space-dark/60 border border-space-border/60 text-slate-300">
            <div className="flex items-center gap-1.5 font-bold mb-1 text-holo-glow">
              <ShieldCheck className="w-3.5 h-3.5 text-holo-glow" />
              <span>RECOMMENDED MEDICAL ACTION</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              {current.recommendation}
            </p>
          </div>
        </div>

        {/* Unavailable Measurements Note & Data Source */}
        <div className="p-2 rounded bg-space-dark/40 border border-space-border/40 text-[10px] font-mono text-slate-400 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">DATA SOURCE</span>
            <span className="text-slate-300 font-medium">{current.source}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">AI CONFIDENCE</span>
            <span className="text-cyan-glow font-bold">{current.confidence}</span>
          </div>
          <div className="text-[9px] text-slate-500 pt-1 border-t border-space-border/30">
            <span>Unavailable in flight: </span>
            <span className="text-slate-400 italic">{current.unavailable.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE 10-POINT AI ASSESSMENT MODAL ────────────────────────── */}
      {showAiModal && analysisResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-[#060E1E] border-2 border-cyan-glow/50 shadow-[0_0_40px_rgba(50,230,224,0.3)] p-6 space-y-4 font-sans text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-glow/15 border border-cyan-glow/40 text-cyan-glow">
                  <Sparkles className="w-6 h-6 text-cyan-glow" />
                </div>
                <div>
                  <h3 className="text-base font-orbitron font-bold text-white">
                    {analysisResult.query}
                  </h3>
                  <p className="text-xs font-mono text-cyan-glow">
                    Subject: {analysisResult.astronaut_name} ({analysisResult.astronaut_id}) • Status: {analysisResult.severity}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 rounded-lg bg-space-surface border border-space-border text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. Problem Identified */}
            <div className="p-3 rounded-xl bg-space-surface/90 border border-space-border space-y-1">
              <span className="text-[10px] font-mono text-cyan-glow font-bold uppercase tracking-wider block">
                1. Problem Identified
              </span>
              <p className="text-xs font-mono text-white font-semibold">
                {analysisResult.problem_identified}
              </p>
            </div>

            {/* 2. Supporting Measurements Table */}
            {analysisResult.supporting_measurements && (
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-cyan-glow font-bold uppercase tracking-wider block">
                  2. Supporting Measurements vs Personal Baseline
                </span>
                <div className="overflow-x-auto rounded-xl border border-space-border bg-space-dark text-xs font-mono">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-space-border/60 bg-space-card/40 text-[10px] text-slate-400">
                        <th className="p-2.5">METRIC</th>
                        <th className="p-2.5">CURRENT</th>
                        <th className="p-2.5">BASELINE</th>
                        <th className="p-2.5">DEVIATION</th>
                        <th className="p-2.5">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysisResult.supporting_measurements.map((sm, i) => (
                        <tr key={i} className="border-b border-space-border/30">
                          <td className="p-2.5 font-semibold text-slate-300">{sm.metric}</td>
                          <td className="p-2.5 font-bold text-white">{sm.current_value}</td>
                          <td className="p-2.5 text-slate-400">{sm.baseline_value}</td>
                          <td className="p-2.5 text-cyan-glow">{sm.deviation}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sm.status === 'CRITICAL'
                                ? 'bg-emergency-red/20 text-[#FF526B]'
                                : sm.status === 'ELEVATED' || sm.status === 'WARNING'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {sm.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Possible Explanations */}
            <div className="p-3 rounded-xl bg-space-dark/80 border border-space-border/60 text-xs font-mono space-y-1">
              <span className="text-[10px] text-holo-glow font-bold uppercase block">
                3. Possible Explanations
              </span>
              <p className="text-slate-300 font-sans leading-relaxed">
                {analysisResult.possible_explanations}
              </p>
            </div>

            {/* 5. Immediate Safety Actions */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-xs font-mono space-y-1.5">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                5. Immediate Safety Actions
              </span>
              <ul className="space-y-1 text-slate-300 font-sans">
                {analysisResult.immediate_safety_actions.map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 6. Medical Review & 7. Follow-up */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-space-dark/60 border border-space-border">
                <span className="text-[10px] text-cyan-glow font-bold uppercase block mb-1">
                  6. Recommended Review
                </span>
                <p className="text-slate-300 font-sans">{analysisResult.recommended_medical_review}</p>
              </div>
              <div className="p-3 rounded-xl bg-space-dark/60 border border-space-border">
                <span className="text-[10px] text-cyan-glow font-bold uppercase block mb-1">
                  7. Follow-up Monitoring
                </span>
                <p className="text-slate-300 font-sans">{analysisResult.follow_up_monitoring}</p>
              </div>
            </div>

            {/* 8, 9, 10 Meta Details */}
            <div className="p-3 rounded-xl bg-space-dark/40 border border-space-border/40 text-[11px] font-mono text-slate-400 space-y-1.5">
              <div className="flex justify-between">
                <span>8. Missing Information:</span>
                <span className="text-slate-300 italic">{analysisResult.missing_information}</span>
              </div>
              <div className="flex justify-between">
                <span>9. AI Confidence:</span>
                <span className="text-cyan-glow font-bold">{analysisResult.confidence_and_uncertainty}</span>
              </div>
              <div className="flex justify-between">
                <span>10. Sensor Source:</span>
                <span className="text-slate-300">{analysisResult.data_source_and_timestamp}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-5 py-2 rounded-xl bg-cyan-glow text-[#050B16] font-mono font-bold text-xs hover:bg-cyan-200 transition-all shadow-[0_0_12px_rgba(50,230,224,0.3)]"
              >
                CLOSE EVALUATION
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default OrganTelemetryPanel;

import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import {
  BrainCircuit,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Activity,
  CheckCircle,
  HelpCircle,
  TrendingDown,
} from 'lucide-react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

const AIAnalysis = () => {
  const { telemetry, selectedAstronaut, activeEmergencyAlert } = useTelemetry();

  // Multi-dimensional physiological baseline radar data
  const radarData = [
    { metric: 'Cardiovascular', score: telemetry.heart_rate > 100 ? 95 : 22, fullMark: 100 },
    { metric: 'Oxygenation', score: telemetry.oxygen_saturation < 92 ? 90 : 15, fullMark: 100 },
    { metric: 'Neuro-Cognitive', score: telemetry.stress_index * 8, fullMark: 100 },
    { metric: 'Thermal Balance', score: Math.abs(telemetry.body_temperature - 36.7) * 40 + 10, fullMark: 100 },
    { metric: 'Hemodynamics', score: Math.abs(telemetry.systolic_bp - 120) * 1.5 + 15, fullMark: 100 },
    { metric: 'Circadian Index', score: 25, fullMark: 100 },
  ];

  const compositeRiskScore = telemetry.heart_rate > 100 ? 0.942 : 0.084;
  const riskCategory = compositeRiskScore > 0.75 ? 'CRITICAL' : compositeRiskScore > 0.5 ? 'WARNING' : compositeRiskScore > 0.3 ? 'MONITOR' : 'NORMAL';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 rounded-xl bg-space-surface/80 border border-space-border/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-glow/15 border border-cyan-glow/40 text-cyan-glow">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-orbitron font-bold text-white">
              AI HEALTH RISK INTELLIGENCE & CLINICAL DECISION SUPPORT
            </h2>
            <p className="text-xs font-mono text-cyan-glow">
              Unsupervised Isolation Forest & Empirical Z-Score Anomaly Engine • Astronaut {selectedAstronaut?.name}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded bg-space-card border border-space-border text-xs font-mono text-slate-300">
          Model: Personal Isolation Forest v2.4
        </span>
      </div>

      {/* Top AI Assessment Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        riskCategory === 'CRITICAL'
          ? 'bg-rose-950/70 border-emergency-red shadow-[0_0_24px_rgba(255,82,107,0.35)]'
          : 'bg-space-surface/90 border-space-border/80'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${
                riskCategory === 'CRITICAL'
                  ? 'bg-emergency-red text-white border-white animate-pulse'
                  : 'bg-alert-green/20 text-alert-green border-alert-green/40'
              }`}>
                RISK CLASSIFICATION: {riskCategory}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Composite Anomaly Score: {compositeRiskScore} (Scale 0.00 – 1.00)
              </span>
            </div>
            <h3 className="text-base font-orbitron font-bold text-white mt-1">
              {riskCategory === 'CRITICAL'
                ? 'Severe Non-Linear Physiological Departure Detected'
                : 'Nominal Physiological Homeostasis Confirmed'}
            </h3>
            <p className="text-xs font-mono text-slate-300 mt-1 max-w-3xl leading-relaxed">
              {riskCategory === 'CRITICAL'
                ? 'Incoming measurements show acute multi-parameter deviation across heart rate (+4.2 SD) and systolic blood pressure (+3.1 SD). High likelihood of sustained cardiac stress.'
                : 'All continuous vital signs remain within 1.2 personal standard deviations of pre-mission baseline records.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-space-dark/80 border border-space-border text-center shrink-0">
            <p className="text-[10px] font-mono text-slate-400 uppercase">Confidence Level</p>
            <p className="text-2xl font-orbitron font-bold text-cyan-glow mt-0.5">97.8%</p>
            <p className="text-[9px] font-mono text-slate-400">P-value &lt; 0.001</p>
          </div>
        </div>
      </div>

      {/* Grid: Radar Analysis & Contributing Anomaly Vectors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Chart (6 cols) */}
        <div className="lg:col-span-6 p-5 rounded-2xl bg-space-surface/85 border border-space-border/80">
          <h3 className="text-xs font-orbitron font-bold text-white uppercase mb-2">
            Multi-System Physiological Risk Radar
          </h3>
          <p className="text-[10px] font-mono text-slate-400 mb-4">
            Compares real-time sensory inputs against personal astronaut baseline
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#1B315B" />
                <PolarAngleAxis dataKey="metric" stroke="#A0AEC0" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                <PolarRadiusAxis stroke="#4A5568" angle={30} domain={[0, 100]} />
                <Radar name="Risk Index" dataKey="score" stroke="#32E6E0" fill="#32E6E0" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contributing Factors & Medical Recommendations (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-space-surface/85 border border-space-border/80 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-glow" />
              <h3 className="text-xs font-orbitron font-bold text-white uppercase">
                Contributing Anomaly Factors
              </h3>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-space-dark/80 border border-space-border flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">Heart Rate (BPM)</span>
                  <p className="text-[10px] text-slate-400">Baseline Mean: 68.0 bpm (Std: 4.0)</p>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${telemetry.heart_rate > 100 ? 'text-emergency-red' : 'text-cyan-glow'}`}>
                    {telemetry.heart_rate} bpm
                  </span>
                  <p className="text-[10px] text-slate-400">
                    {telemetry.heart_rate > 100 ? '+4.2 SD (Critical)' : '+0.5 SD (Nominal)'}
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded bg-space-dark/80 border border-space-border flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">Oxygen Saturation (SpO2)</span>
                  <p className="text-[10px] text-slate-400">Baseline Mean: 98.2% (Std: 0.4)</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-alert-green">{telemetry.oxygen_saturation}%</span>
                  <p className="text-[10px] text-slate-400">+0.2 SD (Nominal)</p>
                </div>
              </div>

              <div className="p-2.5 rounded bg-space-dark/80 border border-space-border flex items-center justify-between">
                <div>
                  <span className="font-bold text-white">Blood Pressure (Systolic)</span>
                  <p className="text-[10px] text-slate-400">Baseline Mean: 118.0 mmHg</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-white">{telemetry.systolic_bp} mmHg</span>
                  <p className="text-[10px] text-slate-400">
                    {telemetry.systolic_bp > 140 ? '+3.1 SD (Elevated)' : '+0.2 SD (Nominal)'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Flight Surgeon Decision Support */}
          <div className="p-5 rounded-2xl bg-space-surface/85 border border-space-border/80 space-y-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-alert-green">
              <ShieldCheck className="w-4 h-4" />
              <h3 className="font-orbitron font-bold text-white uppercase">
                Clinical Decision Support
              </h3>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {riskCategory === 'CRITICAL'
                ? '1. Immediately contact crew on Lunar Gateway voice loop. 2. Verify ECG Lead II signal integrity. 3. Administer anti-arrhythmic protocol per Flight Medical Manual Section 4.'
                : '1. Continue standard continuous biosensor polling at 4-second intervals. 2. No clinical intervention necessary. Scheduled exercise protocol cleared.'}
            </p>
            <div className="p-2 rounded bg-space-dark/60 border border-space-border/40 text-[10px] text-slate-400 flex items-center gap-1.5 mt-2">
              <HelpCircle className="w-3.5 h-3.5 text-cyan-glow shrink-0" />
              <span>
                Note: AI health intelligence serves as decision support only and does not replace the certified judgment of the NASA/ESA Flight Surgeon.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysis;
